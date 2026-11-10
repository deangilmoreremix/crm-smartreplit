-- Workflow automation: versions, schedule/webhook triggers, paused-run waits, DB-originated event queue.
-- Depends on 20261113100000_workflows_and_views.sql. Idempotent; service role is used by the engine/API.

-- ---------------------------------------------------------------------------
-- 1. Versions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.workflow_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  graph JSONB NOT NULL DEFAULT '{"steps": []}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workflow_id, version)
);
CREATE INDEX IF NOT EXISTS idx_workflow_versions_workflow ON public.workflow_versions(workflow_id, version DESC);
-- At most one active version per workflow.
CREATE UNIQUE INDEX IF NOT EXISTS uq_workflow_versions_one_active
  ON public.workflow_versions(workflow_id) WHERE status = 'active';

ALTER TABLE public.workflow_versions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS workflow_versions_owner_all ON public.workflow_versions;
CREATE POLICY workflow_versions_owner_all ON public.workflow_versions
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.workflows w WHERE w.id = workflow_id AND w.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.workflows w WHERE w.id = workflow_id AND w.user_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- 2. Trigger columns on workflows (guarded)
-- ---------------------------------------------------------------------------
ALTER TABLE public.workflows ADD COLUMN IF NOT EXISTS schedule_cron TEXT;
ALTER TABLE public.workflows ADD COLUMN IF NOT EXISTS next_run_at TIMESTAMPTZ;
ALTER TABLE public.workflows ADD COLUMN IF NOT EXISTS webhook_token TEXT;
ALTER TABLE public.workflows ADD COLUMN IF NOT EXISTS active_version_id UUID;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'workflows_active_version_fk') THEN
    ALTER TABLE public.workflows
      ADD CONSTRAINT workflows_active_version_fk
      FOREIGN KEY (active_version_id) REFERENCES public.workflow_versions(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_workflows_webhook_token
  ON public.workflows(webhook_token) WHERE webhook_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_workflows_due
  ON public.workflows(next_run_at) WHERE enabled AND schedule_cron IS NOT NULL;

-- Runs can now be paused.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'workflow_runs_status_check') THEN
    ALTER TABLE public.workflow_runs DROP CONSTRAINT workflow_runs_status_check;
  END IF;
  ALTER TABLE public.workflow_runs
    ADD CONSTRAINT workflow_runs_status_check
    CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled', 'waiting'));
END $$;

-- ---------------------------------------------------------------------------
-- 3. Waits (delay / wait_for_event / form)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.workflow_run_waits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES public.workflow_runs(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('delay', 'event', 'form')),
  step_id TEXT NOT NULL,
  resume_at TIMESTAMPTZ,
  event_key TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,        -- engine snapshot (variables, prior results, match, form)
  resume_payload JSONB,                              -- what resumed it (form values, event data)
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_run_waits_due ON public.workflow_run_waits(resume_at) WHERE resolved_at IS NULL AND resume_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_run_waits_event ON public.workflow_run_waits(event_key) WHERE resolved_at IS NULL AND event_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_run_waits_run ON public.workflow_run_waits(run_id);

ALTER TABLE public.workflow_run_waits ENABLE ROW LEVEL SECURITY;
-- Owners may read waits of their own runs; only the service role writes them.
DROP POLICY IF EXISTS workflow_run_waits_owner_select ON public.workflow_run_waits;
CREATE POLICY workflow_run_waits_owner_select ON public.workflow_run_waits
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.workflow_runs r JOIN public.workflows w ON w.id = r.workflow_id
    WHERE r.id = run_id AND w.user_id = auth.uid()
  ));

-- ---------------------------------------------------------------------------
-- 4. Inbound webhook rate limiting (atomic DB counter, per workflow per minute)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.workflow_hook_usage (
  workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  window_start TIMESTAMPTZ NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (workflow_id, window_start)
);
ALTER TABLE public.workflow_hook_usage ENABLE ROW LEVEL SECURITY;  -- no policies: service role only

CREATE OR REPLACE FUNCTION public.bump_workflow_hook_usage(p_workflow_id UUID, p_window TIMESTAMPTZ)
RETURNS INTEGER LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO public.workflow_hook_usage (workflow_id, window_start, count)
  VALUES (p_workflow_id, p_window, 1)
  ON CONFLICT (workflow_id, window_start) DO UPDATE SET count = public.workflow_hook_usage.count + 1
  RETURNING count;
$$;
REVOKE ALL ON FUNCTION public.bump_workflow_hook_usage(UUID, TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bump_workflow_hook_usage(UUID, TIMESTAMPTZ) TO service_role;

-- ---------------------------------------------------------------------------
-- 5. Event queue for record changes made outside the API (SQL editor, imports, edge functions...)
--    The scheduler sweep drains it into triggerWorkflowsForEvent. API-originated changes are
--    de-duplicated: emitCrmEvent marks the matching pending row 'skipped'.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.workflow_event_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('RECORD_CREATED', 'RECORD_UPDATED', 'RECORD_DELETED')),
  object_type TEXT NOT NULL,
  record_id TEXT,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'done', 'failed', 'skipped')),
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_wf_event_queue_pending ON public.workflow_event_queue(created_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_wf_event_queue_dedupe ON public.workflow_event_queue(object_type, record_id, event_type) WHERE status = 'pending';
ALTER TABLE public.workflow_event_queue ENABLE ROW LEVEL SECURITY;  -- no policies: service role only

-- TG_ARGV[0] = owner column of the table (profile_id / owner_user_id).
CREATE OR REPLACE FUNCTION public.enqueue_workflow_event()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  rec JSONB;
  ev TEXT;
  owner_id UUID;
BEGIN
  BEGIN
    IF TG_OP = 'DELETE' THEN
      rec := to_jsonb(OLD); ev := 'RECORD_DELETED';
    ELSIF TG_OP = 'UPDATE' THEN
      IF to_jsonb(OLD) = to_jsonb(NEW) THEN RETURN NULL; END IF;
      rec := to_jsonb(NEW); ev := 'RECORD_UPDATED';
    ELSE
      rec := to_jsonb(NEW); ev := 'RECORD_CREATED';
    END IF;

    owner_id := NULLIF(rec ->> TG_ARGV[0], '')::uuid;
    IF owner_id IS NULL THEN RETURN NULL; END IF;

    -- Only queue when something can react to the event.
    IF EXISTS (SELECT 1 FROM public.workflows w WHERE w.user_id = owner_id AND w.enabled AND w.trigger_type = ev)
       OR EXISTS (SELECT 1 FROM public.workflow_run_waits x
                  WHERE x.resolved_at IS NULL AND x.event_key IN (ev || ':*', ev || ':' || TG_TABLE_NAME)) THEN
      INSERT INTO public.workflow_event_queue (user_id, event_type, object_type, record_id, data)
      VALUES (owner_id, ev, TG_TABLE_NAME, rec ->> 'id', rec);
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'enqueue_workflow_event failed: %', SQLERRM;  -- never block the user write
  END;
  RETURN NULL;
END $$;
REVOKE ALL ON FUNCTION public.enqueue_workflow_event() FROM PUBLIC, anon, authenticated;

DO $$
DECLARE
  t RECORD;
BEGIN
  FOR t IN SELECT * FROM (VALUES
      ('contacts', 'profile_id'), ('deals', 'profile_id'), ('tasks', 'profile_id'), ('companies', 'owner_user_id')
    ) AS v(tbl, owner_col)
  LOOP
    IF to_regclass('public.' || t.tbl) IS NOT NULL THEN
      EXECUTE format('DROP TRIGGER IF EXISTS trg_workflow_event_queue ON public.%I', t.tbl);
      EXECUTE format(
        'CREATE TRIGGER trg_workflow_event_queue AFTER INSERT OR UPDATE OR DELETE ON public.%I
           FOR EACH ROW EXECUTE FUNCTION public.enqueue_workflow_event(%L)', t.tbl, t.owner_col);
    END IF;
  END LOOP;
END $$;
