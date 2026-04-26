# GTM Analytics Integration for Monorepos

This document explains how the Contacts and Pipeline monorepos can integrate with the GTM (Google Tag Manager) analytics system.

## Architecture Overview

The GTM analytics system is available through shared services that monorepos can consume via module federation. The integration provides:

- Contact analytics and insights
- Deal analytics and recommendations
- AI-powered recommendations
- Performance tracking and usage analytics

## Integration Methods

### Method 1: Shared Service API (Recommended)

Import the shared GTM analytics service and use it directly:

```typescript
import { sharedGTMAnalytics } from 'crm-shared/services/sharedGTMAnalytics';

// Get contact analytics
const contactAnalytics = await sharedGTMAnalytics.getContactAnalytics(contactId);

// Get deal analytics
const dealAnalytics = await sharedGTMAnalytics.getDealAnalytics(dealId);

// Generate AI recommendations
const recommendations = await sharedGTMAnalytics.generateContactRecommendations(contactData);

// Track recommendation usage
await sharedGTMAnalytics.trackRecommendationUsage(recId, 'applied', context);
```

### Method 2: Pre-built Components

Import and use pre-built React components:

```typescript
import { ContactAnalyticsWidget, DealAnalyticsWidget } from 'crm-shared/components/shared/GTMAnalyticsWidgets';

// In your contact detail view
<ContactAnalyticsWidget
  contactId={contact.id}
  contactData={contact}
  className="mt-4"
/>

// In your deal detail view
<DealAnalyticsWidget
  dealId={deal.id}
  dealData={deal}
  className="mt-4"
/>
```

### Method 3: Module Federation Events

Subscribe to analytics events via the shared event bus:

```typescript
import { globalEventBus } from 'crm-shared/utils/moduleFederationOrchestrator';

// Subscribe to analytics events
const unsubscribe = globalEventBus.on('CONTACT_ANALYTICS_RECEIVED', (data) => {
  console.log('Contact analytics received:', data);
});

// Cleanup
unsubscribe();
```

## Available Services

### SharedGTMAnalyticsService

**Methods:**
- `getContactAnalytics(contactId: number)` - Get analytics for a specific contact
- `getDealAnalytics(dealId: number)` - Get analytics for a specific deal
- `generateContactRecommendations(contactData: any)` - AI recommendations for contacts
- `generateDealRecommendations(dealData: any)` - AI recommendations for deals
- `trackRecommendationUsage(recId: string, action: string, context: any)` - Track user interactions
- `getPromptPerformance(timeRange: string)` - Get performance metrics
- `subscribeToAnalyticsEvents(callback)` - Subscribe to analytics events

## Component Props

### ContactAnalyticsWidget
- `contactId: number` - Required contact ID
- `contactData?: any` - Optional contact data for enhanced recommendations
- `className?: string` - CSS classes

### DealAnalyticsWidget
- `dealId: number` - Required deal ID
- `dealData?: any` - Optional deal data for enhanced recommendations
- `className?: string` - CSS classes

## Event Types

- `CONTACT_ANALYTICS_RECEIVED` - Contact analytics data received
- `DEAL_ANALYTICS_RECEIVED` - Deal analytics data received
- `CONTACT_RECOMMENDATIONS_GENERATED` - AI recommendations for contacts
- `DEAL_RECOMMENDATIONS_GENERATED` - AI recommendations for deals
- `RECOMMENDATION_TRACKED` - User interaction with recommendation
- `PERFORMANCE_DATA_RECEIVED` - Performance metrics received

## Implementation Steps

### For Contacts Monorepo:

1. **Import the service:**
```typescript
import { sharedGTMAnalytics } from 'crm-shared/services/sharedGTMAnalytics';
```

2. **Add analytics to contact detail view:**
```typescript
// In your ContactDetail component
const [analytics, setAnalytics] = useState(null);

useEffect(() => {
  sharedGTMAnalytics.getContactAnalytics(contactId)
    .then(setAnalytics)
    .catch(console.error);
}, [contactId]);
```

3. **Or use the pre-built component:**
```typescript
// Add to your contact detail template
<ContactAnalyticsWidget contactId={contact.id} contactData={contact} />
```

### For Pipeline Monorepo:

1. **Import the service:**
```typescript
import { sharedGTMAnalytics } from 'crm-shared/services/sharedGTMAnalytics';
```

2. **Add analytics to deal detail view:**
```typescript
// In your DealDetail component
const [analytics, setAnalytics] = useState(null);

useEffect(() => {
  sharedGTMAnalytics.getDealAnalytics(dealId)
    .then(setAnalytics)
    .catch(console.error);
}, [dealId]);
```

3. **Or use the pre-built component:**
```typescript
// Add to your deal detail template
<DealAnalyticsWidget dealId={deal.id} dealData={deal} />
```

## Best Practices

1. **Lazy Loading**: Load analytics data only when needed to avoid performance issues
2. **Error Handling**: Always wrap API calls in try-catch blocks
3. **Caching**: Consider caching analytics data locally to reduce API calls
4. **Event Cleanup**: Unsubscribe from events when components unmount
5. **User Permissions**: Check user permissions before showing analytics features

## API Endpoints

The shared service communicates with these GTM API endpoints:

- `POST /.netlify/functions/gtm-prompt-library`
  - Actions: `dashboard`, `performance`, `revenue`, `create_ab_test`, `get_ab_tests`, `update_ab_test`, `track_response`

## Support

For integration issues or questions, refer to the main CRM application's GTM documentation or contact the development team.