# ESLint and Prettier Code Cleanup Plan

## Overview

This plan outlines the approach for running ESLint and Prettier on the entire codebase, removing unused variables, deprecated comments, and console logs.

## Current State Analysis

### Configuration Files

- **ESLint Config**: [`eslint.config.js`](../eslint.config.js) - Flat config format with TypeScript and React support
- **Prettier Config**: [`.prettierrc.json`](../.prettierrc.json) - Standard configuration
- **Prettier Ignore**: [`.prettierignore`](../.prettierignore) - Excludes dist, node_modules, netlify, config files

### Existing ESLint Rules

From [`eslint.config.js`](../eslint.config.js:75-86):

- `@typescript-eslint/no-unused-vars`: Warns on unused variables (with `_` prefix ignore)
- `@typescript-eslint/no-explicit-any`: Warns on `any` type usage
- `@typescript-eslint/no-empty-function`: Warns on empty functions

### Scope of Cleanup

Based on analysis:

| Category               | Client Files | Server Files | Total                |
| ---------------------- | ------------ | ------------ | -------------------- |
| console.log statements | 300+         | 300+         | 600+                 |
| TODO comments          | 11           | TBD          | 11+                  |
| Unused variables       | TBD          | TBD          | ESLint will identify |

## Execution Plan

### Phase 1: Run Prettier

```bash
npm run format
```

This will format all files according to [`.prettierrc.json`](../.prettierrc.json) configuration.

**Expected Changes**:

- Consistent formatting across all `.ts`, `.tsx`, `.js`, `.jsx` files
- No functional changes, only whitespace/formatting

### Phase 2: Run ESLint Analysis

```bash
npm run lint
```

This will identify:

- Unused variables
- Unused imports
- `any` type usage
- Other code quality issues

**Note**: The current ESLint config ignores `server/**` directory. We may need to update this for comprehensive coverage.

### Phase 3: Remove Console Logs

#### Strategy for Client Files (`client/src/**/*.tsx`)

**Files with most console statements** (based on analysis):

- [`client/src/contexts/VideoCallContext.tsx`](../client/src/contexts/VideoCallContext.tsx) - ~80+ console statements
- [`client/src/pages/ContactsWithRemote.tsx`](../client/src/pages/ContactsWithRemote.tsx) - ~30+ console statements
- [`client/src/components/Navbar.tsx`](../client/src/components/Navbar.tsx) - ~15+ console statements
- [`client/src/pages/RemotePipeline.tsx`](../client/src/pages/RemotePipeline.tsx) - ~20+ console statements
- [`client/src/components/DevBypassButton.tsx`](../client/src/components/DevBypassButton.tsx) - ~15+ console statements

**Approach**:

1. Remove all `console.log()` statements (debugging output)
2. Keep `console.error()` in error handlers (for production error tracking)
3. Keep `console.warn()` for important warnings
4. Remove emoji-prefixed debug logs (e.g., `console.log('🔧 ...')`)

#### Strategy for Server Files (`server/**/*.ts`)

**Important**: Server-side logging serves different purposes:

- Error logging for debugging production issues
- Audit trails for security events
- Performance monitoring

**Approach**:

1. Keep `console.error()` for error handling
2. Keep `console.warn()` for warnings
3. Remove verbose debug `console.log()` statements
4. Keep important operational logs (e.g., server startup, webhook processing)

**Files to clean**:

- [`server/routes/billing.ts`](../server/routes/billing.ts) - Debug logs
- [`server/routes/crm.ts`](../server/routes/crm.ts) - Auth debug logs
- [`server/signaling-server.ts`](../server/signaling-server.ts) - WebSocket debug logs

### Phase 4: Remove Deprecated Comments and TODOs

**TODO Comments Found**:

| File                                                                                                                                 | Line   | Comment                                          |
| ------------------------------------------------------------------------------------------------------------------------------------ | ------ | ------------------------------------------------ |
| [`client/src/pages/AutomationConfig.tsx`](../client/src/pages/AutomationConfig.tsx:54)                                               | 54     | `// TODO: Save to backend`                       |
| [`client/src/components/RoleBasedAccess.tsx`](../client/src/components/RoleBasedAccess.tsx:87)                                       | 87     | `// TODO: implement permissions`                 |
| [`client/src/components/ModuleFederationAgency.tsx`](../client/src/components/ModuleFederationAgency.tsx:3)                          | 3      | `// TODO: Replace with Module Federation import` |
| [`client/src/components/ModuleFederationResearch.tsx`](../client/src/components/ModuleFederationResearch.tsx:3)                      | 3      | `// TODO: Replace with Module Federation import` |
| [`client/src/components/aiTools/SmartSearchRealtime.tsx`](../client/src/components/aiTools/SmartSearchRealtime.tsx:9)                | 9-12   | `// TODO: Replace with real CRM data`            |
| [`client/src/components/aiTools/EmailComposerContent.tsx`](../client/src/components/aiTools/EmailComposerContent.tsx:18)             | 18, 88 | TODO comments                                    |
| [`client/src/components/aiTools/ReasoningContentGenerator.tsx`](../client/src/components/aiTools/ReasoningContentGenerator.tsx:130)  | 130    | `// TODO: Replace with real AI implementation`   |
| [`client/src/components/aiTools/DocumentAnalyzerRealtime.tsx`](../client/src/components/aiTools/DocumentAnalyzerRealtime.tsx:166)    | 166    | `// TODO: Replace with real AI implementation`   |
| [`client/src/components/aiTools/InstantAIResponseGenerator.tsx`](../client/src/components/aiTools/InstantAIResponseGenerator.tsx:89) | 89     | `// TODO: Replace with real AI implementation`   |
| [`client/src/components/aiTools/SocialMediaGenerator.tsx`](../client/src/components/aiTools/SocialMediaGenerator.tsx:104)            | 104    | `// TODO: Replace with real AI implementation`   |

**Approach**:

1. Remove obsolete TODOs that are no longer relevant
2. Keep TODOs that represent legitimate future work
3. Convert important TODOs to GitHub issues if needed

### Phase 5: Fix Unused Variables

ESLint will identify unused variables. Common patterns to address:

- Unused imports
- Unused function parameters (prefix with `_` if intentionally unused)
- Unused destructured variables

### Phase 6: Final Verification

```bash
# Run both checks
npm run lint
npm run format
```

Verify no errors remain.

## Files to Modify

### High Priority (Most Console Logs)

1. `client/src/contexts/VideoCallContext.tsx`
2. `client/src/pages/ContactsWithRemote.tsx`
3. `client/src/components/Navbar.tsx`
4. `client/src/pages/RemotePipeline.tsx`
5. `client/src/components/DevBypassButton.tsx`
6. `client/src/main.tsx`
7. `server/routes/billing.ts`
8. `server/routes/crm.ts`
9. `server/signaling-server.ts`

### Medium Priority (TODO Comments)

1. `client/src/pages/AutomationConfig.tsx`
2. `client/src/components/RoleBasedAccess.tsx`
3. `client/src/components/ModuleFederationAgency.tsx`
4. `client/src/components/ModuleFederationResearch.tsx`
5. `client/src/components/aiTools/*.tsx`

### Configuration Updates Needed

The current [`eslint.config.js`](../eslint.config.js:150-192) ignores `server/**` directory. Consider updating to include server files for comprehensive linting.

## Risks and Considerations

1. **Breaking Changes**: Removing console.logs should not affect functionality
2. **Debugging**: Some console.logs may be useful for debugging; consider keeping error-level logs
3. **Test Files**: Console.logs in test files may be intentional; review before removal
4. **Copy Files**: Files named `*.copy.tsx` or `* copy.tsx` appear to be duplicates; consider removal

## Estimated Impact

- **Files Modified**: 50+ files
- **Lines Removed**: 500+ lines (console logs, TODOs, unused variables)
- **Code Quality**: Improved maintainability and cleaner codebase

## Next Steps

1. Switch to Code mode to execute the cleanup
2. Run Prettier first (safe operation)
3. Run ESLint to identify issues
4. Systematically remove console logs and fix issues
5. Run final verification
