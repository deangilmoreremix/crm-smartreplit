# Module Federation Control System - Integration Guide

This guide explains how to integrate the Federation Control System across all 7 deployed module federation apps.

## Overview

The system enables:
- **Cross-app communication** via EventBus (BroadcastChannel + localStorage fallback)
- **Shared state synchronization** for contacts, deals, and user preferences
- **Feature propagation** from host to remote apps
- **White label configuration sync** across all apps

## Files Created

```
client/src/shared/federation/
├── index.ts                    # Main exports
├── types.ts                    # Shared TypeScript interfaces
├── RemoteRegistry.ts           # Registry of all 7 apps
├── FederationProvider.tsx      # React context provider
├── useFederation.ts            # Core hooks
├── EventBus.ts                 # Cross-app messaging
├── useCrossAppCommunication.ts # Data sharing hooks
└── useWhitelabelFederation.ts  # WL config sync hooks
```

## Integration Steps for Each Remote App

### Step 1: Add FederationProvider

In your remote app's main entry file:

```tsx
// main.tsx or index.tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { FederationProvider } from './shared/federation';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <FederationProvider>
      <App />
    </FederationProvider>
  </React.StrictMode>
);
```

### Step 2: Enable Data Requests

Add request handlers for each capability your app provides:

#### Contacts App (ContactsApp scope)
```tsx
// In your contacts app initialization
import { eventBus } from './shared/federation';

// Add to app startup or useEffect
eventBus.onRequest('contacts', async (action, data) => {
  switch (action) {
    case 'getContact':
      return await fetchContact(data.id);
    case 'listContacts':
      return await fetchContacts(data.filters);
    case 'updateContact':
      return await updateContact(data.id, data.changes);
    default:
      throw new Error(`Unknown action: ${action}`);
  }
});
```

#### Pipeline App (PipelineApp scope)
```tsx
eventBus.onRequest('pipeline', async (action, data) => {
  switch (action) {
    case 'getDeal':
      return await fetchDeal(data.id);
    case 'listDeals':
      return await fetchDeals(data.filters);
    case 'getPipelineStats':
      return await getPipelineStats();
    default:
      throw new Error(`Unknown action: ${action}`);
  }
});
```

#### Analytics App (AnalyticsApp scope)
```tsx
eventBus.onRequest('analytics', async (action, data) => {
  switch (action) {
    case 'getInsights':
      return await getAnalyticsInsights(data.filters);
    case 'getForecast':
      return await getSalesForecast(data.period);
    default:
      throw new Error(`Unknown action: ${action}`);
  }
});
```

### Step 3: Use Shared State Hooks

Import and use the hooks in your components:

```tsx
import { 
  useSharedContactSelection, 
  useSharedDealSelection,
  useContactData,
  useDealData 
} from './shared/federation';

function MyComponent() {
  const { selectContact, onContactSelected } = useSharedContactSelection();
  
  // Listen for contact selections from other apps
  useEffect(() => {
    const unsubscribe = onContactSelected((contact) => {
      // Update UI when contact is selected in another app
      console.log('Contact selected:', contact);
    });
    return unsubscribe;
  }, [onContactSelected]);
  
  // Request contact data from contacts app
  const loadContactDetails = async (contactId) => {
    const { getContact } = useContactData();
    return await getContact(contactId);
  };
}
```

### Step 4: Sync Whitelabel Configuration

For white-label aware apps:

```tsx
import { useWhitelabelFederation } from './shared/federation';
import { useWhitelabel } from './contexts/WhitelabelContext';

function App() {
  const { config } = useWhitelabel();
  const { syncWhitelabelConfig } = useWhitelabelFederation();
  
  useEffect(() => {
    syncWhitelabelConfig(config);
  }, [config, syncWhitelabelConfig]);
  
  return <YourApp />;
}
```

## Host App Integration (Already Done)

The host app at `/client/src/App.tsx` now:
1. Wraps everything in `FederationProvider`
2. Syncs whitelabel config via `WhitelabelFederationSync` component
3. Provides access to all federation hooks

## Remote App URLs & Scopes

| App ID | Domain | Netlify URL | Scope | Request Prefix |
|--------|--------|-------------|-------|----------------|
| contacts | contacts.smartcrm.vip | taupe-sprinkles...netlify.app | ContactsApp | 'contacts' |
| agency | agency.smartcrm.vip | videoagencyai...netlify.app (91317337-b416-4b44-94e9-a852ed448a79) | AIGoalsApp | 'agency' |
| analytics | analytics.smartcrm.vip | subtle-florentine...netlify.app | AnalyticsApp | 'analytics' |
| pipeline | pipeline.smartcrm.vip | cheery-syrniki...netlify.app | PipelineApp | 'pipeline' |
| research | research.smartcrm.vip | clever-syrniki...netlify.app | ResearchApp | 'research' |
| calendar | calendar.smartcrm.vip | voluble-vacherin...netlify.app | CalendarApp | 'calendar' |
| ai-analytics | ai-analytics.smartcrm.vip | dulcet-salmiakki...netlify.app | AnalyticsApp | 'ai-analytics' |

## Available Hooks

### Core Hooks
- `useFederation()` - Access registry, featureFlags, sharedState
- `useFeatureFlags()` - Get current feature flags
- `useSharedState()` - Get/update shared state

### Cross-App Data Hooks
- `useContactData()` - Request contact data from contacts app
  - `getContact(id)` - Get single contact
  - `getContacts(filters)` - List contacts with filters

- `useDealData()` - Request deal data from pipeline app
  - `getDeal(id)` - Get single deal
  - `getDeals(filters)` - List deals with filters

- `useCrossAppCommunication()` - General cross-app functions
  - `requestData(appId, action, data)` - Request data from any app
  - `broadcastData(type, payload)` - Broadcast to all apps
  - `getAppsByCapability(capability)` - Find apps by capability

### Shared Selection Hooks
- `useSharedContactSelection()`
  - `selectContact(contact)` - Broadcast contact selection
  - `onContactSelected(handler)` - Listen for selections

- `useSharedDealSelection()`
  - `selectDeal(deal)` - Broadcast deal selection
  - `onDealSelected(handler)` - Listen for selections

### Whitelabel Hooks
- `useWhitelabelFederation()`
  - `syncWhitelabelConfig(config)` - Sync config to all apps
  - `broadcastTenantSwitch(tenantId)` - Notify tenant change
  - `onWhitelabelConfigUpdate(handler)` - Listen for config changes

## Testing Cross-App Communication

1. Open two different apps in separate tabs
2. In Contacts app, select a contact
3. In Analytics app, verify the contact selection is received via `onContactSelected`
4. Check browser console for event bus activity

## Troubleshooting

### EventBus not working across origins
- Ensure both apps are on the same parent domain or use localStorage fallback
- Check browser console for CORS errors

### Request timeout
- Verify the target app has registered a request handler
- Check network tab for failed requests

### Whitelabel config not syncing
- Ensure both apps use FederationProvider
- Check that `syncWhitelabelConfig` is called on config changes