# Testing

Stack: Netlify, Supabase, OpenAI. Nothing else. Use pnpm for installs (`corepack enable && pnpm install`); the commands below use `npx`/`node` and need no install.

There are five layers. The first needs nothing external; the other four need a staging stack (Supabase branch + Netlify deploy preview) and two throwaway users.

| # | Layer | Command | Needs |
|---|-------|---------|-------|
| 1 | Unit tests (vitest) | `npx vitest run server packages` (hard CI gate), `npx vitest run` (client tests are informational, see `docs/CI.md`) | nothing |
| 2 | OpenAI model/tool check | `OPENAI_API_KEY=sk-... node scripts/smoke-openai.mjs` | an OpenAI key |
| 3 | API smoke test | `npm run test:smoke` (= `node scripts/smoke-api.mjs`) | staging API + Supabase + users A/B |
| 4 | Database RLS assertions | `supabase/tests/rls.sql` through `psql` or the Supabase SQL editor | staging database + users A/B |
| 5 | Browser E2E (Playwright) | `npm run test:e2e` (= `playwright test --config tests/playwright/staging/playwright.config.ts`) | staging site + users A/B |

All of layers 3 to 5 skip themselves with a clear message when their environment is missing, so running them without setup is harmless.

## 1. Environment matrix

| Variable | Where it is set | Used by | Notes |
|----------|-----------------|---------|-------|
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Netlify (build env, deploy preview context) | client build | point at the **staging** project |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Netlify (functions env) | API (`server/netlify-api.ts`) | service-role key is a secret, never put it in a test env or in chat |
| `OPENAI_API_KEY` | Netlify (functions env); optional per-user key in app Settings > API Keys | AI routes | per-user keys win over the site key |
| `OPENAI_MODEL_FAST/DEFAULT/DEEP/MAX` | Netlify | AI routes | only to override tier model ids |
| `API_KEY_PEPPER` | Netlify | public API keys (`/api/public-api-keys`, `/api/v1/*`) | long random string; without it creating a key answers 503 and smoke reports SKIP |
| `AI_JOBS_SECRET`, `URL` | Netlify (`URL` is set by Netlify itself) | `POST /api/ai/jobs` -> `ai-jobs-background` | without them AI jobs answer 503 (smoke reports SKIP) |
| `NETLIFY_CNAME_TARGET`, plus `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Supabase Edge Function secrets | `verify-domain` function | `NETLIFY_CNAME_TARGET` is the host custom domains must CNAME to |
| `API_BASE_URL` | your shell | `smoke-api` | the deploy preview origin, e.g. `https://deploy-preview-12--site.netlify.app` |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | your shell | `smoke-api` | staging project; anon key only |
| `TEST_USER_A_EMAIL/PASSWORD`, `TEST_USER_B_EMAIL/PASSWORD` | your shell | `smoke-api` | B is optional but enables every cross-user denial check |
| `SMOKE_AI=1` | your shell | `smoke-api` | assistants two-turn chat + AI job; needs an OpenAI key (site key or one saved for user A) |
| `SMOKE_RATE_LIMIT=1` | your shell | `smoke-api` | sends about 125 requests to prove the 429 on public API keys |
| `SMOKE_STRICT=1` | your shell | `smoke-api` | exit code 2 instead of 0 when required env is missing (useful in CI) |
| `E2E_BASE_URL` | your shell | Playwright | deploy preview origin |
| `E2E_USER_A_EMAIL/PASSWORD`, `E2E_USER_B_EMAIL/PASSWORD` | your shell | Playwright | same users as above |
| `E2E_AI=1` | your shell | Playwright | enables the assertions that call OpenAI |
| `DATABASE_URL` | your shell | `psql` for `rls.sql` / seed | the staging Postgres connection string (role `postgres`) |

Tip: keep the test variables in an untracked file (`.env.staging`) and `set -a; source .env.staging; set +a` before running. Never commit it.

## 2. Staging setup

1. **Supabase branch.** Create a branch of the project (Dashboard > Branches, or `supabase branches create staging`) so no production data is involved. Copy the branch's API URL, anon key and database connection string.
2. **Apply migrations in order.** Everything in `supabase/migrations/` applies in file-name order. The migrations covered by the tests are the 2026-11 batch, in this order:
   ```
   20261110000000_white_label_persistence.sql
   20261111000000_ai_assistants.sql
   20261112000000_openai_only_keys.sql
   20261113000000_white_label_domains_rls.sql
   20261113100000_workflows_and_views.sql
   20261113200000_crm_attachments.sql
   20261113300000_user_api_keys_unify.sql
   20261113310000_ai_jobs.sql
   20261114000000_companies_and_targets.sql
   20261114100000_search_favorites.sql
   20261114200000_timeline_notes.sql
   20261114300000_data_model.sql
   20261114310000_permissions.sql
   20261114400000_workflow_automation.sql
   20261114410000_webhooks_api.sql
   20261114500000_user_ui_preferences.sql
   20261115000000_workflow_nested_waits.sql
   20261115100000_records_masked_view.sql
   ```
   Easiest: `supabase link --project-ref <branch-ref> && supabase db push`. Or run the files one by one in the SQL editor in that order. Each `*.REVIEW.md` next to a migration explains the security model.
3. **Deploy the edge function** that verifies custom-domain DNS:
   ```
   supabase functions deploy verify-domain --project-ref <branch-ref>
   supabase secrets set NETLIFY_CNAME_TARGET=<your-site>.netlify.app --project-ref <branch-ref>
   ```
   (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` are injected by Supabase.)
4. **Netlify preview env vars.** In Site configuration > Environment variables, scope the staging values to **Deploy Previews** (or a branch deploy): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `API_KEY_PEPPER`, `AI_JOBS_SECRET`, optional `OPENAI_API_KEY`. Open a PR (the `netlify-preview` workflow posts the URL) or run `npx netlify-cli deploy --build` for a draft URL. Scheduled functions (`webhook-delivery`, `workflow-scheduler`) only run on published deploys, not on drafts; webhook deliveries therefore stay `pending` on a preview, which is expected.
5. **Create users A and B and seed sample data:** follow the header of `supabase/seed/test_users.sql` (dashboard or Auth admin API), then run it:
   ```
   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/seed/test_users.sql
   ```
   It is idempotent and skips tables or columns that do not exist.
6. Give the users whatever plan/entitlement the app requires for the features under test (AI tools, white-label). A 403 from an entitlement guard shows up as a SKIP in smoke and as a redirect in E2E.

## 3. Running each layer

### vitest
```
npx vitest run server packages     # must be green
npx vitest run                     # client tests; known failures are listed in docs/CI.md
```

### smoke-openai
```
OPENAI_API_KEY=sk-... node scripts/smoke-openai.mjs
```
Expected: PASS for each model tier, JSON output, streaming and the tool loop; FAIL lines name the model id the key cannot use.

### smoke-api
```
export API_BASE_URL=https://deploy-preview-12--yoursite.netlify.app
export SUPABASE_URL=https://<branch-ref>.supabase.co
export SUPABASE_ANON_KEY=...
export TEST_USER_A_EMAIL=... TEST_USER_A_PASSWORD=...
export TEST_USER_B_EMAIL=... TEST_USER_B_PASSWORD=...
npm run test:smoke                          # core checks
SMOKE_AI=1 npm run test:smoke               # plus assistants + AI jobs
SMOKE_RATE_LIMIT=1 npm run test:smoke       # plus the 429 burst
```
It signs both users in through Supabase Auth REST, runs the checks below, prints a PASS/FAIL/SKIP table, and exits 1 if anything FAILed. Secrets, tokens and API keys are redacted from all output. Everything it creates is deleted afterwards (it also removes the task created by the workflow run, title `smoke-api task`).

Signature helper for webhook receivers: `node scripts/smoke-api.mjs --verify-signature <secret> <timestamp> <rawBody> <sha256=...>` recomputes `HMAC-SHA256(secret, "<timestamp>.<rawBody>")` exactly like `server/jobs/webhookDelivery.ts` and tells you whether a delivery's `X-SmartCRM-Signature` is valid.

Checks and expected results:

| Check | Expected |
|-------|----------|
| no token / garbage token on `/api/notes`, `/api/crm/companies` | 401 |
| JWT on `/api/openai/status` | 200 |
| note create with `body_json` + `body_text`, read back | 201, both fields persisted, listed |
| companies create/get/update/list/delete | 201 / 200 / 200 / listed / 200-204 then 404 |
| user B vs A's company | 403 or 404 for get/put/delete, not in B's list, A's row untouched |
| data-model object + field + record create/list/delete | 201 each, record listed by id and by plural name, soft-deleted afterwards |
| user B vs A's object/records | 403/404 on list/update/delete; A's data unchanged |
| workflow create, manual run, history | 201, run `completed` (or `waiting`), run in history |
| user B vs A's workflow | 404 on get, 403/404 on run |
| inbound webhook token | 202 with `runId`; unknown or revoked token 404 |
| public API key lifecycle | secret returned once with `sk_live_` prefix; `/api/v1/contacts` 200 with Bearer; write with read-only key 403; unknown key 401; revoked key 401; list never shows secret or `key_hash` |
| write key | create (201) / get / validation error (400) / delete (204) / 404 |
| 429 after >120/min (`SMOKE_RATE_LIMIT=1`) | at least one 429 with `Retry-After` |
| outbound webhooks | create returns secret once; list hides it; `http://` and `localhost` URLs 400; rotate gives a new secret; a `contact.created` delivery row appears after creating a contact; signature helper verifies, rejects tampered body and old secret; user B cannot list/patch/delete |
| assistants (`SMOKE_AI=1`) | two turns on one thread, second answer recalls the word, 4 stored messages, user B gets 404 on the thread |
| AI jobs (`SMOKE_AI=1`) | 202, polls until `done`, user B gets 404 |

SKIP reasons you may see: `API_KEY_PEPPER` missing (503), AI jobs not configured (503), user A lacks the AI entitlement (403), no OpenAI key for user A, `SMOKE_RATE_LIMIT` not set, user B not configured.

### rls.sql (database assertions)
1. Get the two user ids (Dashboard > Authentication > Users).
2. Open `supabase/tests/rls.sql`, replace the two placeholder UUIDs at the top (or use the `sed | psql` one-liner in the file header), and run it:
   ```
   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/rls.sql
   ```
   or paste it into the Supabase SQL editor. It runs as `postgres`, inside one transaction that ends in `ROLLBACK`; nothing persists.
3. Success: `NOTICE: RLS TESTS PASSED: N assertions` and a final `RLS TESTS PASSED` row. Failure: the first failing assertion raises `ERROR: RLS FAIL [table or function]: <what leaked>`.

**API-only custom objects (migration `20261116100000`).** `records`, `custom_field_values` and `record_relations` are closed to `anon` and `authenticated` (no privileges, RLS still on) and open to `service_role` only. Sections 2d-2f of `rls.sql` assert this strictly: no table privileges for the browser roles, SELECT/INSERT/UPDATE/DELETE rejected with SQLSTATE 42501 (also for the data owner and for a member with `can_update`), no access to `records_masked` / `records_masked_rows`, `service_role` can read/insert/update/delete, and the masked view still hides restricted fields when called through the service role. The script requires the role `service_role` (present on Supabase). To run it on a plain local Postgres you need stubs for the roles `anon`, `authenticated`, `service_role` (BYPASSRLS), schema `auth` (`uid()` reading `request.jwt.claims`, `users`), `storage.buckets/objects` and extensions `pg_trgm`/`unaccent`/`pgcrypto`, then apply all migrations in filename order (the legacy 2025/early-2026 ones may error on an empty database; the 2026-11 ones apply cleanly), insert two `auth.users` rows and use the `sed | psql` one-liner. Expected on this repository: `RLS TESTS PASSED: 205 assertions`. Unit tests for the API side: `npx vitest run server/routes/__tests__/dataModel.test.ts` (restricted roles cannot find records via hidden-field values or filters; `search_text` never appears in responses).

What it proves, for all 28 new tables (plus supporting tables): RLS is enabled and no policy is `USING (true)`; user A sees exactly its own seeded rows and none of B's; B cannot see, update or delete A's rows; anon sees nothing; inserts with another user's id are rejected; `webhooks.secret` and `api_keys.key_hash` are not selectable (also not through `SELECT *`); anon cannot execute `request_domain`, `global_search`, the permission helpers; `request_domain` normalises, rejects invalid/reserved/duplicate hosts and owners cannot insert or self-verify domains; `get_branding_for_host` answers only for `active` domains; `has_object_perm`, `has_field_perm`, `mask_record_data`, `visible_owner_ids` behave for owner, active member and disabled member; team policies grant record access per role; `records_masked` hides restricted fields (when migration `20261115100000` is applied); `pg_trgm`/`unaccent` exist; `timeline_log_*`, webhook and workflow-event triggers exist on contacts/deals/tasks/notes; storage buckets and the realtime publication are present.

### E2E (Playwright)
```
export E2E_BASE_URL=https://deploy-preview-12--yoursite.netlify.app
export E2E_USER_A_EMAIL=... E2E_USER_A_PASSWORD=...
export E2E_USER_B_EMAIL=... E2E_USER_B_PASSWORD=...
npx playwright install chromium            # once per machine
npm run test:e2e
npx playwright test --config tests/playwright/staging/playwright.config.ts --list   # list without running
E2E_AI=1 npm run test:e2e                  # include OpenAI-dependent assertions
```
Specs (one per flow group, run serially in `tests/playwright/staging/`): `01-dashboard-layout`, `02-command-menu-favorites`, `03-contacts-table`, `04-record-page`, `05-companies-deals`, `06-settings`, `07-workflows`, `08-ai-tools`, `09-white-label`. Login goes through the real `/auth/login` form. Reports: `playwright-report-staging/`, traces and videos of failures in `test-results-staging/`. The specs use role/text/label selectors (the app has few `data-testid`s), so a renamed button text is the most likely cause of a failure; the manual checklist below says what each step is supposed to show.

## 4. Manual checklist (the 10 browser flows)

Use user A on the deploy preview unless stated. Tick each only when the stated result is seen.

1. **Dashboard layout persistence.** Open `/dashboard`, click the gear (Dashboard Layout Settings), hide one section, wait 3 seconds. Open the site in a private window, log in as A: the section is still hidden. Reset Layout restores it. *Expected: state comes from the server, not the browser.*
2. **Command menu and favorites.** Press Ctrl/Cmd+K anywhere: the menu opens, typing `seed` lists matching contacts/deals/tasks/companies (A sees only A's). Enter opens a result, Escape closes. On a contact record click the star: it is listed in the sidebar Favorites; reload keeps it; click again removes it.
3. **Contacts manage table** (`/contacts`). Click a header: sort asc then desc (arrow shown). Search narrows rows. Filters opens the builder; a condition narrows rows; Clear filters resets. Click a cell, type, Enter: value saved and still there after reload. Tick rows: the Bulk actions bar appears (edit field, tag, owner, merge for exactly 2). Export CSV downloads a `.csv`. Import CSV/Excel with a 1-row file creates the contact. Saved views: save, reload, re-open, delete.
4. **Record page.** Open a contact: tabs Overview, Timeline, Notes, Tasks, Files, Related. Notes: type with the rich editor (bold works), Save note, the note appears and survives reload. Files: upload a small file, it is listed and downloadable. Timeline: the note and field edits appear as events.
5. **Companies and deals.** `/companies`: add a company, it appears; open it from the row menu: record tabs; the Related tab lists linked contacts. A deal record (`/deals/:id` from the pipeline) shows the same tabs and its stage/value.
6. **Settings.** `/settings/data-model`: add an object, add a field, add a record on `/o/<plural>`, delete them. `/settings/roles`: create a role, toggle permission checkboxes, reload keeps them. `/settings/team`: invite an e-mail, it shows as invited; remove it. `/settings/webhooks`: add `https://example.com/hook`; the secret is shown once with Copy/Dismiss and is gone after reload; `http://` URL is refused. `/settings/api-keys-public`: create a key with one scope; `sk_live_...` shown once; Revoke turns it inactive.
7. **Public API.** With the key from step 6: `curl -H "Authorization: Bearer sk_live_..." $SITE/api/v1/contacts?limit=2` returns JSON `data`; a write to a read-only key returns 403; after Revoke the same call returns 401; `$SITE/api/v1/openapi.json` is public.
8. **Workflows.** `/workflows`: create a workflow, run it manually, the run appears in history as completed. Add a webhook trigger, copy its URL, `curl -X POST $SITE/api/hooks/workflows/<token> -d '{"x":1}' -H 'Content-Type: application/json'` returns 202 and a new run appears.
9. **AI tools** (needs an OpenAI key in Settings > API Keys or the site key). `/ai-tools` loads; run one tool (e.g. lead scoring) and get a result; `/assistants`: create an assistant, chat two turns, the second answer uses the first; start a bulk AI job and watch it reach `done`.
10. **White-label.** `/white-label`: change company name and colours, save; in a private window logged in as A the values are the same (stored in Supabase, not localStorage). `/white-label/domains`: add `crm.example.com`: row appears as pending with a TXT token; `evil.netlify.app` and `x.smartcrm.vip` are refused; remove works. After adding the TXT record at a real DNS provider and clicking verify, status becomes active and opening the site on that host shows the branding (needs real DNS and a Netlify domain alias, see below).

## 5. What needs live credentials / real infrastructure

| Item | Needs |
|------|-------|
| `smoke-api`, rls.sql, E2E | staging Supabase branch, Netlify deploy preview, two real confirmed users |
| Assistants, AI jobs, AI tools E2E, `smoke-openai` | OpenAI API key (site env or saved per user) |
| Public API keys | `API_KEY_PEPPER` set on Netlify |
| AI jobs | `AI_JOBS_SECRET` set; the `ai-jobs-background` function deployed |
| Webhook deliveries actually reaching a receiver, workflow schedules | a **published** deploy (scheduled functions do not run on draft previews) and a public HTTPS receiver |
| Custom domain verification / branding on a custom host | `verify-domain` edge function deployed, a domain you control (TXT/CNAME), the domain added as an alias in Netlify |
| Entitlement-guarded features | users with the required plan |

Not covered by automation: real e-mail/SMS sending, payments, third-party integrations (outside the Netlify + Supabase + OpenAI stack).

## 6. Troubleshooting

| Symptom | Likely cause / fix |
|---------|--------------------|
| smoke: `SKIP smoke-api: missing env ...` | export the listed variables; use `SMOKE_STRICT=1` to make this a failure in CI |
| smoke: `Supabase sign-in failed (HTTP 400)` | wrong e-mail/password, user not confirmed, or the anon key belongs to another project |
| smoke: everything 401 after sign-in | the Netlify function points at a different Supabase project than `SUPABASE_URL`; check the function env |
| smoke: API key create SKIP (503) | `API_KEY_PEPPER` is not set on Netlify |
| smoke: AI job SKIP (503) | `AI_JOBS_SECRET` or `URL` missing, or the background function is not deployed |
| smoke: AI job stays `pending` | the background function could not be reached; check Netlify function logs for `ai-jobs-background` |
| smoke: webhook delivery row never appears | migration `20261114410000` not applied, or the trigger skipped because the contact owner column differs |
| rls.sql: `RLS SETUP: replace the placeholder UUIDs` | edit the two lines at the top |
| rls.sql: `user A (...) not found in auth.users` | create the users on this project first |
| rls.sql: `run as a role that bypasses RLS` | connect as `postgres`, not as `authenticator`/`anon` |
| rls.sql: `tables missing (apply migrations in order)` | run `supabase db push` on the branch |
| rls.sql: `RLS FAIL [contacts]: ... can SEE ... rows owned by user B` | the legacy `contacts` table has a permissive policy; tighten it (the new tables are not at fault) |
| rls.sql: `RLS FAIL [global_search]: the function itself raised an error: malformed array literal` | `parts := parts \|\| $p$...$p$` in `20261114100000_search_favorites.sql` is resolved as array-concat of two arrays; each appended SQL literal needs a `::text` cast. Fix the migration (or add a follow-up migration) and re-run |
| rls.sql stops half way with an error | by design (first failure wins); nothing is committed because the session ends in rollback |
| Supabase SQL editor shows no NOTICE | read the last result row (`RLS TESTS PASSED`), or run through psql |
| E2E: every test skipped | `E2E_BASE_URL` / `E2E_USER_A_*` not exported |
| E2E: timeout on `/auth/login` | wrong base URL, preview not finished building, or the user is not confirmed |
| E2E: redirected to login or upgrade page | the user lacks the entitlement for that page (white-label, AI tools) |
| E2E: `columnheader` / `Row actions` not found | the page does not use the shared `RecordTable` yet, or the button text changed; update the selector in the spec |
| E2E: leftover data | specs delete what they create; failures may leave `e2e-*` rows, safe to delete (`supabase/seed/test_users.sql` shows cleanup patterns) |
