-- Team roles and permissions (single-owner workspace model, no `workspaces` table).
-- The "workspace" is the owner's user id. Team members get access to the owner's data through
-- ADDITIONAL permissive policies; owner policies on existing tables are untouched.
-- See 20261114310000_permissions.REVIEW.md. Idempotent.

CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (owner_id, name)
);

CREATE TABLE IF NOT EXISTS public.role_object_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  -- standard object name (contacts, deals, tasks, companies) or object_metadata.id::text for custom objects
  object_type TEXT NOT NULL,
  can_read BOOLEAN NOT NULL DEFAULT FALSE,
  can_create BOOLEAN NOT NULL DEFAULT FALSE,
  can_update BOOLEAN NOT NULL DEFAULT FALSE,
  can_delete BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (role_id, object_type)
);

CREATE TABLE IF NOT EXISTS public.role_field_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  object_type TEXT NOT NULL,
  field TEXT NOT NULL,
  can_read BOOLEAN NOT NULL DEFAULT TRUE,
  can_write BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (role_id, object_type, field)
);

CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,  -- null until the invitee has an account
  email TEXT,
  role_id UUID REFERENCES public.roles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'active', 'disabled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (owner_id, member_id),
  UNIQUE (owner_id, email)
);
CREATE INDEX IF NOT EXISTS idx_team_members_member ON public.team_members(member_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_roles_owner ON public.roles(owner_id);

-- ---------------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER so RLS on the permission tables is not re-entered)
-- ---------------------------------------------------------------------------

-- Owners whose data the caller may see: themselves plus owners whose team they are an active member of.
CREATE OR REPLACE FUNCTION public.visible_owner_ids()
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (select auth.uid())
  WHERE (select auth.uid()) IS NOT NULL
  UNION
  SELECT tm.owner_id FROM public.team_members tm
  WHERE tm.member_id = (select auth.uid()) AND tm.status = 'active';
$$;

-- Role id of the caller within p_owner's team (null for the owner or non-members).
CREATE OR REPLACE FUNCTION public.member_role_id(p_owner uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tm.role_id FROM public.team_members tm
  WHERE tm.owner_id = p_owner AND tm.member_id = (select auth.uid()) AND tm.status = 'active'
  LIMIT 1;
$$;

-- Does the caller have `action` (read|create|update|delete) on `object_type` in p_owner's data?
-- The owner always does. Members need an active team row and a role grant. Unknown action => false.
CREATE OR REPLACE FUNCTION public.has_object_perm(p_owner uuid, p_object_type text, p_action text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN (select auth.uid()) IS NULL THEN false
    WHEN p_owner = (select auth.uid()) THEN true
    ELSE COALESCE((
      SELECT CASE p_action
               WHEN 'read'   THEN rop.can_read
               WHEN 'create' THEN rop.can_create
               WHEN 'update' THEN rop.can_update
               WHEN 'delete' THEN rop.can_delete
               ELSE false
             END
      FROM public.team_members tm
      JOIN public.role_object_permissions rop ON rop.role_id = tm.role_id
      WHERE tm.owner_id = p_owner
        AND tm.member_id = (select auth.uid())
        AND tm.status = 'active'
        AND rop.object_type = p_object_type
      LIMIT 1
    ), false)
  END;
$$;

-- Field-level check. Default allow when no row exists (owner always allowed).
CREATE OR REPLACE FUNCTION public.has_field_perm(p_owner uuid, p_object_type text, p_field text, p_action text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN (select auth.uid()) IS NULL THEN false
    WHEN p_owner = (select auth.uid()) THEN true
    ELSE COALESCE((
      SELECT CASE p_action WHEN 'read' THEN rfp.can_read WHEN 'write' THEN rfp.can_write ELSE false END
      FROM public.team_members tm
      JOIN public.role_field_permissions rfp ON rfp.role_id = tm.role_id
      WHERE tm.owner_id = p_owner AND tm.member_id = (select auth.uid()) AND tm.status = 'active'
        AND rfp.object_type = p_object_type AND rfp.field = p_field
      LIMIT 1
    ), true)
  END;
$$;

-- Removes keys the caller may not read from a record's data blob.
-- NOTE: takes the owner as first argument (needed to resolve the caller's role).
CREATE OR REPLACE FUNCTION public.mask_record_data(p_owner uuid, p_object_type text, p_data jsonb)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT jsonb_object_agg(e.key, e.value)
     FROM jsonb_each(COALESCE(p_data, '{}'::jsonb)) e
     WHERE public.has_field_perm(p_owner, p_object_type, e.key, 'read')),
    '{}'::jsonb);
$$;

REVOKE ALL ON FUNCTION public.visible_owner_ids() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.member_role_id(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_object_perm(uuid, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_field_perm(uuid, text, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.mask_record_data(uuid, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.visible_owner_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.member_role_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_object_perm(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_field_perm(uuid, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mask_record_data(uuid, text, jsonb) TO authenticated;

-- ---------------------------------------------------------------------------
-- RLS on the permission tables
-- ---------------------------------------------------------------------------
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_object_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_field_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS roles_owner_all ON public.roles;
CREATE POLICY roles_owner_all ON public.roles FOR ALL TO authenticated
  USING ((select auth.uid()) = owner_id) WITH CHECK ((select auth.uid()) = owner_id);

DROP POLICY IF EXISTS roles_member_select ON public.roles;
CREATE POLICY roles_member_select ON public.roles FOR SELECT TO authenticated
  USING (id = (select public.member_role_id(owner_id)));

DROP POLICY IF EXISTS role_object_permissions_owner_all ON public.role_object_permissions;
CREATE POLICY role_object_permissions_owner_all ON public.role_object_permissions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.roles r WHERE r.id = role_id AND r.owner_id = (select auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.roles r WHERE r.id = role_id AND r.owner_id = (select auth.uid())));

DROP POLICY IF EXISTS role_field_permissions_owner_all ON public.role_field_permissions;
CREATE POLICY role_field_permissions_owner_all ON public.role_field_permissions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.roles r WHERE r.id = role_id AND r.owner_id = (select auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.roles r WHERE r.id = role_id AND r.owner_id = (select auth.uid())));

DROP POLICY IF EXISTS team_members_owner_all ON public.team_members;
CREATE POLICY team_members_owner_all ON public.team_members FOR ALL TO authenticated
  USING ((select auth.uid()) = owner_id) WITH CHECK ((select auth.uid()) = owner_id);

-- A member can read their own membership row (read-only).
DROP POLICY IF EXISTS team_members_self_select ON public.team_members;
CREATE POLICY team_members_self_select ON public.team_members FOR SELECT TO authenticated
  USING ((select auth.uid()) = member_id);

-- ---------------------------------------------------------------------------
-- Field-level write enforcement for records
-- ---------------------------------------------------------------------------
-- Applies only to authenticated end users acting through RLS as team members.
-- The service role (auth.uid() IS NULL) is trusted: the API enforces permissions itself.
CREATE OR REPLACE FUNCTION public.enforce_field_write_perms()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  k text;
BEGIN
  IF (select auth.uid()) IS NULL OR (select auth.uid()) = OLD.user_id THEN
    RETURN NEW;
  END IF;
  IF NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.object_id IS DISTINCT FROM OLD.object_id THEN
    RAISE EXCEPTION 'owner/object of a record cannot be changed' USING ERRCODE = '42501';
  END IF;
  FOR k IN
    SELECT key FROM (
      SELECT key FROM jsonb_object_keys(COALESCE(OLD.data, '{}'::jsonb)) AS key
      UNION
      SELECT key FROM jsonb_object_keys(COALESCE(NEW.data, '{}'::jsonb)) AS key
    ) keys
  LOOP
    IF (OLD.data -> k) IS DISTINCT FROM (NEW.data -> k)
       AND NOT public.has_field_perm(OLD.user_id, OLD.object_id::text, k, 'write') THEN
      RAISE EXCEPTION 'no write permission on field %', k USING ERRCODE = '42501';
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_records_a_field_perms ON public.records;
CREATE TRIGGER trg_records_a_field_perms
  BEFORE UPDATE ON public.records
  FOR EACH ROW EXECUTE FUNCTION public.enforce_field_write_perms();

-- ---------------------------------------------------------------------------
-- Additional (OR'd) member policies. Owner policies are not modified.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS records_member_select ON public.records;
CREATE POLICY records_member_select ON public.records FOR SELECT TO authenticated
  USING (user_id <> (select auth.uid()) AND public.has_object_perm(user_id, object_id::text, 'read'));

DROP POLICY IF EXISTS records_member_update ON public.records;
CREATE POLICY records_member_update ON public.records FOR UPDATE TO authenticated
  USING (user_id <> (select auth.uid()) AND public.has_object_perm(user_id, object_id::text, 'update'))
  WITH CHECK (user_id <> (select auth.uid()) AND public.has_object_perm(user_id, object_id::text, 'update'));

DROP POLICY IF EXISTS custom_field_values_member_select ON public.custom_field_values;
CREATE POLICY custom_field_values_member_select ON public.custom_field_values FOR SELECT TO authenticated
  USING (user_id <> (select auth.uid()) AND public.has_object_perm(user_id, object_type, 'read'));

DROP POLICY IF EXISTS custom_field_values_member_update ON public.custom_field_values;
CREATE POLICY custom_field_values_member_update ON public.custom_field_values FOR UPDATE TO authenticated
  USING (user_id <> (select auth.uid()) AND public.has_object_perm(user_id, object_type, 'update'))
  WITH CHECK (user_id <> (select auth.uid()) AND public.has_object_perm(user_id, object_type, 'update'));

-- Members need to read the owner's object/field definitions for objects they can read.
DROP POLICY IF EXISTS object_metadata_member_select ON public.object_metadata;
CREATE POLICY object_metadata_member_select ON public.object_metadata FOR SELECT TO authenticated
  USING (user_id <> (select auth.uid()) AND public.has_object_perm(user_id, id::text, 'read'));

DROP POLICY IF EXISTS field_metadata_member_select ON public.field_metadata;
CREATE POLICY field_metadata_member_select ON public.field_metadata FOR SELECT TO authenticated
  USING (user_id <> (select auth.uid()) AND public.has_object_perm(user_id, object_id::text, 'read'));

-- Legacy tables: only when present, with a uuid owner column (profile_id or user_id), RLS already enabled.
DO $$
DECLARE
  t text;
  col text;
BEGIN
  FOREACH t IN ARRAY ARRAY['contacts', 'deals', 'tasks', 'companies'] LOOP
    IF to_regclass('public.' || t) IS NULL THEN CONTINUE; END IF;
    SELECT c.column_name INTO col
    FROM information_schema.columns c
    WHERE c.table_schema = 'public' AND c.table_name = t
      AND c.column_name IN ('profile_id', 'user_id') AND c.data_type = 'uuid'
    ORDER BY (c.column_name = 'profile_id') DESC
    LIMIT 1;
    IF col IS NULL THEN CONTINUE; END IF;

    EXECUTE format('DROP POLICY IF EXISTS team_member_select ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY team_member_select ON public.%I FOR SELECT TO authenticated '
      'USING (%I <> (select auth.uid()) AND public.has_object_perm(%I, %L, %L))', t, col, col, t, 'read');

    EXECUTE format('DROP POLICY IF EXISTS team_member_update ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY team_member_update ON public.%I FOR UPDATE TO authenticated '
      'USING (%I <> (select auth.uid()) AND public.has_object_perm(%I, %L, %L)) '
      'WITH CHECK (%I <> (select auth.uid()) AND public.has_object_perm(%I, %L, %L))',
      t, col, col, t, 'update', col, col, t, 'update');
  END LOOP;
END $$;
