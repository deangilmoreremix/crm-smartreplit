import { createClient } from '@supabase/supabase-js';
import { storage } from '../storage.js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export const handler = async (event: any, context: any) => {
  const { httpMethod, path, body } = event;
  const pathParts = path.split('/').filter(Boolean);

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  if (httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // GET /api/white-label/tenants - Get all tenants
    if (
      pathParts.length >= 2 &&
      pathParts[0] === 'white-label' &&
      pathParts[1] === 'tenants' &&
      httpMethod === 'GET'
    ) {
      if (!supabase) {
        // No database configured: report it instead of returning made-up tenants/configs
        return { statusCode: 503, headers, body: JSON.stringify({ error: 'White-label storage is not configured (Supabase)' }) };
      }

      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    }

    // PUT /api/white-label/tenants/:tenantId - Update tenant
    if (
      pathParts.length >= 3 &&
      pathParts[0] === 'white-label' &&
      pathParts[1] === 'tenants' &&
      httpMethod === 'PUT'
    ) {
      const tenantId = pathParts[2];
      const updates = JSON.parse(body);

      if (!supabase) {
        // No database configured: report it instead of returning made-up tenants/configs
        return { statusCode: 503, headers, body: JSON.stringify({ error: 'White-label storage is not configured (Supabase)' }) };
      }

      const { data, error } = await supabase
        .from('tenants')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', tenantId)
        .select()
        .single();

      if (error) throw error;
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    }

    // DELETE /api/white-label/tenants/:tenantId - Delete tenant
    if (
      pathParts.length >= 3 &&
      pathParts[0] === 'white-label' &&
      pathParts[1] === 'tenants' &&
      httpMethod === 'DELETE'
    ) {
      const tenantId = pathParts[2];

      if (!supabase) {
        // No database configured: report it instead of returning made-up tenants/configs
        return { statusCode: 503, headers, body: JSON.stringify({ error: 'White-label storage is not configured (Supabase)' }) };
      }

      const { error } = await supabase.from('tenants').delete().eq('id', tenantId);

      if (error) throw error;
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'Tenant deleted successfully', id: tenantId }),
      };
    }

    // GET /api/white-label/config/:tenantId - Get tenant config
    if (
      pathParts.length >= 3 &&
      pathParts[0] === 'white-label' &&
      pathParts[1] === 'config' &&
      httpMethod === 'GET'
    ) {
      const tenantId = pathParts[2];

      if (!supabase) {
        // No database configured: report it instead of returning made-up tenants/configs
        return { statusCode: 503, headers, body: JSON.stringify({ error: 'White-label storage is not configured (Supabase)' }) };
      }

      const { data, error } = await supabase
        .from('white_label_configs')
        .select('*')
        .eq('tenant_id', tenantId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!data) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'White-label configuration not found' }),
        };
      }

      return { statusCode: 200, headers, body: JSON.stringify(data) };
    }

    // PUT /api/white-label/config/:tenantId - Update tenant config
    if (
      pathParts.length >= 3 &&
      pathParts[0] === 'white-label' &&
      pathParts[1] === 'config' &&
      httpMethod === 'PUT'
    ) {
      const tenantId = pathParts[2];
      const updates = JSON.parse(body);

      if (!supabase) {
        // No database configured: report it instead of returning made-up tenants/configs
        return { statusCode: 503, headers, body: JSON.stringify({ error: 'White-label storage is not configured (Supabase)' }) };
      }

      const { data: existingConfig } = await supabase
        .from('white_label_configs')
        .select('id')
        .eq('tenant_id', tenantId)
        .single();

      let result;
      if (existingConfig) {
        const { data, error } = await supabase
          .from('white_label_configs')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('tenant_id', tenantId)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase
          .from('white_label_configs')
          .insert({
            tenant_id: tenantId,
            ...updates,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;
        result = data;
      }

      return { statusCode: 200, headers, body: JSON.stringify(result) };
    }

    // Not found
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'White-label endpoint not found' }),
    };
  } catch (error: any) {
    console.error('White-label function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error', message: error.message }),
    };
  }
};
