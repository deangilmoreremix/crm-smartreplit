# Review note: 20261113000000_white_label_domains_rls.sql

Tenant == owning auth user (`domains.tenant_id = auth.uid()`).

| Object | Role | Access |
|---|---|---|
| `domains` policy `domains_owner_select` | authenticated | SELECT where `tenant_id = auth.uid()` |
| `domains` policy `domains_owner_delete` | authenticated | DELETE where `tenant_id = auth.uid()` |
| `domains` INSERT/UPDATE | authenticated | none (privileges revoked, no policy) |
| `domains` | anon | none (all revoked) |
| `request_domain(text)` | authenticated | SECURITY DEFINER; the only way to insert. Lower-cases, validates hostname, rejects `*.smartcrm.vip`/`*.netlify.app`, duplicates (case-insensitive), max 10 per owner; random 64-hex token; status `pending`, ssl `pending` |
| `get_branding_for_host(text)` (earlier migration) | anon, authenticated | returns branding JSON for `status='active'` domains only; `domains` stays unreadable to anon |

Verification writes: the `verify-domain` Edge Function reads the row with the caller's JWT
(RLS proves ownership) and writes `dns_verified/status/last_checked_at/error_message` with the
service role, scoped to that row id + `tenant_id`. Owners therefore cannot self-verify.
SSL is never set by this system; Netlify provisions certificates.

Also: unique index on `lower(domain)`; `tenants.parent_partner_id` added only if `public.tenants` exists (it does not in current migrations, so it is a no-op).
