-- CRM companies (additive), polymorphic note/task targets, and per-user UI preferences.
-- Idempotent and non-destructive: existing contacts keep their free-text `company` column;
-- `contacts.company_id` is an optional link only. Table is named crm_companies because the
-- tenant-admin routes (server/routes/companies.ts) already use a `companies` table with a
-- different shape (owner_user_id / company_users).

-- ---------------------------------------------------------------------------
-- crm_companies
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.crm_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  domain TEXT,
  industry TEXT,
  size TEXT,
  phone TEXT,
  address JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_crm_companies_user ON public.crm_companies(user_id, name);

ALTER TABLE public.crm_companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS crm_companies_owner_all ON public.crm_companies;
CREATE POLICY crm_companies_owner_all ON public.crm_companies
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- ---------------------------------------------------------------------------
-- contacts.company_id (nullable link; guarded in case contacts is not in this schema)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.contacts') IS NOT NULL THEN
    ALTER TABLE public.contacts
      ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.crm_companies(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_contacts_company_id ON public.contacts(company_id);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- note_targets / task_targets: attach a note or task to any record (contact, company, deal)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.note_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note_id UUID NOT NULL,
  object_type TEXT NOT NULL CHECK (object_type IN ('contact', 'company', 'deal')),
  record_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (note_id, object_type, record_id)
);
CREATE INDEX IF NOT EXISTS idx_note_targets_record ON public.note_targets(user_id, object_type, record_id);

CREATE TABLE IF NOT EXISTS public.task_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id INTEGER NOT NULL,
  object_type TEXT NOT NULL CHECK (object_type IN ('contact', 'company', 'deal')),
  record_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (task_id, object_type, record_id)
);
CREATE INDEX IF NOT EXISTS idx_task_targets_record ON public.task_targets(user_id, object_type, record_id);

-- Foreign keys to notes/tasks are added only when those tables exist with matching key types.
DO $$
BEGIN
  IF to_regclass('public.notes') IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'note_targets_note_id_fkey'
  ) THEN
    BEGIN
      ALTER TABLE public.note_targets
        ADD CONSTRAINT note_targets_note_id_fkey FOREIGN KEY (note_id) REFERENCES public.notes(id) ON DELETE CASCADE;
    EXCEPTION WHEN datatype_mismatch OR undefined_column THEN
      RAISE NOTICE 'note_targets.note_id FK skipped (notes.id type differs)';
    END;
  END IF;
  IF to_regclass('public.tasks') IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'task_targets_task_id_fkey'
  ) THEN
    BEGIN
      ALTER TABLE public.task_targets
        ADD CONSTRAINT task_targets_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;
    EXCEPTION WHEN datatype_mismatch OR undefined_column THEN
      RAISE NOTICE 'task_targets.task_id FK skipped (tasks.id type differs)';
    END;
  END IF;
END $$;

ALTER TABLE public.note_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_targets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS note_targets_owner_all ON public.note_targets;
CREATE POLICY note_targets_owner_all ON public.note_targets
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS task_targets_owner_all ON public.task_targets;
CREATE POLICY task_targets_owner_all ON public.task_targets
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- ---------------------------------------------------------------------------
-- user_ui_preferences: per-user JSON UI state (record layouts, dashboard layouts, ...)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_ui_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  key TEXT NOT NULL,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, kind, key)
);

ALTER TABLE public.user_ui_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS user_ui_preferences_owner_all ON public.user_ui_preferences;
CREATE POLICY user_ui_preferences_owner_all ON public.user_ui_preferences
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));
