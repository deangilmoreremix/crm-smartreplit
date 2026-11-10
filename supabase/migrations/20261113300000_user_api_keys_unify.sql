-- Unify the two shapes of public.user_api_keys without dropping or rewriting data.
--
--  Wide shape (supabase/migrations/20260514 + 20260521): ONE row per user with
--    openai_api_key / openai_model / openclaw_* columns. The client hooks
--    (useAIApiKeys, useApiKeyStatus) read and upsert this shape through supabase-js
--    and RLS, so the real database has it.
--  Row-per-provider shape (Drizzle shared/schema.ts userApiKeys): provider, api_key,
--    model, is_default, is_active, metadata. Used by server/routes/apiKeys.ts.
--
-- Canonical OpenAI lookup for every server / edge-function path: the view
-- public.user_api_keys_openai (user_id, api_key, model).
-- Writers of either shape are mirrored into the other by a trigger.

-- 1. Add the row-per-provider columns if absent (all nullable / defaulted).
ALTER TABLE public.user_api_keys
  ADD COLUMN IF NOT EXISTS provider text,
  ADD COLUMN IF NOT EXISTS api_key text,
  ADD COLUMN IF NOT EXISTS model text,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_default boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- 2. Add the wide columns if absent (covers a database created from the Drizzle shape).
ALTER TABLE public.user_api_keys
  ADD COLUMN IF NOT EXISTS openai_api_key text,
  ADD COLUMN IF NOT EXISTS openai_model text,
  ADD COLUMN IF NOT EXISTS openclaw_api_key text,
  ADD COLUMN IF NOT EXISTS openclaw_model text,
  ADD COLUMN IF NOT EXISTS openclaw_base_url text;

-- 3. Backfill: only fills NULLs, never overwrites.
UPDATE public.user_api_keys
   SET provider   = COALESCE(provider, 'openai'),
       api_key    = COALESCE(api_key, openai_api_key),
       model      = COALESCE(model, openai_model),
       is_default = COALESCE(is_default, true)
 WHERE openai_api_key IS NOT NULL
   AND (provider IS NULL OR api_key IS NULL);

UPDATE public.user_api_keys
   SET openai_api_key = api_key,
       openai_model   = COALESCE(openai_model, model)
 WHERE provider = 'openai' AND api_key IS NOT NULL AND openai_api_key IS NULL;

-- 4. Keep both shapes in sync on future writes.
CREATE OR REPLACE FUNCTION public.user_api_keys_sync_openai()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.provider = 'openai' AND NEW.api_key IS NOT NULL
     AND (TG_OP = 'INSERT' OR NEW.api_key IS DISTINCT FROM OLD.api_key) THEN
    NEW.openai_api_key := NEW.api_key;
    IF NEW.model IS NOT NULL THEN NEW.openai_model := NEW.model; END IF;
  ELSIF NEW.openai_api_key IS NOT NULL
     AND (TG_OP = 'INSERT' OR NEW.openai_api_key IS DISTINCT FROM OLD.openai_api_key
          OR NEW.openai_model IS DISTINCT FROM OLD.openai_model) THEN
    NEW.provider := COALESCE(NEW.provider, 'openai');
    IF NEW.provider = 'openai' THEN
      NEW.api_key := NEW.openai_api_key;
      NEW.model := COALESCE(NEW.openai_model, NEW.model);
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS user_api_keys_sync_openai ON public.user_api_keys;
CREATE TRIGGER user_api_keys_sync_openai
  BEFORE INSERT OR UPDATE ON public.user_api_keys
  FOR EACH ROW EXECUTE FUNCTION public.user_api_keys_sync_openai();

-- 5. Canonical read path. security_invoker => RLS of the caller still applies.
CREATE OR REPLACE VIEW public.user_api_keys_openai
WITH (security_invoker = true) AS
SELECT user_id,
       COALESCE(openai_api_key, api_key) AS api_key,
       COALESCE(openai_model, model)     AS model
  FROM public.user_api_keys
 WHERE COALESCE(openai_api_key, CASE WHEN provider = 'openai' THEN api_key END) IS NOT NULL
   AND COALESCE(is_active, true);

COMMENT ON VIEW public.user_api_keys_openai IS
  'Canonical per-user OpenAI key lookup (user_id, api_key, model) across both user_api_keys shapes.';

REVOKE ALL ON public.user_api_keys_openai FROM anon;
GRANT SELECT ON public.user_api_keys_openai TO authenticated, service_role;
