# Module Federation Control System Design

## Overview

Create a unified system to control, configure, and enable cross-app communication for 7 module federation apps.

## Architecture Goals

1. **Centralized Control** — Features added to host repo propagate to all remotes
2. **Cross-App Communication** — Apps share data and trigger actions in each other
3. **Dynamic Configuration** — Runtime feature flags and settings
4. **Unified Data Layer** — Shared state synchronization

---

## Phase 1: Shared Module Federation Library

### Architecture
```
client/
  src/
    shared/
      federation/
        FederationProvider.tsx    # Host-wide federation context
        useFederation.ts          # React hooks for cross-app calls
        RemoteRegistry.ts         # Registry of all remote apps
        EventBus.ts               # Cross-app event system
```

### Data Model
```typescript
interface RemoteApp {
  id: string;
  name: string;
  domain: string;
  url: string;
  scope: string;
  modules: string[];
  capabilities: string[]; // ['contacts', 'analytics', 'pipeline', 'ai']
}

interface FederationEvent {
  type: string;
  payload: any;
  source: string; // app id
  target?: string; // specific app or 'broadcast'
}
```

---

## Phase 2: Cross-App Communication System

### Event Bus Architecture
```typescript
// Broadcasts events to all connected apps
// Falls back to localStorage/events for same-origin
// Uses postMessage for iframe-based remotes

class FederationEventBus {
  subscribe(appId: string, callback: (event: FederationEvent) => void): void;
  publish(event: FederationEvent): void;
  request(appId: string, action: string, data: any): Promise<any>;
}
```

### Shared State Sync
```typescript
// Apps can share state like:
// - Selected contact
// - Active deal
// - User preferences
// - Analytics filters

interface SharedState {
  selectedContact?: Contact;
  activeDeal?: Deal;
  currentTenant?: string;
  userPreferences?: Preferences;
}
```

---

## Phase 3: Remote App Registry & Discovery

### Registry Service
```typescript
const REMOTE_APPS: RemoteApp[] = [
  {
    id: 'contacts',
    name: 'Enhanced Contacts',
    domain: 'contacts.smartcrm.vip',
    url: 'https://contacts.smartcrm.vip',
    scope: 'enhanced_contacts',
    modules: ['./ContactsApp', './ContactDetail', './LeadScore'],
    capabilities: ['contacts', 'ai-scoring']
  },
  {
    id: 'analytics',
    name: 'AI Analytics Dashboard',
    domain: 'analytics.smartcrm.vip',
    url: 'https://analytics.smartcrm.vip',
    scope: 'ai_analytics',
    modules: ['./AnalyticsApp', './InsightsPanel'],
    capabilities: ['analytics', 'insights', 'forecasting']
  },
  // ... all 7 apps
];
```

---

## Phase 4: Feature Propagation System

### Shared Feature Components
```typescript
// Components that exist in the host and are exposed to remotes
interface SharedFeatures {
  ContactCard: React.ComponentType;
  LeadScoreBadge: React.ComponentType;
  DealPipeline: React.ComponentType;
  AnalyticsChart: React.ComponentType;
}

// Feature flags that all apps can query
interface FeatureFlags {
  enableAI: boolean;
  enableScoring: boolean;
  enableForecasting: boolean;
}
```

### Implementation Pattern
1. Create shared components in `client/src/shared/components/`
2. Expose via Module Federation from host
3. Import in remote apps via dynamic module federation
4. Use versioning for backward compatibility

---

## Phase 5: Data Synchronization Layer

### Shared Data Context
```typescript
// Real-time data sync between apps
interface DataSyncLayer {
  // Subscribe to data changes
  subscribe(entityType: string, callback: (data: any) => void): void;
  
  // Request data from another app
  requestData(appId: string, entityType: string, id: string): Promise<any>;
  
  // Broadcast data updates
  broadcastUpdate(entityType: string, data: any): void;
}

// Example: Contact selected in Contacts app
// Analytics app receives update and refreshes dashboard
```

---

## Implementation Steps

### Step 1: Create Federation Context
- Build `FederationProvider` with app registry
- Add `useFederation` hook for apps to access registry
- Write tests for registry and context

### Step 2: Build Event Bus
- Implement cross-origin event bus with fallbacks
- Add support for localStorage, BroadcastChannel, postMessage
- Write tests for cross-app messaging

### Step 3: Shared State Management
- Create shared state context with persistence
- Add state sync between apps
- Write tests for state consistency

### Step 4: Feature Component Library
- Move shared UI components to `shared/` directory
- Configure Module Federation to expose these
- Write tests for component integration

### Step 5: Remote Configuration API
- Create endpoints for feature flags
- Add tenant-specific configuration
- Write tests for configuration service

---

## URLs Mapping

| App ID | Custom Domain | Current URL | Scope |
|--------|---------------|-------------|-------|
| contacts | contacts.smartcrm.vip | taupe-sprinkles-83c9ee.netlify.app | enhanced_contacts |
| agency | agency.smartcrm.vip | tubular-choux-2a9b3c.netlify.app | ai_agency |
| analytics | analytics.smartcrm.vip | subtle-florentine-8fd315.netlify.app | ai_analytics |
| pipeline | pipeline.smartcrm.vip | cheery-syrniki-b5b6ca.netlify.app | pipeline_deals |
| research | research.smartcrm.vip | clever-syrniki-4df87f.netlify.app | product_research |
| calendar | calendar.smartcrm.vip | voluble-vacherin-add80d.netlify.app | ai_calendar |
| ai-analytics | ai-analytics.smartcrm.vip | dulcet-salmiakki-445c47.netlify.app | multi_analytics |

---

## Questions for Clarification

1. Do you need real-time sync or is polling acceptable?
2. Should we use Supabase Realtime or custom WebSocket?
3. Do all apps share the same Supabase database?
4. What's your preference for feature flag storage (env vs DB)?