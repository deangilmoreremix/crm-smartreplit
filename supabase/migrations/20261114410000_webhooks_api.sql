-- Outbound webhooks (deliveries + DB triggers), public REST API keys and per-key rate limiting.
-- See 20261114410000_webhooks_api.REVIEW.md for the security review.

-- ---------------------------------------------------------------------------
-- 1. Webhooks
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL CHECK (url ~ '^https://'),
  events TEXT[] NOT NULL DEFAULT ARRAY['*']::text[],
  secret TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_webhooks_user ON public.webhooks(user_id) WHERE active;

CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES public.webhooks(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 0,
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  response_status INTEGER,
  response_body TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_due ON public.webhook_deliveries(next_attempt_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook ON public.webhook_deliveries(webhook_id, created_at DESC);

ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS webhooks_owner_all ON public.webhooks;
CREATE POLICY webhooks_owner_all ON public.webhooks
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Deliveries are written by triggers / the worker; owners may only read.
DROP POLICY IF EXISTS webhook_deliveries_owner_select ON public.webhook_deliveries;
CREATE POLICY webhook_deliveries_owner_select ON public.webhook_deliveries
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.webhooks w WHERE w.id = webhook_id AND w.user_id = auth.uid()));

-- The signing secret never leaves the server: browsers using the anon/authenticated role cannot read it.
REVOKE SELECT ON public.webhooks FROM authenticated, anon;
GRANT SELECT (id, user_id, url, events, active, created_at, updated_at) ON public.webhooks TO authenticated;

-- ---------------------------------------------------------------------------
-- 2. Enqueue deliveries from row changes (payload = to_jsonb(row))
--    TG_ARGV[0] = owner column, TG_ARGV[1] = event prefix (contact/deal/task/company)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enqueue_webhook_deliveries()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  rec JSONB;
  ev TEXT;
  owner_id UUID;
  hook RECORD;
BEGIN
  BEGIN
    IF TG_OP = 'DELETE' THEN
      rec := to_jsonb(OLD); ev := TG_ARGV[1] || '.deleted';
    ELSIF TG_OP = 'UPDATE' THEN
      IF to_jsonb(OLD) = to_jsonb(NEW) THEN RETURN NULL; END IF;
      rec := to_jsonb(NEW); ev := TG_ARGV[1] || '.updated';
    ELSE
      rec := to_jsonb(NEW); ev := TG_ARGV[1] || '.created';
    END IF;

    owner_id := NULLIF(rec ->> TG_ARGV[0], '')::uuid;
    IF owner_id IS NULL THEN RETURN NULL; END IF;

    FOR hook IN
      SELECT id FROM public.webhooks
      WHERE user_id = owner_id AND active AND (events @> ARRAY[ev] OR events @> ARRAY['*'])
    LOOP
      INSERT INTO public.webhook_deliveries (webhook_id, event, payload)
      VALUES (hook.id, ev, jsonb_build_object(
        'id', gen_random_uuid(), 'event', ev, 'created_at', now(), 'data', rec));
    END LOOP;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'enqueue_webhook_deliveries failed: %', SQLERRM;  -- never block the user write
  END;
  RETURN NULL;
END $$;
REVOKE ALL ON FUNCTION public.enqueue_webhook_deliveries() FROM PUBLIC, anon, authenticated;

DO $$
DECLARE
  t RECORD;
BEGIN
  FOR t IN SELECT * FROM (VALUES
      ('contacts', 'profile_id', 'contact'), ('deals', 'profile_id', 'deal'),
      ('tasks', 'profile_id', 'task'), ('companies', 'owner_user_id', 'company')
    ) AS v(tbl, owner_col, prefix)
  LOOP
    IF to_regclass('public.' || t.tbl) IS NOT NULL THEN
      EXECUTE format('DROP TRIGGER IF EXISTS trg_webhook_deliveries ON public.%I', t.tbl);
      EXECUTE format(
        'CREATE TRIGGER trg_webhook_deliveries AFTER INSERT OR UPDATE OR DELETE ON public.%I
           FOR EACH ROW EXECUTE FUNCTION public.enqueue_webhook_deliveries(%L, %L)',
        t.tbl, t.owner_col, t.prefix);
    END IF;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 3. API keys (sha256(pepper || key) only; the secret is shown once at creation)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  prefix TEXT NOT NULL,
  scopes TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  last_used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON public.api_keys(prefix) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON public.api_keys(user_id, created_at DESC);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS api_keys_owner_all ON public.api_keys;
CREATE POLICY api_keys_owner_all ON public.api_keys
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

REVOKE SELECT ON public.api_keys FROM authenticated, anon;
GRANT SELECT (id, user_id, name, prefix, scopes, last_used_at, revoked_at, created_at) ON public.api_keys TO authenticated;

-- ---------------------------------------------------------------------------
-- 4. Per-key rate limit counters (120 req/min enforced by the API via bump_api_key_usage)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.api_key_usage (
  key_id UUID NOT NULL REFERENCES public.api_keys(id) ON DELETE CASCADE,
  window_start TIMESTAMPTZ NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (key_id, window_start)
);
ALTER TABLE public.api_key_usage ENABLE ROW LEVEL SECURITY;  -- no policies: service role only

CREATE OR REPLACE FUNCTION public.bump_api_key_usage(p_key_id UUID, p_window TIMESTAMPTZ)
RETURNS INTEGER LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO public.api_key_usage (key_id, window_start, count)
  VALUES (p_key_id, p_window, 1)
  ON CONFLICT (key_id, window_start) DO UPDATE SET count = public.api_key_usage.count + 1
  RETURNING count;
$$;
REVOKE ALL ON FUNCTION public.bump_api_key_usage(UUID, TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bump_api_key_usage(UUID, TIMESTAMPTZ) TO service_role;
