# GTM Prompt Library Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Netlify function providing analytics endpoints for GTM prompt library dashboard, performance tracking, revenue analysis, A/B testing, and response tracking.

**Architecture:** Single Netlify function with action-based routing, Supabase integration for data queries, user authentication via JWT tokens, CORS handling, and comprehensive error management.

**Tech Stack:** JavaScript (ESM), Netlify Functions, Supabase client, existing analytics tables (prompt_performance_metrics, prompt_responses, prompt_ab_tests, prompt_generation_logs)

---

### Task 1: Create Function Structure and Authentication

**Files:**
- Create: `netlify/functions/gtm-prompt-library/index.mjs`
- Test: `netlify/functions/gtm-prompt-library/index.test.mjs`

- [ ] **Step 1: Create test file with basic structure**

```javascript
import { describe, it, expect, beforeEach } from '@jest/globals';
import { handler } from './index.mjs';

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn()
    }
  }))
}));

describe('GTM Prompt Library Function', () => {
  let mockSupabase;

  beforeEach(() => {
    mockSupabase = require('@supabase/supabase-js').createClient();
  });

  it('should handle OPTIONS request for CORS', async () => {
    const event = { httpMethod: 'OPTIONS' };
    const result = await handler(event, {});
    
    expect(result.statusCode).toBe(200);
    expect(result.headers['Access-Control-Allow-Origin']).toBe('*');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd netlify/functions/gtm-prompt-library && npm test`
Expected: FAIL with "handler is not defined"

- [ ] **Step 3: Create basic function structure**

```javascript
// netlify/functions/gtm-prompt-library/index.mjs
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseServiceKey ? 
  createClient(supabaseUrl, supabaseServiceKey) : null;

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

const handler = async (event, context) => {
  const { httpMethod, body } = event;

  if (httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  }

  try {
    // Parse request body
    let requestBody;
    try {
      requestBody = body ? JSON.parse(body) : {};
    } catch (error) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Invalid JSON body' })
      };
    }

    // Authenticate user
    const authHeader = event.headers?.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Missing authorization header' })
      };
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: authError } = await supabase.auth.getUser(token);

    if (authError || !userData.user) {
      return {
        statusCode: 401,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Invalid token' })
      };
    }

    const user = { id: userData.user.id, email: userData.user.email };

    // Route based on action
    const { action } = requestBody;

    if (!action) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Missing action parameter' })
      };
    }

    // Action routing will be added in subsequent tasks
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Action not implemented yet' })
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

export { handler };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd netlify/functions/gtm-prompt-library && npm test`
Expected: PASS

- [ ] **Step 5: Add Jest configuration**

Create: `netlify/functions/gtm-prompt-library/package.json`

```json
{
  "name": "gtm-prompt-library-tests",
  "version": "1.0.0",
  "scripts": {
    "test": "jest"
  },
  "devDependencies": {
    "@jest/globals": "^29.0.0",
    "jest": "^29.0.0"
  },
  "jest": {
    "testEnvironment": "node",
    "extensionsToTreatAsEsm": [".mjs"],
    "globals": {
      "ts-jest": {
        "useESM": true
      }
    }
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add netlify/functions/gtm-prompt-library/
git commit -m "feat: create GTM prompt library function structure with authentication"
```

### Task 2: Implement Dashboard Endpoint

**Files:**
- Modify: `netlify/functions/gtm-prompt-library/index.mjs`
- Test: `netlify/functions/gtm-prompt-library/index.test.mjs`

- [ ] **Step 1: Add dashboard test**

```javascript
describe('Dashboard Endpoint', () => {
  beforeEach(() => {
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: [
                { performance_score: 0.8, created_at: '2024-01-01' },
                { performance_score: 0.9, created_at: '2024-01-02' }
              ]
            })
          })
        })
      })
    });
  });

  it('should return dashboard analytics', async () => {
    const event = {
      httpMethod: 'POST',
      headers: { authorization: 'Bearer valid-token' },
      body: JSON.stringify({ action: 'dashboard' })
    };

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@example.com' } }
    });

    const result = await handler(event, {});
    
    expect(result.statusCode).toBe(200);
    const response = JSON.parse(result.body);
    expect(response.overview).toBeDefined();
    expect(response.performance).toBeDefined();
    expect(response.revenue).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd netlify/functions/gtm-prompt-library && npm test -- --testNamePattern="should return dashboard analytics"`
Expected: FAIL with "Action not implemented yet"

- [ ] **Step 3: Add dashboard case and function**

Add to index.mjs after the action check:

```javascript
switch (action) {
  case 'dashboard':
    return await getAnalyticsDashboard({ user });
  // Other cases will be added in subsequent tasks
  default:
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Unknown action' })
    };
}
```

Add at the end of the file:

```javascript
async function getAnalyticsDashboard({ user }) {
  // Query prompt_performance_metrics for usage stats
  const { data: performanceData } = await supabase
    .from('prompt_performance_metrics')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100);

  // Calculate overview metrics
  const totalPrompts = performanceData?.length || 0;
  const avgPerformance = performanceData ? 
    performanceData.reduce((sum, p) => sum + (p.performance_score || 0), 0) / totalPrompts : 0;

  // Query prompt_responses for conversions
  const { data: responses } = await supabase
    .from('prompt_responses')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100);

  const totalResponses = responses?.length || 0;
  const avgQuality = responses ? 
    responses.reduce((sum, r) => sum + (r.quality_score || 0), 0) / totalResponses : 0;

  // Mock revenue data for now
  const revenueData = {
    totalRevenue: 0,
    attributedRevenue: 0,
    roi: 0
  };

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify({
      overview: {
        totalPrompts,
        totalResponses,
        avgPerformance: Math.round(avgPerformance * 100) / 100,
        avgQuality: Math.round(avgQuality * 100) / 100
      },
      performance: performanceData || [],
      revenue: revenueData
    })
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd netlify/functions/gtm-prompt-library && npm test -- --testNamePattern="should return dashboard analytics"`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add netlify/functions/gtm-prompt-library/index.mjs
git commit -m "feat: add dashboard analytics endpoint"
```

### Task 3: Implement Performance Endpoint

**Files:**
- Modify: `netlify/functions/gtm-prompt-library/index.mjs`
- Test: `netlify/functions/gtm-prompt-library/index.test.mjs`

- [ ] **Step 1: Add performance test**

```javascript
describe('Performance Endpoint', () => {
  it('should return performance analytics for 30d range', async () => {
    const event = {
      httpMethod: 'POST',
      headers: { authorization: 'Bearer valid-token' },
      body: JSON.stringify({ action: 'performance', timeRange: '30d' })
    };

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@example.com' } }
    });

    const result = await handler(event, {});
    
    expect(result.statusCode).toBe(200);
    const response = JSON.parse(result.body);
    expect(response.timeRange).toBe('30d');
    expect(response.performanceByDate).toBeDefined();
    expect(response.performanceByCategory).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd netlify/functions/gtm-prompt-library && npm test -- --testNamePattern="should return performance analytics"`
Expected: FAIL

- [ ] **Step 3: Add performance case and function**

Add to switch statement:

```javascript
case 'performance':
  return await getPromptPerformance({ user, timeRange: requestBody.timeRange || '30d' });
```

Add function:

```javascript
async function getPromptPerformance({ user, timeRange }) {
  const days = timeRange === '7d' ? 7 : timeRange === '90d' ? 90 : 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data: metrics } = await supabase
    .from('prompt_performance_metrics')
    .select('*')
    .eq('user_id', user.id)
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: false });

  // Group by date and prompt type
  const performanceByDate = {};
  const performanceByCategory = {};

  metrics?.forEach(m => {
    const date = m.created_at.split('T')[0];
    if (!performanceByDate[date]) performanceByDate[date] = [];
    performanceByDate[date].push(m);

    const category = m.category || 'unknown';
    if (!performanceByCategory[category]) performanceByCategory[category] = [];
    performanceByCategory[category].push(m);
  });

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify({
      timeRange,
      performanceByDate,
      performanceByCategory,
      totalMetrics: metrics?.length || 0
    })
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd netlify/functions/gtm-prompt-library && npm test -- --testNamePattern="should return performance analytics"`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add netlify/functions/gtm-prompt-library/index.mjs
git commit -m "feat: add performance analytics endpoint"
```

### Task 4: Implement Revenue Endpoint

**Files:**
- Modify: `netlify/functions/gtm-prompt-library/index.mjs`
- Test: `netlify/functions/gtm-prompt-library/index.test.mjs`

- [ ] **Step 1: Add revenue test**

```javascript
describe('Revenue Endpoint', () => {
  it('should return revenue analytics', async () => {
    const event = {
      httpMethod: 'POST',
      headers: { authorization: 'Bearer valid-token' },
      body: JSON.stringify({ action: 'revenue', timeRange: '30d' })
    };

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@example.com' } }
    });

    const result = await handler(event, {});
    
    expect(result.statusCode).toBe(200);
    const response = JSON.parse(result.body);
    expect(response.timeRange).toBe('30d');
    expect(response).toHaveProperty('totalRevenue');
    expect(response).toHaveProperty('roi');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd netlify/functions/gtm-prompt-library && npm test -- --testNamePattern="should return revenue analytics"`
Expected: FAIL

- [ ] **Step 3: Add revenue case and function**

Add to switch statement:

```javascript
case 'revenue':
  return await getRevenueAnalysis({ user, timeRange: requestBody.timeRange || '30d' });
```

Add function:

```javascript
async function getRevenueAnalysis({ user, timeRange }) {
  const days = timeRange === '7d' ? 7 : timeRange === '90d' ? 90 : 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Query prompt_responses with revenue attribution
  const { data: responses } = await supabase
    .from('prompt_responses')
    .select('*')
    .eq('user_id', user.id)
    .gte('created_at', startDate.toISOString())
    .not('revenue_attributed', 'is', null);

  const totalRevenue = responses?.reduce((sum, r) => sum + (r.revenue_attributed || 0), 0) || 0;
  const totalResponses = responses?.length || 0;
  const avgRevenuePerResponse = totalResponses > 0 ? totalRevenue / totalResponses : 0;

  // Query prompt_generation_logs for costs
  const { data: logs } = await supabase
    .from('prompt_generation_logs')
    .select('*')
    .eq('user_id', user.id)
    .gte('created_at', startDate.toISOString());

  const totalCost = logs?.reduce((sum, l) => sum + (l.cost || 0), 0) || 0;
  const roi = totalCost > 0 ? (totalRevenue - totalCost) / totalCost : 0;

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify({
      timeRange,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      roi: Math.round(roi * 100) / 100,
      avgRevenuePerResponse: Math.round(avgRevenuePerResponse * 100) / 100,
      responses: responses || []
    })
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd netlify/functions/gtm-prompt-library && npm test -- --testNamePattern="should return revenue analytics"`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add netlify/functions/gtm-prompt-library/index.mjs
git commit -m "feat: add revenue analytics endpoint"
```

### Task 5: Implement A/B Testing Endpoints

**Files:**
- Modify: `netlify/functions/gtm-prompt-library/index.mjs`
- Test: `netlify/functions/gtm-prompt-library/index.test.mjs`

- [ ] **Step 1: Add A/B testing tests**

```javascript
describe('A/B Testing Endpoints', () => {
  it('should create A/B test', async () => {
    const testData = {
      name: 'Test Prompt A/B',
      description: 'Testing two prompt variations',
      promptA: 'Version A',
      promptB: 'Version B',
      category: 'sales'
    };

    const event = {
      httpMethod: 'POST',
      headers: { authorization: 'Bearer valid-token' },
      body: JSON.stringify({ action: 'create_ab_test', testData })
    };

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@example.com' } }
    });

    mockSupabase.from.mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: 'test-123', ...testData },
            error: null
          })
        })
      })
    });

    const result = await handler(event, {});
    
    expect(result.statusCode).toBe(201);
    const response = JSON.parse(result.body);
    expect(response.test).toBeDefined();
  });

  it('should get A/B tests', async () => {
    const event = {
      httpMethod: 'POST',
      headers: { authorization: 'Bearer valid-token' },
      body: JSON.stringify({ action: 'get_ab_tests' })
    };

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@example.com' } }
    });

    const result = await handler(event, {});
    
    expect(result.statusCode).toBe(200);
    const response = JSON.parse(result.body);
    expect(response.tests).toBeDefined();
  });

  it('should update A/B test', async () => {
    const event = {
      httpMethod: 'POST',
      headers: { authorization: 'Bearer valid-token' },
      body: JSON.stringify({ 
        action: 'update_ab_test', 
        testId: 'test-123',
        updates: { status: 'completed' }
      })
    };

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@example.com' } }
    });

    const result = await handler(event, {});
    
    expect(result.statusCode).toBe(200);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd netlify/functions/gtm-prompt-library && npm test -- --testNamePattern="A/B Testing Endpoints"`
Expected: FAIL

- [ ] **Step 3: Add A/B testing cases and functions**

Add to switch statement:

```javascript
case 'create_ab_test':
  return await createABTest({ user, testData: requestBody.testData });
case 'get_ab_tests':
  return await getABTests({ user });
case 'update_ab_test':
  return await updateABTest({ user, testId: requestBody.testId, updates: requestBody.updates });
```

Add functions:

```javascript
async function createABTest({ user, testData }) {
  const { data, error } = await supabase
    .from('prompt_ab_tests')
    .insert({
      user_id: user.id,
      name: testData.name,
      description: testData.description,
      prompt_a: testData.promptA,
      prompt_b: testData.promptB,
      category: testData.category,
      status: 'active',
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;

  return {
    statusCode: 201,
    headers: CORS_HEADERS,
    body: JSON.stringify({ test: data })
  };
}

async function getABTests({ user }) {
  const { data: tests } = await supabase
    .from('prompt_ab_tests')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify({ tests: tests || [] })
  };
}

async function updateABTest({ user, testId, updates }) {
  const { data, error } = await supabase
    .from('prompt_ab_tests')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', user.id)
    .eq('id', testId)
    .select()
    .single();

  if (error) throw error;

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify({ test: data })
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd netlify/functions/gtm-prompt-library && npm test -- --testNamePattern="A/B Testing Endpoints"`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add netlify/functions/gtm-prompt-library/index.mjs
git commit -m "feat: add A/B testing endpoints"
```

### Task 6: Implement Response Tracking Endpoint

**Files:**
- Modify: `netlify/functions/gtm-prompt-library/index.mjs`
- Test: `netlify/functions/gtm-prompt-library/index.test.mjs`

- [ ] **Step 1: Add response tracking test**

```javascript
describe('Response Tracking Endpoint', () => {
  it('should track prompt response', async () => {
    const responseData = {
      promptId: 'prompt-123',
      responseText: 'Generated response',
      qualityScore: 0.85,
      revenueAttributed: 50.00,
      category: 'sales'
    };

    const event = {
      httpMethod: 'POST',
      headers: { authorization: 'Bearer valid-token' },
      body: JSON.stringify({ action: 'track_response', responseData })
    };

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@example.com' } }
    });

    mockSupabase.from.mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: 'response-123', ...responseData },
            error: null
          })
        })
      })
    });

    const result = await handler(event, {});
    
    expect(result.statusCode).toBe(201);
    const response = JSON.parse(result.body);
    expect(response.response).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd netlify/functions/gtm-prompt-library && npm test -- --testNamePattern="should track prompt response"`
Expected: FAIL

- [ ] **Step 3: Add response tracking case and function**

Add to switch statement:

```javascript
case 'track_response':
  return await trackResponse({ user, responseData: requestBody.responseData });
```

Add function:

```javascript
async function trackResponse({ user, responseData }) {
  const { data, error } = await supabase
    .from('prompt_responses')
    .insert({
      user_id: user.id,
      prompt_id: responseData.promptId,
      response_text: responseData.responseText,
      quality_score: responseData.qualityScore,
      revenue_attributed: responseData.revenueAttributed || 0,
      category: responseData.category,
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;

  return {
    statusCode: 201,
    headers: CORS_HEADERS,
    body: JSON.stringify({ response: data })
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd netlify/functions/gtm-prompt-library && npm test -- --testNamePattern="should track prompt response"`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add netlify/functions/gtm-prompt-library/index.mjs
git commit -m "feat: add response tracking endpoint"
```

### Task 7: Final Integration and Testing

**Files:**
- Test: `netlify/functions/gtm-prompt-library/index.test.mjs`

- [ ] **Step 1: Add integration test**

```javascript
describe('Integration Tests', () => {
  it('should handle unknown action', async () => {
    const event = {
      httpMethod: 'POST',
      headers: { authorization: 'Bearer valid-token' },
      body: JSON.stringify({ action: 'unknown_action' })
    };

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@example.com' } }
    });

    const result = await handler(event, {});
    
    expect(result.statusCode).toBe(400);
    const response = JSON.parse(result.body);
    expect(response.error).toBe('Unknown action');
  });

  it('should handle invalid JSON', async () => {
    const event = {
      httpMethod: 'POST',
      headers: { authorization: 'Bearer valid-token' },
      body: 'invalid json'
    };

    const result = await handler(event, {});
    
    expect(result.statusCode).toBe(400);
    const response = JSON.parse(result.body);
    expect(response.error).toBe('Invalid JSON body');
  });

  it('should handle missing authorization', async () => {
    const event = {
      httpMethod: 'POST',
      body: JSON.stringify({ action: 'dashboard' })
    };

    const result = await handler(event, {});
    
    expect(result.statusCode).toBe(401);
    const response = JSON.parse(result.body);
    expect(response.error).toBe('Missing authorization header');
  });
});
```

- [ ] **Step 2: Run all tests**

Run: `cd netlify/functions/gtm-prompt-library && npm test`
Expected: All tests PASS

- [ ] **Step 3: Add README**

Create: `netlify/functions/gtm-prompt-library/README.md`

```markdown
# GTM Prompt Library Analytics Function

Netlify function providing analytics endpoints for GTM prompt library.

## Endpoints

All requests are POST to the function URL with an `action` field in the request body.

### Dashboard
```json
{
  "action": "dashboard"
}
```

Returns overview metrics, recent performance data, and revenue summary.

### Performance
```json
{
  "action": "performance",
  "timeRange": "30d"
}
```

Returns performance metrics grouped by date and category. timeRange: "7d", "30d", "90d"

### Revenue
```json
{
  "action": "revenue",
  "timeRange": "30d"
}
```

Returns revenue analysis with ROI calculations and attribution data.

### A/B Testing
```json
{
  "action": "create_ab_test",
  "testData": {
    "name": "Test Name",
    "description": "Test Description",
    "promptA": "Version A",
    "promptB": "Version B",
    "category": "sales"
  }
}
```

```json
{
  "action": "get_ab_tests"
}
```

```json
{
  "action": "update_ab_test",
  "testId": "test-id",
  "updates": { "status": "completed" }
}
```

### Response Tracking
```json
{
  "action": "track_response",
  "responseData": {
    "promptId": "prompt-id",
    "responseText": "Generated text",
    "qualityScore": 0.85,
    "revenueAttributed": 50.00,
    "category": "sales"
  }
}
```

## Authentication

All requests require a Bearer token in the Authorization header.

## Testing

```bash
npm install
npm test
```
```

- [ ] **Step 4: Commit**

```bash
git add netlify/functions/gtm-prompt-library/
git commit -m "feat: complete GTM prompt library analytics function with all endpoints"
```</content>
<parameter name="filePath">docs/superpowers/plans/2026-04-26-gtm-prompt-library-analytics-implementation.md