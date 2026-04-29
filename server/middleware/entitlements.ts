/**
 * Server-side Entitlement Checking Middleware
 * Uses Supabase user_entitlements table for feature gating
 */

import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const serviceRoleKey =
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Allowed feature keys - must match database exactly
export type FeatureKey =
  | 'core_crm'
  | 'dashboard'
  | 'contacts'
  | 'pipeline'
  | 'calendar'
  | 'contact_enhancements'
  | 'ai_contact_enrichment'
  | 'ai_lead_scoring'
  | 'custom_fields'
  | 'contact_activity_tracking'
  | 'bulk_contact_operations'
  | 'pipeline_management'
  | 'task_management'
  | 'ai_tools'
  | 'email_analysis'
  | 'meeting_summarizer'
  | 'proposal_generator'
  | 'call_script_generator'
  | 'subject_line_optimizer'
  | 'vision_analyzer'
  | 'image_generator'
  | 'semantic_search'
  | 'function_assistant'
  | 'streaming_chat'
  | 'live_deal_analysis'
  | 'instant_response_generator'
  | 'ai_goals'
  | 'analytics'
  | 'advanced_analytics'
  | 'business_intelligence'
  | 'sales_intelligence'
  | 'deal_intelligence_dashboard'
  | 'contact_analytics_dashboard'
  | 'pipeline_intelligence'
  | 'deal_risk_monitor'
  | 'smart_conversion_insights'
  | 'pipeline_health_dashboard'
  | 'sales_cycle_analytics'
  | 'win_rate_intelligence'
  | 'ai_sales_forecast'
  | 'competitor_insights'
  | 'revenue_intelligence'
  | 'communication_hub'
  | 'appointments'
  | 'video_email'
  | 'text_messages'
  | 'phone_system'
  | 'voice_profiles'
  | 'invoicing'
  | 'lead_automation'
  | 'forms_surveys'
  | 'business_analyzer'
  | 'content_library'
  | 'circle_prospecting'
  | 'connected_apps'
  | 'funnelcraft_ai'
  | 'smartcrm_closer'
  | 'content_ai'
  | 'billing_credits'
  | 'buy_credits'
  | 'white_label'
  | 'white_label_customization'
  | 'white_label_management'
  | 'multi_tenant_features'
  | 'custom_branding'
  | 'domain_management'
  | 'package_builder'
  | 'revenue_sharing'
  | 'partner_dashboard'
  | 'partner_onboarding'
  | 'brand_asset_management'
  | 'theme_customization'
  | 'custom_domain_setup'
  | 'feature_package_configuration'
  | 'openclaw'
  | 'admin_panel'
  | 'feature_management'
  | 'user_management'
  | 'system_monitoring'
  | 'security_audit_logs'
  | 'compliance_tools'
  | 'security_compliance';

interface UserEntitlement {
  id: string;
  email: string;
  package: 'no_access' | 'regular' | 'smartmarketer' | 'whitelabel' | 'super_admin';
  openclaw_enabled: boolean;
  admin_enabled: boolean;
}

/**
 * requireEntitlement Middleware Factory
 * Creates a middleware that checks if user has access to a specific feature
 * Usage: app.post('/route', requireAuth, requireEntitlement(FeatureKey.AI_TOOLS), handler)
 */
export function requireEntitlement(featureKey: FeatureKey) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req.session as any)?.userId;
      const userEmail = (req.session as any)?.userEmail;

      if (!userId && !userEmail) {
        return res.status(401).json({ error: 'Unauthorized - Not authenticated' });
      }

      if (!supabaseUrl || !serviceRoleKey) {
        return res.status(500).json({ error: 'Supabase not configured' });
      }

      const supabase = createClient(supabaseUrl, serviceRoleKey);

      // Get user's entitlement by email (from session) or user_id
      let entitlement: UserEntitlement | null = null;

      if (userEmail) {
        const { data } = await supabase
          .from('user_entitlements')
          .select('*')
          .eq('email', userEmail)
          .single();
        entitlement = data as UserEntitlement;
      }

      if (!entitlement && userId) {
        const { data } = await supabase
          .from('user_entitlements')
          .select('*')
          .eq('user_id', userId)
          .single();
        entitlement = data as UserEntitlement;
      }

      // If no entitlement found, treat as 'regular' user (basic access)
      // The frontend will create a default entitlement record on first login
      if (!entitlement) {
        // Allow access to proceed; missing entitlement means no feature restrictions yet (default regular)
        return next();
      }

      // Block users with no_access package
      if (entitlement.package === 'no_access') {
        return res.status(403).json({
          error: 'Forbidden - No subscription found',
          requiredFeature: featureKey,
          message: 'Please purchase a subscription to access this feature',
        });
      }

      // Check package access via user_has_feature function
      const { data: hasAccess } = await supabase.rpc('user_has_feature', {
        input_email: entitlement.email,
        input_feature_key: featureKey,
      });

      if (!hasAccess) {
        return res.status(403).json({
          error: 'Forbidden - Feature not included in your package',
          requiredFeature: featureKey,
          userPackage: entitlement.package,
          message: 'This feature is not available in your current subscription. Please upgrade.',
        });
      }

      // Attach entitlement to request for downstream handlers
      (req as any).entitlement = entitlement;
      (req as any).userPackage = entitlement.package;

      next();
    } catch (error) {
      console.error('Entitlement check error:', error);
      res.status(500).json({ error: 'Internal server error during entitlement check' });
    }
  };
}
export function requireOneOfEntitlements(featureKeys: FeatureKey[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req.session as any)?.userId;
      const userEmail = (req.session as any)?.userEmail;

      if (!userId && !userEmail) {
        return res.status(401).json({ error: 'Unauthorized - Not authenticated' });
      }

      if (!supabaseUrl || !serviceRoleKey) {
        return res.status(500).json({ error: 'Supabase not configured' });
      }

      const supabase = createClient(supabaseUrl, serviceRoleKey);

      let entitlement: UserEntitlement | null = null;

      if (userEmail) {
        const { data } = await supabase
          .from('user_entitlements')
          .select('*')
          .eq('email', userEmail)
          .single();
        entitlement = data as UserEntitlement;
      }

      if (!entitlement && userId) {
        const { data } = await supabase
          .from('user_entitlements')
          .select('*')
          .eq('user_id', userId)
          .single();
        entitlement = data as UserEntitlement;
      }

      if (!entitlement) {
        return res.status(403).json({
          error: 'Forbidden - No subscription found',
          requiredFeatures: featureKeys,
          message: 'Please purchase a subscription to access this feature',
        });
      }

      // Super admin bypasses all checks
      if (entitlement.package === 'super_admin') {
        (req as any).entitlement = entitlement;
        (req as any).userPackage = entitlement.package;
        return next();
      }

      // Check if user has at least one of the required features
      const accessPromises = featureKeys.map((fk) =>
        supabase.rpc('user_has_feature', { input_email: entitlement.email, input_feature_key: fk })
      );

      const results = await Promise.all(accessPromises);
      const hasAnyAccess = results.some((result) => result.data === true);

      if (!hasAnyAccess) {
        return res.status(403).json({
          error: 'Forbidden - None of the required features are available in your package',
          requiredFeatures: featureKeys,
          userPackage: entitlement.package,
          message: 'Your subscription does not include access to this area. Please upgrade.',
        });
      }

      (req as any).entitlement = entitlement;
      (req as any).userPackage = entitlement.package;
      next();
    } catch (error) {
      console.error('Entitlement check error:', error);
      res.status(500).json({ error: 'Internal server error during entitlement check' });
    }
  };
}

/**
 * SkipEntitlementCheck Middleware
 * Used for routes that don't need entitlement checking (public, auth, etc)
 */
export function skipEntitlementCheck(req: Request, res: Response, next: NextFunction) {
  next();
}
