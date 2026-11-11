# Review notes: 20261115100000_records_masked_view.sql

## Problem
Field read permissions (`role_field_permissions.can_read = false`) were enforced only by the API
(`server/routes/dataModel.ts` masks with `maskData`, using the service role). A team member with a Supabase JWT could
`select * from records` through PostgREST / supabase-js and read every field, because `records_member_select` only
checks object-level read.

## What this adds
- `records_masked` view `WITH (security_invoker = true)`: `id, object_id, user_id, data, deleted_at, created_at, updated_at`
  with `data = mask_record_data(user_id, object_id::text, data)` (owner sees everything; members lose keys their role
  cannot read; default is allow when no field row exists, as elsewhere).
- `records_masked_rows(p_object_id uuid default null)`: the SECURITY DEFINER function the view wraps. Prefer
  `supabase.rpc('records_masked_rows', { p_object_id })` for large tables (see "Performance").
- `has_read_restrictions(owner, object_type)`: true when the caller's role hides at least one field of that object.
- `records_member_select` is replaced: a member can read raw rows only when their role has **no** hidden fields for that
  object. Restricted members get no rows from the raw table and must use the view.
- `REVOKE ALL ON records FROM anon` (it had no policy; this removes the table grant too).

## Why not "revoke SELECT on records from authenticated" + plain security_invoker view
A `security_invoker` view runs the underlying query with the **caller's** privileges and RLS. Revoking `SELECT` from
`authenticated` (or dropping the member policy) would make the view return nothing / fail for exactly the people it is
for, and owners would lose PostgREST access. A security-invoker view therefore cannot be the only way to read. So the
view delegates to a SECURITY DEFINER function that re-implements visibility with the same helpers the policies use
(`visible_owner_ids()`, `has_object_perm(..., 'read')`), while the raw-table policy is narrowed instead of revoked.

## Trade-offs
- **Direct writes by restricted members stop working.** Postgres requires UPDATE targets to pass a SELECT policy
  (WHERE/RETURNING), so `records_member_update` matches zero rows for restricted members. Their writes must go through
  `/api/data-model/records/:id` (service role, field write checks), which is already the app's path. Unrestricted members
  and owners are unchanged. The `trg_records_a_field_perms` write trigger remains as defence in depth.
- **Performance.** The planner cannot push `object_id` / `created_at` filters or `ORDER BY ... LIMIT` into a SECURITY
  DEFINER function, so `select ... from records_masked where object_id = ...` scans all visible records first. Use the
  `p_object_id` argument (filtered inside the function) for list reads; the API keeps using the raw table with the
  service role and indexes. Fine for the current data volumes; revisit with a SQL-inlinable view if it grows.
- **`search_text` is not exposed** on the view (it concatenates every field value, including masked ones). Anything
  filtering on it must use the service role. Note `GET /api/data-model/records` currently spreads the whole row, so it
  returns `search_text` to members; `server/routes/dataModel.ts` should drop that key for restricted roles (not changed here).
- **Role changes** apply on the next query (functions are STABLE, evaluated per statement). Realtime on `records` is
  unaffected by the view (Realtime does not publish views); restricted members stop receiving raw row events because RLS
  now hides the rows.
- **Hidden fields only.** Object-level `can_read` already gated rows; this adds no new deny for objects without field rows.

## Clients
`client/src/hooks/useDataModel.ts` and `GenericRecordsPage` read only through `/api/data-model/*` (no supabase-js reads of
`records`), and the API masks server-side, so no client change is needed. Any future supabase-js read of record data should
use `from('records_masked')` or the RPC above, never `from('records')`.

## Verification (not run here; needs a Postgres with the migrations)
As a member with a role hiding field `salary`: `select data from records_masked` has no `salary`; `select * from records`
returns 0 rows; as the owner both return everything; as a member with no hidden fields both work.
