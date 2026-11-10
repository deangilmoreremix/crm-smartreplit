# AI Stack

Stack: Netlify (Functions, background functions, Actions) + Supabase + OpenAI. OpenClaw integration is kept.

## Responses API helpers
- Server: `server/services/openaiClient.ts` (`respond`, `respondText`, `respondJson`, `respondStream`, `respondWithTools`). All server AI calls go through it: `max_tokens` becomes `max_output_tokens`, `response_format` becomes `text.format`, temperature/top_p only with effort `none`, chat-shaped tools are flattened.
- Images: `server/services/openaiImages.ts` (GPT Image 2.6; `generateImages`, `editImage` with `markup`, `outputFormat` png/jpeg/webp/svg/gif; svg is generate-only, n=1).
- Edge Functions (Deno): `supabase/functions/_shared/openai.ts` (same API over fetch).
- Tiers and model ids: `shared/aiModels.ts`.

## Tier map (env overrides)
| Tier | Default model | Env var |
|---|---|---|
| fast | gpt-6-luna | `OPENAI_MODEL_FAST` |
| default | gpt-6.1-terra | `OPENAI_MODEL_DEFAULT` |
| deep | gpt-6.1-sol | `OPENAI_MODEL_DEEP` |
| max | gpt-6-astra | `OPENAI_MODEL_MAX` |

Image tiers: `OPENAI_IMAGE_MODEL_FAST` (gpt-image-2.6-flare), `OPENAI_IMAGE_MODEL_QUALITY` (gpt-image-2.6-sunburst).

## Netlify layout
- `/api/*` -> `netlify/functions/api` (Express, built from `server/netlify-api.ts`; `npm run build:api`). Sync limit 10s (26s max); `/api/stream` is buffered, the client renders the full text when it arrives.
- `netlify/functions/ai-jobs-background.mjs` (built from `server/jobs/aiJobs.ts`; `npm run build:ai-jobs-background`): background function, 15 minute limit.
- Other function bundles: health, partners, openai, users, messaging, auth, entitlements, ai-proxy, gtm-prompt-library.

## AI jobs (long-running work)
`POST /api/ai/jobs {kind, input}` inserts an `ai_jobs` row (migration `20261113310000_ai_jobs.sql`) and calls `${URL}/.netlify/functions/ai-jobs-background` with header `x-ai-jobs-secret: $AI_JOBS_SECRET`. Poll `GET /api/ai/jobs/:id` (owner-scoped). Kinds: `bulk_lead_score` (contacts[]), `image_generate_hq` (quality xhigh/max; result stored in the public Storage bucket `generated-images`), `batch_respond` (prompts[]). The client uses jobs automatically for xhigh/max images and batches larger than 5.

## Auth flow
The browser sends the Supabase access token as `Authorization: Bearer <jwt>` (patched fetch in `client/src/lib/apiAuthFetch.ts`). `server/middleware/jwtSession.ts` verifies it per request (no session store); `requireAuth` / entitlements read the verified user. Per-user OpenAI keys come from the view `user_api_keys_openai` (migration `20261113300000_user_api_keys_unify.sql`), falling back to `OPENAI_API_KEY`.

## Required environment variables
`OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `AI_JOBS_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (and other `STRIPE_*` price ids), plus `DATABASE_URL` for the Drizzle-backed routes. Netlify supplies `URL` at runtime.
