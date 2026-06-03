import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

interface RollupConfig {
  objectType: 'contact' | 'company' | 'deal';
  aggregationType: 'count' | 'sum' | 'average' | 'min' | 'max';
  sourceField: string;
  groupByField: string;
  filters?: Record<string, unknown>;
}

interface RollupRequest {
  config: RollupConfig;
  tenantId?: string;
}

function createResponse(data: unknown, statusCode = 200) {
  return new Response(JSON.stringify(data), {
    status: statusCode,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getUserFromToken(token: string) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) throw new Error('Invalid token');
  return user;
}

async function executeRollup(
  supabase: ReturnType<typeof createClient>,
  config: RollupConfig,
  userId: string
) {
  const { objectType, aggregationType, sourceField, groupByField, filters } = config;

  let query = supabase
    .from(`${objectType}s`)
    .select('*');

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
  }

  const { data, error } = await query;
  if (error) throw error;

  const groups: Record<string, number[]> = {};

  for (const record of data || []) {
    const groupKey = String(record[groupByField] || 'unknown');
    const value = parseFloat(String(record[sourceField] || 0));

    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(value);
  }

  const results = Object.entries(groups).map(([group, values]) => {
    let aggregatedValue: number;

    switch (aggregationType) {
      case 'count':
        aggregatedValue = values.length;
        break;
      case 'sum':
        aggregatedValue = values.reduce((a, b) => a + b, 0);
        break;
      case 'average':
        aggregatedValue = values.reduce((a, b) => a + b, 0) / values.length;
        break;
      case 'min':
        aggregatedValue = Math.min(...values);
        break;
      case 'max':
        aggregatedValue = Math.max(...values);
        break;
      default:
        aggregatedValue = values.length;
    }

    return {
      group: groupKey,
      value: aggregatedValue,
      count: values.length,
    };
  });

  return {
    objectType,
    aggregationType,
    groupByField,
    sourceField,
    totalGroups: results.length,
    results: results.sort((a, b) => b.value - a.value),
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method === 'GET') {
    const url = new URL(req.url);
    const configParam = url.searchParams.get('config');
    
    if (!configParam) {
      return createResponse({ error: 'Config parameter required for GET' }, 400);
    }

    try {
      const config = JSON.parse(decodeURIComponent(configParam)) as RollupConfig;
      
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return createResponse({ error: 'Unauthorized' }, 401);

      const result = await executeRollup(supabase, config, session.user.id);
      return createResponse(result);

    } catch (err) {
      return createResponse({ error: 'Invalid config' }, 400);
    }
  }

  if (req.method !== 'POST') {
    return createResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return createResponse({ error: 'Missing or invalid authorization header' }, 401);
    }
    const token = authHeader.replace('Bearer ', '');

    let body: RollupRequest;
    try {
      body = await req.json();
    } catch {
      return createResponse({ error: 'Invalid JSON in request body' }, 400);
    }

    if (!body.config) {
      return createResponse({ error: 'Config is required' }, 400);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const user = await getUserFromToken(token);
    
    const result = await executeRollup(supabase, body.config, user.id);
    
    return createResponse({
      success: true,
      ...result,
    });

  } catch (error) {
    console.error('Rollup engine error:', error);
    return createResponse({
      error: error instanceof Error ? error.message : 'Internal server error',
    }, 500);
  }
});