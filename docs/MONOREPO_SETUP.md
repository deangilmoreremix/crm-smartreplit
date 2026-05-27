# Module Federation Monorepo - Final Architecture

## Overview

Single repo managing all 7 Module Federation apps with unified authentication.

| App | Scope | Directory | Exposes |
|-----|-------|-----------|---------|
| Contacts | ContactsApp | apps/contacts/ | ContactsApp, ContactsModule |
| Agency | AIGoalsApp | apps/agency/ | AIGoalsApp, GoalsModule |
| Analytics | AnalyticsApp | apps/analytics/ | AnalyticsApp, InsightsModule |
| Pipeline | PipelineApp | apps/pipeline/ | PipelineApp, DealsModule |
| Research | ResearchApp | apps/research/ | ResearchApp, ResearchModule |
| Calendar | CalendarApp | apps/calendar/ | CalendarApp, CalendarModule |
| AI Analytics | AnalyticsApp | apps/ai-analytics/ | AnalyticsApp, InsightsModule |

## Unified Authentication Flow

```
Host CRM (Supabase Auth)
    │
    ├── FederationProvider.sharedState ──► React context (host components)
    │
    ├── broadcastToRemotes(postMessage) ──► Remote iframes
    │       │
    │       └── Remote apps listen for 'AUTH_STATE_CHANGED'
    │           └── Set local auth state from payload
    │           └── Show "Authentication Required" if not authenticated
    │
    └── useSharedModuleState ──► Legacy iframe communication
```

### Key Design Decisions
- **No separate auth in remotes** — All auth comes from the host CRM via postMessage
- **No Supabase imports in remote apps** — Remotes are auth-dumb, they just display content
- **postMessage bridge** — Host broadcasts `AUTH_STATE_CHANGED` to all registered iframes
- **Auth guard** — Every remote app shows "Authentication Required" when `isAuthenticated` is false

## Cross-App Communication

### EventBus (same-origin)
- BroadcastChannel with localStorage fallback
- Request/response pattern with 10-second timeout
- Proper cleanup via unsubscribe functions

### postMessage (cross-origin)
- Host broadcasts to registered iframe windows
- Remotes listen for `AUTH_STATE_CHANGED` and data sync messages
- Remotes notify host via `*_MODULE_READY` and `*_ACTION` messages

## File Structure

```
client/src/shared/federation/
├── types.ts                    # Shared TypeScript types
├── RemoteRegistry.ts           # App registry (scopes, URLs, capabilities)
├── EventBus.ts                 # Cross-app event bus (BroadcastChannel)
├── FederationProvider.tsx      # React context + broadcastToRemotes
├── useFederation.ts            # Simplified hooks
├── useCrossAppCommunication.ts # Cross-app data hooks
├── useWhitelabelFederation.ts  # Whitelabel sync hooks
└── index.ts                    # Barrel exports

apps/*/
├── src/
│   ├── eventBus.ts             # SimpleEventBus (per-app singleton)
│   ├── main.tsx                # Entry point + MF exports
│   ├── *App.tsx                # Main component with auth guard
│   └── *Module.tsx             # Lightweight module component
├── package.json                # Self-contained dependencies
├── vite.config.js              # MF config with correct scope name
├── tsconfig.json
└── index.html
```

## Bugs Fixed During Hardening

1. **AnalyticsModule.tsx** — Removed `@supabase/supabase-js` import (not in package.json)
2. **EventBus.request()** — Added proper unsubscribe + settled flag to prevent memory leaks
3. **SimpleEventBus** — Fixed BroadcastChannel leak (was creating new channel per message)
4. **Auth bridge** — Added `broadcastToRemotes` to FederationProvider + `AUTH_STATE_CHANGED` postMessage
5. **Stale closures** — Used `useRef` for data in `onRequest` handlers + functional updates for sharedState
6. **Remote app consistency** — All apps now have uniform auth guard pattern
7. **updateSharedState** — Supports both direct partial state and functional updater pattern
