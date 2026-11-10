-- Data model: user-defined objects, fields, generic records, relations, and custom field values
-- for standard objects. Owner-scoped via RLS ((select auth.uid()) = owner). Idempotent.

CREATE TABLE IF NOT EXISTS public.object_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name_singular TEXT NOT NULL CHECK (name_singular ~ '^[a-z][a-zA-Z0-9]{0,62}$'),
  name_plural TEXT NOT NULL CHECK (name_plural ~ '^[a-z][a-zA-Z0-9]{0,62}$'),
  label_singular TEXT NOT NULL,
  label_plural TEXT NOT NULL,
  icon TEXT,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, name_singular),
  UNIQUE (user_id, name_plural)
);

CREATE TABLE IF NOT EXISTS public.field_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  object_id UUID NOT NULL REFERENCES public.object_metadata(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (name ~ '^[a-z][a-zA-Z0-9_]{0,62}$'),
  label TEXT NOT NULL,
  field_type TEXT NOT NULL DEFAULT 'text' CHECK (field_type IN (
    'text','number','currency','date','datetime','boolean','select','multi_select',
    'relation','email','phone','link','rating','rich_text','json')),
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_required BOOLEAN NOT NULL DEFAULT FALSE,
  position INTEGER NOT NULL DEFAULT 0,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (object_id, name)
);
CREATE INDEX IF NOT EXISTS idx_field_metadata_object ON public.field_metadata(object_id, position);
CREATE INDEX IF NOT EXISTS idx_field_metadata_user ON public.field_metadata(user_id);

CREATE TABLE IF NOT EXISTS public.records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  object_id UUID NOT NULL REFERENCES public.object_metadata(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  search_text TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_records_object ON public.records(object_id, created_at DESC, id DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_records_user ON public.records(user_id);
CREATE INDEX IF NOT EXISTS idx_records_data_gin ON public.records USING GIN (data jsonb_path_ops);

CREATE TABLE IF NOT EXISTS public.record_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_record UUID NOT NULL REFERENCES public.records(id) ON DELETE CASCADE,
  to_record UUID NOT NULL REFERENCES public.records(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES public.field_metadata(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (from_record, to_record, field_id)
);
CREATE INDEX IF NOT EXISTS idx_record_relations_to ON public.record_relations(to_record);
CREATE INDEX IF NOT EXISTS idx_record_relations_user ON public.record_relations(user_id);

-- Values of user-defined fields on STANDARD objects (contacts/deals/tasks/companies).
-- field_id points at custom_field_definitions (existing table); record_id is text because
-- legacy tables use serial ids.
CREATE TABLE IF NOT EXISTS public.custom_field_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  object_type TEXT NOT NULL CHECK (object_type IN ('contacts','deals','tasks','companies')),
  record_id TEXT NOT NULL,
  field_id UUID NOT NULL,
  value JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (object_type, record_id, field_id)
);
CREATE INDEX IF NOT EXISTS idx_custom_field_values_user ON public.custom_field_values(user_id, object_type);
CREATE INDEX IF NOT EXISTS idx_custom_field_values_field ON public.custom_field_values(field_id);

DO $$
BEGIN
  IF to_regclass('public.custom_field_definitions') IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'custom_field_values_field_fk') THEN
    ALTER TABLE public.custom_field_values
      ADD CONSTRAINT custom_field_values_field_fk
      FOREIGN KEY (field_id) REFERENCES public.custom_field_definitions(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Triggers: updated_at and search_text
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.records_maintain()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  -- Concatenate scalar string/number values of data for simple ILIKE search.
  NEW.search_text := (
    SELECT lower(coalesce(string_agg(v.value, ' '), ''))
    FROM jsonb_each_text(NEW.data) AS v
    WHERE jsonb_typeof(NEW.data -> v.key) IN ('string', 'number')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_records_maintain ON public.records;
CREATE TRIGGER trg_records_maintain
  BEFORE INSERT OR UPDATE ON public.records
  FOR EACH ROW EXECUTE FUNCTION public.records_maintain();

CREATE OR REPLACE FUNCTION public.custom_field_values_touch()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_custom_field_values_touch ON public.custom_field_values;
CREATE TRIGGER trg_custom_field_values_touch
  BEFORE UPDATE ON public.custom_field_values
  FOR EACH ROW EXECUTE FUNCTION public.custom_field_values_touch();

-- ---------------------------------------------------------------------------
-- RLS (owner)
-- ---------------------------------------------------------------------------
ALTER TABLE public.object_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.record_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_field_values ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS object_metadata_owner_all ON public.object_metadata;
CREATE POLICY object_metadata_owner_all ON public.object_metadata
  FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS field_metadata_owner_all ON public.field_metadata;
CREATE POLICY field_metadata_owner_all ON public.field_metadata
  FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS records_owner_all ON public.records;
CREATE POLICY records_owner_all ON public.records
  FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS record_relations_owner_all ON public.record_relations;
CREATE POLICY record_relations_owner_all ON public.record_relations
  FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS custom_field_values_owner_all ON public.custom_field_values;
CREATE POLICY custom_field_values_owner_all ON public.custom_field_values
  FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
