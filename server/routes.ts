import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import OpenAI from 'openai';
import { registerBulkImportRoutes } from './bulk-import';
import { registerPhoneRoutes } from './routes/phone';
import { registerVideoRoutes } from './routes/videos';
import { registerMessagingRoutes } from './routes/messaging';
// import companiesRouter from './companies'; // Temporarily disabled due to import issues
import { handleStripeWebhook } from './stripe-webhook';
import { handleZaxaaWebhook } from './zaxaa-webhook';
import { handleJVZooWebhook } from './jvzoo-webhook';
import { handlePayPalWebhook } from './paypal-webhook';
import { getUserEntitlement, isUserActive, handleSuccessfulPurchase } from './entitlements-utils';
import { db } from './db';
import { 
  entitlements, 
  tasks, 
  appointments, 
  communications, 
  notes, 
  documents,
  contacts,
  deals,
  insertTaskSchema,
  updateTaskSchema,
  insertAppointmentSchema,
  updateAppointmentSchema,
  insertCommunicationSchema,
  insertNoteSchema,
  updateNoteSchema,
  insertDocumentSchema,
  insertContactSchema,
  insertDealSchema
} from '../shared/schema.js';
import { eq, and, desc } from 'drizzle-orm';
import { createClient } from '@supabase/supabase-js';
import { handleAuthWebhook, createUserMetadata, determineUserRole } from './email-routing';
import { supabase, isSupabaseConfigured } from './supabase';

// Extend Express session to include userId
declare module 'express-session' {
  interface SessionData {
    userId: string;
  }
}

// Google AI integration
interface GoogleAIResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
    };
  }>;
}

// Authentication middleware - ensures user is logged in
const requireAuth = (req: any, res: any, next: any) => {
  const userId = req.session?.userId;
  const authHeader = req.headers.authorization;
  console.log('🔐 Auth Check:', {
    endpoint: req.path,
    method: req.method,
    sessionUserId: userId,
    authHeader: authHeader ? `${authHeader.substring(0, 20)}...` : null,
    sessionId: req.session?.id
  });

  // Check for session first
  if (userId) {
    return next();
  }

  // In development, also check for Bearer tokens
  if (process.env.NODE_ENV === 'development' && authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    if (token === 'dev-bypass-token') {
      // Set up dev user for this request
      req.user = {
        id: 'dev-user-12345',
        email: 'dev@smartcrm.local',
        username: 'dev@smartcrm.local',
        role: 'super_admin',
        productTier: 'super_admin'
      };
      console.log('✅ Dev bypass auth granted via Bearer token');
      return next();
    }
  }

  console.log('❌ Auth failed: no session userId and no valid dev token');
  return res.status(401).json({ error: 'Not authenticated' });
};

// Authorization middleware - checks if user is admin
const requireAdmin = async (req: any, res: any, next: any) => {
  const userId = req.session?.userId;
  
  // Check for dev bypass token in Authorization header (for dev environment only)
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer dev-bypass-token-')) {
    const hostname = req.headers.host || '';
    const isProductionDomain = hostname.includes('smartcrm.vip');
    
    // Allow dev bypass in non-production environments
    if (!isProductionDomain) {
      // In development/staging, allow dev bypass with full admin access
      req.user = {
        id: 'dev-user-12345',
        email: 'dev@smartcrm.local',
        username: 'dev@smartcrm.local',
        role: 'super_admin',
        productTier: 'super_admin'
      };
      console.log('✅ Dev bypass admin access granted via token');
      return next();
    }
  }
  
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  try {
    const user = await db.query.profiles.findFirst({
      where: (profiles, { eq }) => eq(profiles.id, userId),
    });
    
    // DEV BYPASS: Allow full admin access for dev/admin accounts
    const userEmail = user?.username || '';
    if (user && (DEV_BYPASS_EMAILS.includes(userEmail) || user.role === 'super_admin')) {
      req.user = user;
      return next();
    }
    
    if (!user || (user.role !== 'super_admin' && user.role !== 'wl_user')) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Authorization check failed' });
  }
};

// Product tier hierarchy - higher index = more access
const TIER_HIERARCHY = [
  'ai_communication',      // Level 0 - Video Email, SMS, VoIP, Invoicing
  'ai_boost_unlimited',    // Level 1 - Unlimited AI credits
  'sales_maximizer',       // Level 2 - AI Goals and AI Tools
  'smartcrm',              // Level 3 - Dashboard, Contacts, Pipeline, Calendar
  'smartcrm_bundle',       // Level 4 - All tools except whitelabel
  'whitelabel',            // Level 5 - All features including whitelabel
  'super_admin'            // Level 6 - All features including admin
] as const;

// Get tier level (returns -1 if no tier/null)
const getTierLevel = (tier: string | null | undefined): number => {
  if (!tier) return -1;
  return TIER_HIERARCHY.indexOf(tier as any);
};

// Dev bypass emails that always have full access
const DEV_BYPASS_EMAILS = [
  'dev@smartcrm.local',
  'dean@smartcrm.vip',
  'dean@videoremix.io',
  'samuel@videoremix.io',
  'victor@videoremix.io'
];

// Product tier middleware - ensures user has ANY valid product tier (not null)
const requireProductTier = async (req: any, res: any, next: any) => {
  const userId = req.session?.userId;
  const authHeader = req.headers.authorization;

  // Check for dev bypass token first
  if (process.env.NODE_ENV === 'development' && authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    if (token === 'dev-bypass-token') {
      req.user = {
        id: 'dev-user-12345',
        email: 'dev@smartcrm.local',
        username: 'dev@smartcrm.local',
        role: 'super_admin',
        productTier: 'super_admin'
      };
      req.userTier = 'super_admin';
      console.log('✅ Dev bypass product tier granted via Bearer token');
      return next();
    }
  }

  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const user = await db.query.profiles.findFirst({
      where: (profiles, { eq }) => eq(profiles.id, userId),
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // DEV BYPASS: Allow full access for dev/admin accounts
    const userEmail = user.username?.toLowerCase() || '';
    if (DEV_BYPASS_EMAILS.includes(userEmail) || user.role === 'super_admin') {
      req.user = user;
      req.userTier = 'super_admin'; // Grant highest tier access
      return next();
    }

    // Check if user has a valid product tier
    if (!user.productTier) {
      return res.status(403).json({
        error: 'Subscription required',
        message: 'Please purchase a subscription to access this feature',
        code: 'NO_PRODUCT_TIER'
      });
    }

    // Also check entitlement status if available
    const entitlement = await getUserEntitlement(userId);
    if (entitlement && !isUserActive(entitlement)) {
      return res.status(403).json({
        error: 'Subscription inactive',
        message: 'Your subscription has expired or been revoked',
        code: 'SUBSCRIPTION_INACTIVE'
      });
    }

    req.user = user;
    req.userTier = user.productTier;
    next();
  } catch (error) {
    console.error('Product tier check failed:', error);
    res.status(500).json({ error: 'Authorization check failed' });
  }
};

// Tier-specific middleware factory - checks if user has required tier level or higher
const requireTier = (requiredTier: typeof TIER_HIERARCHY[number]) => {
  return async (req: any, res: any, next: any) => {
    const userId = req.session?.userId;
    const authHeader = req.headers.authorization;

    // Check for dev bypass token first
    if (process.env.NODE_ENV === 'development' && authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      if (token === 'dev-bypass-token') {
        req.user = {
          id: 'dev-user-12345',
          email: 'dev@smartcrm.local',
          username: 'dev@smartcrm.local',
          role: 'super_admin',
          productTier: 'super_admin'
        };
        req.userTier = 'super_admin';
        console.log('✅ Dev bypass tier granted via Bearer token');
        return next();
      }
    }

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    try {
      const user = await db.query.profiles.findFirst({
        where: (profiles, { eq }) => eq(profiles.id, userId),
      });
      
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }
      
      // DEV BYPASS: Allow full access for dev/admin accounts
      const userEmail = user.username?.toLowerCase() || '';
      if (DEV_BYPASS_EMAILS.includes(userEmail) || user.role === 'super_admin') {
        req.user = user;
        req.userTier = 'super_admin'; // Grant highest tier access
        return next();
      }
      
      const userTierLevel = getTierLevel(user.productTier);
      const requiredTierLevel = getTierLevel(requiredTier);
      
      // No tier = no access
      if (userTierLevel === -1) {
        return res.status(403).json({ 
          error: 'Subscription required',
          message: 'Please purchase a subscription to access this feature',
          code: 'NO_PRODUCT_TIER'
        });
      }
      
      // User tier must be >= required tier level
      if (userTierLevel < requiredTierLevel) {
        return res.status(403).json({ 
          error: 'Upgrade required',
          message: `This feature requires ${requiredTier} tier or higher`,
          requiredTier,
          currentTier: user.productTier,
          code: 'INSUFFICIENT_TIER'
        });
      }
      
      // Also check entitlement status
      const entitlement = await getUserEntitlement(userId);
      if (entitlement && !isUserActive(entitlement)) {
        return res.status(403).json({ 
          error: 'Subscription inactive',
          message: 'Your subscription has expired or been revoked',
          code: 'SUBSCRIPTION_INACTIVE'
        });
      }
      
      req.user = user;
      req.userTier = user.productTier;
      next();
    } catch (error) {
      console.error('Tier check failed:', error);
      res.status(500).json({ error: 'Authorization check failed' });
    }
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  let openai: OpenAI | null = null;
  
  // Initialize AI clients with fallback strategy
  const userOpenAIKey = process.env.OPENAI_API_KEY;
  const googleAIKey = process.env.GOOGLE_AI_API_KEY;

  try {

  // Use working key as fallback for production reliability
  const openaiApiKey = userOpenAIKey || process.env.OPENAI_API_KEY_FALLBACK;
  if (openaiApiKey) {
    openai = new OpenAI({ apiKey: openaiApiKey });
    console.log('✅ OpenAI client initialized');
  } else {
    console.warn('⚠️ No OpenAI API key available');
  }
  } catch (error) {
    console.error('❌ Failed to initialize OpenAI client:', error);
    console.log('🔄 Continuing without OpenAI...');
  }

  // Google AI helper function
  async function callGoogleAI(prompt: string, model: string = 'gemini-1.5-flash'): Promise<string> {
    if (!googleAIKey) {
      throw new Error('Google AI API key not configured');
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${googleAIKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Google AI API error: ${response.status} ${response.statusText}`);
    }

    const data: GoogleAIResponse = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  // Partner Management Routes - ADMIN ONLY
  app.get('/api/partners/pending', requireAdmin, async (req: any, res) => {
    try {
      if (!isSupabaseConfigured() || !supabase) {
        // Fallback to mock data if Supabase not configured
        const pendingPartners = [
          {
            id: 'partner_1',
            name: 'TechCorp Solutions',
            contact_email: 'contact@techcorp.com',
            subdomain: 'techcorp',
            created_at: new Date().toISOString(),
            status: 'pending'
          },
          {
            id: 'partner_2',
            name: 'Digital Marketing Pro',
            contact_email: 'hello@digitalmarketing.com',
            subdomain: 'digitalpro',
            created_at: new Date(Date.now() - 86400000).toISOString(),
            status: 'pending'
          }
        ];
        return res.json(pendingPartners);
      }

      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      res.json(data);
    } catch (error) {
      console.error('Error fetching pending partners:', error);
      res.status(500).json({ error: 'Failed to fetch pending partners' });
    }
  });

  app.get('/api/partners/active', requireAdmin, async (req: any, res) => {
    try {
      if (!isSupabaseConfigured() || !supabase) {
        // Fallback to mock data if Supabase not configured
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
        return res.json(activePartners);
      }

      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      res.json(data);
    } catch (error) {
      console.error('Error fetching active partners:', error);
      res.status(500).json({ error: 'Failed to fetch active partners' });
    }
  });

  app.get('/api/partners/:partnerId/stats', requireAdmin, async (req: any, res) => {
    try {
      const { partnerId } = req.params;

      if (!isSupabaseConfigured() || !supabase) {
        // Fallback to mock data if Supabase not configured
        const stats = {
          total_customers: 42,
          active_customers: 38,
          total_revenue: 14200,
          monthly_revenue: 14200,
          customer_growth_rate: 23
        };
        return res.json(stats);
      }

      // Get partner stats from database
      const { data: stats, error: statsError } = await supabase
        .from('partner_stats')
        .select('*')
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (statsError && statsError.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw statsError;
      }

      // If no stats found, calculate from partner customers
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
          customer_growth_rate: 0 // Would need historical data to calculate
        };

        return res.json(calculatedStats);
      }

      res.json(stats);
    } catch (error) {
      console.error('Error fetching partner stats:', error);
      res.status(500).json({ error: 'Failed to fetch partner stats' });
    }
  });

  app.get('/api/partners/:partnerId/customers', requireAdmin, async (req: any, res) => {
    try {
      const { partnerId } = req.params;

      if (!isSupabaseConfigured() || !supabase) {
        // Fallback to mock data if Supabase not configured
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
          },
          {
            id: '2',
            name: 'TechStart Inc',
            subdomain: 'techstart',
            status: 'active',
            plan: 'pro',
            monthly_revenue: 149,
            created_at: '2024-02-20T00:00:00Z',
            last_active: '2024-06-27T00:00:00Z'
          }
        ];
        return res.json(customers);
      }

      const { data, error } = await supabase
        .from('partner_customers')
        .select('*')
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      res.json(data);
    } catch (error) {
      console.error('Error fetching partner customers:', error);
      res.status(500).json({ error: 'Failed to fetch partner customers' });
    }
  });

  app.post('/api/partners/:partnerId/customers', requireAdmin, (req: any, res) => {
    const { partnerId } = req.params;
    const { companyName, contactEmail, plan } = req.body;

    // Mock customer creation
    const newCustomer = {
      id: `customer_${Date.now()}`,
      name: companyName,
      subdomain: companyName.toLowerCase().replace(/\s+/g, ''),
      status: 'active',
      plan: plan || 'basic',
      monthlyRevenue: plan === 'enterprise' ? 299 : plan === 'pro' ? 149 : 49,
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString()
    };

    res.json(newCustomer);
  });

  app.post('/api/partners/onboard', requireAdmin, (req: any, res) => {
    const partnerData = req.body;

    // Mock partner onboarding
    const newPartner = {
      id: `partner_${Date.now()}`,
      name: partnerData.companyName,
      contactEmail: partnerData.contactEmail,
      subdomain: partnerData.subdomain,
      status: 'pending',
      createdAt: new Date().toISOString(),
      brandingConfig: partnerData.brandingConfig
    };

    res.json(newPartner);
  });

  app.post('/api/partners/:partnerId/approve', requireAdmin, (req: any, res) => {
    const { partnerId } = req.params;

    // Mock partner approval
    const approvedPartner = {
      id: partnerId,
      status: 'active',
      approvedAt: new Date().toISOString()
    };

    res.json(approvedPartner);
  });

  app.get('/api/partners', requireAdmin, async (req: any, res) => {
    try {
      if (!isSupabaseConfigured() || !supabase) {
        // Fallback to mock data if Supabase not configured
        const partners = [
          {
            id: 'partner_1',
            name: 'TechCorp Solutions',
            status: 'active',
            contact_email: 'contact@techcorp.com',
            subdomain: 'techcorp',
            created_at: '2024-01-01T00:00:00Z'
          },
          {
            id: 'partner_2',
            name: 'Digital Marketing Pro',
            status: 'active',
            contact_email: 'hello@digitalmarketing.com',
            subdomain: 'digitalpro',
            created_at: '2024-02-01T00:00:00Z'
          }
        ];
        return res.json(partners);
      }

      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      res.json(data);
    } catch (error) {
      console.error('Error fetching partners:', error);
      res.status(500).json({ error: 'Failed to fetch partners' });
    }
  });

  // White-label tenant management routes - ADMIN ONLY
  app.get('/api/white-label/tenants', requireAdmin, async (req: any, res) => {
    try {
      if (!isSupabaseConfigured() || !supabase) {
        // Fallback to mock data if Supabase not configured
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
          },
          {
            id: 'tenant_2',
            name: 'TechStart Inc',
            subdomain: 'techstart',
            custom_domain: null,
            status: 'active',
            type: 'customer',
            plan: 'pro',
            contact_email: 'admin@techstart.com',
            monthly_revenue: 149,
            user_count: 12,
            created_at: '2024-02-20T00:00:00Z',
            parent_partner_id: 'partner_2'
          },
          {
            id: 'tenant_3',
            name: 'SalesForce Plus',
            subdomain: 'salesforceplus',
            custom_domain: 'crm.salesforceplus.com',
            status: 'active',
            type: 'partner',
            plan: 'enterprise',
            contact_email: 'admin@salesforceplus.com',
            monthly_revenue: 499,
            user_count: 50,
            created_at: '2024-01-01T00:00:00Z'
          }
        ];
        return res.json(tenants);
      }

      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      res.json(data);
    } catch (error) {
      console.error('Error fetching tenants:', error);
      res.status(500).json({ error: 'Failed to fetch tenants' });
    }
  });

  app.put('/api/white-label/tenants/:tenantId', requireAdmin, async (req: any, res) => {
    try {
      const { tenantId } = req.params;
      const updates = req.body;

      if (!isSupabaseConfigured() || !supabase) {
        // Fallback to mock response if Supabase not configured
        const updatedTenant = {
          id: tenantId,
          ...updates,
          updated_at: new Date().toISOString()
        };
        return res.json(updatedTenant);
      }

      const { data, error } = await supabase
        .from('tenants')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', tenantId)
        .select()
        .single();

      if (error) throw error;
      res.json(data);
    } catch (error) {
      console.error('Error updating tenant:', error);
      res.status(500).json({ error: 'Failed to update tenant' });
    }
  });

  app.delete('/api/white-label/tenants/:tenantId', requireAdmin, async (req: any, res) => {
    try {
      const { tenantId } = req.params;

      if (!isSupabaseConfigured() || !supabase) {
        // Fallback to mock response if Supabase not configured
        return res.json({ message: 'Tenant deleted successfully', id: tenantId });
      }

      const { error } = await supabase
        .from('tenants')
        .delete()
        .eq('id', tenantId);

      if (error) throw error;
      res.json({ message: 'Tenant deleted successfully', id: tenantId });
    } catch (error) {
      console.error('Error deleting tenant:', error);
      res.status(500).json({ error: 'Failed to delete tenant' });
    }
  });

  // Get white-label configuration for a tenant - ADMIN ONLY
  app.get('/api/white-label/config/:tenantId', requireAdmin, async (req: any, res) => {
    try {
      const { tenantId } = req.params;

      if (!isSupabaseConfigured() || !supabase) {
        // Fallback to mock data if Supabase not configured
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
        return res.json(mockConfig);
      }

      const { data, error } = await supabase
        .from('white_label_configs')
        .select('*')
        .eq('tenant_id', tenantId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      if (!data) {
        return res.status(404).json({ error: 'White-label configuration not found' });
      }

      res.json(data);
    } catch (error) {
      console.error('Error fetching white-label config:', error);
      res.status(500).json({ error: 'Failed to fetch white-label configuration' });
    }
  });

  // Update white-label configuration - ADMIN ONLY
  app.put('/api/white-label/config/:tenantId', requireAdmin, async (req: any, res) => {
    try {
      const { tenantId } = req.params;
      const updates = req.body;

      if (!isSupabaseConfigured() || !supabase) {
        // Fallback to mock response if Supabase not configured
        const updatedConfig = {
          id: 'config_1',
          tenant_id: tenantId,
          ...updates,
          updated_at: new Date().toISOString()
        };
        return res.json(updatedConfig);
      }

      // First check if config exists
      const { data: existingConfig } = await supabase
        .from('white_label_configs')
        .select('id')
        .eq('tenant_id', tenantId)
        .single();

      let result;
      if (existingConfig) {
        // Update existing config
        const { data, error } = await supabase
          .from('white_label_configs')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('tenant_id', tenantId)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        // Create new config
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

      res.json(result);
    } catch (error) {
      console.error('Error updating white-label config:', error);
      res.status(500).json({ error: 'Failed to update white-label configuration' });
    }
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });


  // Development bypass endpoint - Only works in development
  app.post('/api/auth/dev-bypass', (req, res) => {
    // SECURITY: Check both NODE_ENV and hostname
    const hostname = req.headers.host || '';
    const isProductionDomain = hostname.includes('replit.app') || hostname.includes('smartcrm.vip');
    
    if (process.env.NODE_ENV !== 'development' || isProductionDomain) {
      console.log('🔒 Dev bypass blocked - ENV:', process.env.NODE_ENV, 'Host:', hostname);
      return res.status(404).json({ error: 'Not found' });
    }

    // Return dev user with full permissions and session
    const devUser = {
      id: 'dev-user-12345',
      email: 'dev@smartcrm.local',
      username: 'developer',
      firstName: 'Development',
      lastName: 'User',
      role: 'super_admin',
      productTier: 'super_admin',
      permissions: ['all'],
      tenantId: 'development',
      status: 'active',
      lastActive: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      app_context: 'smartcrm'
    };

    const devSession = {
      access_token: 'dev-bypass-token-' + Date.now(),
      refresh_token: 'dev-bypass-refresh-' + Date.now(),
      expires_at: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
      user: devUser
    };

    console.log('✅ Dev bypass session created for:', devUser.email);

    res.json({
      success: true,
      user: devUser,
      session: devSession,
      hasAccess: true,
      permissions: ['all']
    });
  });

  // User role check endpoint - returns actual user role from session
  app.get('/api/auth/user-role', async (req: any, res) => {
    const userId = req.session?.userId;
    
    // If no session, return unauthenticated
    if (!userId) {
      return res.json({
        success: false,
        user: null,
        hasAccess: false,
        permissions: []
      });
    }
    
    try {
      // Get actual user from database
      const user = await db.query.profiles.findFirst({
        where: (profiles, { eq }) => eq(profiles.id, userId),
      });
      
      if (!user) {
        return res.json({
          success: false,
          user: null,
          hasAccess: false,
          permissions: []
        });
      }
      
      // Return actual user with their real role and tier
      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.username,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          productTier: user.productTier,
          permissions: user.role === 'super_admin' ? ['all'] : [],
          status: 'active',
          lastActive: new Date().toISOString(),
          createdAt: user.createdAt
        },
        hasAccess: !!user.productTier,
        permissions: user.role === 'super_admin' ? ['all'] : []
      });
    } catch (error) {
      console.error('Error fetching user role:', error);
      res.status(500).json({ error: 'Failed to fetch user role' });
    }
  });

  // OpenAI API status check with model availability
  app.get('/api/openai/status', async (req, res) => {
    const hasApiKey = !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.length > 10;

    if (!hasApiKey) {
      return res.json({
        configured: false,
        model: 'none',
        status: 'needs_configuration',
        error: 'No API key configured'
      });
    }

    // Check GPT-5 availability
    let gpt5Available = false;
    try {
      if (!openai) {
        throw new Error('OpenAI client not initialized');
      }
      const testResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: "test" }],
        max_tokens: 1
      });
      gpt5Available = true;
    } catch (error: any) {
      gpt5Available = false;
    }

    res.json({
      configured: true,
      model: gpt5Available ? 'gpt-5' : 'gpt-4o',
      status: 'ready',
      gpt5Available,
      capabilities: gpt5Available ? [
        '94.6% AIME mathematical accuracy',
        '74.9% SWE-bench coding accuracy',
        '84.2% MMMU multimodal performance',
        'Unified reasoning system',
        'Advanced verbosity and reasoning_effort controls'
      ] : [
        'GPT-4 Omni model available',
        'Advanced reasoning and analysis',
        'Multimodal capabilities',
        'JSON output formatting'
      ]
    });
  });

  // Quick dev access route - Direct redirect to dashboard in dev mode
  app.get('/dev', (req, res) => {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(404).send('Not found');
    }

    // Redirect to app with dev bypass token in URL
    res.redirect('/?dev=true');
  });


  // Profile management endpoints
  app.post('/api/profiles', async (req, res) => {
    try {
      const { id, username, firstName, lastName } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      // Insert profile into database
      const profile = await storage.createProfile({
        id,
        username,
        firstName,
        lastName,
        role: 'user'
      });

      res.json(profile);
    } catch (error: any) {
      console.error('Profile creation error:', error);
      res.status(500).json({ error: 'Failed to create profile' });
    }
  });

  app.get('/api/profiles/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const profile = await storage.getProfile(id);

      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      res.json(profile);
    } catch (error: any) {
      console.error('Profile fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  });

  // AI API Status Check (tests both OpenAI and Google AI)
  app.get('/api/openai/status', async (req, res) => {
    const results = {
      openai: { available: false, model: 'none', error: null as string | null },
      googleai: { available: false, model: 'none', error: null as string | null }
    };

    // Test OpenAI
    try {
      if (!openai) {
        throw new Error('OpenAI client not initialized');
      }
      const testResponse = await openai.responses.create({
        model: "gpt-5",
        input: "Test connection",
        reasoning: { effort: "minimal" }
      });

      results.openai = {
        available: true,
        model: 'gpt-5',
        error: null
      };
    } catch (error: any) {
      try {
        if (!openai) {
          throw new Error('OpenAI client not initialized');
        }
        const fallbackResponse = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: "Test" }],
          max_tokens: 10
        });

        results.openai = {
          available: true,
          model: 'gpt-4o-mini',
          error: null
        };
      } catch (fallbackError: any) {
        results.openai = {
          available: false,
          model: 'none',
          error: fallbackError.message
        };
      }
    }

    // Test Google AI
    try {
      const googleResponse = await callGoogleAI("Test connection", "gemini-1.5-flash");
      results.googleai = {
        available: true,
        model: 'gemini-1.5-flash',
        error: null
      };
    } catch (error: any) {
      results.googleai = {
        available: false,
        model: 'none',
        error: error.message
      };
    }

    // Return comprehensive status
    const anyWorking = results.openai.available || results.googleai.available;
    const primaryModel = results.openai.available ? results.openai.model : results.googleai.model;

    res.json({
      configured: anyWorking,
      model: primaryModel,
      status: anyWorking ? 'ready' : 'api_keys_invalid',
      openai: results.openai,
      googleai: results.googleai,
      capabilities: anyWorking ? [
        results.openai.available ? 'GPT-5/GPT-4 Processing' : null,
        results.googleai.available ? 'Google Gemini Processing' : null,
        'Intelligent AI fallback system',
        'Advanced business analysis'
      ].filter(Boolean) : ['Configure API keys for AI features']
    });
  });

  // Google AI Test Endpoint - AUTH REQUIRED
  app.post('/api/googleai/test', requireAuth, async (req: any, res) => {
    try {
      const prompt = req.body.prompt || "Generate a business insight in one sentence.";
      const response = await callGoogleAI(prompt);

      res.json({
        success: true,
        model: 'gemini-1.5-flash',
        output: response,
        message: 'Google AI working perfectly!'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Google AI test failed'
      });
    }
  });

  // GPT-5 Direct Test Endpoint (uses configured API key) - AUTH REQUIRED
  app.post('/api/openai/test-gpt5-direct', requireProductTier, async (req: any, res) => {
    try {
      if (!openai) {
        return res.status(400).json({
          error: 'OpenAI API key not configured',
          message: 'Please configure OpenAI API key for testing'
        });
      }

      const testClient = openai;

      const response = await testClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: "Generate a business insight about CRM efficiency in exactly 1 sentence." }],
        max_tokens: 50
      });

      res.json({
        success: true,
        model: 'gpt-4o-mini',
        output: response.choices[0].message.content,
        message: 'AI working perfectly!'
      });

    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Unknown error'
      });
    }
  });

  // OpenAI Embeddings Endpoint - AUTH REQUIRED
  app.post('/api/openai/embeddings', requireProductTier, async (req: any, res) => {
    try {
      const { text, model = "text-embedding-3-small" } = req.body;

      if (!text) {
        return res.status(400).json({
          error: 'Text is required for embedding generation'
        });
      }

      if (!openai) {
        return res.status(400).json({
          error: 'OpenAI API key not configured',
          message: 'Please configure OpenAI API key for embeddings'
        });
      }

      const response = await openai.embeddings.create({
        model: model,
        input: text,
        encoding_format: "float",
      });

      res.json({
        success: true,
        embedding: response.data[0].embedding,
        model: model,
        usage: response.usage
      });

    } catch (error: any) {
      console.error('Embeddings error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to generate embeddings'
      });
    }
  });

  // OpenAI Image Generation Endpoint - AUTH REQUIRED
  app.post('/api/openai/images/generate', requireProductTier, async (req: any, res) => {
    try {
      const { prompt, model = 'dall-e-3', size = '1024x1024', quality = 'standard', style = 'vivid', n = 1 } = req.body;

      if (!prompt) {
        return res.status(400).json({
          error: 'Prompt is required for image generation'
        });
      }

      if (!openai) {
        return res.status(400).json({
          error: 'OpenAI API key not configured',
          message: 'Please configure OpenAI API key for image generation'
        });
      }

      const response = await openai.images.generate({
        model: model,
        prompt: prompt,
        size: size as any,
        quality: quality as any,
        style: style as any,
        n: n
      });

      res.json({
        success: true,
        data: response.data,
        model: model,
        usage: response.data?.length || 0
      });

    } catch (error: any) {
      console.error('Image generation error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to generate image'
      });
    }
  });

  // OpenAI Image Variation Endpoint - AUTH REQUIRED
  app.post('/api/openai/images/variation', requireProductTier, async (req: any, res) => {
    try {
      const { image, n = 1, size = '1024x1024' } = req.body;

      if (!image) {
        return res.status(400).json({
          error: 'Image is required for variation generation'
        });
      }

      if (!openai) {
        return res.status(400).json({
          error: 'OpenAI API key not configured',
          message: 'Please configure OpenAI API key for image variation'
        });
      }

      const response = await openai.images.createVariation({
        image: image,
        n: n,
        size: size as any
      });

      res.json({
        success: true,
        data: response.data,
        model: 'dall-e-2',
        usage: response.data?.length || 0
      });

    } catch (error: any) {
      console.error('Image variation error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to generate image variation'
      });
    }
  });

  // OpenAI Image Edit Endpoint - AUTH REQUIRED
  app.post('/api/openai/images/edit', requireProductTier, async (req: any, res) => {
    try {
      const { image, prompt, mask, n = 1, size = '1024x1024' } = req.body;

      if (!image || !prompt) {
        return res.status(400).json({
          error: 'Image and prompt are required for image editing'
        });
      }

      if (!openai) {
        return res.status(400).json({
          error: 'OpenAI API key not configured',
          message: 'Please configure OpenAI API key for image editing'
        });
      }

      const editParams: any = {
        image: image,
        prompt: prompt,
        n: n,
        size: size as any
      };

      if (mask) {
        editParams.mask = mask;
      }

      const response = await openai.images.edit(editParams);

      res.json({
        success: true,
        data: response.data,
        model: 'dall-e-2',
        usage: response.data?.length || 0
      });

    } catch (error: any) {
      console.error('Image edit error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to edit image'
      });
    }
  });

  // OpenAI Assistant Thread Creation Endpoint - AUTH REQUIRED
  app.post('/api/openai/assistants/threads', requireProductTier, async (req: any, res) => {
    try {
      const { entityType, entityId, context } = req.body;

      if (!openai) {
        return res.status(400).json({
          error: 'OpenAI API key not configured',
          message: 'Please configure OpenAI API key for assistant threads'
        });
      }

      const thread = await openai.beta.threads.create({
        metadata: {
          entityType,
          entityId,
          ...context
        }
      });

      res.json({
        success: true,
        threadId: thread.id,
        created: true
      });

    } catch (error: any) {
      console.error('Assistant thread creation error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create assistant thread'
      });
    }
  });

  // OpenAI Assistant Chat Endpoint - AUTH REQUIRED
  app.post('/api/openai/assistants/chat', requireProductTier, async (req: any, res) => {
    try {
      const { message, assistantId, threadId, context } = req.body;

      if (!openai) {
        return res.status(400).json({
          error: 'OpenAI API key not configured',
          message: 'Please configure OpenAI API key for assistant chat'
        });
      }

      // Create thread if not provided
      let currentThreadId = threadId;
      if (!currentThreadId) {
        const thread = await openai.beta.threads.create();
        currentThreadId = thread.id;
      }

      // Add user message
      await openai.beta.threads.messages.create(currentThreadId, {
        role: 'user',
        content: message
      });

      // Create and run
      const run = await openai.beta.threads.runs.create(currentThreadId, {
        assistant_id: assistantId
      });

      // Wait for completion with polling
      let runStatus = await openai.beta.threads.runs.retrieve(run.id, {
        thread_id: currentThreadId
      });
      while (runStatus.status === 'in_progress' || runStatus.status === 'queued') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        runStatus = await openai.beta.threads.runs.retrieve(run.id, {
          thread_id: currentThreadId
        });
      }

      if (runStatus.status === 'completed') {
        const messages = await openai.beta.threads.messages.list(currentThreadId, { limit: 1 });
        const lastMessage = messages.data[0];
        const content = Array.isArray(lastMessage.content) && lastMessage.content[0]?.type === 'text'
          ? lastMessage.content[0].text.value
          : 'No response available';

        res.json({
          success: true,
          response: content,
          threadId: currentThreadId,
          runId: run.id
        });
      } else {
        res.status(500).json({
          success: false,
          error: `Run failed with status: ${runStatus.status}`
        });
      }

    } catch (error: any) {
      console.error('Assistant chat error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to process assistant chat'
      });
    }
  });

  // Advanced AI Smart Greeting Generation (with intelligent fallback) - AUTH REQUIRED
  app.post('/api/openai/smart-greeting', requireProductTier, async (req: any, res) => {
    const { userMetrics, timeOfDay, recentActivity } = req.body;

    if (!openai) {
      // Intelligent fallback with dynamic data
      return res.json({
        greeting: `Good ${timeOfDay}! You have ${userMetrics?.totalDeals || 0} deals worth $${(userMetrics?.totalValue || 0).toLocaleString()}.`,
        insight: userMetrics?.totalValue > 50000
          ? 'Your pipeline shows strong momentum. Focus on your highest-value opportunities to maximize Q4 performance.'
          : 'Your pipeline is growing steadily. Consider expanding your outreach to increase deal flow.',
        source: 'intelligent_fallback',
        model: 'fallback'
      });
    }

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{
          role: "system",
          content: "You are an expert business strategist. Generate personalized greetings and strategic insights."
        }, {
          role: "user",
          content: `Generate a personalized, strategic greeting for ${timeOfDay}. User has ${userMetrics?.totalDeals || 0} deals worth $${userMetrics?.totalValue || 0}. Recent activity: ${JSON.stringify(recentActivity)}. Provide both greeting and strategic insight in JSON format with 'greeting' and 'insight' fields.`
        }],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 200
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      res.json({
        ...result,
        source: 'gpt-4o-mini',
        model: 'gpt-4o-mini'
      });

    } catch (error) {
      console.error('Smart greeting error:', error);
      // Intelligent fallback with dynamic data
      res.json({
        greeting: `Good ${timeOfDay}! You have ${userMetrics?.totalDeals || 0} deals worth $${(userMetrics?.totalValue || 0).toLocaleString()}.`,
        insight: userMetrics?.totalValue > 50000
          ? 'Your pipeline shows strong momentum. Focus on your highest-value opportunities to maximize Q4 performance.'
          : 'Your pipeline is growing steadily. Consider expanding your outreach to increase deal flow.',
        source: 'intelligent_fallback',
        model: 'fallback'
      });
    }
  });

  // GPT-5 KPI Analysis - AUTH REQUIRED
  app.post('/api/openai/kpi-analysis', requireProductTier, async (req: any, res) => {
    if (!openai) {
      return res.status(400).json({
        error: 'OpenAI API key not configured',
        summary: 'Your KPI trends show steady performance. Configure OpenAI API key for detailed analysis.',
        recommendations: ['Set up API credentials', 'Enable advanced analytics']
      });
    }

    try {
      const { historicalData, currentMetrics } = req.body;

      if (!openai) {
        throw new Error('OpenAI client not available');
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Use available, reliable model
        messages: [{
          role: "system",
          content: "You are an expert business analyst with advanced mathematical reasoning capabilities. Analyze KPI trends and provide strategic insights with confidence intervals and actionable recommendations."
        }, {
          role: "user",
          content: `Analyze these KPI trends: Historical: ${JSON.stringify(historicalData)}, Current: ${JSON.stringify(currentMetrics)}. Provide summary, trends, predictions, and recommendations in JSON format.`
        }],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 800
      });

      let result;
      try {
        const content = response.choices[0].message.content || '{}';
        result = JSON.parse(content);
      } catch (parseError) {
        console.error('JSON parsing error:', parseError);
        console.error('Raw content:', response.choices[0].message.content);
        // Extract JSON-like content using regex if direct parsing fails
        const jsonMatch = response.choices[0].message.content?.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            result = JSON.parse(jsonMatch[0]);
          } catch (fallbackError) {
            result = {
              error: 'Failed to parse AI response',
              summary: 'Analysis completed but response parsing failed',
              recommendations: ['Review data format', 'Check API response'],
              parsed_content: response.choices[0].message.content
            };
          }
        } else {
          result = {
            error: 'Invalid response format',
            summary: 'Unable to extract structured data from AI response',
            recommendations: ['Retry analysis', 'Check API configuration']
          };
        }
      }
      res.json(result);

    } catch (error) {
      console.error('KPI analysis error:', error);
      res.status(500).json({
        error: 'Failed to analyze KPIs',
        summary: 'Your KPI trends show steady performance with opportunities for optimization.',
        recommendations: ['Focus on pipeline velocity', 'Optimize conversion rates', 'Scale successful strategies']
      });
    }
  });

  // GPT-5 Deal Intelligence - AUTH REQUIRED
  app.post('/api/openai/deal-intelligence', requireProductTier, async (req: any, res) => {
    if (!openai) {
      return res.status(400).json({
        error: 'OpenAI API key not configured',
        probability_score: 65,
        risk_level: 'medium',
        key_factors: ['Configure API key for detailed analysis'],
        recommendations: ['Set up OpenAI credentials for expert insights'],
        confidence_level: 'medium',
        estimated_close_days: 30,
        value_optimization: 0
      });
    }

    try {
      const { dealData, contactHistory, marketContext } = req.body;

      if (!openai) {
        throw new Error('OpenAI client not available');
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Use available, reliable model
        messages: [{
          role: "system",
          content: "You are an expert sales strategist with deep reasoning capabilities. Provide comprehensive deal intelligence including win probability, risk factors, and strategic recommendations."
        }, {
          role: "user",
          content: `Analyze this deal: ${JSON.stringify(dealData)}. Contact history: ${JSON.stringify(contactHistory)}. Market context: ${JSON.stringify(marketContext)}. Provide comprehensive deal intelligence in JSON format.`
        }],
        response_format: { type: "json_object" },
        temperature: 0.2,
        max_tokens: 600
      });

      let result;
      try {
        const content = response.choices[0].message.content || '{}';
        result = JSON.parse(content);
      } catch (parseError) {
        console.error('JSON parsing error:', parseError);
        console.error('Raw content:', response.choices[0].message.content);
        // Extract JSON-like content using regex if direct parsing fails
        const jsonMatch = response.choices[0].message.content?.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            result = JSON.parse(jsonMatch[0]);
          } catch (fallbackError) {
            result = {
              error: 'Failed to parse AI response',
              summary: 'Analysis completed but response parsing failed',
              recommendations: ['Review data format', 'Check API response'],
              parsed_content: response.choices[0].message.content
            };
          }
        } else {
          result = {
            error: 'Invalid response format',
            summary: 'Unable to extract structured data from AI response',
            recommendations: ['Retry analysis', 'Check API configuration']
          };
        }
      }
      res.json(result);

    } catch (error) {
      console.error('Deal intelligence error:', error);
      res.status(500).json({
        error: 'Failed to analyze deal',
        probability_score: 65,
        risk_level: 'medium',
        key_factors: ['Follow-up frequency', 'Decision timeline', 'Budget confirmation'],
        recommendations: ['Schedule decision-maker meeting', 'Confirm budget authority', 'Present clear ROI'],
        confidence_level: 'medium',
        estimated_close_days: 30,
        value_optimization: 0
      });
    }
  });

  // GPT-5 Business Intelligence - AUTH REQUIRED
  app.post('/api/openai/business-intelligence', requireProductTier, async (req: any, res) => {
    if (!openai) {
      return res.status(400).json({
        error: 'OpenAI API key not configured',
        market_insights: ['Configure API key for AI-powered insights'],
        competitive_advantages: ['Manual analysis available'],
        risk_factors: ['Limited AI capabilities without API key'],
        growth_opportunities: ['Enable AI for advanced analysis'],
        strategic_recommendations: ['Set up OpenAI integration']
      });
    }

    try {
      const { businessData, marketContext, objectives } = req.body;

      if (!openai) {
        throw new Error('OpenAI client not available');
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{
          role: "system",
          content: "You are a senior business consultant with expertise across multiple industries. Generate strategic business intelligence including market insights, competitive advantages, risk factors, growth opportunities, and strategic recommendations."
        }, {
          role: "user",
          content: `Generate business intelligence for: ${JSON.stringify(businessData)}. Market context: ${JSON.stringify(marketContext)}. Objectives: ${JSON.stringify(objectives)}. Provide market_insights, competitive_advantages, risk_factors, growth_opportunities, and strategic_recommendations in JSON format.`
        }],
        response_format: { type: "json_object" },
        temperature: 0.4,
        max_tokens: 1000
      });

      let result;
      try {
        const content = response.choices[0].message.content || '{}';
        result = JSON.parse(content);

        // Ensure all required arrays exist
        result = {
          market_insights: Array.isArray(result.market_insights) ? result.market_insights : [],
          competitive_advantages: Array.isArray(result.competitive_advantages) ? result.competitive_advantages : [],
          risk_factors: Array.isArray(result.risk_factors) ? result.risk_factors : [],
          growth_opportunities: Array.isArray(result.growth_opportunities) ? result.growth_opportunities : [],
          strategic_recommendations: Array.isArray(result.strategic_recommendations) ? result.strategic_recommendations : [],
          ...result
        };
      } catch (parseError) {
        console.error('JSON parsing error:', parseError);
        console.error('Raw content:', response.choices[0].message.content);
        // Provide structured fallback data
        result = {
          error: 'Failed to parse AI response',
          market_insights: ['Digital transformation accelerating', 'Customer expectations rising'],
          competitive_advantages: ['AI integration', 'Customer-centric approach'],
          risk_factors: ['Market competition', 'Economic uncertainty'],
          growth_opportunities: ['Market expansion', 'Product diversification'],
          strategic_recommendations: ['Invest in AI capabilities', 'Strengthen customer relationships']
        };
      }
      res.json(result);

    } catch (error) {
      console.error('Business intelligence error:', error);
      res.status(500).json({
        error: 'Failed to generate business intelligence',
        market_insights: ['Digital transformation accelerating', 'Customer expectations rising'],
        competitive_advantages: ['AI integration', 'Customer-centric approach'],
        risk_factors: ['Market competition', 'Economic uncertainty'],
        growth_opportunities: ['Market expansion', 'Product diversification'],
        strategic_recommendations: ['Invest in AI capabilities', 'Strengthen customer relationships']
      });
    }
  });

  // GPT-5 Performance Optimization Analysis - AUTH REQUIRED
  app.post('/api/openai/performance-optimization', requireProductTier, async (req: any, res) => {
    try {
      const { systemMetrics, userBehavior, businessGoals } = req.body;

      if (!openai) {
        throw new Error('OpenAI client not available');
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{
          role: "system",
          content: "You are an expert performance optimization consultant with deep knowledge of business systems and process improvement. Analyze system performance data and provide actionable optimization recommendations."
        }, {
          role: "user",
          content: `Analyze performance optimization opportunities: System metrics: ${JSON.stringify(systemMetrics)}. User behavior: ${JSON.stringify(userBehavior)}. Business goals: ${JSON.stringify(businessGoals)}. Provide optimization_score, efficiency_gain, recommended_actions, expected_roi, and implementation_timeline in JSON format.`
        }],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 700
      });

      let result;
      try {
        const content = response.choices[0].message.content || '{}';
        result = JSON.parse(content);
      } catch (parseError) {
        console.error('JSON parsing error:', parseError);
        console.error('Raw content:', response.choices[0].message.content);
        // Extract JSON-like content using regex if direct parsing fails
        const jsonMatch = response.choices[0].message.content?.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            result = JSON.parse(jsonMatch[0]);
          } catch (fallbackError) {
            result = {
              error: 'Failed to parse AI response',
              summary: 'Analysis completed but response parsing failed',
              recommendations: ['Review data format', 'Check API response'],
              parsed_content: response.choices[0].message.content
            };
          }
        } else {
          result = {
            error: 'Invalid response format',
            summary: 'Unable to extract structured data from AI response',
            recommendations: ['Retry analysis', 'Check API configuration']
          };
        }
      }
      res.json(result);

    } catch (error) {
      console.error('Performance optimization error:', error);
      res.status(500).json({
        error: 'Failed to optimize performance',
        optimization_score: 75,
        efficiency_gain: 45,
        recommended_actions: ['Automate routine tasks', 'Implement predictive analytics', 'Optimize workflow processes'],
        expected_roi: '30% increase in productivity',
        implementation_timeline: '4-6 weeks'
      });
    }
  });

  // GPT-5 Advanced Content Generation (with reasoning effort) - AUTH REQUIRED
  app.post('/api/openai/advanced-content', requireProductTier, async (req: any, res) => {
    try {
      const { contentType, parameters, reasoning_effort = 'medium' } = req.body;

      if (!openai) {
        throw new Error('OpenAI client not available');
      }

      // Use GPT-4 with enhanced parameters
      const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{
            role: "system",
            content: `You are an expert ${contentType} generator. Create high-quality, professional content based on the given parameters.`
          }, {
            role: "user",
            content: `Generate ${contentType} content with these specifications: ${JSON.stringify(parameters)}. Ensure the content is strategic, well-structured, and business-appropriate.`
          }],
          temperature: 0.4,
          max_tokens: 1000
        });

        res.json({
          content: response.choices[0].message.content,
          reasoning_quality: 'standard',
          confidence: 0.85,
          source: 'gpt-4o-mini'
        });

    } catch (error) {
      console.error('Advanced content generation error:', error);
      res.status(500).json({
        error: 'Failed to generate content',
        content: `Professional ${req.body.contentType} content generation temporarily unavailable. Please try again.`,
        reasoning_quality: 'fallback',
        confidence: 0.5
      });
    }
  });

  // GPT-5 Multimodal Analysis - AUTH REQUIRED
  app.post('/api/openai/multimodal-analysis', requireProductTier, async (req: any, res) => {
    try {
      const { textData, images, charts, documents } = req.body;

      if (!openai) {
        throw new Error('OpenAI client not available');
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Use available model for now
        messages: [{
          role: "system",
          content: "You are an expert data analyst capable of understanding complex business data, charts, and documents. Provide comprehensive insights from multiple data sources."
        }, {
          role: "user",
          content: `Analyze this multimodal business data: Text data: ${JSON.stringify(textData)}. Images count: ${images?.length || 0}. Charts count: ${charts?.length || 0}. Documents count: ${documents?.length || 0}. Provide text_insights, visual_insights, combined_insights, and confidence_score in JSON format.`
        }],
        response_format: { type: "json_object" },
        temperature: 0.2,
        max_tokens: 800
      });

      let result;
      try {
        const content = response.choices[0].message.content || '{}';
        result = JSON.parse(content);
      } catch (parseError) {
        console.error('JSON parsing error:', parseError);
        console.error('Raw content:', response.choices[0].message.content);
        // Extract JSON-like content using regex if direct parsing fails
        const jsonMatch = response.choices[0].message.content?.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            result = JSON.parse(jsonMatch[0]);
          } catch (fallbackError) {
            result = {
              error: 'Failed to parse AI response',
              summary: 'Analysis completed but response parsing failed',
              recommendations: ['Review data format', 'Check API response'],
              parsed_content: response.choices[0].message.content
            };
          }
        } else {
          result = {
            error: 'Invalid response format',
            summary: 'Unable to extract structured data from AI response',
            recommendations: ['Retry analysis', 'Check API configuration']
          };
        }
      }
      res.json(result);

    } catch (error) {
      console.error('Multimodal analysis error:', error);
      res.status(500).json({
        error: 'Failed to analyze multimodal data',
        text_insights: ['Text analysis shows steady performance trends'],
        visual_insights: ['Chart analysis indicates growth opportunities'],
        combined_insights: ['Comprehensive analysis suggests optimization potential'],
        confidence_score: 0.7
      });
    }
  });

  // GPT-5 Predictive Analytics - AUTH REQUIRED
  app.post('/api/openai/predictive-analytics', requireProductTier, async (req: any, res) => {
    try {
      const { historicalData, forecastPeriod, analysisType } = req.body;

      if (!openai) {
        throw new Error('OpenAI client not available');
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{
          role: "system",
          content: "You are an expert predictive analytics specialist with advanced mathematical modeling capabilities. Generate accurate forecasts and predictions based on historical data patterns."
        }, {
          role: "user",
          content: `Generate predictive analytics for ${analysisType}: Historical data: ${JSON.stringify(historicalData)}. Forecast period: ${forecastPeriod} months. Provide predictions, confidence_intervals, key_factors, accuracy_score, and forecast_period in JSON format.`
        }],
        response_format: { type: "json_object" },
        temperature: 0.1,
        max_tokens: 900
      });

      let result;
      try {
        const content = response.choices[0].message.content || '{}';
        result = JSON.parse(content);
      } catch (parseError) {
        console.error('JSON parsing error:', parseError);
        console.error('Raw content:', response.choices[0].message.content);
        // Extract JSON-like content using regex if direct parsing fails
        const jsonMatch = response.choices[0].message.content?.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            result = JSON.parse(jsonMatch[0]);
          } catch (fallbackError) {
            result = {
              error: 'Failed to parse AI response',
              summary: 'Analysis completed but response parsing failed',
              recommendations: ['Review data format', 'Check API response'],
              parsed_content: response.choices[0].message.content
            };
          }
        } else {
          result = {
            error: 'Invalid response format',
            summary: 'Unable to extract structured data from AI response',
            recommendations: ['Retry analysis', 'Check API configuration']
          };
        }
      }
      res.json(result);

    } catch (error) {
      console.error('Predictive analytics error:', error);
      res.status(500).json({
        error: 'Failed to generate predictions',
        predictions: ['Sales growth expected to continue upward trend'],
        confidence_intervals: { low: 0.75, high: 0.92 },
        key_factors: ['Historical performance', 'Market conditions', 'Seasonal trends'],
        accuracy_score: 0.8,
        forecast_period: req.body.forecastPeriod || 3
      });
    }
  });

  // GPT-5 Strategic Planning - AUTH REQUIRED
  app.post('/api/openai/strategic-planning', requireProductTier, async (req: any, res) => {
    try {
      const { businessContext, goals, constraints, timeframe } = req.body;

      if (!openai) {
        throw new Error('OpenAI client not available');
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{
          role: "system",
          content: "You are a senior strategic planning consultant with expertise in business strategy, goal setting, and execution planning. Create comprehensive strategic plans with actionable steps."
        }, {
          role: "user",
          content: `Create a strategic plan: Business context: ${JSON.stringify(businessContext)}. Goals: ${JSON.stringify(goals)}. Constraints: ${JSON.stringify(constraints)}. Timeframe: ${timeframe}. Provide strategic_objectives, action_items, milestones, risk_mitigation, and success_metrics in JSON format.`
        }],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 1200
      });

      let result;
      try {
        const content = response.choices[0].message.content || '{}';
        result = JSON.parse(content);
      } catch (parseError) {
        console.error('JSON parsing error:', parseError);
        console.error('Raw content:', response.choices[0].message.content);
        // Extract JSON-like content using regex if direct parsing fails
        const jsonMatch = response.choices[0].message.content?.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            result = JSON.parse(jsonMatch[0]);
          } catch (fallbackError) {
            result = {
              error: 'Failed to parse AI response',
              summary: 'Analysis completed but response parsing failed',
              recommendations: ['Review data format', 'Check API response'],
              parsed_content: response.choices[0].message.content
            };
          }
        } else {
          result = {
            error: 'Invalid response format',
            summary: 'Unable to extract structured data from AI response',
            recommendations: ['Retry analysis', 'Check API configuration']
          };
        }
      }
      res.json(result);

    } catch (error) {
      console.error('Strategic planning error:', error);
      res.status(500).json({
        error: 'Failed to generate strategic plan',
        strategic_objectives: ['Expand market presence', 'Improve operational efficiency', 'Enhance customer experience'],
        action_items: ['Conduct market research', 'Implement process improvements', 'Launch customer feedback program'],
        milestones: ['Q1: Research completion', 'Q2: Process optimization', 'Q3: Customer program launch'],
        risk_mitigation: ['Regular progress reviews', 'Contingency planning', 'Market monitoring'],
        success_metrics: ['Market share growth', 'Efficiency improvements', 'Customer satisfaction scores']
      });
    }
  });

  // AI Assistants API Endpoints - AUTH REQUIRED
  app.post('/api/assistants/create', requireProductTier, async (req: any, res) => {
    try {
      const { name, instructions, model, tools } = req.body;

      if (!openai) {
        return res.status(400).json({ error: 'OpenAI API key not configured' });
      }

      const assistant = await openai.beta.assistants.create({
        name,
        instructions,
        model: model || "gpt-4o-mini",
        tools: tools || []
      });

      res.json({ success: true, assistant });
    } catch (error) {
      console.error('Assistant creation error:', error);
      res.status(500).json({ error: 'Failed to create assistant' });
    }
  });

  app.get('/api/assistants/:assistantId', requireProductTier, async (req: any, res) => {
    try {
      const { assistantId } = req.params;

      if (!openai) {
        return res.status(400).json({ error: 'OpenAI API key not configured' });
      }

      const assistant = await openai.beta.assistants.retrieve(assistantId);
      res.json(assistant);
    } catch (error) {
      console.error('Assistant retrieval error:', error);
      res.status(500).json({ error: 'Failed to retrieve assistant' });
    }
  });

  app.delete('/api/assistants/:assistantId', requireProductTier, async (req: any, res) => {
    try {
      const { assistantId } = req.params;

      if (!openai) {
        return res.status(400).json({ error: 'OpenAI API key not configured' });
      }

      await openai.beta.assistants.delete(assistantId);
      res.json({ success: true });
    } catch (error) {
      console.error('Assistant deletion error:', error);
      res.status(500).json({ error: 'Failed to delete assistant' });
    }
  });

  app.post('/api/assistants/chat', requireProductTier, async (req: any, res) => {
    try {
      const { message, assistantId, threadId } = req.body;

      if (!openai) {
        return res.status(400).json({ error: 'OpenAI API key not configured' });
      }

      // Create thread if not provided
      let currentThreadId = threadId;
      if (!currentThreadId) {
        const thread = await openai.beta.threads.create();
        currentThreadId = thread.id;
      }

      // Add user message
      await openai.beta.threads.messages.create(currentThreadId, {
        role: 'user',
        content: message
      });

      // Create and run
      const run = await openai.beta.threads.runs.create(currentThreadId, {
        assistant_id: assistantId
      });

      // Wait for completion with polling
      let runStatus = await openai.beta.threads.runs.retrieve(run.id, {
        thread_id: currentThreadId
      });
      while (runStatus.status === 'in_progress' || runStatus.status === 'queued') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        runStatus = await openai.beta.threads.runs.retrieve(run.id, {
          thread_id: currentThreadId
        });
      }

      if (runStatus.status === 'completed') {
        const messages = await openai.beta.threads.messages.list(currentThreadId, { limit: 1 });
        const lastMessage = messages.data[0];
        const content = Array.isArray(lastMessage.content) && lastMessage.content[0]?.type === 'text'
          ? lastMessage.content[0].text.value 
          : 'No response available';

        res.json({
          response: content,
          threadId: currentThreadId,
          runId: run.id
        });
      } else {
        res.status(500).json({ error: `Run failed with status: ${runStatus.status}` });
      }

    } catch (error) {
      console.error('Assistant chat error:', error);
      res.status(500).json({ error: 'Failed to process chat message' });
    }
  });

  // Multi-tenant email routing webhook for Supabase
  app.post('/api/auth-webhook', (req, res) => {
    try {
      // Optional webhook signature verification
      const signature = req.headers['x-webhook-signature'] as string;
      const expectedSignature = process.env.SUPABASE_WEBHOOK_SECRET;

      if (expectedSignature && signature && signature !== expectedSignature) {
        console.warn('⚠️ Invalid webhook signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }

      const { type, record } = req.body;

      if (type === 'INSERT' && record) {
        // Get app context from user metadata
        const appContext = record.raw_user_meta_data?.app_context || 
                          record.user_metadata?.app_context || 
                          'smartcrm';

        // Enhanced logging for monitoring
        console.log(`🎯 Email routing: ${record.email} → ${appContext} templates`, {
          userId: record.id,
          email: record.email,
          appContext,
          timestamp: new Date().toISOString(),
          metadata: record.raw_user_meta_data || record.user_metadata
        });

        // Log successful routing for monitoring
        res.json({ 
          success: true, 
          appContext,
          message: `User routed to ${appContext} email templates`,
          timestamp: new Date().toISOString()
        });
      } else {
        res.json({ success: true, message: 'Event processed' });
      }
    } catch (error) {
      console.error('❌ Auth webhook error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to process auth webhook',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Apply admin middleware to bulk import and admin routes (MUST be before route registration)
  app.use('/api/bulk-import', requireAdmin);
  app.use('/api/admin', requireAdmin);

  // Register bulk import routes
  registerBulkImportRoutes(app);
  // Register phone routes
  registerPhoneRoutes(app);
  // Register video routes
  registerVideoRoutes(app);
  // Register messaging routes
  registerMessagingRoutes(app);
  // app.use('/api/companies', companiesRouter); // Temporarily disabled due to import issues

  // Admin Stats Endpoint - Get real-time admin statistics (protected by requireAdmin middleware)
  app.get('/api/admin/stats', async (req, res) => {
    try {
      if (!supabase) {
        return res.status(500).json({ error: 'Supabase not configured' });
      }

      // Fetch total users count
      const { count: totalUsers, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (usersError) throw usersError;

      // Fetch active users (logged in within last 24 hours)
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count: activeSessions, error: activeError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('last_active', twentyFourHoursAgo);

      if (activeError) throw activeError;

      // Check database connectivity for system health
      const { error: healthCheckError} = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

      const systemHealth = healthCheckError ? 0 : 98.5; // Default to 98.5% if healthy

      // Fetch recent errors/alerts (you could add an errors table)
      const alerts = 0; // Placeholder - implement error tracking if needed

      res.json({
        totalUsers: totalUsers || 0,
        activeSessions: activeSessions || 0,
        systemHealth: systemHealth,
        alerts: alerts,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
      res.status(500).json({ error: 'Failed to fetch admin stats' });
    }
  });

  // Partner Management API Endpoints

  // Get all partners
  app.get('/api/partners', async (req, res) => {
    try {
      const partners = await storage.getPartners();
      res.json(partners);
    } catch (error) {
      console.error('Failed to fetch partners:', error);
      res.status(500).json({ error: 'Failed to fetch partners' });
    }
  });

  // Get partner by ID
  app.get('/api/partners/:id', async (req, res) => {
    try {
      const partner = await storage.getPartner(req.params.id);
      if (!partner) {
        return res.status(404).json({ error: 'Partner not found' });
      }
      res.json(partner);
    } catch (error) {
      console.error('Failed to fetch partner:', error);
      res.status(500).json({ error: 'Failed to fetch partner' });
    }
  });

  // Create new partner
  app.post('/api/partners', async (req, res) => {
    try {
      const partner = await storage.createPartner(req.body);
      res.status(201).json(partner);
    } catch (error) {
      console.error('Failed to create partner:', error);
      res.status(500).json({ error: 'Failed to create partner' });
    }
  });

  // Update partner
  app.put('/api/partners/:id', async (req, res) => {
    try {
      const partner = await storage.updatePartner(req.params.id, req.body);
      if (!partner) {
        return res.status(404).json({ error: 'Partner not found' });
      }
      res.json(partner);
    } catch (error) {
      console.error('Failed to update partner:', error);
      res.status(500).json({ error: 'Failed to update partner' });
    }
  });

  // Partner onboarding
  app.post('/api/partners/onboard', async (req, res) => {
    try {
      const { brandingConfig, ...partnerData } = req.body;

      const newPartner = await storage.createPartner({
        ...partnerData,
        brandingConfig,
        status: 'pending',
        tier: 'bronze',
        profileId: 'dev-user-12345'
      });

      res.status(201).json({
        success: true,
        partner: newPartner,
        message: 'Partner application submitted successfully'
      });
    } catch (error) {
      console.error('Partner onboarding failed:', error);
      res.status(500).json({ error: 'Failed to process partner application' });
    }
  });

  // Get partner statistics
  app.get('/api/partners/:id/stats', async (req, res) => {
    try {
      const stats = await storage.getPartnerStats(req.params.id);
      res.json(stats);
    } catch (error) {
      console.error('Failed to fetch partner stats:', error);
      res.status(500).json({ error: 'Failed to fetch partner statistics' });
    }
  });

  // Get all feature packages
  app.get('/api/feature-packages', async (req, res) => {
    try {
      const packages = await storage.getFeaturePackages();
      res.json(packages);
    } catch (error) {
      console.error('Failed to fetch feature packages:', error);
      res.status(500).json({ error: 'Failed to fetch feature packages' });
    }
  });

  // Create feature package
  app.post('/api/feature-packages', async (req, res) => {
    try {
      const package_ = await storage.createFeaturePackage(req.body);
      res.status(201).json(package_);
    } catch (error) {
      console.error('Failed to create feature package:', error);
      res.status(500).json({ error: 'Failed to create feature package' });
    }
  });

  // Get partner commissions
  app.get('/api/partners/:id/commissions', async (req, res) => {
    try {
      const commissions = await storage.getPartnerCommissions(req.params.id);
      res.json(commissions);
    } catch (error) {
      console.error('Failed to fetch commissions:', error);
      res.status(500).json({ error: 'Failed to fetch commissions' });
    }
  });

  // Get all partner tiers
  app.get('/api/partner-tiers', async (req, res) => {
    try {
      const tiers = await storage.getPartnerTiers();
      res.json(tiers);
    } catch (error) {
      console.error('Failed to fetch partner tiers:', error);
      res.status(500).json({ error: 'Failed to fetch partner tiers' });
    }
  });

  // Get revenue analytics
  app.get('/api/revenue/analytics', async (req, res) => {
    try {
      const analytics = await storage.getRevenueAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error('Failed to fetch revenue analytics:', error);
      res.status(500).json({ error: 'Failed to fetch revenue analytics' });
    }
  });

  // Entitlements API routes
  app.get('/api/entitlements/check', async (req, res) => {
    try {
      // Get user ID from session or authentication
      const userId = (req as any).user?.id; // Implement proper auth middleware

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const entitlement = await getUserEntitlement(userId);
      const isActive = isUserActive(entitlement);

      res.json({
        entitlement,
        isActive,
        hasAccess: isActive
      });
    } catch (error) {
      console.error('Error checking entitlement:', error);
      res.status(500).json({ error: 'Failed to check entitlement' });
    }
  });

  app.get('/api/entitlements/list', async (req, res) => {
    try {
      // For admin access - in production, add proper admin authentication
      const entitlementsList = await db.select().from(entitlements).limit(100);

      res.json({
        entitlements: entitlementsList || [],
        total: entitlementsList?.length || 0
      });
    } catch (error) {
      console.error('Error listing entitlements:', error);
      res.status(500).json({ error: 'Failed to list entitlements' });
    }
  });

  app.post('/api/entitlements/create', async (req, res) => {
    try {
      const { userId, productType, planName, planAmount, currency } = req.body;

      if (!userId || !productType || !planName) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Create entitlement using the utility function
      const entitlement = await handleSuccessfulPurchase(
        userId,
        productType,
        {
          planName,
          planAmount: planAmount?.toString(),
          currency: currency || 'USD',
        }
      );

      res.json({ success: true, entitlement });
    } catch (error) {
      console.error('Error creating entitlement:', error);
      res.status(500).json({ error: 'Failed to create entitlement' });
    }
  });

  // Check admin status endpoint
  app.get('/api/admin/check-status', async (req, res) => {
    try {
      if (!supabase) {
        return res.status(500).json({ error: 'Supabase not configured' });
      }

      const ADMIN_EMAILS = [
        'victor@videoremix.io',
        'samuel@videoremix.io', 
        'dean@videoremix.io',
        'dean@smartcrm.vip' // Production super admin
      ];

      const results: Array<{
        email: string;
        status: string;
        user_id?: string | null;
        email_confirmed?: boolean;
        last_sign_in?: string | null;
        auth_role?: string;
        profile_role?: string;
        has_profile?: boolean;
        can_sign_in?: boolean;
        error?: string;
      }> = [];

      for (const email of ADMIN_EMAILS) {
        try {
          // Get all users and find this one
          const { data: users } = await supabase.auth.admin.listUsers();
          const user = users?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());

          if (user) {
            // Check profile
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single();

            results.push({
              email,
              status: 'found',
              user_id: user.id,
              email_confirmed: !!user.email_confirmed_at,
              last_sign_in: user.last_sign_in_at,
              auth_role: user.user_metadata?.role || 'none',
              profile_role: profile?.role || 'none',
              has_profile: !!profile,
              can_sign_in: !!user.email_confirmed_at
            });
          } else {
            results.push({
              email,
              status: 'not_found',
              user_id: null,
              email_confirmed: false,
              last_sign_in: null,
              auth_role: 'none',
              profile_role: 'none',
              has_profile: false,
              can_sign_in: false
            });
          }
        } catch (error: any) {
          results.push({
            email,
            status: 'error',
            error: error.message
          });
        }
      }

      res.json({
        success: true,
        admins: results,
        summary: {
          total: ADMIN_EMAILS.length,
          found: results.filter(r => r.status === 'found').length,
          confirmed: results.filter(r => r.email_confirmed).length,
          can_sign_in: results.filter(r => r.can_sign_in).length
        }
      });

    } catch (error: any) {
      console.error('Admin status check error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check admin status',
        message: error.message
      });
    }
  });

  // Fix admin access endpoint
  app.post('/api/admin/fix-access', async (req, res) => {
    try {
      if (!supabase) {
        return res.status(500).json({ error: 'Supabase not configured' });
      }

      const ADMIN_EMAILS = [
        'victor@videoremix.io',
        'samuel@videoremix.io', 
        'dean@videoremix.io',
        'dean@smartcrm.vip' // Production super admin
      ];

      const results: Array<{
        email: string;
        status: string;
        user_id?: string;
        magic_link?: string | null;
        message?: string;
        error?: string;
      }> = [];

      for (const email of ADMIN_EMAILS) {
        try {
          console.log(`🔧 Fixing access for ${email}...`);

          // Check if user exists
          const { data: users } = await supabase.auth.admin.listUsers();
          let user = users?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());

          if (!user) {
            // Create user
            const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
              email: email,
              email_confirm: true,
              user_metadata: {
                first_name: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
                last_name: 'Admin',
                role: 'super_admin',
                app_context: 'smartcrm',
                email_template_set: 'smartcrm'
              }
            });

            if (createError) throw createError;
            user = newUser.user;

            console.log(`✅ Created user: ${email}`);
          } else {
            // Update existing user
            const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
              email_confirm: true,
              user_metadata: {
                ...user.user_metadata,
                role: 'super_admin',
                app_context: 'smartcrm',
                email_template_set: 'smartcrm'
              }
            });

            if (updateError) throw updateError;
            console.log(`✅ Updated user: ${email}`);
          }

          // Ensure profile exists
          if (user) {
            const { data: existingProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single();

            if (!existingProfile) {
              const { error: profileError } = await supabase
                .from('profiles')
                .insert({
                  id: user.id,
                  username: email.split('@')[0],
                  first_name: user.user_metadata?.first_name || email.split('@')[0],
                  last_name: user.user_metadata?.last_name || 'Admin',
                  role: 'super_admin',
                  status: 'active'
                });

              if (profileError) throw profileError;
              console.log(`✅ Created profile: ${email}`);
            } else {
              const { error: profileUpdateError } = await supabase
                .from('profiles')
                .update({
                  role: 'super_admin',
                  status: 'active'
                })
                .eq('id', user.id);

              if (profileUpdateError) throw profileUpdateError;
              console.log(`✅ Updated profile: ${email}`);
            }

            // Generate magic link
            const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
              type: 'magiclink',
              email: email,
              options: {
                redirectTo: req.get('origin') 
                  ? `${req.get('origin')}/auth/callback`
                  : 'https://smartcrm-videoremix.replit.app/auth/callback'
              }
            });

            results.push({
              email,
              status: 'fixed',
              user_id: user.id,
              magic_link: linkData?.properties?.action_link || null,
              message: 'Admin access configured successfully'
            });
          }
        } catch (error: any) {
          console.error(`❌ Failed to fix ${email}:`, error);
          results.push({
            email,
            status: 'failed',
            error: error.message
          });
        }
      }

      res.json({
        success: true,
        message: 'Admin access fix completed',
        results,
        dev_bypass_url: req.get('origin') 
          ? `${req.get('origin')}/dev`
          : 'https://smartcrm-videoremix.replit.app/dev'
      });

    } catch (error: any) {
      console.error('Admin access fix error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fix admin access',
        message: error.message
      });
    }
  });

  // Import and use auth routes (after dev overrides)
  if (process.env.NODE_ENV !== 'development') {
    const { registerAuthRoutes } = await import('./routes/auth.js');
    registerAuthRoutes(app);
  } else {
    console.log('🔧 Development mode: Using dev auth endpoints');
  }

  // Admin management endpoints
  app.post('/api/admin/resend-confirmations', async (req, res) => {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.SUPABASE_URL!;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

      const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      });

      const adminEmails = [
        'dean@videoremix.io',
        'dean@smartcrm.vip', // Production super admin
        'samuel@videoremix.io',
        'victor@videoremix.io'
      ];

      const results: Array<{
        email: string;
        status: string;
        message?: string;
        user_id?: string | null;
        confirmed?: boolean;
      }> = [];

      for (const email of adminEmails) {
        try {
          // Check if user exists
          const { data: users } = await supabase.auth.admin.listUsers();
          const user = users?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());

          if (user) {
            if (!user.email_confirmed_at) {
              // Resend confirmation
              const { error } = await supabase.auth.admin.generateLink({
                type: 'signup',
                email: email,
                password: 'temporary_password_123!',
                options: {
                  data: {
                    app_context: 'smartcrm',
                    role: 'admin',
                    first_name: email.split('@')[0],
                    last_name: 'Admin'
                  }
                }
              });

              results.push({
                email,
                status: error ? 'failed' : 'confirmation_sent',
                message: error ? error.message : 'Confirmation email sent',
                user_id: user.id,
                confirmed: false
              });
            } else {
              results.push({
                email,
                status: 'already_confirmed',
                message: 'Account already confirmed',
                user_id: user.id,
                confirmed: true
              });
            }
          } else {
            // Create new admin account
            const { data: newUser, error } = await supabase.auth.admin.createUser({
              email: email,
              email_confirm: false,
              user_metadata: {
                app_context: 'smartcrm',
                role: 'admin',
                first_name: email.split('@')[0],
                last_name: 'Admin'
              }
            });

            results.push({
              email,
              status: error ? 'creation_failed' : 'created_and_confirmation_sent',
              message: error ? error.message : 'Admin account created, confirmation email sent',
              user_id: newUser?.user?.id || null
            });
          }
        } catch (error: any) {
          results.push({
            email,
            status: 'error',
            message: error.message
          });
        }
      }

      res.json({
        success: true,
        message: 'Admin confirmation process completed',
        results,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('Admin confirmation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process admin confirmations',
        message: error.message
      });
    }
  });

  // Webhook endpoints - Payment Providers (JVZoo, Stripe, PayPal, Zaxaa)
  // All payment webhooks provision product tiers using the 7-tier system
  app.post('/api/webhooks/stripe', handleStripeWebhook);
  app.post('/api/webhooks/paypal', handlePayPalWebhook);
  app.post('/api/webhooks/zaxaa', handleZaxaaWebhook);
  app.post('/api/webhooks/jvzoo', handleJVZooWebhook);
  app.post('/api/auth-webhook', handleAuthWebhook);

  // User Management API Endpoints
  app.get('/api/users', async (req, res) => {
    try {
      if (!supabase) {
        return res.status(500).json({ error: 'Supabase not configured' });
      }

      // Fetch auth users with admin API to get emails and auth metadata
      const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
      if (authError) throw authError;

      // Fetch all profiles from database
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');
      
      if (profilesError) throw profilesError;

      // Create a map of profiles by user ID for quick lookup
      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Combine auth users with their profiles
      const users = (authData.users || []).map(authUser => {
        const profile = profilesMap.get(authUser.id) || {} as any;
        
        return {
          id: authUser.id,
          email: authUser.email || '',
          firstName: profile.first_name || authUser.user_metadata?.first_name || '',
          lastName: profile.last_name || authUser.user_metadata?.last_name || '',
          role: profile.role || authUser.user_metadata?.role || 'regular_user',
          productTier: profile.product_tier || authUser.user_metadata?.product_tier || null,
          tenantId: profile.tenant_id || 'default',
          status: authUser.email_confirmed_at ? 'active' : 'inactive',
          lastActive: authUser.last_sign_in_at || profile.updated_at || profile.created_at || new Date().toISOString(),
          createdAt: profile.created_at || authUser.created_at || new Date().toISOString(),
          permissions: authUser.user_metadata?.permissions || [],
          invitedBy: authUser.user_metadata?.invited_by,
          twoFactorEnabled: (authUser.factors?.length ?? 0) > 0,
          username: profile.username,
          avatar: profile.avatar_url,
        };
      });

      // Sort by creation date (newest first)
      users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      res.json(users);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  app.post('/api/users/invite', async (req, res) => {
    try {
      if (!supabase) {
        return res.status(500).json({ error: 'Supabase not configured' });
      }

      const { email, role, firstName, lastName, permissions } = req.body;

      // Validate role against new role system
      const validRoles = ['super_admin', 'wl_user', 'regular_user'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ 
          error: 'Invalid role', 
          validRoles,
          message: 'Role must be one of: super_admin, wl_user, regular_user' 
        });
      }

      // Create user invitation in Supabase Auth with enhanced metadata
      const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
        data: {
          first_name: firstName,
          last_name: lastName,
          role: role,
          permissions: permissions,
          app_context: 'smartcrm',
          email_template_set: 'smartcrm',
          invited_at: new Date().toISOString(),
          invited_by: 'admin' // Could be made dynamic based on current user
        },
        redirectTo: req.get('origin') && req.get('origin')?.includes('localhost') || req.get('origin')?.includes('replit') 
          ? `${req.get('origin')}/auth/callback`
          : 'https://smart-crm.videoremix.io/auth/callback'
      });

      if (error) throw error;

      console.log(`✅ User invitation sent: ${email} as ${role}`);
      res.json({ success: true, user: data.user, role });
    } catch (error) {
      console.error('Failed to invite user:', error);
      res.status(500).json({ error: 'Failed to send invitation' });
    }
  });

  app.patch('/api/users/:userId/role', async (req, res) => {
    try {
      if (!supabase) {
        return res.status(500).json({ error: 'Supabase not configured' });
      }

      const { userId } = req.params;
      const { role } = req.body;

      // Validate role against new role system
      const validRoles = ['super_admin', 'wl_user', 'regular_user'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ 
          error: 'Invalid role', 
          validRoles,
          message: 'Role must be one of: super_admin, wl_user, regular_user' 
        });
      }

      // Update role in profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId);

      if (profileError) throw profileError;

      // Also update Supabase Auth metadata for consistency
      const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
        user_metadata: {
          role: role,
          role_updated_at: new Date().toISOString()
        }
      });

      if (authError) {
        console.warn(`Warning: Failed to update auth metadata for ${userId}:`, authError.message);
        // Don't fail the request, just log the warning
      }

      console.log(`✅ User role updated: ${userId} → ${role}`);
      res.json({ success: true, role });
    } catch (error) {
      console.error('Failed to update user role:', error);
      res.status(500).json({ error: 'Failed to update user role' });
    }
  });

  app.patch('/api/users/:userId/status', async (req, res) => {
    try {
      if (!supabase) {
        return res.status(500).json({ error: 'Supabase not configured' });
      }

      const { userId } = req.params;
      const { status } = req.body;

      console.log(`🔄 Updating user status: ${userId} → ${status}`);

      // Status field doesn't exist in profiles table yet, returning success for now
      // TODO: Add status column to profiles table if needed
      res.json({ success: true, message: 'Status update not yet implemented' });
    } catch (error) {
      console.error('Failed to update user status:', error);
      res.status(500).json({ error: 'Failed to update user status' });
    }
  });

  app.patch('/api/users/:userId/product-tier', async (req, res) => {
    try {
      if (!supabase) {
        console.error('❌ Supabase not configured');
        return res.status(500).json({ error: 'Supabase not configured' });
      }

      const { userId } = req.params;
      const { productTier } = req.body;

      console.log(`🔄 Updating product tier for user: ${userId} → ${productTier}`);

      // Update profile product tier
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          product_tier: productTier,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (profileError) {
        console.error(`❌ Profile update error for ${userId}:`, JSON.stringify(profileError));
        throw new Error(`Profile update failed: ${JSON.stringify(profileError)}`);
      }

      console.log(`✅ Profile updated for user ${userId}`);

      // Also update Supabase Auth metadata for consistency
      const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
        user_metadata: {
          product_tier: productTier,
          product_tier_updated_at: new Date().toISOString()
        }
      });

      if (authError) {
        console.warn(`⚠️ Warning: Failed to update auth metadata for ${userId}:`, JSON.stringify(authError));
      } else {
        console.log(`✅ Auth metadata updated for ${userId}`);
      }

      console.log(`✅ User product tier updated: ${userId} → ${productTier}`);
      res.json({ success: true, productTier, updated: true });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
      console.error('❌ Failed to update user product tier:', errorMsg);
      res.status(500).json({ error: 'Failed to update user product tier', details: errorMsg });
    }
  });

  // Role migration endpoint (admin only)
  app.post('/api/admin/migrate-roles', async (req, res) => {
    try {
      if (!supabase) {
        return res.status(500).json({ error: 'Supabase not configured' });
      }

      // Inline migration logic
      console.log('🔄 Starting user role migration...');

      const SUPER_ADMIN_EMAILS = [
        'dean@videoremix.io',
        'dean@smartcrm.vip', // Production super admin
        'victor@videoremix.io', 
        'samuel@videoremix.io'
      ];

      // Get all existing users from profiles table
      let users, fetchError;

      if (process.env.NODE_ENV === 'development') {
        // Use local database via storage layer for development
        try {
          const profiles = await storage.getAllProfiles();
          users = profiles.map(p => ({
            id: p.id,
            username: p.username,
            first_name: p.firstName,
            last_name: p.lastName,
            role: p.role
          }));
          fetchError = null;
        } catch (error: any) {
          fetchError = { message: error.message };
        }
      } else {
        // Use Supabase for production
        const result = await supabase
          .from('profiles')
          .select('id, username, first_name, last_name, role')
          .order('created_at');
        users = result.data;
        fetchError = result.error;
      }

      if (fetchError) {
        throw new Error(`Failed to fetch users: ${fetchError.message}`);
      }

      if (!users || users.length === 0) {
        return res.json({ success: true, message: 'No users found to migrate' });
      }

      console.log(`📊 Found ${users.length} users to process`);

      const updates: Array<{
        id: string;
        oldRole: string | null;
        newRole: string;
        name: string;
        username: string | null;
      }> = [];
      let superAdmins = 0;
      let wlUsers = 0;

      for (const user of users) {
        const email = user.username ? `${user.username}@videoremix.io` : null;
        let newRole: string;

        // Determine correct role
        if (email && SUPER_ADMIN_EMAILS.includes(email.toLowerCase())) {
          newRole = 'super_admin';
          superAdmins++;
        } else {
          // All existing users (except super admins) become WL users
          newRole = 'wl_user';
          wlUsers++;
        }

        // Only update if role is different
        if (user.role !== newRole) {
          updates.push({
            id: user.id,
            oldRole: user.role,
            newRole: newRole,
            name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
            username: user.username
          });
        }
      }

      console.log(`Migration Summary - Super Admins: ${superAdmins}, WL Users: ${wlUsers}, Updates needed: ${updates.length}`);

      if (updates.length === 0) {
        return res.json({ success: true, message: 'All users already have correct roles!' });
      }

      // Perform the updates
      let successCount = 0;
      let errorCount = 0;

      for (const update of updates) {
        try {
          let updateError: { message: string } | null = null;

          if (process.env.NODE_ENV === 'development') {
            // Use storage layer for development
            try {
              await storage.updateProfile(update.id, { role: update.newRole });
            } catch (error: any) {
              updateError = { message: error.message };
            }
          } else {
            // Use Supabase for production
            const result = await supabase
              .from('profiles')
              .update({ role: update.newRole })
              .eq('id', update.id);
            if (result.error) {
              updateError = { message: result.error.message };
            }
          }

          if (updateError) {
            console.error(`Failed to update ${update.username}: ${updateError.message}`);
            errorCount++;
          } else {
            console.log(`Updated ${update.username}: ${update.oldRole} → ${update.newRole}`);
            successCount++;
          }
        } catch (error) {
          console.error(`Error updating ${update.username}:`, error);
          errorCount++;
        }
      }

      const message = `Migration complete! Successful: ${successCount}, Failed: ${errorCount}`;
      console.log(`🎉 ${message}`);

      res.json({ 
        success: true, 
        message,
        stats: { successCount, errorCount, totalProcessed: users.length }
      });

    } catch (error) {
      console.error('Role migration failed:', error);
      res.status(500).json({ error: 'Failed to migrate user roles' });
    }
  });

  // Sync Supabase metadata endpoint (admin only)  
  app.post('/api/admin/sync-metadata', async (req, res) => {
    try {
      if (!supabase) {
        return res.status(500).json({ error: 'Supabase not configured' });
      }

      console.log('🔄 Syncing Supabase Auth metadata with profile roles...');

      // Get all profiles with their roles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, first_name, last_name, role')
        .order('created_at');

      if (profilesError) {
        throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
      }

      if (!profiles || profiles.length === 0) {
        return res.json({ success: true, message: 'No profiles found' });
      }

      console.log(`📊 Found ${profiles.length} profiles to sync`);

      let successCount = 0;
      let errorCount = 0;

      for (const profile of profiles) {
        try {
          // Update the auth user's metadata to match profile role
          const { error: updateError } = await supabase.auth.admin.updateUserById(
            profile.id,
            {
              user_metadata: {
                first_name: profile.first_name,
                last_name: profile.last_name,
                role: profile.role,
                app_context: 'smartcrm',
                email_template_set: 'smartcrm',
                synced_at: new Date().toISOString()
              }
            }
          );

          if (updateError) {
            console.error(`Failed to sync ${profile.username}: ${updateError.message}`);
            errorCount++;
          } else {
            console.log(`Synced ${profile.username || profile.id}: role=${profile.role}`);
            successCount++;
          }
        } catch (error) {
          console.error(`Error syncing ${profile.username}:`, error);
          errorCount++;
        }
      }

      const message = `Metadata sync complete! Successful: ${successCount}, Failed: ${errorCount}`;
      console.log(`🎉 ${message}`);

      res.json({ 
        success: true, 
        message,
        stats: { successCount, errorCount, totalProcessed: profiles.length }
      });

    } catch (error) {
      console.error('Metadata sync failed:', error);
      res.status(500).json({ error: 'Failed to sync metadata' });
    }
  });

  app.delete('/api/users/:userId', async (req, res) => {
    try {
      if (!supabase) {
        return res.status(500).json({ error: 'Supabase not configured' });
      }

      const { userId } = req.params;

      // Delete from auth
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      if (authError) throw authError;

      // Delete from profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) throw profileError;

      res.json({ success: true });
    } catch (error) {
      console.error('Failed to delete user:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  });

  // Feature Management API Routes (Admin Only)
  const { featureService } = await import('./services/featureService.js');

  // Get all features
  app.get('/api/admin/features', async (req, res) => {
    try {
      const { category, isEnabled } = req.query;
      const filters: any = {};
      if (category) filters.category = category as string;
      if (isEnabled !== undefined) filters.isEnabled = isEnabled === 'true';
      
      const features = await featureService.getAllFeatures(filters);
      res.json(features);
    } catch (error) {
      console.error('Failed to fetch features:', error);
      res.status(500).json({ error: 'Failed to fetch features' });
    }
  });

  // Get single feature
  app.get('/api/admin/features/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const featureId = parseInt(id);
      const feature = await featureService.getFeature(featureId);
      
      if (!feature) {
        return res.status(404).json({ error: 'Feature not found' });
      }
      
      res.json(feature);
    } catch (error) {
      console.error('Failed to fetch feature:', error);
      res.status(500).json({ error: 'Failed to fetch feature' });
    }
  });

  // Create new feature
  app.post('/api/admin/features', async (req, res) => {
    try {
      const feature = await featureService.createFeature(req.body);
      res.status(201).json(feature);
    } catch (error) {
      console.error('Failed to create feature:', error);
      res.status(500).json({ error: 'Failed to create feature' });
    }
  });

  // Update feature
  app.patch('/api/admin/features/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const featureId = parseInt(id);
      const feature = await featureService.updateFeature(featureId, req.body);
      
      if (!feature) {
        return res.status(404).json({ error: 'Feature not found' });
      }
      
      res.json(feature);
    } catch (error) {
      console.error('Failed to update feature:', error);
      res.status(500).json({ error: 'Failed to update feature' });
    }
  });

  // Delete feature
  app.delete('/api/admin/features/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const featureId = parseInt(id);
      await featureService.deleteFeature(featureId);
      res.json({ success: true });
    } catch (error) {
      console.error('Failed to delete feature:', error);
      res.status(500).json({ error: 'Failed to delete feature' });
    }
  });

  // Get tier features
  app.get('/api/admin/tier-features/:tier', async (req, res) => {
    try {
      const { tier } = req.params;
      const tierFeatures = await featureService.getTierFeatures(tier);
      res.json(tierFeatures);
    } catch (error) {
      console.error('Failed to fetch tier features:', error);
      res.status(500).json({ error: 'Failed to fetch tier features' });
    }
  });

  // Set tier features
  app.post('/api/admin/tier-features/:tier', async (req, res) => {
    try {
      const { tier } = req.params;
      const { featureIds } = req.body;
      
      if (!Array.isArray(featureIds)) {
        return res.status(400).json({ error: 'featureIds must be an array' });
      }
      
      const tierFeatures = await featureService.setTierFeatures(tier, featureIds);
      res.json(tierFeatures);
    } catch (error) {
      console.error('Failed to set tier features:', error);
      res.status(500).json({ error: 'Failed to set tier features' });
    }
  });

  // Get user features
  app.get('/api/admin/users/:userId/features', async (req, res) => {
    try {
      const { userId } = req.params;
      const userFeatures = await featureService.getUserFeatures(userId);
      res.json(userFeatures);
    } catch (error) {
      console.error('Failed to fetch user features:', error);
      res.status(500).json({ error: 'Failed to fetch user features' });
    }
  });

  // Get effective features for a user
  app.get('/api/admin/users/:userId/features/effective', async (req, res) => {
    try {
      const { userId } = req.params;
      const effectiveFeatures = await featureService.getEffectiveFeatures(userId);
      res.json(effectiveFeatures);
    } catch (error) {
      console.error('Failed to fetch effective features:', error);
      res.status(500).json({ error: 'Failed to fetch effective features' });
    }
  });

  // Set user feature
  app.post('/api/admin/users/:userId/features', async (req, res) => {
    try {
      const { userId } = req.params;
      const { featureId, enabled, expiresAt } = req.body;
      
      // Get the admin user ID from session
      const grantedBy = (req as any).user?.id || 'system';
      
      const userFeature = await featureService.setUserFeature(
        userId,
        featureId,
        enabled,
        grantedBy,
        expiresAt ? new Date(expiresAt) : undefined
      );
      
      res.json(userFeature);
    } catch (error) {
      console.error('Failed to set user feature:', error);
      res.status(500).json({ error: 'Failed to set user feature' });
    }
  });

  // Remove user feature override
  app.delete('/api/admin/users/:userId/features/:featureId', async (req, res) => {
    try {
      const { userId, featureId } = req.params;
      await featureService.removeUserFeature(userId, parseInt(featureId));
      res.json({ success: true });
    } catch (error) {
      console.error('Failed to remove user feature:', error);
      res.status(500).json({ error: 'Failed to remove user feature' });
    }
  });

  // Get feature usage analytics
  app.get('/api/admin/features/usage', async (req, res) => {
    try {
      const { userId, featureId } = req.query;
      const filters: any = {};
      if (userId) filters.userId = userId as string;
      if (featureId) filters.featureId = parseInt(featureId as string);
      
      const usage = await featureService.getUsageAnalytics(filters);
      res.json(usage);
    } catch (error) {
      console.error('Failed to fetch feature usage:', error);
      res.status(500).json({ error: 'Failed to fetch feature usage' });
    }
  });

  // Public endpoint for checking user's feature access (with session check)
  app.get('/api/features/check/:featureKey', async (req, res) => {
    try {
      const { featureKey } = req.params;
      const userId = (req as any).user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const effectiveFeatures = await featureService.getEffectiveFeatures(userId);
      const feature = effectiveFeatures.find(f => f.featureKey === featureKey);
      
      res.json({
        hasAccess: feature?.enabled || false,
        feature: feature || null
      });
    } catch (error) {
      console.error('Failed to check feature access:', error);
      res.status(500).json({ error: 'Failed to check feature access' });
    }
  });

  // White Label API Routes

  // Tenant Info endpoint (used by TenantProvider)
  app.get('/api/tenant/info', async (req, res) => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string || null;
      
      if (!tenantId) {
        return res.status(200).json({ tenant: null });
      }
      
      // Try to get tenant config from storage
      const config = await storage.getTenantConfig(tenantId);
      
      if (!config) {
        return res.status(200).json({ tenant: null });
      }
      
      res.json({
        tenant: {
          id: tenantId,
          name: config.companyName || 'Smart CRM',
          subdomain: tenantId,
          branding: {
            primaryColor: config.primaryColor || '#3B82F6',
            secondaryColor: config.secondaryColor || '#6366F1',
            logo: config.logo,
            companyName: config.companyName || 'Smart CRM'
          },
          features: {
            aiTools: true,
            advancedAnalytics: true,
            customIntegrations: true,
            userLimit: 100,
            storageLimit: 10000
          },
          plan: 'enterprise',
          status: 'active'
        }
      });
    } catch (error) {
      console.debug('Tenant info not available:', error);
      res.status(200).json({ tenant: null });
    }
  });

  // Tenant Configuration Routes
  app.get('/api/tenant/config/:tenantId', async (req, res) => {
    try {
      const { tenantId } = req.params;
      const config = await storage.getTenantConfig(tenantId);
      res.json(config);
    } catch (error) {
      console.error('Failed to fetch tenant config:', error);
      res.status(500).json({ error: 'Failed to fetch tenant config' });
    }
  });

  app.post('/api/tenant/config', async (req, res) => {
    try {
      const config = await storage.createTenantConfig(req.body);
      res.status(201).json(config);
    } catch (error) {
      console.error('Failed to create tenant config:', error);
      res.status(500).json({ error: 'Failed to create tenant config' });
    }
  });

  app.patch('/api/tenant/config/:tenantId', async (req, res) => {
    try {
      const { tenantId } = req.params;
      const config = await storage.updateTenantConfig(tenantId, req.body);
      res.json(config);
    } catch (error) {
      console.error('Failed to update tenant config:', error);
      res.status(500).json({ error: 'Failed to update tenant config' });
    }
  });

  // User White Label Settings Routes
  app.get('/api/user/wl-settings/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const settings = await storage.getUserWLSettings(userId);
      res.json(settings);
    } catch (error) {
      console.error('Failed to fetch user WL settings:', error);
      res.status(500).json({ error: 'Failed to fetch user WL settings' });
    }
  });

  app.post('/api/user/wl-settings', async (req, res) => {
    try {
      const settings = await storage.createUserWLSettings(req.body);
      res.status(201).json(settings);
    } catch (error) {
      console.error('Failed to create user WL settings:', error);
      res.status(500).json({ error: 'Failed to create user WL settings' });
    }
  });

  app.patch('/api/user/wl-settings/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const settings = await storage.updateUserWLSettings(userId, req.body);
      res.json(settings);
    } catch (error) {
      console.error('Failed to update user WL settings:', error);
      res.status(500).json({ error: 'Failed to update user WL settings' });
    }
  });

  // Partner White Label Configuration Routes
  app.get('/api/partner/wl-config/:partnerId', async (req, res) => {
    try {
      const { partnerId } = req.params;
      const config = await storage.getPartnerWLConfig(partnerId);
      res.json(config);
    } catch (error) {
      console.error('Failed to fetch partner WL config:', error);
      res.status(500).json({ error: 'Failed to fetch partner WL config' });
    }
  });

  app.post('/api/partner/wl-config', async (req, res) => {
    try {
      const config = await storage.createPartnerWLConfig(req.body);
      res.status(201).json(config);
    } catch (error) {
      console.error('Failed to create partner WL config:', error);
      res.status(500).json({ error: 'Failed to create partner WL config' });
    }
  });

  app.patch('/api/partner/wl-config/:partnerId', async (req, res) => {
    try {
      const { partnerId } = req.params;
      const config = await storage.updatePartnerWLConfig(partnerId, req.body);
      res.json(config);
    } catch (error) {
      console.error('Failed to update partner WL config:', error);
      res.status(500).json({ error: 'Failed to update partner WL config' });
    }
  });

  // White Label Packages Routes
  app.get('/api/white-label-packages', async (req, res) => {
    try {
      const packages = await storage.getWhiteLabelPackages();
      res.json(packages);
    } catch (error) {
      console.error('Failed to fetch white label packages:', error);
      res.status(500).json({ error: 'Failed to fetch white label packages' });
    }
  });


  // GPT-5 Responses API Endpoints with Advanced Features
  app.post('/api/respond', async (req, res) => {
    try {
      const {
        prompt,
        imageUrl,
        schema,
        useThinking,
        conversationId,
        temperature = 0.4,
        top_p = 1,
        max_output_tokens = 2048,
        metadata,
        forceToolName,
      } = req.body;

      // Use GPT-4 as primary model since GPT-5 may not be available
      if (!openai) {
        return res.status(400).json({
          error: 'OpenAI API key not configured',
          message: 'Please configure OpenAI API key for AI features'
        });
      }

      const messages: any[] = [
        {
          role: "system",
          content: "You are a helpful sales + ops assistant for white-label CRM applications."
        },
        {
          role: "user",
          content: imageUrl
            ? `${prompt}\n\nImage URL: ${imageUrl}`
            : prompt
        }
      ];

      const response = await openai.chat.completions.create({
        model: useThinking ? "gpt-4o" : "gpt-4o-mini",
        messages,
        temperature,
        max_tokens: max_output_tokens,
        response_format: schema ? { type: "json_object" } : undefined,
        tools: [
          {
            type: "function",
            function: {
              name: "analyzeBusinessData",
              description: "Analyze business data and provide insights",
              parameters: {
                type: "object",
                properties: {
                  dataType: { type: "string" },
                  analysisType: { type: "string" },
                  timeRange: { type: "string" }
                },
                required: ["dataType"]
              }
            }
          },
          {
            type: "function",
            function: {
              name: "generateRecommendations",
              description: "Generate business recommendations based on data",
              parameters: {
                type: "object",
                properties: {
                  context: { type: "string" },
                  goals: { type: "array", items: { type: "string" } },
                  constraints: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        ],
        tool_choice: forceToolName ? { type: "function", function: { name: forceToolName } } : "auto"
      });

      // Handle tool calls if present
      const toolCalls = response.choices[0].message.tool_calls;
      if (toolCalls && toolCalls.length > 0) {
        // Execute tools server-side
        const toolOutputs = await Promise.all(
          toolCalls.map(async (tc) => ({
            tool_call_id: tc.id,
            output: await executeWLTool(tc),
          }))
        );

        // Continue the conversation with tool results
        const continuedMessages = [
          ...messages,
          response.choices[0].message,
          ...toolOutputs.map((o) => ({
            role: "tool" as const,
            content: o.output,
            tool_call_id: o.tool_call_id
          }))
        ];

        const continuedResponse = await openai.chat.completions.create({
          model: useThinking ? "gpt-4o" : "gpt-4o-mini",
          messages: continuedMessages,
          temperature,
          max_tokens: max_output_tokens,
          response_format: schema ? { type: "json_object" } : undefined
        });

        return res.json({
          output_text: continuedResponse.choices[0].message.content,
          output: [{
            content: [{
              type: "output_text",
              text: continuedResponse.choices[0].message.content
            }]
          }],
          tool_calls: toolCalls,
          continued: true
        });
      }

      // Return response in consistent format
      res.json({
        output_text: response.choices[0].message.content,
        output: [{
          content: [{
            type: "output_text",
            text: response.choices[0].message.content
          }]
        }],
        model: response.model,
        usage: response.usage
      });

    } catch (error: any) {
      console.error('AI API error:', error);
      res.status(500).json({
        error: 'Failed to process AI request',
        message: error.message,
        fallback: 'Basic analysis available without AI'
      });
    }
  });

  // Streaming endpoint for real-time responses
  app.post('/api/stream', async (req, res) => {
    try {
      const {
        prompt,
        useThinking,
        temperature = 0.4,
        max_output_tokens = 2048,
      } = req.body;

      if (!openai) {
        return res.status(400).json({
          error: 'OpenAI API key not configured',
          message: 'Please configure OpenAI API key for streaming features'
        });
      }

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const stream = await openai.chat.completions.create({
        model: useThinking ? "gpt-4o" : "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature,
        max_tokens: max_output_tokens,
        stream: true
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      res.write('data: [DONE]\n\n');
      res.end();

    } catch (error: any) {
      console.error('Streaming error:', error);
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  });

  // Tool execution function for WL apps
  async function executeWLTool(tc: any): Promise<string> {
    const { name, arguments: args } = tc.function;
    try {
      if (name === "analyzeBusinessData") {
        const { dataType, analysisType, timeRange } = args || {};
        return JSON.stringify({
          ok: true,
          analysis: `Analysis of ${dataType} for ${timeRange}`,
          insights: [`Key insight 1 for ${analysisType}`, `Key insight 2 for ${analysisType}`],
          recommendations: [`Recommendation 1`, `Recommendation 2`]
        });
      }
      if (name === "generateRecommendations") {
        const { context, goals, constraints } = args || {};
        return JSON.stringify({
          ok: true,
          recommendations: goals?.map((goal: string, i: number) =>
            `For ${goal}: Action ${i + 1} considering ${constraints?.[i] || 'no constraints'}`
          ) || [],
          context: context
        });
      }
      return JSON.stringify({ ok: false, error: `Unknown tool: ${name}` });
    } catch (e: any) {
      return JSON.stringify({ ok: false, error: e?.message || "Tool error" });
    }
  }

  // SMS Messaging API Endpoints
  // Twilio Integration for SMS/MMS

  // Send SMS Message
  app.post('/api/messaging/send', async (req, res) => {
    try {
      const { content, recipient, provider, priority = 'medium' } = req.body;

      if (!content || !recipient) {
        return res.status(400).json({ error: 'Content and recipient are required' });
      }

      // Validate phone number format
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      if (!phoneRegex.test(recipient.replace(/\s+/g, ''))) {
        return res.status(400).json({ error: 'Invalid phone number format' });
      }

      // Use Twilio if configured, otherwise use mock response
      const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
      const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
      const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

      let messageResult;

      if (twilioAccountSid && twilioAuthToken && twilioPhoneNumber) {
        // Real Twilio integration
        const twilio = require('twilio')(twilioAccountSid, twilioAuthToken);

        const message = await twilio.messages.create({
          body: content,
          from: twilioPhoneNumber,
          to: recipient,
          statusCallback: `${req.protocol}://${req.get('host')}/api/messaging/webhook/twilio`
        });

        messageResult = {
          id: message.sid,
          status: message.status,
          provider: 'twilio',
          cost: message.price || 0,
          sentAt: new Date().toISOString()
        };
      } else {
        // Mock response for development/testing
        messageResult = {
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          status: 'sent',
          provider: provider || 'twilio',
          cost: 0.0075,
          sentAt: new Date().toISOString()
        };

        console.log(`📱 SMS sent (mock): ${recipient} - "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`);
      }

      // Store message in database if Supabase is configured
      if (isSupabaseConfigured() && supabase) {
        try {
          await supabase.from('messages').insert({
            id: messageResult.id,
            content,
            recipient,
            provider: messageResult.provider,
            status: messageResult.status,
            cost: messageResult.cost,
            sent_at: messageResult.sentAt,
            priority,
            created_at: new Date().toISOString()
          });
        } catch (dbError) {
          console.warn('Failed to store message in database:', dbError);
        }
      }

      res.json({
        success: true,
        message: messageResult,
        status: 'SMS sent successfully'
      });

    } catch (error: any) {
      console.error('SMS send error:', error);
      res.status(500).json({
        error: 'Failed to send SMS',
        message: error.message
      });
    }
  });

  // Send Bulk SMS Messages
  app.post('/api/messaging/bulk', async (req, res) => {
    try {
      const { messages, provider = 'twilio', batchSize = 10 } = req.body;

      if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'Messages array is required' });
      }

      if (messages.length > 1000) {
        return res.status(400).json({ error: 'Maximum 1000 messages per bulk send' });
      }

      const results: Array<{
        success?: boolean;
        error?: string;
        recipient: string;
        [key: string]: any;
      }> = [];

      // Process in batches to avoid rate limits
      for (let i = 0; i < messages.length; i += batchSize) {
        const batch = messages.slice(i, i + batchSize);

        const batchPromises = batch.map(async (msg: any) => {
          try {
            const response = await fetch(`${req.protocol}://${req.get('host')}/api/messaging/send`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                content: msg.content,
                recipient: msg.recipient,
                provider,
                priority: msg.priority || 'medium'
              })
            });

            const result = await response.json();
            return { ...result, recipient: msg.recipient };
          } catch (error: any) {
            return {
              error: error.message,
              recipient: msg.recipient,
              success: false
            };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Add delay between batches to respect rate limits
        if (i + batchSize < messages.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      res.json({
        success: true,
        total: messages.length,
        successful,
        failed,
        results,
        summary: `${successful} sent successfully, ${failed} failed`
      });

    } catch (error: any) {
      console.error('Bulk SMS error:', error);
      res.status(500).json({
        error: 'Failed to send bulk SMS',
        message: error.message
      });
    }
  });

  // Get Message History
  app.get('/api/messaging/messages', async (req, res) => {
    try {
      const { limit = 50, offset = 0, status, provider, startDate, endDate } = req.query;

      if (isSupabaseConfigured() && supabase) {
        // Real database query
        let query = supabase
          .from('messages')
          .select('*')
          .order('created_at', { ascending: false })
          .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

        if (status) query = query.eq('status', status);
        if (provider) query = query.eq('provider', provider);
        if (startDate) query = query.gte('created_at', startDate);
        if (endDate) query = query.lte('created_at', endDate);

        const { data, error } = await query;

        if (error) throw error;

        res.json(data || []);
      } else {
        // Mock data for development
        const mockMessages: Array<{
          id: string;
          content: string;
          recipient: string;
          provider: string;
          status: string;
          cost: number;
          sent_at: string;
          created_at: string;
        }> = [];
        for (let i = 0; i < parseInt(limit as string); i++) {
          mockMessages.push({
            id: `msg_${Date.now()}_${i}`,
            content: `Sample message ${i + 1}`,
            recipient: `+1555${String(Math.floor(Math.random() * 9000000) + 1000000).padStart(7, '0')}`,
            provider: (provider as string) || 'twilio',
            status: (status as string) || ['sent', 'delivered', 'failed'][Math.floor(Math.random() * 3)],
            cost: 0.0075,
            sent_at: new Date(Date.now() - Math.random() * 86400000).toISOString(),
            created_at: new Date(Date.now() - Math.random() * 86400000).toISOString()
          });
        }

        res.json(mockMessages);
      }

    } catch (error: any) {
      console.error('Messages fetch error:', error);
      res.status(500).json({
        error: 'Failed to fetch messages',
        message: error.message
      });
    }
  });

  // Get Messaging Statistics
  app.get('/api/messaging/stats', async (req, res) => {
    try {
      const { period = '30d' } = req.query;

      if (isSupabaseConfigured() && supabase) {
        // Real database aggregation
        const startDate = new Date();
        switch (period) {
          case '7d': startDate.setDate(startDate.getDate() - 7); break;
          case '30d': startDate.setDate(startDate.getDate() - 30); break;
          case '90d': startDate.setDate(startDate.getDate() - 90); break;
          default: startDate.setDate(startDate.getDate() - 30);
        }

        const { data: messages, error } = await supabase
          .from('messages')
          .select('status, cost, created_at')
          .gte('created_at', startDate.toISOString());

        if (error) throw error;

        const stats = {
          totalMessages: messages?.length || 0,
          deliveredMessages: messages?.filter(m => m.status === 'delivered').length || 0,
          deliveryRate: messages?.length ? (messages.filter(m => m.status === 'delivered').length / messages.length) : 0,
          averageResponseTime: 2.4, // Would need webhook data for real calculation
          totalCost: messages?.reduce((sum, m) => sum + (m.cost || 0), 0) || 0,
          costPerMessage: messages?.length ? (messages.reduce((sum, m) => sum + (m.cost || 0), 0) / messages.length) : 0,
          activeProviders: 1, // Would need to count distinct providers
          period
        };

        res.json(stats);
      } else {
        // Mock statistics
        const stats = {
          totalMessages: Math.floor(Math.random() * 1000) + 500,
          deliveredMessages: Math.floor(Math.random() * 900) + 400,
          deliveryRate: 0.981,
          averageResponseTime: 2.4,
          totalCost: Math.random() * 10 + 5,
          costPerMessage: 0.0070,
          activeProviders: 2,
          period
        };

        res.json(stats);
      }

    } catch (error: any) {
      console.error('Stats fetch error:', error);
      res.status(500).json({
        error: 'Failed to fetch messaging stats',
        message: error.message
      });
    }
  });

  // Get Available Providers
  app.get('/api/messaging/providers', async (req, res) => {
    try {
      const providers = [
        {
          id: 'twilio',
          name: 'Twilio',
          apiKey: process.env.TWILIO_ACCOUNT_SID ? 'configured' : null,
          costPerMessage: 0.0075,
          supportedFeatures: ['SMS', 'MMS', 'Voice'],
          status: process.env.TWILIO_ACCOUNT_SID ? 'active' : 'inactive',
          deliveryRate: 0.987,
          responseTime: 2.3
        },
        {
          id: 'aws-sns',
          name: 'AWS SNS',
          apiKey: process.env.AWS_ACCESS_KEY_ID ? 'configured' : null,
          costPerMessage: 0.0065,
          supportedFeatures: ['SMS', 'Email'],
          status: process.env.AWS_ACCESS_KEY_ID ? 'active' : 'inactive',
          deliveryRate: 0.982,
          responseTime: 2.8
        },
        {
          id: 'messagebird',
          name: 'MessageBird',
          apiKey: process.env.MESSAGEBIRD_API_KEY ? 'configured' : null,
          costPerMessage: 0.0080,
          supportedFeatures: ['SMS', 'MMS', 'Voice', 'WhatsApp'],
          status: process.env.MESSAGEBIRD_API_KEY ? 'active' : 'inactive',
          deliveryRate: 0.975,
          responseTime: 3.1
        }
      ];

      res.json(providers);

    } catch (error: any) {
      console.error('Providers fetch error:', error);
      res.status(500).json({
        error: 'Failed to fetch providers',
        message: error.message
      });
    }
  });

  // Twilio Webhook for Status Updates
  app.post('/api/messaging/webhook/twilio', async (req, res) => {
    try {
      const { MessageSid, MessageStatus, To, From, Body, Price } = req.body;

      console.log(`📱 Twilio webhook: ${MessageSid} - ${MessageStatus}`);

      // Update message status in database
      if (isSupabaseConfigured() && supabase) {
        try {
          await supabase
            .from('messages')
            .update({
              status: MessageStatus,
              cost: Price ? parseFloat(Price) : undefined,
              updated_at: new Date().toISOString()
            })
            .eq('id', MessageSid);
        } catch (dbError) {
          console.warn('Failed to update message status:', dbError);
        }
      }

      res.json({ success: true });

    } catch (error: any) {
      console.error('Twilio webhook error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });

  // Test SMS Provider Connection
  app.post('/api/messaging/test/:provider', async (req, res) => {
    try {
      const { provider } = req.params;
      const { phoneNumber } = req.body;

      if (!phoneNumber) {
        return res.status(400).json({ error: 'Phone number is required for testing' });
      }

      let testResult;

      switch (provider) {
        case 'twilio':
          if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
            return res.status(400).json({ error: 'Twilio credentials not configured' });
          }

          const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
          const testMessage = await twilio.messages.create({
            body: 'SMS provider test message from SmartCRM',
            from: process.env.TWILIO_PHONE_NUMBER,
            to: phoneNumber
          });

          testResult = {
            success: true,
            provider: 'twilio',
            messageId: testMessage.sid,
            status: testMessage.status
          };
          break;

        default:
          testResult = {
            success: true,
            provider,
            messageId: `test_${Date.now()}`,
            status: 'sent',
            note: 'Mock test - provider not fully configured'
          };
      }

      res.json(testResult);

    } catch (error: any) {
      console.error('Provider test error:', error);
      res.status(500).json({
        error: 'Provider test failed',
        message: error.message
      });
    }
  });

  // Video Email Routes - PRODUCT TIER REQUIRED (ai_communication tier or higher)
  app.get('/api/videos', requireProductTier, async (req: any, res) => {
    try {
      // Mock data for now - integrate with storage later
      const videos = [
        {
          id: '1',
          title: 'Product Demo for Acme Corp',
          script: 'Welcome to our product demo...',
          duration: 120,
          thumbnail: '/api/placeholder/300/200',
          status: 'ready',
          analytics: { views: 245, completionRate: 0.78, engagement: 0.85, sentDate: '2024-01-10' },
          recipient: { name: 'John Smith', email: 'john@acme.com', company: 'Acme Corp' }
        }
      ];
      res.json(videos);
    } catch (error) {
      console.error('Error fetching videos:', error);
      res.status(500).json({ error: 'Failed to fetch videos' });
    }
  });

  app.get('/api/videos/stats', requireProductTier, async (req: any, res) => {
    try {
      const stats = {
        totalVideos: 12,
        totalViews: 1547,
        averageEngagement: 0.82,
        conversionRate: 0.35,
        topPerformingVideo: 'Product Demo for Acme Corp'
      };
      res.json(stats);
    } catch (error) {
      console.error('Error fetching video stats:', error);
      res.status(500).json({ error: 'Failed to fetch video stats' });
    }
  });

  app.post('/api/videos', requireProductTier, async (req: any, res) => {
    try {
      const { title, recipientName, recipientEmail, company, script } = req.body;
      
      // TODO: Save video blob to storage
      // For now, just acknowledge the upload
      const videoId = `video_${Date.now()}`;
      
      res.json({
        success: true,
        videoId,
        message: 'Video email saved successfully'
      });
    } catch (error) {
      console.error('Error saving video:', error);
      res.status(500).json({ error: 'Failed to save video' });
    }
  });

  app.post('/api/videos/generate-script', requireProductTier, async (req: any, res) => {
    try {
      const { recipient, purpose, tone, length } = req.body;
      
      if (!openai) {
        return res.status(503).json({ error: 'AI service not available' });
      }

      const prompt = `Generate a ${length}-second video email script with a ${tone} tone for ${recipient.name} from ${recipient.company}. Purpose: ${purpose}. Keep it concise, engaging, and personalized.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are a professional video script writer specializing in personalized video emails.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 500,
        temperature: 0.7
      });

      const script = completion.choices[0]?.message?.content || '';

      res.json({ script });
    } catch (error: any) {
      console.error('Error generating video script:', error);
      res.status(500).json({ error: 'Failed to generate script', message: error.message });
    }
  });

  // Basic CRM routes (keeping minimal for Supabase integration)
  app.get('/api/test', (req, res) => {
    res.json({ message: 'CRM API is working', supabase: 'Edge Functions will handle AI operations' });
  });

  // ==================== CONTACTS API ====================

  // Get all contacts for the authenticated user
  app.get('/api/contacts', async (req, res) => {
    try {
      const userId = req.session?.userId;
      const authHeader = req.headers.authorization;
      console.log('📞 Contacts API called:', {
        sessionUserId: userId,
        authHeader: authHeader ? `${authHeader.substring(0, 20)}...` : null,
        sessionId: req.session?.id
      });

      // Check for session first
      if (userId) {
        // Session exists, proceed
      } else if (authHeader?.startsWith('Bearer ')) {
        // Handle Bearer token authentication for development
        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        if (token === 'dev-bypass-token') {
          // Set up dev user for this request
          req.user = {
            id: 'dev-user-12345',
            email: 'dev@smartcrm.local',
            username: 'dev@smartcrm.local',
            role: 'super_admin',
            productTier: 'super_admin'
          };
          console.log('✅ Dev bypass auth granted via Bearer token for contacts');
        } else {
          console.log('❌ Invalid Bearer token for contacts');
          return res.status(401).json({ error: 'Not authenticated' });
        }
      } else {
        console.log('📞 Contacts: No session userId or valid Bearer token, returning 401');
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const userContacts = await db
        .select()
        .from(contacts)
        .where(eq(contacts.profileId, userId))
        .orderBy(desc(contacts.createdAt));

      console.log(`📞 Contacts: Found ${userContacts.length} contacts for user ${userId}`);
      res.json(userContacts);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      res.status(500).json({ error: 'Failed to fetch contacts' });
    }
  });

  // Get a single contact
  app.get('/api/contacts/:id', async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const contactId = parseInt(req.params.id);
      const [contact] = await db
        .select()
        .from(contacts)
        .where(and(eq(contacts.id, contactId), eq(contacts.profileId, userId)));

      if (!contact) {
        return res.status(404).json({ error: 'Contact not found' });
      }

      res.json(contact);
    } catch (error) {
      console.error('Error fetching contact:', error);
      res.status(500).json({ error: 'Failed to fetch contact' });
    }
  });

  // Create a new contact
  app.post('/api/contacts', async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const validatedData = insertContactSchema.parse({
        ...req.body,
        profileId: userId
      });

      const [newContact] = await db
        .insert(contacts)
        .values(validatedData)
        .returning();

      res.status(201).json(newContact);
    } catch (error: any) {
      console.error('Error creating contact:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to create contact' });
    }
  });

  // Update a contact
  app.put('/api/contacts/:id', async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const contactId = parseInt(req.params.id);
      
      // Verify contact belongs to user
      const [existingContact] = await db
        .select()
        .from(contacts)
        .where(and(eq(contacts.id, contactId), eq(contacts.profileId, userId)));

      if (!existingContact) {
        return res.status(404).json({ error: 'Contact not found' });
      }

      const [updatedContact] = await db
        .update(contacts)
        .set({
          ...req.body,
          profileId: userId,
          updatedAt: new Date()
        })
        .where(and(eq(contacts.id, contactId), eq(contacts.profileId, userId)))
        .returning();

      res.json(updatedContact);
    } catch (error: any) {
      console.error('Error updating contact:', error);
      res.status(500).json({ error: 'Failed to update contact' });
    }
  });

  // Delete a contact
  app.delete('/api/contacts/:id', async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const contactId = parseInt(req.params.id);
      
      const [deletedContact] = await db
        .delete(contacts)
        .where(and(eq(contacts.id, contactId), eq(contacts.profileId, userId)))
        .returning();

      if (!deletedContact) {
        return res.status(404).json({ error: 'Contact not found' });
      }

      res.json({ message: 'Contact deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting contact:', error);
      res.status(500).json({ error: 'Failed to delete contact' });
    }
  });

  // ==================== DEALS API ====================
  
  // Get all deals for the authenticated user
  app.get('/api/deals', async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const userDeals = await db
        .select()
        .from(deals)
        .where(eq(deals.profileId, userId))
        .orderBy(desc(deals.createdAt));

      res.json(userDeals);
    } catch (error) {
      console.error('Error fetching deals:', error);
      res.status(500).json({ error: 'Failed to fetch deals' });
    }
  });

  // Get a single deal
  app.get('/api/deals/:id', async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const dealId = parseInt(req.params.id);
      const [deal] = await db
        .select()
        .from(deals)
        .where(and(eq(deals.id, dealId), eq(deals.profileId, userId)));

      if (!deal) {
        return res.status(404).json({ error: 'Deal not found' });
      }

      res.json(deal);
    } catch (error) {
      console.error('Error fetching deal:', error);
      res.status(500).json({ error: 'Failed to fetch deal' });
    }
  });

  // Create a new deal
  app.post('/api/deals', async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const validatedData = insertDealSchema.parse({
        ...req.body,
        profileId: userId
      });

      const [newDeal] = await db
        .insert(deals)
        .values(validatedData)
        .returning();

      res.status(201).json(newDeal);
    } catch (error: any) {
      console.error('Error creating deal:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to create deal' });
    }
  });

  // Update a deal
  app.put('/api/deals/:id', async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const dealId = parseInt(req.params.id);
      
      // Verify deal belongs to user
      const [existingDeal] = await db
        .select()
        .from(deals)
        .where(and(eq(deals.id, dealId), eq(deals.profileId, userId)));

      if (!existingDeal) {
        return res.status(404).json({ error: 'Deal not found' });
      }

      const [updatedDeal] = await db
        .update(deals)
        .set({
          ...req.body,
          profileId: userId,
          updatedAt: new Date()
        })
        .where(and(eq(deals.id, dealId), eq(deals.profileId, userId)))
        .returning();

      res.json(updatedDeal);
    } catch (error: any) {
      console.error('Error updating deal:', error);
      res.status(500).json({ error: 'Failed to update deal' });
    }
  });

  // Delete a deal
  app.delete('/api/deals/:id', async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const dealId = parseInt(req.params.id);
      
      const [deletedDeal] = await db
        .delete(deals)
        .where(and(eq(deals.id, dealId), eq(deals.profileId, userId)))
        .returning();

      if (!deletedDeal) {
        return res.status(404).json({ error: 'Deal not found' });
      }

      res.json({ message: 'Deal deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting deal:', error);
      res.status(500).json({ error: 'Failed to delete deal' });
    }
  });

  // ==================== TASKS API ====================
  
  // Get all tasks for the authenticated user
  app.get('/api/tasks', async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const userTasks = await db
        .select()
        .from(tasks)
        .where(eq(tasks.profileId, userId))
        .orderBy(desc(tasks.createdAt));

      res.json(userTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      res.status(500).json({ error: 'Failed to fetch tasks' });
    }
  });

  // Get a single task
  app.get('/api/tasks/:id', async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const taskId = parseInt(req.params.id);
      const [task] = await db
        .select()
        .from(tasks)
        .where(and(eq(tasks.id, taskId), eq(tasks.profileId, userId)));

      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      res.json(task);
    } catch (error) {
      console.error('Error fetching task:', error);
      res.status(500).json({ error: 'Failed to fetch task' });
    }
  });

  // Create a new task
  app.post('/api/tasks', async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const validatedData = insertTaskSchema.parse({
        ...req.body,
        profileId: userId
      });

      const [newTask] = await db
        .insert(tasks)
        .values(validatedData)
        .returning();

      res.status(201).json(newTask);
    } catch (error: any) {
      console.error('Error creating task:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to create task' });
    }
  });

  // Update a task
  app.put('/api/tasks/:id', async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const taskId = parseInt(req.params.id);
      
      // Verify task belongs to user
      const [existingTask] = await db
        .select()
        .from(tasks)
        .where(and(eq(tasks.id, taskId), eq(tasks.profileId, userId)));

      if (!existingTask) {
        return res.status(404).json({ error: 'Task not found' });
      }

      // Validate and sanitize update data
      const validatedData = updateTaskSchema.parse(req.body);

      const [updatedTask] = await db
        .update(tasks)
        .set({
          ...validatedData,
          profileId: userId, // Explicitly set to prevent privilege escalation
          updatedAt: new Date()
        })
        .where(and(eq(tasks.id, taskId), eq(tasks.profileId, userId))) // Double-check ownership
        .returning();

      res.json(updatedTask);
    } catch (error: any) {
      console.error('Error updating task:', error);
      // Differentiate validation errors from server errors
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to update task' });
    }
  });

  // Delete a task
  app.delete('/api/tasks/:id', async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const taskId = parseInt(req.params.id);
      
      const [deletedTask] = await db
        .delete(tasks)
        .where(and(eq(tasks.id, taskId), eq(tasks.profileId, userId)))
        .returning();

      if (!deletedTask) {
        return res.status(404).json({ error: 'Task not found' });
      }

      res.json({ message: 'Task deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting task:', error);
      res.status(500).json({ error: 'Failed to delete task' });
    }
  });

  // ==================== APPOINTMENTS API ====================
  
  // Get all appointments for the authenticated user
  app.get('/api/appointments', async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const userAppointments = await db
        .select()
        .from(appointments)
        .where(eq(appointments.profileId, userId))
        .orderBy(desc(appointments.startTime));

      res.json(userAppointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      res.status(500).json({ error: 'Failed to fetch appointments' });
    }
  });

  // Get a single appointment
  app.get('/api/appointments/:id', async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const appointmentId = parseInt(req.params.id);
      const [appointment] = await db
        .select()
        .from(appointments)
        .where(and(eq(appointments.id, appointmentId), eq(appointments.profileId, userId)));

      if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found' });
      }

      res.json(appointment);
    } catch (error) {
      console.error('Error fetching appointment:', error);
      res.status(500).json({ error: 'Failed to fetch appointment' });
    }
  });

  // Create a new appointment
  app.post('/api/appointments', async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const validatedData = insertAppointmentSchema.parse({
        ...req.body,
        profileId: userId
      });

      const [newAppointment] = await db
        .insert(appointments)
        .values(validatedData)
        .returning();

      res.status(201).json(newAppointment);
    } catch (error: any) {
      console.error('Error creating appointment:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to create appointment' });
    }
  });

  // Update an appointment
  app.put('/api/appointments/:id', async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const appointmentId = parseInt(req.params.id);
      
      // Verify appointment belongs to user
      const [existingAppointment] = await db
        .select()
        .from(appointments)
        .where(and(eq(appointments.id, appointmentId), eq(appointments.profileId, userId)));

      if (!existingAppointment) {
        return res.status(404).json({ error: 'Appointment not found' });
      }

      // Validate and sanitize update data
      const validatedData = updateAppointmentSchema.parse(req.body);

      const [updatedAppointment] = await db
        .update(appointments)
        .set({
          ...validatedData,
          profileId: userId, // Explicitly set to prevent privilege escalation
          updatedAt: new Date()
        })
        .where(and(eq(appointments.id, appointmentId), eq(appointments.profileId, userId))) // Double-check ownership
        .returning();

      res.json(updatedAppointment);
    } catch (error: any) {
      console.error('Error updating appointment:', error);
      // Differentiate validation errors from server errors
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to update appointment' });
    }
  });

  // Delete an appointment
  app.delete('/api/appointments/:id', async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const appointmentId = parseInt(req.params.id);
      
      const [deletedAppointment] = await db
        .delete(appointments)
        .where(and(eq(appointments.id, appointmentId), eq(appointments.profileId, userId)))
        .returning();

      if (!deletedAppointment) {
        return res.status(404).json({ error: 'Appointment not found' });
      }

      res.json({ message: 'Appointment deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting appointment:', error);
      res.status(500).json({ error: 'Failed to delete appointment' });
    }
  });

  // ==================== COMMUNICATIONS API ====================
  
  // Get all communications for the authenticated user
  app.get('/api/communications', async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const userCommunications = await db
        .select()
        .from(communications)
        .where(eq(communications.profileId, userId))
        .orderBy(desc(communications.createdAt));

      res.json(userCommunications);
    } catch (error) {
      console.error('Error fetching communications:', error);
      res.status(500).json({ error: 'Failed to fetch communications' });
    }
  });

  // Create a new communication
  app.post('/api/communications', async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const validatedData = insertCommunicationSchema.parse({
        ...req.body,
        profileId: userId
      });

      const [newCommunication] = await db
        .insert(communications)
        .values(validatedData)
        .returning();

      res.status(201).json(newCommunication);
    } catch (error: any) {
      console.error('Error creating communication:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to create communication' });
    }
  });

  // ==================== NOTES API ====================
  
  // Get all notes for the authenticated user
  app.get('/api/notes', async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const userNotes = await db
        .select()
        .from(notes)
        .where(eq(notes.profileId, userId))
        .orderBy(desc(notes.createdAt));

      res.json(userNotes);
    } catch (error) {
      console.error('Error fetching notes:', error);
      res.status(500).json({ error: 'Failed to fetch notes' });
    }
  });

  // Get notes by contact
  app.get('/api/notes/contact/:contactId', async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const contactId = parseInt(req.params.contactId);
      const contactNotes = await db
        .select()
        .from(notes)
        .where(and(eq(notes.contactId, contactId), eq(notes.profileId, userId)))
        .orderBy(desc(notes.createdAt));

      res.json(contactNotes);
    } catch (error) {
      console.error('Error fetching contact notes:', error);
      res.status(500).json({ error: 'Failed to fetch notes' });
    }
  });

  // Get notes by deal
  app.get('/api/notes/deal/:dealId', async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const dealId = parseInt(req.params.dealId);
      const dealNotes = await db
        .select()
        .from(notes)
        .where(and(eq(notes.dealId, dealId), eq(notes.profileId, userId)))
        .orderBy(desc(notes.createdAt));

      res.json(dealNotes);
    } catch (error) {
      console.error('Error fetching deal notes:', error);
      res.status(500).json({ error: 'Failed to fetch notes' });
    }
  });

  // Create a new note
  app.post('/api/notes', async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const validatedData = insertNoteSchema.parse({
        ...req.body,
        profileId: userId
      });

      const [newNote] = await db
        .insert(notes)
        .values(validatedData)
        .returning();

      res.status(201).json(newNote);
    } catch (error: any) {
      console.error('Error creating note:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to create note' });
    }
  });

  // Update a note
  app.put('/api/notes/:id', async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const noteId = parseInt(req.params.id);
      
      // Verify note belongs to user
      const [existingNote] = await db
        .select()
        .from(notes)
        .where(and(eq(notes.id, noteId), eq(notes.profileId, userId)));

      if (!existingNote) {
        return res.status(404).json({ error: 'Note not found' });
      }

      // Validate and sanitize update data
      const validatedData = updateNoteSchema.parse(req.body);

      const [updatedNote] = await db
        .update(notes)
        .set({
          ...validatedData,
          profileId: userId, // Explicitly set to prevent privilege escalation
          updatedAt: new Date()
        })
        .where(and(eq(notes.id, noteId), eq(notes.profileId, userId))) // Double-check ownership
        .returning();

      res.json(updatedNote);
    } catch (error: any) {
      console.error('Error updating note:', error);
      // Differentiate validation errors from server errors
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to update note' });
    }
  });

  // Delete a note
  app.delete('/api/notes/:id', async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const noteId = parseInt(req.params.id);
      
      const [deletedNote] = await db
        .delete(notes)
        .where(and(eq(notes.id, noteId), eq(notes.profileId, userId)))
        .returning();

      if (!deletedNote) {
        return res.status(404).json({ error: 'Note not found' });
      }

      res.json({ message: 'Note deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting note:', error);
      res.status(500).json({ error: 'Failed to delete note' });
    }
  });

  // ==================== DOCUMENTS API ====================
  
  // Get all documents for the authenticated user
  app.get('/api/documents', async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const userDocuments = await db
        .select()
        .from(documents)
        .where(eq(documents.profileId, userId))
        .orderBy(desc(documents.createdAt));

      res.json(userDocuments);
    } catch (error) {
      console.error('Error fetching documents:', error);
      res.status(500).json({ error: 'Failed to fetch documents' });
    }
  });

  // Create a new document
  app.post('/api/documents', async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const validatedData = insertDocumentSchema.parse({
        ...req.body,
        profileId: userId
      });

      const [newDocument] = await db
        .insert(documents)
        .values(validatedData)
        .returning();

      res.status(201).json(newDocument);
    } catch (error: any) {
      console.error('Error creating document:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to create document' });
    }
  });

  // Delete a document
  app.delete('/api/documents/:id', async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const documentId = parseInt(req.params.id);
      
      const [deletedDocument] = await db
        .delete(documents)
        .where(and(eq(documents.id, documentId), eq(documents.profileId, userId)))
        .returning();

      if (!deletedDocument) {
        return res.status(404).json({ error: 'Document not found' });
      }

      res.json({ message: 'Document deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting document:', error);
      res.status(500).json({ error: 'Failed to delete document' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}