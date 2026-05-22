# Module Federation Control System - Implementation Plan

**Design**: .superpowers/brainstorm/1747237780/federation-control-system.md  
**Created**: 2026-05-14  
**Status**: Ready for execution

---

## Phase 1: Remote App Registry & Configuration

### Task 1.1: Create Remote App Registry
- **Files to create**: 
  - `client/src/shared/federation/RemoteRegistry.ts`
  - `client/src/shared/federation/types.ts`
- **Test**: `client/src/shared/__tests__/RemoteRegistry.test.ts`
- **Verification**: Registry returns correct app config for each ID

### Task 1.2: Create Federation Context Provider
- **Files to create**: `client/src/shared/federation/FederationProvider.tsx`
- **Files to modify**: `client/src/main.tsx` or `client/src/App.tsx`
- **Test**: `client/src/shared/__tests__/FederationProvider.test.ts`
- **Verification**: Context provides registry to all children

### Task 1.3: Create useFederation Hook
- **Files to create**: `client/src/shared/federation/useFederation.ts`
- **Test**: `client/src/shared/__tests__/useFederation.test.ts`
- **Verification**: Hook returns registry and app methods

---

## Phase 2: Cross-App Communication System

### Task 2.1: Create Event Bus
- **Files to create**: `client/src/shared/federation/EventBus.ts`
- **Capabilities needed**: 
  - localStorage fallback for same-origin
  - BroadcastChannel for modern browsers
  - postMessage for iframe communication
- **Test**: `client/src/shared/__tests__/EventBus.test.ts`
- **Verification**: Events broadcast between apps

### Task 2.2: Add Cross-App Messaging to Iframes
- **Files to modify**: `client/src/components/AutoRefreshRemoteApp.tsx`
- **Test**: Verify postMessage communication
- **Verification**: Parent can send/receive messages from iframes

### Task 2.3: Create useCrossAppCommunication Hook
- **Files to create**: `client/src/shared/federation/useCrossAppCommunication.ts`
- **Test**: `client/src/shared/__tests__/useCrossAppCommunication.test.ts`
- **Verification**: Apps can request data from other apps

---

## Phase 3: Shared State Synchronization

### Task 3.1: Create Shared State Context
- **Files to create**: `client/src/shared/federation/SharedStateContext.tsx`
- **State to track**:
  - selectedContact
  - activeDeal
  - currentTenant
  - userPreferences
- **Test**: `client/src/shared/__tests__/SharedStateContext.test.ts`
- **Verification**: State persists and syncs across apps

### Task 3.2: Add State Persistence
- **Files to create**: `client/src/shared/federation/stateStorage.ts`
- **Options**: localStorage, sessionStorage, or Supabase
- **Test**: State persists across page reloads
- **Verification**: Apps load correct state on init

### Task 3.3: Create State Change Listeners
- **Files to create**: `client/src/shared/federation/useSharedStateSubscription.ts`
- **Test**: Components re-render on state changes
- **Verification**: UI updates when other apps change state

---

## Phase 4: Feature Component Library

### Task 4.1: Create Shared Components Directory
- **Files to create**: `client/src/shared/components/index.ts`
- **Components**:
  - `ContactCard.tsx` - Unified contact display
  - `LeadScoreBadge.tsx` - Reusable scoring badge
  - `DealPipeline.tsx` - Pipeline visualization
  - `AnalyticsChart.tsx` - Shared chart component

### Task 4.2: Configure Module Federation Exposing
- **Files to create**: `client/vite.config.federation.ts`
- **Expose**: All shared components with versioning
- **Test**: Remote apps can load shared components
- **Verification**: Components render in remote contexts

### Task 4.3: Create Shared Types Package
- **Files to create**: `client/src/shared/types/index.ts`
- **Types**: Contact, Deal, LeadScore, AnalyticsData
- **Test**: TypeScript compilation succeeds
- **Verification**: All apps use same type definitions

---

## Phase 5: Data Synchronization Layer

### Task 5.1: Create Data Request Service
- **Files to create**: `client/src/shared/federation/dataRequest.ts`
- **Methods**:
  - `requestData(appId, entityType, id)`
  - `broadcastUpdate(entityType, data)`
  - `subscribeToChanges(entityType, callback)`
- **Test**: Data requests resolve across apps
- **Verification**: Apps can query each other's data

### Task 5.2: Implement Cross-App API Bridge
- **Files to create**: `client/src/services/federationBridge.ts`
- **Bridge**: Translate local calls to remote calls
- **Test**: API calls work through bridge
- **Verification**: Same API works locally and remotely

### Task 5.3: Add Data Validation Layer
- **Files to create**: `client/src/shared/federation/dataValidation.ts`
- **Validation**: Ensure data shape before transmission
- **Test**: Invalid data is rejected
- **Verification**: Only valid data crosses app boundaries

---

## Phase 6: Feature Propagation System

### Task 6.1: Create Feature Flag Service
- **Files to create**: `client/src/shared/federation/FeatureFlags.ts`
- **Flags**: enableAIModules, enableScoring, enableForecasting
- **Test**: Flags control feature visibility
- **Verification**: All apps respect same flags

### Task 6.2: Build Feature Configuration API
- **Files to create**: `server/routes/federation.ts`
- **Endpoints**:
  - `GET /api/federation/apps` - List all apps
  - `GET /api/federation/features/:appId` - App features
  - `GET /api/federation/config` - Global config
- **Test**: API returns correct config
- **Verification**: Apps fetch config on startup

### Task 6.3: Add Tenant-Specific Configuration
- **Files to modify**: `server/routes/federation.ts`
- **Support**: Tenant-based feature flags
- **Test**: Tenant config overrides global
- **Verification**: Different tenants see different features

---

## Phase 7: Integration & Testing

### Task 7.1: Wire Up All Loaders
- **Files to modify**: All `Remote*Loader.tsx` components
- **Changes**: Use FederationProvider context
- **Test**: All apps load through federation
- **Verification**: Apps communicate through bus

### Task 7.2: Create End-to-End Test
- **Files to create**: `client/src/shared/__tests__/federation.e2e.test.ts`
- **Scenario**: Contact selected → Analytics updates
- **Verification**: Full workflow works

### Task 7.3: Update Deployment Scripts
- **Files to modify**: `package.json` scripts
- **Add**: Federation health check script
- **Verification**: Scripts validate all remotes reachable

---

## App URLs Configuration (for Phase 1)

```typescript
const REMOTE_APPS: RemoteApp[] = [
  {
    id: 'contacts',
    name: 'Enhanced Contacts Module',
    domain: 'contacts.smartcrm.vip',
    url: 'https://taupe-sprinkles-83c9ee.netlify.app',
    scope: 'enhanced_contacts',
    modules: ['./ContactsApp', './ContactDetail', './LeadScore'],
    capabilities: ['contacts', 'ai-scoring', 'import-export']
  },
  {
    id: 'agency',
    name: 'AI Agency Suite',
    domain: 'agency.smartcrm.vip',
    url: 'https://tubular-choux-2a9b3c.netlify.app',
    scope: 'ai_agency',
    modules: ['./AgencyApp', './CampaignBuilder'],
    capabilities: ['campaigns', 'automation', 'ai-content']
  },
  {
    id: 'analytics',
    name: 'AI Analytics Dashboard',
    domain: 'analytics.smartcrm.vip',
    url: 'https://subtle-florentine-8fd315.netlify.app',
    scope: 'ai_analytics',
    modules: ['./AnalyticsApp', './InsightsPanel'],
    capabilities: ['analytics', 'insights', 'forecasting']
  },
  {
    id: 'pipeline',
    name: 'Enhanced Pipeline Deals',
    domain: 'pipeline.smartcrm.vip',
    url: 'https://cheery-syrniki-b5b6ca.netlify.app',
    scope: 'pipeline_deals',
    modules: ['./PipelineApp', './DealTracker'],
    capabilities: ['pipeline', 'deals', 'forecasting']
  },
  {
    id: 'research',
    name: 'Product Research Module',
    domain: 'research.smartcrm.vip',
    url: 'https://clever-syrniki-4df87f.netlify.app',
    scope: 'product_research',
    modules: ['./ResearchApp', './ProductInsights'],
    capabilities: ['research', 'market-analysis']
  },
  {
    id: 'calendar',
    name: 'Advanced AI Calendar',
    domain: 'calendar.smartcrm.vip',
    url: 'https://voluble-vacherin-add80d.netlify.app',
    scope: 'ai_calendar',
    modules: ['./CalendarApp', './ScheduleOptimizer'],
    capabilities: ['calendar', 'scheduling', 'ai-suggestions']
  },
  {
    id: 'ai-analytics',
    name: 'AI-Powered Analytics Dashboard',
    domain: 'ai-analytics.smartcrm.vip',
    url: 'https://dulcet-salmiakki-445c47.netlify.app',
    scope: 'multi_analytics',
    modules: ['./MultiAnalyticsApp', './CrossAppInsights'],
    capabilities: ['analytics', 'cross-app', 'ai-insights']
  }
];
```

---

## Execution Order

1. Start with Phase 1 (Registry) — foundation for everything
2. Phase 2 (Communication) — enables cross-app interaction
3. Phase 3 (State) — data consistency across apps
4. Phase 4 (Shared Components) — reusable UI
5. Phase 5 (Data Layer) — cross-app data access
6. Phase 6 (Feature Flags) — centralized control
7. Phase 7 (Integration) — wire everything together

## Dependencies Graph

```
1.1 → 1.2 → 1.3
  ↓
2.1 → 2.2 → 2.3
  ↓
3.1 → 3.2 → 3.3
  ↓
4.1 → 4.2 → 4.3
  ↓
5.1 → 5.2 → 5.3
  ↓
6.1 → 6.2 → 6.3
  ↓
7.1 → 7.2 → 7.3
```