# SmartCRM Improvement Design

## Design Goals
1. **Security Hardening** — fix exposed secrets & CORS
2. **Reliability** — proper DB connection failure handling  
3. **Observability** — add health endpoint & monitoring
4. **Quality** — clean up duplicates & add tests
5. **Performance** — caching & indexing improvements

## Proposed Changes

### Phase 1: Critical Security Fixes (Must-Have)
- Remove/rotate exposed keys in .env.example
- Configure CORS properly in Express
- Audit for other secret exposures
- Add security headers middleware

### Phase 2: Reliability & Observability 
- Add /health endpoint with DB/Redis health checks
- Fail fast on DB connection errors (not silent)
- Add startup validation for required env vars
- Standardize rate limiter (keep Redis, add DB fallback)

### Phase 3: Code Quality
- Remove duplicate/copy files (archive to .archive/)
- Consolidate rate limiting logic
- Add missing indexes to critical tables
- Add session-based entitlement caching

### Phase 4: Testing
- Unit tests for: db.ts, supabase.ts, enhancedCache.ts, rate limiting
- Integration tests for auth & entitlement middleware
- E2E smoke tests for critical flows

### Out of Scope (Future Phases)
- Feature additions
- Major refactoring
- Migration consolidation
