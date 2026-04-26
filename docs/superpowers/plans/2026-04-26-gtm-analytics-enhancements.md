# GTM Analytics Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance the GTM prompt library API with comprehensive analytics endpoints for dashboard, performance, revenue, A/B testing, and response tracking.

**Architecture:** Extend the existing Netlify function with new action handlers that query Supabase tables for analytics data. Maintain existing structure for CORS, auth, and error handling.

**Tech Stack:** JavaScript, Netlify Functions, Supabase

---

### Task 1: Add Dashboard Endpoint

**Files:**
- Modify: `apps/contacts/netlify/functions/gtm-prompt-library.js`

- [ ] **Step 1: Add 'dashboard' case to switch statement**

Add after existing cases:

```javascript
case 'dashboard':
  return await getAnalyticsDashboard({ user });
```

- [ ] **Step 2: Implement getAnalyticsDashboard function**

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

- [ ] **Step 3: Commit**

```bash
git add apps/contacts/netlify/functions/gtm-prompt-library.js
git commit -m "feat: add dashboard analytics endpoint"
```

### Task 2: Add Performance Endpoint

**Files:**
- Modify: `apps/contacts/netlify/functions/gtm-prompt-library.js`

- [ ] **Step 1: Add 'performance' case to switch statement**

Add after dashboard case:

```javascript
case 'performance':
  return await getPromptPerformance({ user, timeRange: body.timeRange || '30d' });
```

- [ ] **Step 2: Implement getPromptPerformance function**

Add after getAnalyticsDashboard:

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

- [ ] **Step 3: Commit**

```bash
git add apps/contacts/netlify/functions/gtm-prompt-library.js
git commit -m "feat: add performance analytics endpoint"
```

### Task 3: Add Revenue Endpoint

**Files:**
- Modify: `apps/contacts/netlify/functions/gtm-prompt-library.js`

- [ ] **Step 1: Add 'revenue' case to switch statement**

Add after performance case:

```javascript
case 'revenue':
  return await getRevenueAnalysis({ user, timeRange: body.timeRange || '30d' });
```

- [ ] **Step 2: Implement getRevenueAnalysis function**

Add after getPromptPerformance:

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

- [ ] **Step 3: Commit**

```bash
git add apps/contacts/netlify/functions/gtm-prompt-library.js
git commit -m "feat: add revenue analytics endpoint"
```

### Task 4: Add A/B Testing Endpoints

**Files:**
- Modify: `apps/contacts/netlify/functions/gtm-prompt-library.js`

- [ ] **Step 1: Add A/B test cases to switch statement**

Add after revenue case:

```javascript
case 'create_ab_test':
  return await createABTest({ user, testData: body.testData });
case 'get_ab_tests':
  return await getABTests({ user });
case 'update_ab_test':
  return await updateABTest({ user, testId: body.testId, updates: body.updates });
```

- [ ] **Step 2: Implement createABTest function**

Add after getRevenueAnalysis:

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
```

- [ ] **Step 3: Implement getABTests function**

Add after createABTest:

```javascript
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
```

- [ ] **Step 4: Implement updateABTest function**

Add after getABTests:

```javascript
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

- [ ] **Step 5: Commit**

```bash
git add apps/contacts/netlify/functions/gtm-prompt-library.js
git commit -m "feat: add A/B testing endpoints"
```

### Task 5: Add Response Tracking Endpoint

**Files:**
- Modify: `apps/contacts/netlify/functions/gtm-prompt-library.js`

- [ ] **Step 1: Add 'track_response' case to switch statement**

Add after update_ab_test case:

```javascript
case 'track_response':
  return await trackResponse({ user, responseData: body.responseData });
```

- [ ] **Step 2: Implement trackResponse function**

Add after updateABTest:

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

- [ ] **Step 3: Commit**

```bash
git add apps/contacts/netlify/functions/gtm-prompt-library.js
git commit -m "feat: add response tracking endpoint"
```