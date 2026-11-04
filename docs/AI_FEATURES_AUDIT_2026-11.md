# SmartCRM AI Features Audit — November 2026

**Scope:** every AI feature in the host app (`client/`, `server/`), Netlify functions, Supabase edge functions, and the
features ported from `deangilmoreremix/openclaw-crm` and `deangilmoreremix/twenty`.
**Method:** live probes of production (`https://app.smartcrm.vip`, Netlify site `smartcrmnewdean`; Supabase project
`bzxohkrxcwodllketcpz`) on 2026-11-04, plus code tracing from each UI feature to the network call it makes.

## Summary

In production **almost no AI feature reaches a model**. Only two paths are known to work:

| Works | Path |
|---|---|
| AI provider "test" in settings | `AIProviderSettings.tsx` → `/.netlify/functions/ai-proxy` (with a key the user types in) |
| GTM prompt library | `/.netlify/functions/gtm-prompt-library` (no LLM call) |

Email AI (`useEmailAI`) and contact enrichment (`aiEnrichmentService`) call deployed Supabase functions and work **only if**
`VITE_SUPABASE_ANON_KEY` is set at build time. Everything else either errors or shows **mock data presented as AI output**.

The failures stack in four layers; fixing a lower layer exposes the next one.

---

## Layer 1 — Hosting: `/api/*` never reaches a backend  *(fixed in this branch)*

| # | Finding | Evidence |
|---|---|---|
| 1.1 | `netlify.toml` listed `/* → /index.html` **first**; Netlify applies the first match, so every `/api/*` request returned the SPA HTML with status 200. | Live: `/api/ai/status`, `/api/openai/smart-greeting`, `/api/health` → `200 text/html` |
| 1.2 | The Express server (`server/`), which implements ~90 AI routes, was never deployed. `npm run build` didn't build it and `npm start` expects a `dist/index.js` nothing produces. | `package.json` scripts |
| 1.3 | The `openai` Netlify function can't match any route: it expects the first path segment to be `openai`, but receives `.netlify` (direct) or `api` (via rewrite). | `server/openai/index.ts:190,204`; live `GET /.netlify/functions/openai/status` → `404 {"error":"OpenAI endpoint not found"}` |
| 1.4 | Client code calls `response.json()` on the HTML → throws, or (in `unifiedApiClient.ts:220-229`) returns `{success:true, data:"<html>…"}` so OpenClaw chat displays an HTML string. | see Layer 4 |
| 1.5 | Production was last deployed **2026-08-24 via the Netlify CLI**; repo changes after that aren't live. | Netlify deploy `6a8c8c3c03ea0c1d463ae253` (`deploy_source: cli`) |
| 1.6 | `pnpm-lock.yaml` was out of date with `packages/crm-shared/package.json`, so `pnpm install --frozen-lockfile` (Netlify CI default) fails. | `ERR_PNPM_OUTDATED_LOCKFILE` |

## Layer 2 — The Express server was broken even when run  *(boot blockers fixed in this branch)*

| # | Finding | Location | Status |
|---|---|---|---|
| 2.1 | Syntax error `import { requireAuth(), requireAdmin }` — the server could not start at all. | `server/routes/partners.ts:2` | fixed |
| 2.2 | No session middleware, so `req.session` is always undefined → `requireAuth()` and `requireEntitlement()` returned **401 on every AI route**. The client never sends credentials either. | `server/routes/auth.ts`, `server/middleware/entitlements.ts:114,193` | fixed: Supabase access-token auth |
| 2.3 | `memoryService.recordChatInteraction()` (46 call sites) and `isEnabled()` don't exist → successful AI calls hang (aiAdvanced/aiCommunication/aiContent/aiSalesTools), get replaced by a fallback (aiProductivity) or 500 (openai.ts). | `server/memory.ts` | fixed (no-op stubs) |
| 2.4 | `openai.ts` / `openaiResponses.ts` declare full `/api/openai/...` paths but were mounted under `/api/openai` → real URLs were `/api/openai/api/openai/*`; Responses API endpoints unreachable. | `server/routes/index.ts:91,95` | fixed |
| 2.5 | `shared/schema.ts` lost ~1,850 lines in commit `00a8405` ("add Mailchimp integration fields"). 15 tables/insert-schemas still imported by `crm.ts`, `openclaw.ts`, `creditService.ts`, `aiPricingService.ts` became `undefined` (and block bundling). | `shared/schema.ts` | restored the 15 definitions |
| 2.6 | `aiPricing.ts` imports a non-existent `requireRole`; `domainManager.ts` imports `../services/cache` (wrong path); health check uses `require('os')` inside ESM. | `aiPricing.ts:2`, `services/whitelabel/domainManager.ts:9`, `health/index.ts:180` | fixed |
| 2.7 | AI pricing/credit code queries columns that no longer exist in `ai_feature_definitions` / `ai_feature_usage` (`featureKey`, `category`, `creditsCharged`, `resellerId`, …) — same schema regression as 2.5. | `routes/aiPricing.ts`, `services/aiPricingService.ts` (tsc TS2339) | **open** |
| 2.8 | The whole API crashes at import if any of `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_SALES_MAXIMIZER_PRICE_ID`, `STRIPE_SMARTCRM_BUNDLE_PRICE_ID` is unset (billing.ts `requireEnv` at module load). | `server/routes/billing.ts:12` | **open** — set them on Netlify |
| 2.9 | Fake output labelled as AI: calendar suggestions are hardcoded with `source:'openai'`; `/api/ai/content/save` saves nothing; white-label tool calls return canned text and never `JSON.parse` the arguments; parts of `pipeline-stage`/`form-submission` are hardcoded; errors return fabricated scores (`probability_score: 65`). | `aiProductivity.ts:193-222`, `aiContent.ts:261-286`, `ai.ts:677-705,405,432`, `aiAutomation.ts:101-107,139-141` | **open** |
| 2.10 | `/api/respond` sets `response_format: json_object` without ensuring the prompt contains "json" → OpenAI 400. | `ai.ts:520` | **open** |
| 2.11 | Key source is inconsistent: `ai.ts`/`openai.ts`/`openaiResponses.ts` use per-user keys from `user_api_keys` (stored in plaintext); `aiToolsService`/`openclaw.ts` use server `OPENAI_API_KEY`. | | **open** |

## Layer 3 — Deployed functions

| Function | Live result | Problem | Status |
|---|---|---|---|
| Supabase `ai-agents`, `contacts`, `deals` | `OPTIONS` 500 / `WORKER_ERROR` | Module-level `new OpenAI({apiKey: Deno.env.get('OPENAI_API_KEY')!})` crashes — the `OPENAI_API_KEY` secret is not set. `ai-agents`/`deals` call `auth.getUser()` without passing the token (`:40`). | **open** (set secret; pass token) |
| Supabase `contacts` | — | **Security:** invalid/missing token fell back to a hardcoded user + tenant using the service-role key. | **fixed** (401); redeploy the function |
| Supabase `meeting-transcript-processor` | 404 (not deployed) | Sends Anthropic tool type `computer_20241022` to OpenAI `/v1/responses` (`:93`); queries columns that don't exist (`:44-58`). | **open** |
| Netlify `meeting-transcript` | 401 / 500 | Per-user key lookup uses `.eq('id', user.id)` (should be `user_id`, `:182`) and selects non-existent `anthropic_api_key`; fallbacks use retired models. | **open** |
| Netlify `ai-proxy` | 400 "No API key" | No `SMARTCRM_*_API_KEY` set. Had **no auth** (would be an open relay once keys are added). `temperature || 0.7` turns 0 into 0.7; `system` messages are sent to Anthropic unchanged. | auth **fixed**; rest open |
| Netlify `agents` | 500 "Missing AGENTS_API_BASE_URL" | Needs an external agents service; nothing in the client calls it. | **open** |
| Netlify `health` | 503 "db null" | `DATABASE_URL` not set on Netlify. | **open** (env) |
| Duplicate entries | — | `ai-proxy.js` + `ai-proxy/`; `gtm-prompt-library/index.js` + `index.mjs` define the same function names. | **open** |
| Edge functions the client calls that aren't deployed | — | 9 in `edgeFunctionService.ts` (`generate-sales-pitch`, `analyze-sentiment`, `draft-email-response`, …), `gpt5-social-research`, `profile-validator`, `assistant-thread`, `communication-logs`. | **open** |

## Layer 4 — Client

**Env-var mismatch.** `.env.example` defines `VITE_SUPABASE_PUBLISHABLE_KEY`; `useEmailAI`, `aiEnrichmentService`,
`gpt5SocialResearchService`, `ai-orchestrator.service`, `supabaseAIService` read only `VITE_SUPABASE_ANON_KEY` and drop
into mock mode without it.

**Direct browser calls to providers.** `openaiVisionService`, `openaiStreamService`, `openaiLegacyService`
(`dangerouslyAllowBrowser`) read `apiStore.apiKeys.openai`, which nothing sets (`EnhancedSettings.tsx:8` calls setters
that don't exist) → Vision Analyzer, streaming chat, meeting summary, sales-forecast streaming never work.
`enhancedGeminiService.ts:31` calls Gemini directly with `VITE_GOOGLE_AI_API_KEY` (would ship the key in the bundle).

**Always fake (look like they work):**

| Feature | Behaviour |
|---|---|
| DealDetail "AI analysis" (`DealDetail.tsx:170-188`) | `setTimeout` + `Math.random` template |
| Function Assistant (`openAiFunctionService.ts`) | keyword matching over mock contacts/deals |
| Gemini image modal (`GeminiImageModal.tsx:68-80`) | returns a 1×1 transparent PNG |
| AI-enhanced contact card (`AIEnhancedContactCard.tsx:99-131`) | calls `api.openclaw.com` with an empty key, then random score |
| Social research (`gpt5SocialResearchService.ts:217`) | mock social profiles (function not deployed) |
| Sentiment (`edgeFunctionService.ts:62`) | always neutral 0.5 |
| Greeting / KPI cards / deal intelligence / analytics panel (`gpt5Service.ts`) | hardcoded fallback objects |
| Communication pages (`gpt5CommunicationService.ts:68`) | `{intent:'fallback'}` |
| Assistants list (`openaiAssistantsService.ts:59`) | hardcoded |

**Other bugs:** `AIInsightsPanel.tsx:201` tests a Promise (`!isApiKeyConfigured()`), so the check never fires.
ElevenLabs voice is disabled in code; `/api/voice/*` has no server route.

**Endpoints the client calls that exist nowhere:** `/api/openai/{strategic-planning, predictive-analytics,
performance-optimization, multimodal-analysis, advanced-content, images/edit, images/variation, assistants/*}`,
`/api/ai/business-analyzer` (`EnhancedDashboard.tsx:113`), `/api/ai/sales-insights`, `/api/ai-enrichment`, `/api/gpt5/*`,
`/api/assistants/chat`, `/api/remote-sync/*`, `/api/voice/*`.

**Feature → endpoint map (key paths):**

| Area | Feature | Endpoint | After this branch deploys |
|---|---|---|---|
| Contacts | score / enrich (`useContactStore.ts:512,549,595`) | `/api/contacts/:id/score`, `/enrich` | reachable; needs `OPENAI_API_KEY` |
| Pipeline | Pipeline Intelligence, Lead Automation (`aiToolsApiService.ts`, 49 routes) | `/api/ai/*` | reachable; needs `OPENAI_API_KEY` + entitlements |
| AI Tools | Call script, reasoning, visual content (`openAIService.ts`) | `/api/respond`, `/api/openai/status` | reachable; per-user key required; see 2.10 |
| AI Tools | Instant response, email response, agenda, persona… (`geminiService.ts`) | `/api/openai/status`, `/api/googleai/test` | reachable; Gemini test uses retired model |
| AI Tools | Image generator (`openaiImageService.ts:56`) | `/api/openai/images/generate` | reachable |
| Search | Semantic search (`openaiEmbeddingsService.ts`) | `/api/openai/embeddings` | reachable |
| Dashboard | Greeting, KPI, BI (`gpt5Service.ts`) | `/api/openai/smart-greeting`, `kpi-analysis`, `business-intelligence` | reachable |
| OpenClaw | chat / tools / execute (`openclawService.ts`) | `/api/openclaw/*` | reachable; chat needs external OpenClaw |

## OpenClaw CRM integration

* Client `openclawService.ts` → `/api/openclaw/*` → `server/routes/openclaw.ts` (3,157 lines). `/chat` forwards to
  `OPENCLAW_API_URL` (default `http://localhost:3001`), so **a separately hosted openclaw-crm instance is required**;
  `/execute` runs the 72 CRM tools locally with OpenAI. Gated by the `openclaw` entitlement.
* Runtime bugs: `req` undefined in `executeCRMFunction` → `list_videos`/`create_video` always fail (`:2722,2743`);
  `automationRules` not imported → `trigger_automation` throws (`:1112`; table now restored in schema, import still
  missing); `const notes = …from(notes)` shadows the table (`:3098`); six non-existent `insert*Schema` imports (`:11-16`);
  `.single()` on multi-row `user_api_keys` silently ignores per-user config (`:55-59`); upstream SSE double-wrapped as
  `data: data:` (`:771`); dall-e-3 called with sizes it rejects (`:2665`).
* **Security:** per-user `openclaw_base_url` is fetched without validation — server-side request forgery (`:668`).
* `AIEnhancedContactCard` uses `@crm/openclaw-api` against `https://api.openclaw.com` with an empty key.

## Twenty integration

* `client/src/twenty-integration.ts` (KanbanBoard, ViewSwitcher, FilterBuilder, DynamicFieldRenderer) is **imported by
  nothing**, so none of these render. Its imports (`../packages/ui/...`) point at a non-existent `client/packages/`
  (should use the `@crm/ui` alias).
* `@crm/ui`, `@crm/workflows`, `@crm/ai-core` aliases exist in `vite.config.ts` but no client file uses them.
* The workflow engine (`packages/workflows/src/events/emitter.ts:150`) imported a missing `../supabase` module, so
  `triggerWorkflowsForEvent` always threw — **fixed** (module added).
* No migration in `supabase/migrations` creates `object_metadata`/`field_metadata`/`views`/`workflows`, yet
  `20260419100000_update_twenty_field_types.sql` updates `field_metadata` — verify against the live DB.
* `/api/workflows/*` lives in Express (reachable once this branch deploys).

## Models

| Status | IDs (where) |
|---|---|
| Retired | `gemini-1.5-flash` (`ai.ts:69,170,209`, `server/openai/index.ts:148,586`), `gemini-1.5-pro`, `gemini-1.5-flash-8b`, `gemini-pro`, `gemini-2.0-flash-exp`, `claude-3-5-sonnet-20241022` (`meeting-transcript/index.js:293`) |
| Invalid | `gemini-2.5-flash-8b` (`aiModels.ts:49`, `supabaseAIService.ts:57`), `gemini-flash` (`aiModels.ts:202`), `claude-3.5-sonnet-20241022` (`AIProviderSettings.tsx:203`), `gpt-4o-assistant*` (a label, not a model) |
| OK | `gpt-4o`, `gpt-4o-mini`, `gpt-4.1*`, `o3`, `o4-mini`, `text-embedding-3-small`, `dall-e-3` |

## Security findings (non-AI)

1. **Committed credentials** — the production Supabase **service_role key** (`bzxohkrxcwodllketcpz`) and production DB
   password, an older project's (`gadedbrnqzpfqtsdfzcg`) service key and DB password, and a Neon DB password were
   committed in scripts and docs. Removed from the tree in this branch, **but they remain in git history — rotate all
   of them now.**
2. `contacts` edge-function auth bypass — fixed (see Layer 3).
3. `ai-proxy` unauthenticated relay — fixed (server keys require a valid Supabase session).
4. OpenClaw SSRF via per-user base URL — open.
5. Netlify `openai` function trusts a client-supplied `x-user-id` for budgets/rate limits — open.
6. Per-user AI keys stored in plaintext in `user_api_keys` — open.

## Test & type-check baseline

* `vitest run server`: 28 failing tests before **and** after this branch (no regressions; +6 new passing tests).
  `server/routes/__tests__/auth.test.ts` has 10 pre-existing failures.
* `tsc -p tsconfig.server.json`: stops at a syntax error in `server/tests/credit-purchase.test.ts:356`; with that file
  excluded, 759 pre-existing errors (none in code changed here).
* The full `vitest run` (client + server) does not finish within 10 minutes.

---

## What this branch changes

**Phase 0 — security:** contacts auth bypass closed; ai-proxy server keys gated behind Supabase auth; committed
credentials scrubbed.

**Phase 1 — make the API reachable:**
* `server/app.ts` (app + routes), `server/index.ts` (local server), `server/netlify-api.ts` (Netlify function via
  `serverless-http`), built by `npm run build:api` into `netlify/functions/api/index.mjs`.
* `netlify.toml`: `/api/* → /.netlify/functions/api/:splat` **before** the SPA fallback (replaces the three dead
  `/api/openai/*` rules).
* `requireAuth`/`requireAdmin`/`requireEntitlement` accept a Supabase access token (`Authorization: Bearer <jwt>`).
* `client/src/lib/apiAuthFetch.ts` attaches the signed-in user's token to same-origin `/api/*` fetches.
* Boot blockers fixed: 2.1, 2.3, 2.4, 2.5, 2.6; lockfile updated.

Verified locally: the bundled function answers `/api/openai/status`, `/api/ai/email/compose`,
`/.netlify/functions/api/openai/models` with JSON (`401` without a valid token).

## Required actions (owner)

1. **Rotate** the Supabase service_role keys and database passwords for both projects, and the Neon password.
2. **Netlify env vars** (site `smartcrmnewdean`): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`,
   `OPENAI_API_KEY`, `GEMINI_API_KEY`/`GOOGLE_AI_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
   `STRIPE_SALES_MAXIMIZER_PRICE_ID`, `STRIPE_SMARTCRM_BUNDLE_PRICE_ID`, `VITE_SUPABASE_ANON_KEY`; optionally
   `OPENCLAW_API_URL`/`OPENCLAW_API_KEY`, `SMARTCRM_<PROVIDER>_API_KEY`.
3. **Supabase secrets:** `OPENAI_API_KEY`; then redeploy `contacts` (auth fix), `ai-agents`, `deals`.
4. Raise the Netlify function timeout (site settings → Functions; sync functions default to 10 s) — longer AI calls
   will be cut off otherwise. Streaming endpoints (`/api/stream`, `/api/openclaw/chat/stream`) are buffered by
   serverless functions and won't stream.
5. Deploy from git (merge to `main`) instead of the CLI so production matches the repo.

## Remaining work (proposed phases)

* **Phase 2 — config & deployed functions:** one helper for the Supabase anon/publishable key; pass the token to
  `getUser()` in `ai-agents`/`deals`; fix `meeting-transcript` column; replace retired/invalid model IDs; remove
  duplicate function entries; make `billing.ts` env checks lazy so a missing Stripe var doesn't take down AI routes.
* **Phase 3 — replace fakes:** route vision/streaming/legacy browser calls through the API; remove the browser Gemini
  key path; implement or remove the no-route endpoints; replace `Math.random`/`setTimeout`/hardcoded "AI" results with
  real calls or an explicit "AI unavailable" state; make `unifiedApiClient` treat non-JSON as an error; fix 2.7, 2.9, 2.10.
* **Phase 4 — OpenClaw & Twenty:** fix the `openclaw.ts` runtime bugs and add a base-URL allowlist (SSRF); decide where
  openclaw-crm is hosted; wire the Twenty components into the contacts/deals views via `@crm/ui`; add the missing
  metadata/view/workflow migrations.
