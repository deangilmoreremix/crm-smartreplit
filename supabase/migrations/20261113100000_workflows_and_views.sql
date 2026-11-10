-- Workflows (definitions, ordered actions, run history), saved views, and custom field definitions.
-- Owner-scoped via RLS (auth.uid() = user_id). The workflow engine and API use the service role.

CREATE TABLE IF NOT EXISTS public.workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL,
  trigger_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_workflows_user ON public.workflows(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflows_trigger ON public.workflows(user_id, trigger_type) WHERE enabled;

CREATE TABLE IF NOT EXISTS public.workflow_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  action_type TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  condition JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_workflow_actions_workflow ON public.workflow_actions(workflow_id, order_index);

CREATE TABLE IF NOT EXISTS public.workflow_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  trigger_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  result JSONB,
  error TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_workflow ON public.workflow_runs(workflow_id, started_at DESC);

CREATE TABLE IF NOT EXISTS public.views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  object_type TEXT NOT NULL,
  name TEXT NOT NULL,
  view_type TEXT NOT NULL DEFAULT 'table' CHECK (view_type IN ('table', 'kanban', 'calendar')),
  filters JSONB NOT NULL DEFAULT '[]'::jsonb,
  sort JSONB NOT NULL DEFAULT '[]'::jsonb,
  columns JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_views_user_object ON public.views(user_id, object_type);

CREATE TABLE IF NOT EXISTS public.custom_field_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  object_type TEXT NOT NULL,
  key TEXT NOT NULL,
  label TEXT NOT NULL,
  field_type TEXT NOT NULL DEFAULT 'text',
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_required BOOLEAN NOT NULL DEFAULT FALSE,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, object_type, key)
);

ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_field_definitions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS workflows_owner_all ON public.workflows;
CREATE POLICY workflows_owner_all ON public.workflows
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Actions and runs have no user_id; ownership comes from the parent workflow.
DROP POLICY IF EXISTS workflow_actions_owner_all ON public.workflow_actions;
CREATE POLICY workflow_actions_owner_all ON public.workflow_actions
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.workflows w WHERE w.id = workflow_id AND w.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.workflows w WHERE w.id = workflow_id AND w.user_id = auth.uid()));

DROP POLICY IF EXISTS workflow_runs_owner_all ON public.workflow_runs;
CREATE POLICY workflow_runs_owner_all ON public.workflow_runs
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.workflows w WHERE w.id = workflow_id AND w.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.workflows w WHERE w.id = workflow_id AND w.user_id = auth.uid()));

DROP POLICY IF EXISTS views_owner_all ON public.views;
CREATE POLICY views_owner_all ON public.views
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS custom_field_definitions_owner_all ON public.custom_field_definitions;
CREATE POLICY custom_field_definitions_owner_all ON public.custom_field_definitions
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
