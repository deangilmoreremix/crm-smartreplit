import { createClient } from '@supabase/supabase-js';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export default async function handler(req, res) {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200, CORS_HEADERS);
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.writeHead(405, CORS_HEADERS);
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  try {
    // Initialize Supabase
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate user
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.writeHead(401, CORS_HEADERS);
      res.end(JSON.stringify({ error: 'Missing or invalid authorization header' }));
      return;
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      res.writeHead(401, CORS_HEADERS);
      res.end(JSON.stringify({ error: 'Invalid authentication token' }));
      return;
    }

    // Parse request body
    const body = JSON.parse(req.body || '{}');
    const { action, ...params } = body;

    // Route to appropriate handler
    let result;
    switch (action) {
      case 'dashboard':
        result = await getAnalyticsDashboard(supabase, user);
        break;
      case 'performance':
        result = await getPromptPerformance(supabase, user, params.timeRange || '30d');
        break;
      case 'revenue':
        result = await getRevenueAnalysis(supabase, user, params.timeRange || '30d');
        break;
      case 'create_ab_test':
        result = await createABTest(supabase, user, params.testData);
        break;
      case 'get_ab_tests':
        result = await getABTests(supabase, user);
        break;
      case 'update_ab_test':
        result = await updateABTest(supabase, user, params.testId, params.updates);
        break;
      case 'track_response':
        result = await trackResponse(supabase, user, params.responseData);
        break;
      default:
        res.writeHead(400, CORS_HEADERS);
        res.end(JSON.stringify({ error: 'Invalid action' }));
        return;
    }

    res.writeHead(200, CORS_HEADERS);
    res.end(JSON.stringify(result));

  } catch (error) {
    console.error('GTM Prompt Library Error:', error);
    res.writeHead(500, CORS_HEADERS);
    res.end(JSON.stringify({
      error: 'Internal server error',
      message: error.message
    }));
  }
}

async function getAnalyticsDashboard(supabase, user) {
  // Query prompt_performance_metrics for usage stats
  const { data: performanceData, error: perfError } = await supabase
    .from('prompt_performance_metrics')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100);

  if (perfError) throw perfError;

  // Calculate overview metrics
  const totalPrompts = performanceData?.length || 0;
  const avgPerformance = performanceData && performanceData.length > 0 ?
    performanceData.reduce((sum, p) => sum + (p.performance_score || 0), 0) / totalPrompts : 0;

  // Query prompt_responses for quality metrics
  const { data: responses, error: respError } = await supabase
    .from('prompt_responses')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100);

  if (respError) throw respError;

  const totalResponses = responses?.length || 0;
  const avgQuality = responses && responses.length > 0 ?
    responses.reduce((sum, r) => sum + (r.quality_score || 0), 0) / totalResponses : 0;

  // Mock revenue data for now
  const revenueData = {
    totalRevenue: 0,
    attributedRevenue: 0,
    roi: 0
  };

  return {
    overview: {
      totalPrompts,
      totalResponses,
      avgPerformance: Math.round(avgPerformance * 100) / 100,
      avgQuality: Math.round(avgQuality * 100) / 100
    },
    performance: performanceData || [],
    revenue: revenueData
  };
}

async function getPromptPerformance(supabase, user, timeRange) {
  const days = timeRange === '7d' ? 7 : timeRange === '90d' ? 90 : 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data: metrics, error } = await supabase
    .from('prompt_performance_metrics')
    .select('*')
    .eq('user_id', user.id)
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Group by date and category
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
    timeRange,
    performanceByDate,
    performanceByCategory,
    totalMetrics: metrics?.length || 0
  };
}

async function getRevenueAnalysis(supabase, user, timeRange) {
  const days = timeRange === '7d' ? 7 : timeRange === '90d' ? 90 : 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Query prompt_responses with revenue attribution
  const { data: responses, error: respError } = await supabase
    .from('prompt_responses')
    .select('*')
    .eq('user_id', user.id)
    .gte('created_at', startDate.toISOString())
    .not('revenue_attributed', 'is', null);

  if (respError) throw respError;

  const totalRevenue = responses?.reduce((sum, r) => sum + (r.revenue_attributed || 0), 0) || 0;
  const totalResponses = responses?.length || 0;
  const avgRevenuePerResponse = totalResponses > 0 ? totalRevenue / totalResponses : 0;

  // Query prompt_generation_logs for costs (if table exists)
  let totalCost = 0;
  try {
    const { data: logs, error: logError } = await supabase
      .from('prompt_generation_logs')
      .select('cost')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString());

    if (!logError && logs) {
      totalCost = logs.reduce((sum, l) => sum + (l.cost || 0), 0);
    }
  } catch (e) {
    // Table might not exist, use 0 cost
    console.log('prompt_generation_logs table not available, using 0 cost');
  }

  const roi = totalCost > 0 ? (totalRevenue - totalCost) / totalCost : 0;

  return {
    timeRange,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
    roi: Math.round(roi * 100) / 100,
    avgRevenuePerResponse: Math.round(avgRevenuePerResponse * 100) / 100,
    responses: responses || []
  };
}

async function createABTest(supabase, user, testData) {
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

  return { test: data };
}

async function getABTests(supabase, user) {
  const { data: tests, error } = await supabase
    .from('prompt_ab_tests')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return { tests: tests || [] };
}

async function updateABTest(supabase, user, testId, updates) {
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

  return { test: data };
}

async function trackResponse(supabase, user, responseData) {
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

  return { response: data };
}