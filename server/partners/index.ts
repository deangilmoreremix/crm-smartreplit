import { createClient } from '@supabase/supabase-js';
import { storage } from '../storage.js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export const handler = async (event: any, context: any) => {
  const { httpMethod, path, queryStringParameters, body } = event;
  const pathParts = path.split('/').filter(Boolean);

  // CORS headers
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
    // Route handling based on path
    if (pathParts.length === 1 && pathParts[0] === 'partners') {
      // GET /api/partners - Get all partners
      if (httpMethod === 'GET') {
        const partners = await storage.getPartners();
        return { statusCode: 200, headers, body: JSON.stringify(partners) };
      }

      // POST /api/partners - Create partner
      if (httpMethod === 'POST') {
        const partnerData = JSON.parse(body);
        const partner = await storage.createPartner(partnerData);
        return { statusCode: 201, headers, body: JSON.stringify(partner) };
      }
    }

    if (pathParts.length === 2 && pathParts[0] === 'partners') {
      const partnerId = pathParts[1];

      // GET /api/partners/:id - Get partner by ID
      if (httpMethod === 'GET') {
        const partner = await storage.getPartner(partnerId);
        if (!partner) {
          return { statusCode: 404, headers, body: JSON.stringify({ error: 'Partner not found' }) };
        }
        return { statusCode: 200, headers, body: JSON.stringify(partner) };
      }

      // PUT /api/partners/:id - Update partner
      if (httpMethod === 'PUT') {
        const updates = JSON.parse(body);
        const partner = await storage.updatePartner(partnerId, updates);
        if (!partner) {
          return { statusCode: 404, headers, body: JSON.stringify({ error: 'Partner not found' }) };
        }
        return { statusCode: 200, headers, body: JSON.stringify(partner) };
      }
    }

    if (pathParts.length === 3 && pathParts[0] === 'partners' && pathParts[2] === 'stats') {
      const partnerId = pathParts[1];

      // GET /api/partners/:id/stats - Get partner stats
      if (httpMethod === 'GET') {
        const stats = await storage.getPartnerStats(partnerId);
        return { statusCode: 200, headers, body: JSON.stringify(stats) };
      }
    }

    if (pathParts.length === 3 && pathParts[0] === 'partners' && pathParts[2] === 'commissions') {
      const partnerId = pathParts[1];

      // GET /api/partners/:id/commissions - Get partner commissions
      if (httpMethod === 'GET') {
        const commissions = await storage.getPartnerCommissions(partnerId);
        return { statusCode: 200, headers, body: JSON.stringify(commissions) };
      }
    }

    // POST /api/partners/onboard - Partner onboarding
    if (pathParts.length === 2 && pathParts[0] === 'partners' && pathParts[1] === 'onboard' && httpMethod === 'POST') {
      const { brandingConfig, ...partnerData } = JSON.parse(body);

      const newPartner = await storage.createPartner({
        ...partnerData,
        brandingConfig,
        status: 'pending',
        tier: 'bronze',
        profileId: 'dev-user-12345'
      });

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          success: true,
          partner: newPartner,
          message: 'Partner application submitted successfully'
        })
      };
    }

    // POST /api/partners/:id/approve - Approve partner
    if (pathParts.length === 3 && pathParts[0] === 'partners' && pathParts[2] === 'approve' && httpMethod === 'POST') {
      const partnerId = pathParts[1];

      // Mock approval - in real implementation, update partner status
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          id: partnerId,
          status: 'active',
          approvedAt: new Date().toISOString()
        })
      };
    }

    // GET /api/partners/pending - Get pending partners
    if (pathParts.length === 2 && pathParts[0] === 'partners' && pathParts[1] === 'pending' && httpMethod === 'GET') {
      if (!supabase) {
        const pendingPartners = [
          {
            id: 'partner_1',
            name: 'TechCorp Solutions',
            contact_email: 'contact@techcorp.com',
            subdomain: 'techcorp',
            created_at: new Date().toISOString(),
            status: 'pending'
          }
        ];
        return { statusCode: 200, headers, body: JSON.stringify(pendingPartners) };
      }

      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    }

    // GET /api/partners/active - Get active partners
    if (pathParts.length === 2 && pathParts[0] === 'partners' && pathParts[1] === 'active' && httpMethod === 'GET') {
      if (!supabase) {
        const activePartners = [
          {
            id: 'partner_3',
            name: 'SalesForce Plus',
            contact_email: 'admin@salesforceplus.com',
            subdomain: 'salesforceplus',
            created_at: new Date(Date.now() - 604800000).toISOString(),
            status: 'active'
          }
        ];
        return { statusCode: 200, headers, body: JSON.stringify(activePartners) };
      }

      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    }

    // GET /api/partners/:partnerId/stats - Get partner stats with calculations
    if (pathParts.length === 3 && pathParts[0] === 'partners' && pathParts[2] === 'stats' && httpMethod === 'GET') {
      const partnerId = pathParts[1];

      if (!supabase) {
        const stats = {
          total_customers: 42,
          active_customers: 38,
          total_revenue: 14200,
          monthly_revenue: 14200,
          customer_growth_rate: 23
        };
        return { statusCode: 200, headers, body: JSON.stringify(stats) };
      }

      const { data: stats, error: statsError } = await supabase
        .from('partner_stats')
        .select('*')
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (statsError && statsError.code !== 'PGRST116') {
        throw statsError;
      }

      if (!stats) {
        const { data: customers, error: customersError } = await supabase
          .from('partner_customers')
          .select('monthly_revenue, status')
          .eq('partner_id', partnerId);

        if (customersError) throw customersError;

        const totalCustomers = customers?.length || 0;
        const activeCustomers = customers?.filter(c => c.status === 'active').length || 0;
        const totalRevenue = customers?.reduce((sum, c) => sum + (c.monthly_revenue || 0), 0) || 0;

        const calculatedStats = {
          total_customers: totalCustomers,
          active_customers: activeCustomers,
          total_revenue: totalRevenue,
          monthly_revenue: totalRevenue,
          customer_growth_rate: 0
        };

        return { statusCode: 200, headers, body: JSON.stringify(calculatedStats) };
      }

      return { statusCode: 200, headers, body: JSON.stringify(stats) };
    }

    // GET /api/partners/:partnerId/customers - Get partner customers
    if (pathParts.length === 3 && pathParts[0] === 'partners' && pathParts[2] === 'customers' && httpMethod === 'GET') {
      const partnerId = pathParts[1];

      if (!supabase) {
        const customers = [
          {
            id: '1',
            name: 'Acme Corp',
            subdomain: 'acme',
            status: 'active',
            plan: 'enterprise',
            monthly_revenue: 299,
            created_at: '2024-01-15T00:00:00Z',
            last_active: '2024-06-28T00:00:00Z'
          }
        ];
        return { statusCode: 200, headers, body: JSON.stringify(customers) };
      }

      const { data, error } = await supabase
        .from('partner_customers')
        .select('*')
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    }

    // POST /api/partners/:partnerId/customers - Create customer for partner
    if (pathParts.length === 3 && pathParts[0] === 'partners' && pathParts[2] === 'customers' && httpMethod === 'POST') {
      const partnerId = pathParts[1];
      const { companyName, contactEmail, plan } = JSON.parse(body);

      const newCustomer = {
        id: `customer_${Date.now()}`,
        name: companyName,
        subdomain: companyName.toLowerCase().replace(/\s+/g, ''),
        status: 'active',
        plan: plan || 'basic',
        monthly_revenue: plan === 'enterprise' ? 299 : plan === 'pro' ? 149 : 49,
        created_at: new Date().toISOString(),
        last_active: new Date().toISOString()
      };

      return { statusCode: 200, headers, body: JSON.stringify(newCustomer) };
    }

    // Not found
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Partner endpoint not found' })
    };

  } catch (error: any) {
    console.error('Partners function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error', message: error.message })
    };
  }
};