# AI manual test checklist (PR #10)

Use this to check the AI features against the live OpenAI API with your own key. Run it on PR #10's Netlify deploy preview; the link is in the PR's checks.

Before you start: sign in, open DevTools on the Network tab, and turn off ad blockers.

1. **Key.** In Settings → API Keys, save an OpenAI key and click Test.
   - Pass: it shows as connected or valid.
   - Fail: it shows "unavailable" even though the key is valid (status check).
2. **Dashboard.** Reload the dashboard.
   - Pass: the greeting is real, personalised AI text.
   - Fail: a generic canned greeting, or an error banner. Note the `/api/ai/smart-greeting` status.
3. **Direct link.** Paste `/ai-tools` into the address bar and press Enter.
   - Pass: the AI Tools hub loads.
   - Fail: you're sent to `/upgrade`.
4. **Text tool.** Run Email Analysis on a short email, then click Download.
   - Pass: the result renders, any HTML shows as plain text, and the download works.
5. **JSON tool.** Run Competitor Analysis with an industry and strengths filled in.
   - Pass: the result mentions both.
6. **Web research.** Run Topic Research and wait up to about 2 minutes.
   - Pass: a result with source links.
   - Fail: a spinner that never finishes, or a 504. Note whether requests to `/api/ai/research/topic` repeat every 2 s with a `responseId`.
7. **Long jobs.** Run Sales Forecast and Business Analysis. Pass and fail are the same as step 6.
8. **Images.** In the Image Generator:
   - Create a WebP image with Flare at Low quality.
   - Create a transparent PNG.
   - Try one edit.

   Pass: the images show and are saved to your gallery.
   Fail: note the error text, for example an unknown `complexity` or `output_format`.
   GIF and SVG output may fail if your account doesn't have access to them. Note the error text.
9. **Speech to Text.** Upload a 5–10 s audio clip.
   - Pass: a transcript appears (`gpt-transcribe`).
10. **AI Assistant.** Send two messages, where the second refers to the first.
    - Pass: the reply remembers the first message (Conversations API).

## Reporting a failure
For each failure, send:
- the step number
- the failing request's URL, status and response body, from the Network tab
- any console error

Never send the API key.

## Not covered here
Contact enrichment and scoring have no reachable UI (see the audit's dead-code list), so they are covered only by unit tests.
