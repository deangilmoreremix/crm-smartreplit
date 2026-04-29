# Dead Code Removal Plan — Entitlements Integration

## Summary
After completing the Supabase entitlement gating integration, several legacy code artifacts remain that are no longer used. This document outlines safe removal steps.

---

## ✅ SAFE TO DELETE (No Risk)

### 1. server/routes.ts (ENTIRE FILE)
**Status:** ❌ NOT IMPORTED anywhere in the codebase  
**Evidence:**
- `server/index.ts` imports from `./routes` (directory), which resolves to `routes/index.ts`
- No file imports `'./routes.ts'`
- This is the old monolithic router that was replaced by modular `routes/*.ts`

**Action:** Delete file completely  
**Risk:** None — zero dependencies

---

### 2. requireProductTier Middleware (server/routes/auth.ts)
**Location:** `server/routes/auth.ts` lines ~177–256  
**Status:** ❌ NOT CALLED anywhere  
**Evidence:**
- Grep shows only definition exists; no imports in active route files
- Replaced by `requireEntitlement(FeatureKey.X)` pattern
- Legacy `crm.ts` had import removed (now only imports `requireAuth`)

**Action:** Remove function and JSDoc comment  
**Risk:** None — no callers remain

---

### 3. requireTier Middleware (server/routes/auth.ts)
**Location:** `server/routes/auth.ts` lines ~258–335  
**Status:** ❌ NOT CALLED anywhere  
**Evidence:**
- Only defined in auth.ts; never imported
- Was part of old product tier system

**Action:** Remove function and JSDoc comment  
**Risk:** None — no callers remain

---

## ⚠️ LOW-RISK CLEANUP (Optional but Recommended)

### 4. Clean Up auth.ts Imports
**File:** `server/routes/auth.ts`  
**Current:** May have unused imports from old code  
**Action:** Run `npx eslint` or `npx tsc --noEmit` to identify and remove any unused imports

---

## ❌ DO NOT REMOVE (Still in Use)

### Client-side `productTier` References
**Files:** Various (UserManagement.tsx, DevBypassPage.tsx, etc.)  
**Reason:** These are NOT dead code — they read `user.productTier` from profile for:
- Displaying user's tier in UI (badge/label)
- Filtering users in admin panel
- Pre-filling forms when upgrading users
- Compatibility with legacy components

**Note:** The `profiles.product_tier` field still exists in database and is used for display purposes, just not for gating. Gating now uses `entitlement.package`.

---

### Role-based Helper Functions (useRole)
**Functions:** `isSuperAdmin()`, `isWLUser()`, `isRegularUser()`, `hasProductTier()`  
**Reason:** Still used in multiple places:
- DevBypassPage (checks dev bypass)
- UserManagement (admin user list)
- UserFeatureManager (legacy props)
- Some layout components

These functions have been updated to derive from `entitlement.package` and are safe to keep for backward compatibility.

---

### Legacy Route Files (module-federation-configs, calendar-mf-setup)
These are part of Module Federation setup, not related to entitlements. Keep.

---

## 🗑️ REMOVAL STEPS (One-time)

### Step 1: Remove dead middleware from auth.ts
```bash
# Edit server/routes/auth.ts and delete:
# - Lines 177-256: requireProductTier function + JSDoc
# - Lines 258-335: requireTier function + JSDoc
```

### Step 2: Delete old monolithic routes file
```bash
rm server/routes.ts
```

### Step 3: Run lint to catch any remaining unused imports
```bash
npx eslint server/routes/auth.ts --fix
```

### Step 4: Rebuild and test
```bash
npm run build
npm run dev  # Should start cleanly
```

### Step 5: Search for any lingering requireProductTier references
```bash
grep -r "requireProductTier" server/ client/
# Should return zero results (except this document)
```

---

## 📊 Impact Assessment

| Item | Lines Removed | Risk | Effort |
|------|---------------|------|--------|
| server/routes.ts | ~3700 | None | 1 min |
| requireProductTier fn | ~80 | None | 1 min |
| requireTier fn | ~80 | None | 1 min |
| Unused imports cleanup | ~20 | Low | 2 min |

**Total effort:** ~5 minutes  
**Risk:** Zero — all code paths verified unused

---

## 🔄 Verification After Removal

1. **Build passes:** `npm run build` ✅
2. **Dev server starts:** `npm run dev` ✅ (no import errors)
3. **Feature gating still works:** Test one whitelabel route → loads; test no_access route → 403
4. **No regression:** Existing user flows unaffected since middleware layer unchanged

---

## 📝 Notes

- `requireProductTier` and `requireTier` are **obsolete** because:
  - Old system checked `profiles.product_tier` column
  - New system checks `user_entitlements.package` + `user_has_feature()` RPC
  - All routes now use `requireEntitlement(FeatureKey.X)` instead
- Keeping them does no harm but clutters codebase and may mislead future developers
- Removal simplifies maintenance and makes architecture clearer

---

**Recommendation:** Perform removal in a separate commit after verifying current integration is stable.
