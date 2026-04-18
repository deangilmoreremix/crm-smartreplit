# Implementation Plan: Automated Playwright Scripts for Demo Videos

## Project Structure
- Main app: `/workspaces/crm-smartreplit/apps/contacts/` (React/Vite)
- Client source: `/workspaces/crm-smartreplit/client/src/`
- Tests: `/workspaces/crm-smartreplit/client/src/__tests__/`, `/workspaces/crm-smartreplit/client/src/services/__tests__/`
- API routes: `/workspaces/crm-smartreplit/server/routes/`
- Supabase functions: `/workspaces/smartcrm/supabase/functions/`

## Key Components Identified

### 1. Contact Enrichment
- **Component**: `client/src/components/contacts/EnhancedContactCard.tsx`
- **Store**: `client/src/store/contactStore.ts` (includes `enrichContact` action)
- **API**: `client/src/hooks/useIntegration.ts` (enrichContact hook)
- **Integration Manager**: `client/src/services/integration-manager.service.ts`

### 2. Bulk Operations
- **Component**: `client/src/components/ai/SmartAIControls.tsx`
- **Store**: `client/src/store/aiIntegrationStore.ts` (includes `bulkEnrichContacts`)
- **Batch API**: `client/src/components/ui/BatchProcessingPanel.tsx`

### 3. Lead Scoring
- **Component**: `client/src/components/contacts/LeadScoringVisualization.tsx` (needs to be created)
- **Data**: `client/src/types/contact.ts` has `aiScore` field
- **Store**: `client/src/store/contactStore.ts` handles score updates

## Test Files to Create

### 1. Contact Enrichment Workflow Test
**Path**: `client/src/components/contacts/__tests__/EnhancedContactCard.test.tsx`
**Purpose**: Test the contact enrichment flow including:
- Enrich button click triggers API call
- Loading state display
- Data update in store
- Error handling
- Score visualization updates

### 2. Bulk Operations Demonstration Test
**Path**: `client/src/components/ai/__tests__/SmartAIControls.test.tsx`
**Purpose**: Test bulk operations including:
- Multi-contact selection
- Bulk enrichment trigger
- Batch analysis trigger
- Progress indicators
- Completion status

### 3. Lead Scoring Visualization Test
**Path**: `client/src/components/contacts/__tests__/LeadScoringVisualization.test.tsx`
**Purpose**: Test lead scoring features including:
- Score display
- Sorting by score
- AI rationale display
- Filtering by score range
- Score updates

## Implementation Details

### Test Data Fixtures
Based on existing codebase patterns, test fixtures should include:
```typescript
const mockContacts = {
  'contact-1': { id: 'contact-1', name: 'John Doe', email: 'john@example.com', aiScore: 92, status: 'prospect' },
  'contact-2': { id: 'contact-2', name: 'Jane Smith', email: 'jane@example.com', aiScore: 45, status: 'lead' },
  'contact-3': { id: 'contact-3', name: 'Bob Johnson', email: 'bob@example.com', aiScore: 67, status: 'customer' },
};
```

### Test Patterns to Follow
1. Use `vi.mock()` for store/method mocks
2. Use `render`, `screen`, `fireEvent`, `waitFor` from `@testing-library/react`
3. Use `userEvent` for realistic interactions
4. Include proper cleanup with `vi.clearAllMocks()` in `beforeEach`
5. Test both success and error cases

### Key Test Assertions
- API calls are made with correct parameters
- UI states update correctly (loading, success, error)
- Store actions are dispatched appropriately
- Visual feedback is provided to users
- Error messages are displayed when appropriate

## Next Steps
1. Create the three test files in their respective locations
2. Implement test data fixtures
3. Run tests to ensure they pass
4. Verify test coverage
5. Document any edge cases
