-- Twenty CRM metadata tables (object/field/relation metadata and saved views), as defined in
-- shared/schema.ts. None of these exist in the live database, although
-- 20260419100000_update_twenty_field_types.sql already updates field_metadata.
--
-- Not included on purpose: workflows / workflow_runs. The live database already has tables with
-- those names for a different feature (columns data, edges, thumbnail, cost), so the Twenty
-- workflow tables (workflows, workflow_actions, workflow_runs, workflow_run_logs, workflow_credits,
-- workflow_templates) need a naming decision before they can be created.

CREATE TABLE IF NOT EXISTS public.object_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  label TEXT NOT NULL,
  label_plural TEXT,
  description TEXT,
  icon TEXT,
  is_custom BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false,
  workspace_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.field_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  object_metadata_id UUID NOT NULL REFERENCES public.object_metadata(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  label TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  options JSONB,
  default_value JSONB,
  settings JSONB,
  is_custom BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false,
  is_nullable BOOLEAN DEFAULT true,
  is_unique BOOLEAN DEFAULT false,
  workspace_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.relation_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_object_metadata_id UUID NOT NULL REFERENCES public.object_metadata(id) ON DELETE CASCADE,
  target_object_metadata_id UUID NOT NULL REFERENCES public.object_metadata(id) ON DELETE CASCADE,
  source_field_metadata_id UUID NOT NULL REFERENCES public.field_metadata(id) ON DELETE CASCADE,
  target_field_metadata_id UUID REFERENCES public.field_metadata(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL,
  is_custom BOOLEAN DEFAULT false,
  workspace_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  object_metadata_id UUID REFERENCES public.object_metadata(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('table', 'kanban', 'calendar')),
  kanban_field_metadata_id UUID REFERENCES public.field_metadata(id),
  filters JSONB DEFAULT '[]',
  sorts JSONB DEFAULT '[]',
  visible_fields JSONB DEFAULT '[]',
  hidden_fields JSONB DEFAULT '[]',
  aggregations JSONB DEFAULT '[]',
  visibility TEXT DEFAULT 'personal',
  is_default BOOLEAN DEFAULT false,
  user_id UUID REFERENCES public.profiles(id),
  workspace_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_field_metadata_object ON public.field_metadata (object_metadata_id);
CREATE INDEX IF NOT EXISTS idx_object_metadata_workspace ON public.object_metadata (workspace_id);
CREATE INDEX IF NOT EXISTS idx_views_user ON public.views (user_id);

ALTER TABLE public.object_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relation_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.views ENABLE ROW LEVEL SECURITY;

-- Rows with workspace_id NULL are system metadata, readable by every signed-in user.
-- Rows with a workspace_id belong to that profile.
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['object_metadata', 'field_metadata', 'relation_metadata'] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = t
                   AND policyname = 'Users read system and own metadata') THEN
      EXECUTE format('CREATE POLICY "Users read system and own metadata" ON public.%I FOR SELECT TO authenticated
                      USING (workspace_id IS NULL OR workspace_id = auth.uid())', t);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = t
                   AND policyname = 'Users manage own metadata') THEN
      EXECUTE format('CREATE POLICY "Users manage own metadata" ON public.%I FOR ALL TO authenticated
                      USING (workspace_id = auth.uid()) WITH CHECK (workspace_id = auth.uid())', t);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = t
                   AND policyname = 'Service role full access') THEN
      EXECUTE format('CREATE POLICY "Service role full access" ON public.%I FOR ALL TO service_role
                      USING (true) WITH CHECK (true)', t);
    END IF;
  END LOOP;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'views'
                 AND policyname = 'Users read own and workspace views') THEN
    CREATE POLICY "Users read own and workspace views" ON public.views FOR SELECT TO authenticated
      USING (user_id = auth.uid() OR (visibility = 'workspace' AND workspace_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'views'
                 AND policyname = 'Users manage own views') THEN
    CREATE POLICY "Users manage own views" ON public.views FOR ALL TO authenticated
      USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'views'
                 AND policyname = 'Service role full access') THEN
    CREATE POLICY "Service role full access" ON public.views FOR ALL TO service_role
      USING (true) WITH CHECK (true);
  END IF;
END $$;
