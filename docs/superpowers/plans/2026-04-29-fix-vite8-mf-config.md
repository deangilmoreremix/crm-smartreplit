# Fix Vite 8 Module Federation Configuration

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove incompatible `format: 'systemjs'` option from Vite 8 rollupOptions.output configurations across four MFE apps.

**Architecture:** Vite 8 uses Rolldown which doesn't support `output.format: 'systemjs'`. The @originjs/vite-plugin-federation plugin automatically generates SystemJS-compatible remoteEntry.js. We only need to ensure predictable entry filename and keep MFE-required options.

**Tech Stack:** Vite 8, Rollup (Rolldown), Module Federation, React

---

## Files Affected

All four apps have identical structure: `rollupOptions.output.format: 'systemjs'` must be removed while keeping:
- `entryFileNames: 'assets/remoteEntry.js'` (predictable path)
- `minify: false` (debugging)
- `cssCodeSplit: false` (MFE requirement)
- `assetsDir: 'assets'` where present (asset location)

**Apps to modify:**
- `apps/contacts/vite.config.ts`
- `apps/pipeline/vite.config.ts`
- `apps/analytics/vite.config.ts`
- `apps/calendar/vite.config.ts`

---

### Task 1: Fix Contacts App Vite Config

**Files:**
- Modify: `apps/contacts/vite.config.ts:61-67`

**Current problematic block:**
```typescript
rollupOptions: {
  output: {
    format: 'systemjs',  // <-- REMOVE THIS LINE
    entryFileNames: 'assets/remoteEntry.js',
    minifyInternalExports: false
  }
}
```

**Fixed block:**
```typescript
rollupOptions: {
  output: {
    entryFileNames: 'assets/remoteEntry.js',
    minifyInternalExports: false
  }
}
```

- [ ] **Step 1:** Edit `apps/contacts/vite.config.ts`, remove line 63 (`format: 'systemjs',`)
- [ ] **Step 2:** Verify build section structure remains intact (lines 57-69)
- [ ] **Step 3:** Commit change

---

### Task 2: Fix Pipeline App Vite Config

**Files:**
- Modify: `apps/pipeline/vite.config.ts:39-45`

**Current problematic block:**
```typescript
rollupOptions: {
  output: {
    format: 'systemjs',  // <-- REMOVE THIS LINE
    entryFileNames: 'assets/remoteEntry.js',
    minifyInternalExports: false
  }
}
```

**Fixed block:**
```typescript
rollupOptions: {
  output: {
    entryFileNames: 'assets/remoteEntry.js',
    minifyInternalExports: false
  }
}
```

- [ ] **Step 1:** Edit `apps/pipeline/vite.config.ts`, remove line 41 (`format: 'systemjs',`)
- [ ] **Step 2:** Verify build section structure remains intact (lines 34-46)
- [ ] **Step 3:** Commit change

---

### Task 3: Fix Analytics App Vite Config

**Files:**
- Modify: `apps/analytics/vite.config.ts:53-59`

**Current problematic block:**
```typescript
rollupOptions: {
  output: {
    format: 'systemjs',  // <-- REMOVE THIS LINE
    entryFileNames: 'assets/remoteEntry.js',
    minifyInternalExports: false
  }
}
```

**Fixed block:**
```typescript
rollupOptions: {
  output: {
    entryFileNames: 'assets/remoteEntry.js',
    minifyInternalExports: false
  }
}
```

- [ ] **Step 1:** Edit `apps/analytics/vite.config.ts`, remove line 55 (`format: 'systemjs',`)
- [ ] **Step 2:** Verify build section structure remains intact (lines 48-60)
- [ ] **Step 3:** Commit change

---

### Task 4: Fix Calendar App Vite Config

**Files:**
- Modify: `apps/calendar/vite.config.ts:44-50`

**Current problematic block:**
```typescript
rollupOptions: {
  output: {
    format: 'systemjs',  // <-- REMOVE THIS LINE
    entryFileNames: 'assets/remoteEntry.js',
    minifyInternalExports: false
  }
}
```

**Fixed block:**
```typescript
rollupOptions: {
  output: {
    entryFileNames: 'assets/remoteEntry.js',
    minifyInternalExports: false
  }
}
```

- [ ] **Step 1:** Edit `apps/calendar/vite.config.ts`, remove line 46 (`format: 'systemjs',`)
- [ ] **Step 2:** Verify build section structure remains intact (lines 38-51)
- [ ] **Step 3:** Commit change

---

### Task 5: Verify Build Success

**Files:**
- Test: All four app builds

**Commands:**
```bash
# Build each app to verify no rollup errors
cd /workspaces/crm-smartreplit/apps/contacts && npm run build
cd /workspaces/crm-smartreplit/apps/pipeline && npm run build
cd /workspaces/crm-smartreplit/apps/analytics && npm run build
cd /workspaces/crm-smartreplit/apps/calendar && npm run build
```

**Expected:** All builds succeed without `option "format" is not supported` or similar Rolldown errors.

- [ ] **Step 1:** Build contacts app - verify success
- [ ] **Step 2:** Build pipeline app - verify success
- [ ] **Step 3:** Build analytics app - verify success
- [ ] **Step 4:** Build calendar app - verify success
- [ ] **Step 5:** Check generated `dist/assets/remoteEntry.js` files are SystemJS-compatible (contain `System.register` wrapper)
- [ ] **Step 6:** Commit successful build verification

---

## Acceptance Criteria

1. No `format` property in any `rollupOptions.output` configuration
2. All `entryFileNames: 'assets/remoteEntry.js'` preserved
3. All `minify: false` preserved
4. All `cssCodeSplit: false` preserved
5. `assetsDir: 'assets'` preserved where present
6. All four apps build successfully with Vite 8
7. Generated remoteEntry.js files are SystemJS-compatible (auto-generated by plugin)

---

## Rollback Plan

If issues arise:
1. Check plugin documentation for Vite 8 compatibility
2. Verify `@originjs/vite-plugin-federation` version supports Vite 8
3. Restore `format: 'systemjs'` temporarily if build fails for other reasons
4. Inspect generated remoteEntry.js to confirm SystemJS wrapper exists

---

**Plan complete and saved to `docs/superpowers/plans/2026-04-29-fix-vite8-mf-config.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
