# Twenty CRM AI Enhancements – Production Hardening & Fix Plan
**Date**: 2026-05-21  
**Author**: Kilo (Senior Software Engineer Code Review)  
**Status**: Ready for execution  
**Goal**: Bring the large wave of AI-powered "Twenty CRM" enhancements (ai* routes, services, components, entitlements) to **true 100% production readiness**.

---

## Executive Summary

The "Twenty CRM Feature Enhancement" initiative added substantial surface area:
- 8+ new AI route modules (`aiSalesTools`, `aiCommunication`, `aiContent`, `aiProductivity`, `aiAdvanced`, `aiAutomation`, etc.)
- Unified `aiToolsService.ts` with dozens of LLM-backed functions
- Client-side hooks, API service, and many "enhanced" intelligence dashboards
- Expanded granular `FeatureKey` enum + `twenty-fields` package + schema extensions

**Current state**: Feature-rich but **not production safe**.

**Top 3 Critical Risks** (addressed in this plan):
1. **Entitlement Unification Failure** — Client uses fine-grained keys (`LIVE_DEAL_ANALYSIS`, `DEAL_RISK_MONITOR`...) while server gates almost everything under broad `SALES_INTELLIGENCE` / `AI_TOOLS`. Permissive fallback in `requireEntitlement`.
2. **Uncontrolled LLM Cost & Token Usage** — Full pipeline/contact data stringified directly into prompts. No budgeting, no credit deduction, no truncation.
3. **Privacy / Security Exposure** — Raw PII + customer data sent to OpenAI on every call. In-memory rate limiting. Sensitive data logged via memoryService.

**Secondary Risks**: `packages/twenty-fields` is dead code, session-based auth fragility, missing RLS on new schema, no tests, build not integrated.

This plan provides:
- A complete **branch + PR strategy** with specific file-level changes
- **Production Hardening Checklist** + ready-to-paste **code snippets** for the three highest-risk items
- **Deeper static analysis** findings on the most dangerous files

---

## 1. Detailed Fix Branch Plan (with Specific File Changes)

### Recommended Branch Strategy

```bash
git checkout -b feat/production-harden-twenty-ai-enhancements-2026-05
```

**PR Split Recommendation** (to keep reviews manageable):

1. **PR 1** – Entitlement Unification & Auth Hardening (highest priority)
2. **PR 2** – Cost Control & Token Budgeting Layer
3. **PR 3** – PII Redaction, Privacy, Logging Hardening
4. **PR 4** – Rate Limiting, Resilience & Observability
5. **PR 5** – `twenty-fields` Decision + Schema/RLS + Tests + Build

### Phase-by-Phase File Changes

#### Phase 1: Entitlement Unification (PR 1)

**Goal**: Make server the single source of truth. Align every AI route with the exact granular key the client protects the route with.

**Files to change**:

1. **`server/types/entitlements.ts`** (server side)
   - Add all missing granular keys that exist on client:
     ```ts
     LIVE_DEAL_ANALYSIS: 'live_deal_analysis',
     DEAL_RISK_MONITOR: 'deal_risk_monitor',
     WIN_RATE_INTELLIGENCE: 'win_rate_intelligence',
     PIPELINE_HEALTH_DASHBOARD: 'pipeline_health_dashboard',
     // ... (add the rest from client/src/types/entitlements.ts)
     ```

2. **`server/routes/aiSalesTools.ts`**
   - Replace the single `requireSalesIntelligence` array.
   - Create per-endpoint arrays:
     ```ts
     const requireLiveDealAnalysis = [requireAuth, requireEntitlement(FeatureKey.LIVE_DEAL_ANALYSIS)];
     // Use on /api/ai/live-deal-analysis
     const requireDealRisk = [requireAuth, requireEntitlement(FeatureKey.DEAL_RISK_MONITOR)];
     // etc.
     ```

3. **`server/routes/aiCommunication.ts`, `aiContent.ts`, `aiProductivity.ts`, `aiAdvanced.ts`, `aiAutomation.ts`** (and `ai.ts`)
   - Audit every route and switch from broad `AI_TOOLS` / `CONTENT_LIBRARY` to the most specific key that matches the client route map (`/live-deal-analysis`, `/deal-risk-monitor`, etc.).

4. **`server/middleware/entitlements.ts`**
   - **Remove the dangerous permissive fallback** (lines ~150-152):
     ```ts
     if (!entitlement) { return next(); }   // ← DELETE THIS
     ```
   - Change to 403 with clear "no entitlement record" message.
   - Improve error messages to include the exact `featureKey`.
   - Add caching (short TTL) for entitlement lookups using Redis (or in-memory with invalidation).

5. **`client/src/types/entitlements.ts`**
   - Ensure the server-side `FeatureKey` constant is the canonical source (consider generating or sharing the enum).

6. **`server/routes/auth.ts`** (requireAuth)
   - Ensure it always populates both `userId` and `userEmail` consistently.
   - Add a helper `getUserIdentity(req)` used by both `requireAuth` and `requireEntitlement`.

**Acceptance Criteria for PR 1**:
- Every `/api/ai/*` route uses the exact same key that `ProtectedRoute` checks on the client for that page.
- No route allows access when no `user_entitlements` row exists.
- Unit test for each new granular key.

#### Phase 2: Token Budgeting & Credit Integration (PR 2)

**Goal**: Never spend money without explicit budget/credit approval.

**New/Changed Files**:

1. **`server/services/aiCostGuard.ts`** (new file)
   - Central service:
     - `estimateTokens(prompt: string): number`
     - `checkAndReserveBudget(userId, estimatedTokens, featureKey): Promise<Reservation>`
     - `commitUsage(reservationId, actualUsage)`
     - `refundReservation(...)`

2. **`server/services/aiToolsService.ts`**
   - Modify `callAIJson` and `callAIText`:
     - Accept optional `userId` + `featureKey`.
     - Call cost guard **before** OpenAI call.
     - Only proceed if reservation succeeds.
     - Record actual usage from `response.usage`.

3. **Billing / Credits integration**
   - Update `server/routes/billing.ts` or create `server/services/creditService.ts` to expose:
     - `deductCredits(userId, amount, reason)`
     - `getUserCreditBalance(userId)`
   - Wire the AI cost guard to the existing credit system (or create a new "AI Credits" bucket).

4. **Client-side** (`client/src/services/aiToolsApiService.ts` + hooks)
   - Before calling heavy endpoints, show estimated cost / credit warning modal (optional but recommended UX).

**Specific Snippets** are in section 2 below.

#### Phase 3: PII Redaction + Secure Logging (PR 3)

**New File**: `server/utils/piiRedaction.ts`

Functions:
- `redactPII(obj: any): any`
- `sanitizePromptForLLM(text: string): string`

Apply redaction in:
- `aiToolsService.ts` before building `userPrompt`
- All route handlers before calling `memoryService.record*`
- Any logging of `req.body`

#### Phase 4: Rate Limiting Hardening

- Replace in-memory `Map` with Redis-based rate limiter (or use existing infrastructure).
- Add per-feature + per-tenant limits (not just per-user).
- Add circuit breaker for OpenAI calls.

#### Phase 5: twenty-fields + Schema + Tests

- Decision: Either delete `packages/twenty-fields` or fully integrate it (align with Tailwind, add to build, create tests).
- Add proper RLS policies and indexes for new Twenty-inspired columns/tables (`health_score`, `workflows`, `field_metadata`, etc.).
- Add integration tests for at least the top 5 most expensive AI endpoints.

---

## 2. Production Hardening Checklist + Code Snippets (Highest-Risk Items)

### Checklist – Token Budgeting & Cost Control

- [ ] Every LLM call goes through a central `CostGuard`
- [ ] Estimate tokens **before** calling OpenAI
- [ ] Reserve / deduct credits **before** the call
- [ ] Record actual usage after success
- [ ] Refund on failure where appropriate
- [ ] Per-tenant + per-feature daily caps
- [ ] Admin dashboard shows OpenAI spend by feature / user

### Code Snippet: Basic Cost Guard (server/services/aiCostGuard.ts)

```ts
// server/services/aiCostGuard.ts
import { creditService } from './creditService'; // your existing billing credits logic

export interface TokenReservation {
  id: string;
  userId: string;
  estimatedCostCents: number;
  featureKey: string;
}

const TOKEN_TO_CREDIT_RATE = 0.00015; // example: $0.00015 per 1k tokens (adjust to your model pricing)

export async function estimateAndReserve(
  userId: string,
  prompt: string,
  featureKey: string,
  model: string = 'gpt-4o-mini'
): Promise<TokenReservation | null> {
  const estimatedTokens = Math.ceil(prompt.length / 3.5); // rough estimate
  const estimatedCostCents = Math.ceil((estimatedTokens / 1000) * TOKEN_TO_CREDIT_RATE * 100);

  const hasCredits = await creditService.hasSufficientCredits(userId, estimatedCostCents);
  if (!hasCredits) {
    throw new Error('Insufficient AI credits');
  }

  const reservation = await creditService.reserveCredits(userId, estimatedCostCents, featureKey);
  return {
    id: reservation.id,
    userId,
    estimatedCostCents,
    featureKey,
  };
}

export async function commitActualUsage(reservation: TokenReservation, actualTokens: number) {
  const actualCost = Math.ceil((actualTokens / 1000) * TOKEN_TO_CREDIT_RATE * 100);
  await creditService.commitReservation(reservation.id, actualCost);
}
```

Then in `aiToolsService.ts` `callAIJson`:

```ts
let reservation: TokenReservation | null = null;
if (userId && featureKey) {
  reservation = await estimateAndReserve(userId, userPrompt, featureKey, model);
}

const response = await client.chat.completions.create(...);

// after success
if (reservation && response.usage) {
  await commitActualUsage(reservation, response.usage.total_tokens);
}
```

### Checklist – PII Redaction & Privacy

- [ ] Central `redactPII` utility
- [ ] Applied to every prompt sent to LLMs
- [ ] Applied before any `memoryService` or logging call
- [ ] Option for "strict" vs "permissive" redaction per tenant
- [ ] Audit log of what was redacted (without storing original PII)

### Code Snippet: PII Redaction Utility

```ts
// server/utils/piiRedaction.ts
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
const PHONE_REGEX = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
const NAME_PATTERNS = /\b(John|Jane|Michael|Sarah|David|Emily|Robert|Lisa)\b/gi; // extend with real list or ML

export function redactPII(input: any): any {
  if (typeof input === 'string') {
    return input
      .replace(EMAIL_REGEX, '[REDACTED_EMAIL]')
      .replace(PHONE_REGEX, '[REDACTED_PHONE]')
      .replace(NAME_PATTERNS, '[REDACTED_NAME]');
  }
  if (Array.isArray(input)) return input.map(redactPII);
  if (input && typeof input === 'object') {
    const out: any = {};
    for (const k of Object.keys(input)) {
      out[k] = redactPII(input[k]);
    }
    return out;
  }
  return input;
}
```

Usage in `aiToolsService.ts`:

```ts
const safeUserPrompt = redactPII(userPrompt);
// then pass safeUserPrompt to OpenAI and to memoryService
```

### Checklist – Entitlement Unification & Hardening

- [ ] Single source of truth for `FeatureKey` (prefer server or shared package)
- [ ] Every AI route uses the **most specific** key the client page uses
- [ ] No permissive "if no entitlement record → allow" path for AI tools
- [ ] Short cache (5-30s) on entitlement lookups
- [ ] Clear 403 messages that tell the user exactly which feature they need

### Code Snippet: Hardened requireEntitlement (key change)

```ts
// inside requireEntitlement
if (!entitlement) {
  return res.status(403).json({
    error: 'Forbidden - No entitlement record',
    requiredFeature: featureKey,
    message: 'Please contact support or complete onboarding to enable this feature.',
  });
}
```

---

## 3. Deeper Static Analysis – Key Files

### A. `server/middleware/entitlements.ts` (Highest Risk)

**Problems found**:
- Lines 150-152: Permissive fallback that silently allows any user with no `user_entitlements` row.
- Uses `req.session` while many modern flows (Supabase) may not populate it the same way.
- No caching → every AI call does 1-2 DB + RPC calls.
- Error messages are good but not consistent across `requireOneOfEntitlements`.

**Impact**: Any user who bypasses entitlement creation can access expensive AI tools.

### B. `server/services/aiToolsService.ts`

**Problems**:
- `callAIJson` / `callAIText` accept arbitrary large `userPrompt` with zero size or cost guard.
- `userPrompt: userPrompt?.slice(0, 200)` still leaks PII into memory logs.
- No `featureKey` passed through most call sites.
- Rate limit check happens **after** some memory logging.

**Impact**: Direct path to runaway OpenAI bills and data leakage.

### C. `server/routes/aiSalesTools.ts` (representative of all AI route files)

**Problems**:
- Every single sales intelligence endpoint uses the **same** broad `SALES_INTELLIGENCE` gate.
- Client protects the pages with `LIVE_DEAL_ANALYSIS`, `DEAL_RISK_MONITOR`, `WIN_RATE_INTELLIGENCE`, etc.
- Heavy `memoryService.recordObservation(JSON.stringify(req.body))` on almost every request.

**Impact**: Entitlement mismatch + massive data logging.

### D. `server/routes/auth.ts` + session model

- Dev bypass is reasonable but fragile.
- `requireAuth` and `requireEntitlement` duplicate a lot of session lookup logic.

### E. `packages/twenty-fields`

- No usage in the tree.
- Depends on `@linaria/react` (incompatible with current Tailwind stack).
- Build not wired into root.

---

## Next Steps & How to Execute

1. Create the branch as described.
2. Start with **PR 1** (Entitlements) – it is the highest leverage and lowest risk of breaking features.
3. Run the full test suite + manual flow for one expensive AI tool (Live Deal Analysis) after each PR.
4. After PR 2 + PR 3, the financial and compliance risk drops dramatically.

Would you like me to:
- Generate the actual code for `aiCostGuard.ts` + the updated `callAIJson` as a ready-to-apply patch?
- Create the first PR description template?
- Analyze one more specific file (e.g. a frontend component or the billing credit service)?

This plan, when executed, will bring the Twenty AI enhancements to a genuinely production-grade state.

