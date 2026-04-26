# GTM Prompt Library Analytics API Design

## Overview
Create a Netlify function providing comprehensive analytics endpoints for the GTM prompt library, enabling dashboard visualization, performance tracking, revenue analysis, A/B testing management, and response tracking.

## Requirements
- **Authentication:** Bearer token validation via Supabase auth
- **Authorization:** User-scoped data access with RLS policies
- **Endpoints:** 5 action-based endpoints (dashboard, performance, revenue, A/B testing, response tracking)
- **Data Sources:** Existing Supabase tables (prompt_performance_metrics, prompt_responses, prompt_ab_tests, prompt_generation_logs)
- **Response Format:** Consistent JSON structure with error handling

## Architecture

### File Structure
```
netlify/functions/gtm-prompt-library/
└── index.mjs                 # Main function handler
```

### Request/Response Flow
1. Client sends POST request with `action` field and data
2. Function validates Authorization header token
3. Extracts authenticated user ID from verified token
4. Routes to appropriate handler based on action
5. Handler queries Supabase with user-scoped filters
6. Returns JSON response with analytics data

### Action-Based Routing
- `dashboard`: Overview metrics and recent data
- `performance`: Time-range filtered performance analysis
- `revenue`: Revenue attribution and ROI calculations
- `create_ab_test`: Create new A/B test
- `get_ab_tests`: List user's A/B tests
- `update_ab_test`: Modify existing A/B test
- `track_response`: Record prompt response with metrics

## Components

### Main Handler
- CORS preflight handling
- Token authentication
- Request body parsing
- Action routing with switch statement
- Error handling and response formatting

### Dashboard Handler
- Queries prompt_performance_metrics for usage stats
- Queries prompt_responses for quality metrics
- Calculates totals, averages, and trends
- Returns overview dashboard data

### Performance Handler
- Accepts timeRange parameter (7d, 30d, 90d)
- Filters metrics by date range
- Groups data by date and category
- Returns performance trends and breakdowns

### Revenue Handler
- Queries responses with revenue attribution
- Queries generation logs for cost data
- Calculates ROI and attribution metrics
- Returns revenue analysis

### A/B Testing Handlers
- Create: Validates and inserts new test
- List: Returns user's tests ordered by creation
- Update: Modifies existing test with validation

### Response Tracking Handler
- Validates response data
- Inserts with user context and attribution
- Links to prompt and category

## Security Considerations
- User ID extracted from verified JWT only (never from request body)
- All queries filtered by authenticated user_id
- Input validation on all parameters
- Safe error responses (no internal details exposed)
- CORS restricted to allowed origins

## Data Models

### Request Body Schema
```javascript
{
  action: string, // Required: action type
  timeRange?: string, // Optional: '7d' | '30d' | '90d'
  testData?: object, // For create_ab_test
  testId?: string, // For update_ab_test
  updates?: object, // For update_ab_test
  responseData?: object // For track_response
}
```

### Response Schema
```javascript
{
  statusCode: number,
  headers: { /* CORS headers */ },
  body: string // JSON string
}
```

## Error Handling
- 400: Invalid request body or parameters
- 401: Missing/invalid authentication
- 403: Forbidden (ownership check failed)
- 404: Resource not found
- 500: Internal server error

## Dependencies
- @supabase/supabase-js: Database client
- Node.js runtime (Netlify Functions)

## Testing Strategy
- Unit tests for each handler function
- Integration tests with Supabase
- Authentication validation tests
- Error handling edge cases

## Success Criteria
- All 5 endpoints implemented and functional
- Proper authentication and authorization
- Consistent response format
- Error handling for edge cases
- Integration with existing frontend dashboard</content>
<parameter name="filePath">docs/superpowers/specs/2026-04-26-gtm-prompt-library-analytics-design.md