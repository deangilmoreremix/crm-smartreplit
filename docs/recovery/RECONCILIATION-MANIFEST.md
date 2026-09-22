# SmartCRM Canonical Reconciliation Manifest

Base: `2889196`
Branch: `recovery/canonical-reconciliation`
Started: 2026-09-16

## Recovery Sources

| Source | Branch/Ref | Description |
|--------|-----------|-------------|
| Session C | `session/agent_045375e4` | Auth audit logging + password change |
| White-label | `recovery/white-label-f1b9d07` | White-label enhancements, smart notifications, theme system, domain management |
| Session A | `session/agent_543a3a7c` | Onboarding, permissions, audit logging, dashboard widgets, AI agents |
| Session B | `session/agent_6c4ede7c` | AI agent orchestration, SuperPowers, gtm-skills, dench |
| Supabase migration | `recovery/supabase-migration-16d55d2` | Drizzle-removal / Supabase migration work |
| Stash | `recovery/stash-migration-2026-07-13` | 26 migration-related files |
| Dirty main | `recovery/dirty-main-2026-09-15` | 47 modified, 6 deleted, 7 untracked files |

## Feature Recovery Matrix

| Feature | Source | Source SHA | Current Main Equivalent | Dependencies | Risk | Port Method | Status |
|---------|--------|-----------|------------------------|--------------|------|-------------|--------|
| Password Change | Session C | `4162da1` | None | Supabase auth | Low | Manual port | ✅ Done |
| Auth Audit Logging | Session C | `d18b69c` | None | Supabase, server routes | Low | Manual port | ✅ Done (included with password change) |
| Smart Notifications | White-label | `f1b9d07` | `NotificationContext.tsx` + `NotificationCenter.tsx` | None | Low | Preserve main | ⏭️ Deferred (main is better) |
| Onboarding Flow | Session A | `session/agent_543a3a7c` | `OnboardingWidget.tsx` + `useOnboarding.ts` | React Router | Low | Manual port | 🔄 In Progress |
| Permissions System | Session A | `session/agent_543a3a7c` | `RoleBasedAccess.tsx` | Supabase, shared packages | Medium | Manual port | ⏳ Pending |
| Audit Logging (broader) | Session A | `session/agent_543a3a7c` | `AuditLogViewer.tsx` + `auditLog.ts` | Supabase, middleware | Medium | Manual port | ⏳ Pending |
| Dashboard Widgets | Session A | `session/agent_543a3a7c` | Various dashboard components | Supabase, queries | Medium | Selective port | ⏳ Pending |
| White-label Branding | White-label | `f1b9d07` | `WhitelabelContext.tsx` | Supabase tenant_config | Medium | Manual port | ⏳ Pending |
| Theme System | White-label | `f1b9d07` | `ThemeContext.tsx` | CSS variables, localStorage | Low | Preserve main | ⏳ Pending |
| Domain Management | White-label | `f1b9d07` | None | DNS, TLS, Netlify | High | Defer | ⏸️ Deferred |
| AI Agents | Session A/B | Multiple | Various AI components | OpenAI, Supabase | High | Defer to AI phase | ⏸️ Deferred |
| Voice Analysis | `ae82425` | Initial commit | References in AITools.tsx | OpenAI Realtime | High | Preserve references | ⏸️ Deferred |
| Workflow Engine | Session A | `session/agent_543a3a7c` | `packages/workflows/` | Supabase, scheduling | Medium | Selective port | ⏳ Pending |
| GTM Skills | Session B | `session/agent_6c4ede7c` | None | AI-dependent | High | Defer to AI phase | ⏸️ Deferred |
| Dench Package | Session B | `session/agent_6c4ede7c` | None | Unknown | Unknown | Document only | ⏸️ Deferred |
| Drizzle-dependent files | Various | Multiple | Supabase equivalents | Supabase migrations | Medium | Port to Supabase | ⏳ Pending |
| Recovered Tests | Various | Multiple | Current test suite | Vitest/Jest | Low | Evaluate and adapt | ⏳ Pending |

## Port Status

### Completed
- ✅ `recovery(auth): restore password change functionality` - Ported secure password change with audit logging from Session C

### In Progress
- 🔄 Onboarding system recovery

### Pending
- ⏳ Permissions system
- ⏳ Audit logging (broader)
- ⏳ Dashboard widgets
- ⏳ White-label branding
- ⏳ Workflow engine
- ⏳ Recovered tests evaluation
- ⏳ Drizzle-dependent file porting

### Deferred
- ⏭️ Smart Notifications (main implementation is superior)
- ⏸️ Domain Management (infrastructure-dependent)
- ⏸️ AI features (OpenAI modernization phase)
- ⏸️ Voice Analysis (OpenAI modernization phase)
- ⏸️ GTM Skills (AI-dependent)
- ⏸️ Dench package (purpose unclear)
