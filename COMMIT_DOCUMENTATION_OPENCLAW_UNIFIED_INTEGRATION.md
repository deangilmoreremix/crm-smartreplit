# Commit Documentation: OpenClaw Unified AI Key Management Integration

**Date**: 2026-05-22  
**Commit**: `6d84f74`  
**Branch**: `main`  
**Author**: Shashee Moore  
**Packages Modified**: `client`, `server`, `supabase`  

---

## Overview

This commit completes the **Option A** integration for OpenClaw — fully integrating OpenClaw as a third AI provider into the existing unified `user_api_keys` + `AIApiKeySettings` system that already handled OpenAI and Google Gemini.

**Before this change**: OpenClaw had a completely separate, broken infrastructure:
- A standalone `OpenClawSetupModal` with its own 4-step wizard
- Two broken hooks (`useOpenClawStatus`, `useOpenClawSetup`) that never connected to the database
- A fake env-var-based `hasApiKey` check that always returned `false`
- No server-side per-user key storage

**After this change**: OpenClaw uses the exact same infrastructure as OpenAI and Gemini:
- `useAIApiKeys` — single unified hook for all three providers
- `AIApiKeySettings` — single settings UI for all three providers  
- Per-user key storage in `user_api_keys` table
- Server-side key lookup per authenticated user
- Unified trigger logic in `App.tsx` and `Dashboard.tsx`

---

## Files Changed

### New Files Added (Untracked, Committed)

| File | Lines | Purpose |
|------|-------|---------|
| `client/src/hooks/useAIApiKeys.ts` | 196 | Already existed, **extended** to support `openclaw` provider |
| `client/src/components/aiIntegration/AIApiKeySettings.tsx` | 445 | Already existed, **extended** to add OpenClaw as 3rd provider |
| `supabase/migrations/20260521_add_openclaw_to_user_api_keys.sql` | 802 bytes | **Created** — adds `openclaw_api_key`, `openclaw_model`, `openclaw_base_url` columns to `user_api_keys` |

### Modified Files

| File | Change |
|------|--------|
| `client/src/App.tsx` | Replaced `OpenClawSetupModal` import/render with `AIApiKeySettings` using `preferOpenClawOnOpen={true}`. Added auth guard + localStorage once-only logic. |
| `client/src/components/Dashboard.tsx` | Replaced `window.dispatchEvent` approach with direct `AIApiKeySettings` render. Banner button opens unified settings. |
| `client/src/components/Navbar.tsx` | Replaced `useOpenClawStatus` → `useAIApiKeys`. `OpenClawNavbarIndicator` now receives real `hasOpenClawKey`. |
| `client/src/pages/OpenClawPage.tsx` | Replaced `useOpenClawStatus` → `useAIApiKeys`. Gate now reads actual per-user `openclaw_api_key`. |
| `server/routes/openclaw.ts` | Added `getOpenClawConfigForUser()` helper. Updated `POST /api/openclaw/chat` and `POST /api/openclaw/chat/stream` to use per-user key + base URL. |

### Deleted Files

| File | Reason |
|------|--------|
| `client/src/hooks/useOpenClawSetup.ts` | Replaced by `useAIApiKeys` with OpenClaw support |
| `client/src/hooks/useOpenClawStatus.ts` | Replaced by `useAIApiKeys` with OpenClaw support |
| `client/src/components/OpenClawSetupModal.tsx` | Replaced by `AIApiKeySettings` (unified, same design) |

---

## Technical Details

### Database Migration (Supabase)

```sql
ALTER TABLE user_api_keys 
ADD COLUMN IF NOT EXISTS openclaw_api_key text,
ADD COLUMN IF NOT EXISTS openclaw_model text DEFAULT 'default',
ADD COLUMN IF NOT EXISTS openclaw_base_url text;
-- RLS policies already cover new columns (based on user_id)
-- Migration was pushed to live Supabase prior to this commit
```

### Unified Hook (`useAIApiKeys`)

Extended `ApiConfig` interface:
```ts
openclaw: {
  apiKey: string;
  model: string;
  baseUrl?: string;
}
```

Updated methods:
- `loadApiKeys()` — selects `openclaw_api_key`, `openclaw_model`, `openclaw_base_url`
- `saveApiKeys(config)` — persists all three OpenClaw fields via upsert
- `testConnection(provider, apiKey, baseUrl?)` — now accepts `'openai' | 'gemini' | 'openclaw'`

### AIApiKeySettings UI Changes

**Provider selection step** (Step 1):
- Grid changed from 2-column to 3-column
- Added OpenClaw AI card with purple gradient icon (`Bot` from Lucide)
- OpenClaw description: "AI-powered CRM automation with specialized deal intelligence and workflow optimization"

**Model selection step** (Step 2):
- OpenClaw gets two model options: `default` and `enhanced`

**API key entry step** (Step 3):
- Label and placeholder adapt to provider (`oc-skr-XXXXXXXXXXXXXXXXXXXX` for OpenClaw)
- OpenClaw-specific: optional `custom base URL` input for self-hosted instances

**Verification step** (Step 4):
- Text adapts to provider — shows model for OpenAI/Gemini, model + endpoint for OpenClaw

**New `preferOpenClawOnOpen` prop**:
```ts
interface AIApiKeySettingsProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  preferOpenClawOnOpen?: boolean; // NEW
}
```
When `true`, dialog skips provider selection and jumps directly to OpenClaw key entry (step 2).

**On dialog open** (`useEffect`):
- Pre-populates all fields from `apiConfig`
- Auto-selects provider that has an existing saved key
- When `preferOpenClawOnOpen=true`, defaults to OpenClaw even if other keys exist

### Server-Side Per-User Config (`openclaw.ts`)

```ts
async function getOpenClawConfigForUser(userId: string): Promise<{ apiKey: string; baseUrl: string }> {
  // Priority 1: per-user value from user_api_keys
  // Priority 2: server-level env var (OPENCLAW_API_KEY / OPENCLAW_API_URL)
  const { data } = await supabase
    .from('user_api_keys')
    .select('openclaw_api_key, openclaw_base_url')
    .eq('user_id', userId)
    .single();
  // ...
}
```

Used by:
- `POST /api/openclaw/chat` — main chat proxy
- `POST /api/openclaw/chat/stream` — SSE streaming chat

Health endpoint (`/api/openclaw/health`) remains unauthenticated and uses server-level config only.

### App.tsx Trigger Logic

**Auth guard** (existing from prior fix):
```ts
if (isAuthenticated && !loading && !hasOpenClawKey) {
  // Only show once per user (localStorage guard)
  const hasSeenSetup = localStorage.getItem('openclaw-setup-seen');
  if (hasSeenSetup) return;
  // Show AIApiKeySettings with preferOpenClawOnOpen=true after 2.5s delay
}
```

**Banner click** (Dashboard.tsx):
```ts
onSetupClick={() => setShowOpenClawSettings(true)}
// Opens AIApiKeySettings directly, no event bus needed
```

---

## Bugs Fixed

1. **OpenClaw setup modal showing on public landing page**  
   The modal was rendering globally for all routes including `/`.  
   Fixed by adding `isAuthenticated` check and using `AIApiKeySettings` which is only mounted for logged-in users.

2. **`useOpenClawStatus.hasApiKey` always returning `false`**  
   The hook checked `!!import.meta.env.VITE_OPENCLAW_API_KEY` — a build-time env var that is never set for normal users.  
   Replaced by `!!apiConfig?.openclaw?.apiKey?.trim()` from real `user_api_keys` query.

3. **No place for users to save an OpenClaw API key**  
   The old modal's `saveApiKey()` was a stub that did nothing.  
   Now uses the fully functional `useAIApiKeys.saveApiKeys()` → Supabase upsert.

4. **Server using server-level env var instead of per-user key**  
   `server/routes/openclaw.ts` used `process.env.OPENCLAW_API_KEY` for all requests.  
   Now calls `getOpenClawConfigForUser(userId)` to use the user's own key when available.

---

## Testing Checklist

- [ ] Log in as user with no OpenClaw key → `AIApiKeySettings` appears after 2.5s with OpenClaw pre-selected
- [ ] Log in as same user again → modal does **not** appear (localStorage guard)
- [ ] Click "Setup OpenClaw" on Dashboard banner → `AIApiKeySettings` opens with OpenClaw pre-selected
- [ ] Enter OpenClaw API key + model → save → key persists in `user_api_keys.openclaw_api_key`
- [ ] Banner disappears after key is saved (hasOpenClawKey = true)
- [ ] Navbar indicator reflects saved key status
- [ ] OpenClawPage gate works (shows "not configured" if no key)
- [ ] Server proxy uses per-user key for `/api/openclaw/chat` calls
- [ ] Self-hosted OpenClaw users can enter custom base URL

---

## Related Documentation

- `docs/production-hardening/Twenty_AI_Enhancements_Production_Hardening_Plan.md` — Production readiness review (separate initiative)
- `COMMIT_DOCUMENTATION_AI_INTEGRATION_AND_MEMORY.md` — Related AI integration commits

