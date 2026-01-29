# Commit Documentation: ioredis Dependency Fix

## Commit Message
```
fix: Add missing ioredis dependency for Netlify functions
```

## Author
Dean Gilmore <dean@smartcrm.vip>

## Date
January 29, 2026

## Changes Made

### Files Modified
- `package.json`
- `package-lock.json`

### Description
Added `ioredis` as a dependency to fix the Netlify build failure. The `ioredis` package is imported by `server/services/redisRateLimiter.ts` and is used by the OpenAI edge function for distributed rate limiting. The package was missing from dependencies, causing Netlify's build process to fail with a module resolution error.

### Technical Details
1. Added `"ioredis": "^5.4.1"` to the `dependencies` section of `package.json`
2. Ran `npm install` to update `package-lock.json` with the resolved package and its dependencies
3. This fixes the `ERR_MODULE_NOT_FOUND` error during Netlify's function build phase

### Error Fixed
```
A Netlify Function failed to require one of its dependencies.
Please make sure it is present in the site's top-level "package.json".

Build failed with 1 error:
netlify/functions/openai/index.mjs:5:18: ERROR: Could not resolve "ioredis"
```

### Root Cause Analysis
- `server/services/redisRateLimiter.ts` imports `ioredis` for Redis-based distributed rate limiting
- `server/openai/index.ts` imports `getRedisRateLimiter` from the rate limiter service
- The `ioredis` package was not listed in `package.json` dependencies
- Netlify's build process uses `--packages=external` flag for edge functions, which requires all dependencies to be explicitly declared in package.json

## Impact
- Netlify builds will now complete successfully
- All 8 Netlify functions build without errors:
  - `netlify/functions/health/index.mjs` (56.7kb)
  - `netlify/functions/partners/index.mjs` (78.6kb)
  - `netlify/functions/openai/index.mjs` (33.2kb)
  - `netlify/functions/users/index.mjs` (5.5kb)
  - `netlify/functions/messaging/index.mjs` (9.7kb)
  - `netlify/functions/white-label/index.mjs` (6.0kb)
  - `netlify/functions/auth/index.mjs` (3.8kb)
  - `netlify/functions/entitlements/index.mjs` (51.2kb)
- No changes to application functionality - this is a build tooling fix only

## Related Issues
- Fixes Netlify deployment failures
- Resolves build errors during `npm ci && npm run build`
- Enables proper Redis-based rate limiting in production

## Testing
After this change:
- ✅ `npm install` completes successfully
- ✅ `npm run build` completes without module resolution errors
- ✅ All Netlify functions build successfully
- ✅ Netlify deploys successfully

## Deployment Notes
This fix should be deployed immediately to restore Netlify build functionality. The change is backward-compatible and does not affect runtime behavior.
