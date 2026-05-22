# Commit Documentation: Supabase Environment Variable Validation & Signaling Crash Fix

**Date**: 2026-05-22  
**Branch**: `main`  
**Author**: Shashee Moore  
**Packages Modified**: `client`

---

## Overview

This commit fixes a production-blocking runtime crash that prevented the SmartCRM application from loading in the browser. The root cause was a combination of placeholder environment variables in `client/.env` and insufficient defensive coding in the Supabase client initialization and WebRTC signaling service.

**Symptom**:  
Immediate hard crash on app load with:
```
Uncaught Error: Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL.
    at new Tt (VideoCallContext-*.js)
```

Console also showed repeated debug output:
```
VITE_SUPABASE_URL present: true your_supabase_project_url...
hasSupabaseDomain: false
Final supabaseIsConfigured: false
```

---

## Root Cause Analysis

1. **Stale placeholder values**  
   `client/.env` contained the literal strings `your_supabase_project_url` and `your_supabase_anon_key`.  
   Vite inlines `import.meta.env.*` values at build time. Any build performed while these placeholders were present produced bundles that shipped the bad values to the browser.

2. **Direct `createClient()` call without guard**  
   `client/src/services/signalingService.ts` (used by `VideoCallContext`) instantiated `SupabaseSignalingService` at module load time and unconditionally called:
   ```ts
   this.supabase = createClient(supabaseUrl, supabaseKey);
   ```
   When `supabaseUrl` was the placeholder, the Supabase JS client threw synchronously, crashing the entire React tree.

3. **Weak placeholder detection**  
   The validation in `client/src/lib/supabase.ts` only checked for the substring `"placeholder"`. The actual placeholder string used (`your_supabase_project_url`) did not contain that word, so `noPlaceholder` evaluated to `true` and the overall `supabaseIsConfigured` flag became `false` too late — after the signaling service had already thrown.

4. **Naming mismatch with root `.env`**  
   The canonical repository `.env` uses the modern Supabase key name `VITE_SUPABASE_PUBLISHABLE_KEY`. All client code only read `VITE_SUPABASE_ANON_KEY`. In environments where the root `.env` (or Netlify/Vercel vars) is the source of truth, the client key was `undefined`.

---

## Changes Made

### 1. Strengthened Supabase Client (`client/src/lib/supabase.ts`)

- Added fallback reading of `VITE_SUPABASE_PUBLISHABLE_KEY` when `VITE_SUPABASE_ANON_KEY` is absent.
- Improved placeholder rejection to catch common placeholder patterns (`your_supabase`, `your-project`, etc.).
- Added explicit `looksLikeRealUrl` check (`http://` or `https://`).
- Updated debug logging to report both key sources and the new validation flags.

### 2. Defensive Signaling Service (`client/src/services/signalingService.ts`)

- Converted the signaling service to a resilient singleton that never throws on bad configuration.
- Constructor now performs the same domain + placeholder + URL-scheme validation before calling `createClient`.
- When Supabase is not properly configured, the service:
  - Logs a clear warning
  - Continues with a random local `currentUserId`
  - `joinRoom()` and other methods become no-ops that call the error callback instead of crashing
- Also added `VITE_SUPABASE_PUBLISHABLE_KEY` fallback for the key.

### 3. Resilient GPT-5 Service (`client/src/services/gpt5Service.ts`)

- `checkApiStatus()` now detects HTML error pages (common when `/api/openai/status` returns 404 or an error document) and treats them gracefully instead of throwing `SyntaxError: Unexpected token '<'`.

---

## Files Modified

| File | Lines Changed | Purpose |
|------|---------------|---------|
| `client/src/lib/supabase.ts` | +16 / -4 | Dual key support, stronger validation, better logging |
| `client/src/services/signalingService.ts` | +28 / -5 | Guarded constructor, fallback key name, non-throwing fallback mode |
| `client/src/services/gpt5Service.ts` | +9 / -1 | HTML response guard in `checkApiStatus` |

**No secrets committed** — `client/.env` and all `.env*` files remain in `.gitignore`.

---

## How the Fix Prevents Future Regressions

- Any build (local or CI) that accidentally has placeholder or missing Supabase values will now produce a running app that logs warnings instead of a white screen crash.
- The modern `VITE_SUPABASE_PUBLISHABLE_KEY` naming convention is now accepted everywhere the legacy name was read.
- The signaling service (the only place that created a Supabase client outside the guarded central module) is now safe to import at the top level of any component.

---

## Testing Performed

- Reproduced the exact crash using the placeholder values in `client/.env`.
- Verified that after the code changes + rebuild, the app loads and the console shows:
  ```
  Supabase not configured properly. Using fallback mode.
  ```
  (instead of a thrown error).
- Confirmed that supplying a real `VITE_SUPABASE_URL` + either `VITE_SUPABASE_ANON_KEY` or `VITE_SUPABASE_PUBLISHABLE_KEY` results in `supabaseIsConfigured: true` and a working client.
- Hard refresh after `npm run build:client` eliminates the stale bundle.

---

## Deployment Notes

- After merging, any environment that sets Supabase variables must use one of the two supported names:
  - `VITE_SUPABASE_ANON_KEY` (legacy JWT)
  - `VITE_SUPABASE_PUBLISHABLE_KEY` (new Supabase publishable key format)
- The `VITE_SUPABASE_URL` must be a real `https://*.supabase.co` value.
- Rebuild the client (`npm run build:client` or full `npm run build`) after changing any `VITE_*` variable.

---

## Related / Follow-up Work

- Consider centralizing Supabase config reading into a single `createSupabaseClient()` helper that all services import. (Out of scope for this hotfix.)
- Add a CI step that fails the build if `VITE_SUPABASE_URL` still contains placeholder text after the client build.

---

_Commit message will be_:  
`fix(supabase): guard signaling service and strengthen env validation to prevent "Invalid supabaseUrl" crash on placeholder config`

---
**Author**: Shashee Moore  
**Date**: 2026-05-22
