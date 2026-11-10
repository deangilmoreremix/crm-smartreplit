# Review: 20261114100000_search_favorites.sql

## Tables / policies (RLS enabled on both)
| Table | Policy | Command | Role | Rule |
|---|---|---|---|---|
| favorites | favorites_owner_all | ALL | authenticated | user_id = (select auth.uid()) (USING + WITH CHECK) |
| favorite_folders | favorite_folders_owner_all | ALL | authenticated | user_id = (select auth.uid()) (USING + WITH CHECK) |

- `user_id` defaults to `auth.uid()`; unique index (user_id, object_type, record_id) prevents duplicate favorites.
- Deleting a folder sets `favorites.folder_id` to NULL (favorite moves to root).

## Function grants
- `global_search(q text, lim int)`: SECURITY INVOKER (caller's RLS on contacts/deals/tasks/companies applies), STABLE.
  EXECUTE revoked from PUBLIC/anon, granted to `authenticated`. Limit clamped 1..100; LIKE wildcards in input escaped.
- Branches are built only for tables that exist (`to_regclass`), so missing `companies` is skipped.

## Idempotency
Extensions `IF NOT EXISTS`; tables/indexes `IF NOT EXISTS`; policies DROP IF EXISTS + CREATE; function CREATE OR REPLACE; trigram indexes guarded per table.

## Notes
- CRM tables are owned via `profile_id`; this migration relies on existing RLS there (not modified).
- `contacts.id` etc. are integers; exposed as text `record_id`.
