-- Search + favorites (stream S3). Idempotent; ownership is profile_id = auth.uid() on CRM tables.

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- ---------------------------------------------------------------- favorites
CREATE TABLE IF NOT EXISTS public.favorite_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL,
  position numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  object_type text NOT NULL,
  record_id text NOT NULL,
  folder_id uuid REFERENCES public.favorite_folders(id) ON DELETE SET NULL,
  position numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS favorites_user_record_uniq
  ON public.favorites (user_id, object_type, record_id);
CREATE INDEX IF NOT EXISTS favorites_user_position_idx ON public.favorites (user_id, position);
CREATE INDEX IF NOT EXISTS favorite_folders_user_position_idx ON public.favorite_folders (user_id, position);

ALTER TABLE public.favorite_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS favorite_folders_owner_all ON public.favorite_folders;
CREATE POLICY favorite_folders_owner_all ON public.favorite_folders
  FOR ALL TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS favorites_owner_all ON public.favorites;
CREATE POLICY favorites_owner_all ON public.favorites
  FOR ALL TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.favorites, public.favorite_folders TO authenticated;

-- ------------------------------------------------------- trigram indexes
DO $$
BEGIN
  IF to_regclass('public.contacts') IS NOT NULL THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS contacts_first_name_trgm ON public.contacts USING gin (first_name gin_trgm_ops)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS contacts_last_name_trgm ON public.contacts USING gin (last_name gin_trgm_ops)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS contacts_email_trgm ON public.contacts USING gin (email gin_trgm_ops)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS contacts_company_trgm ON public.contacts USING gin (company gin_trgm_ops)';
  END IF;
  IF to_regclass('public.deals') IS NOT NULL THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS deals_title_trgm ON public.deals USING gin (title gin_trgm_ops)';
  END IF;
  IF to_regclass('public.tasks') IS NOT NULL THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS tasks_title_trgm ON public.tasks USING gin (title gin_trgm_ops)';
  END IF;
  IF to_regclass('public.companies') IS NOT NULL THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS companies_name_trgm ON public.companies USING gin (name gin_trgm_ops)';
  END IF;
END $$;

-- ------------------------------------------------------------ global_search
-- SECURITY INVOKER: table RLS of the caller applies to every branch.
-- Branches are built dynamically so missing tables are simply skipped.
CREATE OR REPLACE FUNCTION public.global_search(q text, lim int DEFAULT 20)
RETURNS TABLE (object_type text, record_id text, title text, subtitle text, rank real)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public, extensions
AS $fn$
DECLARE
  needle text := btrim(coalesce(q, ''));
  pat text;
  parts text[] := ARRAY[]::text[];
  sql text;
BEGIN
  IF needle = '' THEN
    RETURN;
  END IF;
  pat := '%' || replace(replace(replace(needle, '\', '\\'), '%', '\%'), '_', '\_') || '%';
  lim := least(greatest(coalesce(lim, 20), 1), 100);

  IF to_regclass('public.contacts') IS NOT NULL THEN
    parts := parts || $p$
      SELECT 'contact'::text, c.id::text,
             btrim(coalesce(c.first_name,'') || ' ' || coalesce(c.last_name,'')),
             nullif(concat_ws(' · ', c.email, c.company), ''),
             greatest(
               similarity(coalesce(c.first_name,'') || ' ' || coalesce(c.last_name,''), $1),
               similarity(coalesce(c.email,''), $1),
               similarity(coalesce(c.company,''), $1)
             )::real
      FROM public.contacts c
      WHERE (coalesce(c.first_name,'') || ' ' || coalesce(c.last_name,'')) ILIKE $2
         OR c.email ILIKE $2 OR c.company ILIKE $2
         OR similarity(coalesce(c.first_name,'') || ' ' || coalesce(c.last_name,''), $1) > 0.3
    $p$::text;
  END IF;
  IF to_regclass('public.deals') IS NOT NULL THEN
    parts := parts || $p$
      SELECT 'deal'::text, d.id::text, d.title,
             nullif(concat_ws(' · ', d.stage, d.value::text), ''),
             similarity(d.title, $1)::real
      FROM public.deals d
      WHERE d.title ILIKE $2 OR similarity(d.title, $1) > 0.3
    $p$::text;
  END IF;
  IF to_regclass('public.tasks') IS NOT NULL THEN
    parts := parts || $p$
      SELECT 'task'::text, t.id::text, t.title,
             nullif(concat_ws(' · ', t.status, t.priority), ''),
             similarity(t.title, $1)::real
      FROM public.tasks t
      WHERE t.title ILIKE $2 OR similarity(t.title, $1) > 0.3
    $p$::text;
  END IF;
  IF to_regclass('public.companies') IS NOT NULL THEN
    parts := parts || $p$
      SELECT 'company'::text, co.id::text, co.name, NULL::text,
             similarity(co.name, $1)::real
      FROM public.companies co
      WHERE co.name ILIKE $2 OR similarity(co.name, $1) > 0.3
    $p$::text;
  END IF;

  IF array_length(parts, 1) IS NULL THEN
    RETURN;
  END IF;

  sql := 'SELECT * FROM (' || array_to_string(parts, ' UNION ALL ')
      || ') r(object_type, record_id, title, subtitle, rank) ORDER BY rank DESC, title LIMIT $3';
  RETURN QUERY EXECUTE sql USING needle, pat, lim;
END;
$fn$;

REVOKE ALL ON FUNCTION public.global_search(text, int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.global_search(text, int) TO authenticated;
