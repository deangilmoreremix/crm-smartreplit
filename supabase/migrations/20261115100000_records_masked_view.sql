-- Hard field-level READ masking for custom-object `records`.
-- See 20261115100000_records_masked_view.REVIEW.md for the design and its trade-offs. Idempotent.
--
-- Until now field read permissions were only enforced by the API (server/routes/dataModel.ts, service role).
-- A team member holding a JWT could still SELECT public.records directly through PostgREST and read every
-- field. This migration:
--   1. adds `records_masked` (security_invoker view) which returns `data` with unreadable keys removed;
--   2. stops members whose role has field read restrictions from reading raw `records` rows at all, so the
--      view is their only direct read path. Owners and unrestricted members are unaffected.
-- The service role (the API) bypasses RLS and is not touched.

-- Does the caller's role (in p_owner's team) hide at least one field of this object? Owner / non-member => false.
CREATE OR REPLACE FUNCTION public.has_read_restrictions(p_owner uuid, p_object_type text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN (select auth.uid()) IS NULL OR p_owner = (select auth.uid()) THEN false
    ELSE EXISTS (
      SELECT 1
      FROM public.team_members tm
      JOIN public.role_field_permissions rfp ON rfp.role_id = tm.role_id
      WHERE tm.owner_id = p_owner AND tm.member_id = (select auth.uid()) AND tm.status = 'active'
        AND rfp.object_type = p_object_type AND rfp.can_read = false
    )
  END;
$$;

-- Rows the caller may read, with `data` masked per role. SECURITY DEFINER so restricted members (who no
-- longer pass RLS on the raw table) can still reach their masked rows; visibility is re-implemented here with
-- the same helpers the RLS policies use. `search_text` is intentionally NOT returned: it is derived from every
-- field value and would leak masked content. p_object_id lets callers filter inside the function (the planner
-- cannot push filters through a SECURITY DEFINER function, so prefer this over `.eq('object_id', ...)` on the view).
CREATE OR REPLACE FUNCTION public.records_masked_rows(p_object_id uuid DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  object_id uuid,
  user_id uuid,
  data jsonb,
  deleted_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.id, r.object_id, r.user_id,
         public.mask_record_data(r.user_id, r.object_id::text, r.data) AS data,
         r.deleted_at, r.created_at, r.updated_at
  FROM public.records r
  WHERE (p_object_id IS NULL OR r.object_id = p_object_id)
    AND r.user_id IN (SELECT public.visible_owner_ids())
    AND public.has_object_perm(r.user_id, r.object_id::text, 'read');
$$;

CREATE OR REPLACE VIEW public.records_masked WITH (security_invoker = true) AS
  SELECT * FROM public.records_masked_rows(NULL);

-- Restricted members may no longer read raw rows (they use records_masked). Everyone else keeps the
-- existing policies: owners via records_owner_all, unrestricted members via this policy.
DROP POLICY IF EXISTS records_member_select ON public.records;
CREATE POLICY records_member_select ON public.records FOR SELECT TO authenticated
  USING (
    user_id <> (select auth.uid())
    AND public.has_object_perm(user_id, object_id::text, 'read')
    AND NOT public.has_read_restrictions(user_id, object_id::text)
  );

-- Privileges: anon never reads records (it has no policy anyway); authenticated goes through RLS / the view.
REVOKE ALL ON public.records FROM anon;
REVOKE ALL ON public.records_masked FROM PUBLIC, anon;
GRANT SELECT ON public.records_masked TO authenticated;
REVOKE ALL ON FUNCTION public.has_read_restrictions(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.records_masked_rows(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_read_restrictions(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.records_masked_rows(uuid) TO authenticated;
