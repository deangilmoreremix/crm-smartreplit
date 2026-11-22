# AI audit: November 2026

Scope: every AI feature in crm-smartreplit, covering the Express API (Netlify `api` function), the other Netlify functions, the Supabase edge functions and the React client. Branch: `claude/epic-allen-rsmfn1`.

## How AI works in this app
- **Keys.** Each user's own OpenAI key is stored in `user_api_keys` and added in Settings → API Keys. There is no server-wide key, so `OPENAI_API_KEY` and `GOOGLE_AI_API_KEY` are not needed in Netlify.
- **Text and vision.** These use the OpenAI **Responses API** (`server/services/openaiResponses.ts`). Older `chat.completions` call sites are translated to it in `server/services/userOpenAI.ts`.
- **Images.** These use **GPT Image 2.6** on the Images API: `gpt-image-2.6-flare` for generation, `gpt-image-2.6-sunburst` for edits.
- **Models** are set in `server/services/openaiModels.ts`: `gpt-6.2-sol` is the default, `gpt-6.2-astra` handles advanced analysis, and `gpt-transcribe` handles speech-to-text. Older stored IDs (`gpt-6-luna`, `gpt-6.1-sol`, `gpt-4o*`, Gemini) are mapped to these.

## Fixed in this branch

| Area | Problem | Fix |
|---|---|---|
| Models | Every call used `gpt-6-luna` / `gpt-6.1-sol` / `gpt-image-2.5-flare`. The legacy map would also downgrade any `gpt-image-2.6-*` ID to 2.5. | Switched to 6.2 Sol and 6.2 Astra plus GPT Image 2.6. Old IDs now upgrade. Settings and model lists show correct names and prices. |
| Images | Images went through the Responses `image_generation` tool with a hardcoded 2.5 model, and the 2.6 options were unavailable. | `generateImage` calls `/images/generations` and `/images/edits` and supports quality up to `max`, `complexity`, transparent backgrounds, PNG/JPEG/WebP/GIF/SVG, GIF frames, and mask or markup edits. The image tool UI exposes these options. |
| `/api/openai/status` | Made a paid 1-token completion, which the API rejects, so every valid key showed as unavailable. It also ran before every email generation. | Now a free `models.retrieve` check. |
| `/api/videos/generate-script` | Never registered, so it returned 404. | Mounted behind the existing video auth and entitlement checks. |
| Shared result renderer | The Download button referenced an undefined `handleDownload`, so every tool crashed when it showed a result (18 tools). AI text was also inserted as raw HTML (XSS from web-research output). | The button now uses the save handler, and AI text is HTML-escaped before rendering. |
| Fake AI output | Smart greeting, appointment insights, meeting-transcript summaries, the email fallback, `generatePersonalizedMessage` templates and `analyzeDeal` / `analyzePipelineHealth` (fixed scores 65/75) returned canned text with HTTP 200. | Each now returns real AI output or a real error. |
| Meeting processing (Supabase) | Sent the Anthropic tool type `computer_20241022`, which OpenAI rejects on every call. Parse failures returned success. | Removed the tool, switched to the current model with JSON mode, and parse failures now return errors. |
| OpenClaw tools | `enrich_contact` and `social_media_research` "researched" people without web access, so profile URLs were invented. Bad JSON became `{}`, which looked like success. | Both use live web search with sources, and unreadable JSON is now an error. |
| JSON parsing | A bare `JSON.parse` failed on fenced or wrapped JSON (contact score, AI tools). | Added a shared `parseJSONText`. Contact score also uses JSON mode. |
| Image privacy | Generated images were saved under one shared `demo-user` folder, visible to every user. | Images are saved under the signed-in user's own folder. |
| Open proxies | `ai-proxy.js` (no auth) and the dead `openai` function (server key, no auth, Gemini) were deployed. `agents.js` forwarded requests with the server secret and no auth. | Deleted the first two. `agents.js` now requires a signed-in Supabase user and has a timeout. |
| Key exposure | `GET /api/user/api-keys/active/:provider` returned the plaintext key. | Returns a masked key. |
| Dead tool IDs | Eight Navbar and dashboard tool IDs opened an empty modal, and the "Voice Analysis" card had no component. | IDs now map to existing tools, the card is now the working Speech to Text tool, and Structured Data Extraction has a card. |
| Dropped inputs | Competitor analysis and market trends silently ignored industry, strengths, target market and timeframe. | These now go into the prompt. |
| Gated pages | An entitlement race redirected reloads or direct links to `/ai-tools` (and other gated pages) to `/upgrade`. | Entitlements now report loading until the user's plan is fetched. |
| Missing edge functions | `ai-orchestrator.service.ts` called 9 Supabase functions that don't exist, so contact AI, communication AI and task-completion analysis always failed. | Each request type now uses `/api/ai/generate`, and task threads use `/api/ai/conversations`. |
| Timeouts | Contact enrichment and the web-search or code-interpreter tools (sales forecast, business analysis, topic research) waited synchronously and could exceed Netlify's function limit. | These now run as OpenAI background responses. The client repeats the request with `responseId` every 2 s until the result is ready, for up to 3 minutes. |

## Verified
- Server AI tests pass, including new ones for model mapping, Images API calls, the status check, smart greeting, the image route and JSON parsing. The 28 pre-existing auth/CRM test failures are unchanged.
- Client tests pass, including new ones for the renderer escape and the entitlement race.
- `npm run build` passes, including `verify-dist`.
- In the browser, with `/api` mocked: a direct load of `/ai-tools` works, all 38 hub tools open with content, the image generator sends GPT Image 2.6 options, and a text tool's result renders escaped with no page errors.
- **Not verified against the live OpenAI API**, because there was no key in the test environment.

## Not changed (needs a decision or more work)
- **Streaming.** `/api/stream`, `/api/openai/responses/stream` and `/api/openclaw/chat/stream` are buffered by serverless-http on Netlify, so responses arrive all at once.
- **Cost.** The dashboard fires the greeting, KPI and deal-intelligence calls on every load. Semantic and smart search make one embeddings request per contact and per deal.
- **Plan check.** `PRODUCTION_READINESS` / `NETLIFY_ENVIRONMENT_SETUP.md` tell you to set `VITE_OPENAI_API_KEY`. Don't: `VITE_` variables are published in the browser bundle, and the app doesn't read them.
- **Dev scripts.** `verify-ai-system.js` and `test-ai-system.js` still check for the deleted `netlify/functions/ai-proxy.js`.

## Dead code (listed, not deleted, per CLAUDE.md)
- **Shadowed routes.** `server/routes/openai.ts` defines `/api/openai/status`, `smart-greeting`, `kpi-analysis`, `deal-intelligence` and `business-intelligence`, but they never run because `ai.ts` registers the same paths first.
- **Unused services.**
  - `server/services/openaiResponsesService.ts` and `server/config.ts` are imported nowhere. `config.ts` would `process.exit(1)` without server keys.
  - `client/src/services/aiToolsService.ts` has a broken import and is unused.
  - `client/src/utils/lazyComponents.tsx` imports files that don't exist.
- **Unused AI components.** `aiTools/CallScriptGenerator.tsx`, `ChurnPrediction.tsx`, `CompetitorAnalysis.tsx`, `MarketTrendsAnalysis.tsx`, `SentimentAnalysis.tsx`, `AIUsageStatsPanel.tsx` and `SocialMediaGenerator.tsx` all duplicate the `*Content` tools.
- **Unrouted pages.** `pages/EnhancedAITools.tsx` (a second hub), `pages/BusinessAnalyzer.tsx`, `pages/businessanalysis/BusinessAnalyzer.tsx`, `pages/ai-goals/` and `pages/AIGoals/` (identical, case-only difference), and `DealDetail.tsx` / `DealDetailsModal.tsx` (not imported).
- **Strays.** Timestamped pasted files (`client/src/*FeaturePage_17557203127xx.tsx`), `Navbar.tsx.bak` and `types/entitlements.ts.bak`.
- **Unused functions.** No client callers for `netlify/functions/meeting-transcript` or the `ai-agents` edge function.
- **Unreachable UI.** Contact enrichment and scoring work on the server, but the UI that triggers them (`ContactEnrichmentModal`, `AIEnhancedContactCard` and others) isn't reachable from any route.
