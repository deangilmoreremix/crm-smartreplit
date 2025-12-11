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
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  if (httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // GET /api/white-label/tenants - Get all tenants
    if (pathParts.length >= 2 && pathParts[0] === 'white-label' && pathParts[1] === 'tenants' && httpMethod === 'GET') {
      if (!supabase) {
        const tenants = [
          {
            id: 'tenant_1',
            name: 'Acme Corp',
            subdomain: 'acme',
            custom_domain: null,
            status: 'active',
            type: 'customer',
            plan: 'enterprise',
            contact_email: 'admin@acme.com',
            monthly_revenue: 299,
            user_count: 25,
            created_at: '2024-01-15T00:00:00Z',
            parent_partner_id: 'partner_1'
          }
        ];
        return { statusCode: 200, headers, body: JSON.stringify(tenants) };
      }

      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    }

    // PUT /api/white-label/tenants/:tenantId - Update tenant
    if (pathParts.length >= 3 && pathParts[0] === 'white-label' && pathParts[1] === 'tenants' && httpMethod === 'PUT') {
      const tenantId = pathParts[2];
      const updates = JSON.parse(body);

      if (!supabase) {
        const updatedTenant = {
          id: tenantId,
          ...updates,
          updated_at: new Date().toISOString()
        };
        return { statusCode: 200, headers, body: JSON.stringify(updatedTenant) };
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
    if (pathParts.length >= 3 && pathParts[0] === 'white-label' && pathParts[1] === 'tenants' && httpMethod === 'DELETE') {
      const tenantId = pathParts[2];

      if (!supabase) {
        return { statusCode: 200, headers, body: JSON.stringify({ message: 'Tenant deleted successfully', id: tenantId }) };
      }

      const { error } = await supabase
        .from('tenants')
        .delete()
        .eq('id', tenantId);

      if (error) throw error;
      return { statusCode: 200, headers, body: JSON.stringify({ message: 'Tenant deleted successfully', id: tenantId }) };
    }

    // GET /api/white-label/config/:tenantId - Get tenant config
    if (pathParts.length >= 3 && pathParts[0] === 'white-label' && pathParts[1] === 'config' && httpMethod === 'GET') {
      const tenantId = pathParts[2];

      if (!supabase) {
        const mockConfig = {
          id: 'config_1',
          tenant_id: tenantId,
          company_name: 'Demo Company',
          logo_url: null,
          primary_color: '#3B82F6',
          secondary_color: '#6366F1',
          hero_title: 'Welcome to Our Platform',
          hero_subtitle: 'Transform your business with our solutions',
          cta_buttons: [],
          redirect_mappings: {},
          show_pricing: true,
          show_testimonials: true,
          show_features: true,
          support_email: 'support@demo.com',
          support_phone: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        return { statusCode: 200, headers, body: JSON.stringify(mockConfig) };
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
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'White-label configuration not found' }) };
      }

      return { statusCode: 200, headers, body: JSON.stringify(data) };
    }

    // PUT /api/white-label/config/:tenantId - Update tenant config
    if (pathParts.length >= 3 && pathParts[0] === 'white-label' && pathParts[1] === 'config' && httpMethod === 'PUT') {
      const tenantId = pathParts[2];
      const updates = JSON.parse(body);

      if (!supabase) {
        const updatedConfig = {
          id: 'config_1',
          tenant_id: tenantId,
          ...updates,
          updated_at: new Date().toISOString()
        };
        return { statusCode: 200, headers, body: JSON.stringify(updatedConfig) };
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
            updated_at: new Date().toISOString()
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
      body: JSON.stringify({ error: 'White-label endpoint not found' })
    };

  } catch (error: any) {
    console.error('White-label function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error', message: error.message })
    };
  }
};