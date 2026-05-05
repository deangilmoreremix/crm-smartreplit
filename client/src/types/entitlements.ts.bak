// Package and feature type definitions for SmartCRM gating
export type PackageType = 'no_access' | 'regular' | 'smartmarketer' | 'whitelabel' | 'super_admin';

export interface UserEntitlement {
  id: string;
  user_id?: string;
  email: string;
  package: PackageType;
  openclaw_enabled: boolean;
  admin_enabled: boolean;
  source?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PackageFeature {
  id: string;
  package: PackageType;
  feature_key: string;
  enabled: boolean;
}

// Feature keys enum - matches database exactly
export enum FeatureKey {
  // Core CRM
  CORE_CRM = 'core_crm',
  DASHBOARD = 'dashboard',
  CONTACTS = 'contacts',
  PIPELINE = 'pipeline',
  CALENDAR = 'calendar',

  // Contact enhancements
  CONTACT_ENHANCEMENTS = 'contact_enhancements',
  AI_CONTACT_ENRICHMENT = 'ai_contact_enrichment',
  AI_LEAD_SCORING = 'ai_lead_scoring',
  CUSTOM_FIELDS = 'custom_fields',
  CONTACT_ACTIVITY_TRACKING = 'contact_activity_tracking',
  BULK_CONTACT_OPERATIONS = 'bulk_contact_operations',
  PIPELINE_MANAGEMENT = 'pipeline_management',
  TASK_MANAGEMENT = 'task_management',

  // AI Tools
  AI_TOOLS = 'ai_tools',
  EMAIL_ANALYSIS = 'email_analysis',
  MEETING_SUMMARIZER = 'meeting_summarizer',
  PROPOSAL_GENERATOR = 'proposal_generator',
  CALL_SCRIPT_GENERATOR = 'call_script_generator',
  SUBJECT_LINE_OPTIMIZER = 'subject_line_optimizer',
  VISION_ANALYZER = 'vision_analyzer',
  IMAGE_GENERATOR = 'image_generator',
  SEMANTIC_SEARCH = 'semantic_search',
  FUNCTION_ASSISTANT = 'function_assistant',
  STREAMING_CHAT = 'streaming_chat',
  LIVE_DEAL_ANALYSIS = 'live_deal_analysis',
  INSTANT_RESPONSE_GENERATOR = 'instant_response_generator',
  AI_GOALS = 'ai_goals',

  // Analytics / Intelligence
  ANALYTICS = 'analytics',
  ADVANCED_ANALYTICS = 'advanced_analytics',
  BUSINESS_INTELLIGENCE = 'business_intelligence',
  SALES_INTELLIGENCE = 'sales_intelligence',
  DEAL_INTELLIGENCE_DASHBOARD = 'deal_intelligence_dashboard',
  CONTACT_ANALYTICS_DASHBOARD = 'contact_analytics_dashboard',
  PIPELINE_INTELLIGENCE = 'pipeline_intelligence',
  DEAL_RISK_MONITOR = 'deal_risk_monitor',
  SMART_CONVERSION_INSIGHTS = 'smart_conversion_insights',
  PIPELINE_HEALTH_DASHBOARD = 'pipeline_health_dashboard',
  SALES_CYCLE_ANALYTICS = 'sales_cycle_analytics',
  WIN_RATE_INTELLIGENCE = 'win_rate_intelligence',
  AI_SALES_FORECAST = 'ai_sales_forecast',
  COMPETITOR_INSIGHTS = 'competitor_insights',
  REVENUE_INTELLIGENCE = 'revenue_intelligence',

  // Communication Hub
  COMMUNICATION_HUB = 'communication_hub',
  APPOINTMENTS = 'appointments',
  VIDEO_EMAIL = 'video_email',
  TEXT_MESSAGES = 'text_messages',
  PHONE_SYSTEM = 'phone_system',
  VOICE_PROFILES = 'voice_profiles',

  // Smart Marketer tools
  INVOICING = 'invoicing',
  LEAD_AUTOMATION = 'lead_automation',
  FORMS_SURVEYS = 'forms_surveys',
  BUSINESS_ANALYZER = 'business_analyzer',
  CONTENT_LIBRARY = 'content_library',
  CIRCLE_PROSPECTING = 'circle_prospecting',

  // Connected Apps
  CONNECTED_APPS = 'connected_apps',
  FUNNELCRAFT_AI = 'funnelcraft_ai',
  SMARTCRM_CLOSER = 'smartcrm_closer',
  CONTENT_AI = 'content_ai',

  // Billing/Credits
  BILLING_CREDITS = 'billing_credits',
  BUY_CREDITS = 'buy_credits',

  // White Label
  WHITE_LABEL = 'white_label',
  WHITE_LABEL_CUSTOMIZATION = 'white_label_customization',
  WHITE_LABEL_MANAGEMENT = 'white_label_management',
  MULTI_TENANT_FEATURES = 'multi_tenant_features',
  CUSTOM_BRANDING = 'custom_branding',
  DOMAIN_MANAGEMENT = 'domain_management',
  PACKAGE_BUILDER = 'package_builder',
  REVENUE_SHARING = 'revenue_sharing',
  PARTNER_DASHBOARD = 'partner_dashboard',
  PARTNER_ONBOARDING = 'partner_onboarding',
  BRAND_ASSET_MANAGEMENT = 'brand_asset_management',
  THEME_CUSTOMIZATION = 'theme_customization',
  CUSTOM_DOMAIN_SETUP = 'custom_domain_setup',
  FEATURE_PACKAGE_CONFIGURATION = 'feature_package_configuration',

  // Admin / OpenClaw
  OPENCLAW = 'openclaw',
  ADMIN_PANEL = 'admin_panel',
  FEATURE_MANAGEMENT = 'feature_management',
  USER_MANAGEMENT = 'user_management',
  SYSTEM_MONITORING = 'system_monitoring',
  SECURITY_AUDIT_LOGS = 'security_audit_logs',
  COMPLIANCE_TOOLS = 'compliance_tools',
  SECURITY_COMPLIANCE = 'security_compliance',
}

// Package feature mappings (client-side copy for quick checks)
export const PACKAGE_FEATURES: Record<PackageType, string[]> = {
  regular: [
    FeatureKey.CORE_CRM,
    FeatureKey.DASHBOARD,
    FeatureKey.CONTACTS,
    FeatureKey.PIPELINE,
    FeatureKey.CALENDAR,
  ],

  smartmarketer: [
    // Core
    FeatureKey.CORE_CRM,
    FeatureKey.DASHBOARD,
    FeatureKey.CONTACTS,
    FeatureKey.PIPELINE,
    FeatureKey.CALENDAR,

    // Enhanced CRM
    FeatureKey.CONTACT_ENHANCEMENTS,
    FeatureKey.AI_CONTACT_ENRICHMENT,
    FeatureKey.AI_LEAD_SCORING,
    FeatureKey.CUSTOM_FIELDS,
    FeatureKey.CONTACT_ACTIVITY_TRACKING,
    FeatureKey.BULK_CONTACT_OPERATIONS,
    FeatureKey.PIPELINE_MANAGEMENT,
    FeatureKey.TASK_MANAGEMENT,

    // AI Tools
    FeatureKey.AI_TOOLS,
    FeatureKey.EMAIL_ANALYSIS,
    FeatureKey.MEETING_SUMMARIZER,
    FeatureKey.PROPOSAL_GENERATOR,
    FeatureKey.CALL_SCRIPT_GENERATOR,
    FeatureKey.SUBJECT_LINE_OPTIMIZER,
    FeatureKey.VISION_ANALYZER,
    FeatureKey.IMAGE_GENERATOR,
    FeatureKey.SEMANTIC_SEARCH,
    FeatureKey.FUNCTION_ASSISTANT,
    FeatureKey.STREAMING_CHAT,
    FeatureKey.LIVE_DEAL_ANALYSIS,
    FeatureKey.INSTANT_RESPONSE_GENERATOR,
    FeatureKey.AI_GOALS,

    // Analytics
    FeatureKey.ANALYTICS,
    FeatureKey.ADVANCED_ANALYTICS,
    FeatureKey.BUSINESS_INTELLIGENCE,
    FeatureKey.SALES_INTELLIGENCE,
    FeatureKey.DEAL_INTELLIGENCE_DASHBOARD,
    FeatureKey.CONTACT_ANALYTICS_DASHBOARD,
    FeatureKey.PIPELINE_INTELLIGENCE,
    FeatureKey.DEAL_RISK_MONITOR,
    FeatureKey.SMART_CONVERSION_INSIGHTS,
    FeatureKey.PIPELINE_HEALTH_DASHBOARD,
    FeatureKey.SALES_CYCLE_ANALYTICS,
    FeatureKey.WIN_RATE_INTELLIGENCE,
    FeatureKey.AI_SALES_FORECAST,
    FeatureKey.COMPETITOR_INSIGHTS,
    FeatureKey.REVENUE_INTELLIGENCE,

    // Communication
    FeatureKey.COMMUNICATION_HUB,
    FeatureKey.APPOINTMENTS,
    FeatureKey.VIDEO_EMAIL,
    FeatureKey.TEXT_MESSAGES,
    FeatureKey.PHONE_SYSTEM,
    FeatureKey.VOICE_PROFILES,

    // Smart Marketer tools
    FeatureKey.INVOICING,
    FeatureKey.LEAD_AUTOMATION,
    FeatureKey.FORMS_SURVEYS,
    FeatureKey.BUSINESS_ANALYZER,
    FeatureKey.CONTENT_LIBRARY,
    FeatureKey.CIRCLE_PROSPECTING,

    // Connected apps
    FeatureKey.CONNECTED_APPS,
    FeatureKey.FUNNELCRAFT_AI,
    FeatureKey.SMARTCRM_CLOSER,
    FeatureKey.CONTENT_AI,

    // Billing
    FeatureKey.BILLING_CREDITS,
    FeatureKey.BUY_CREDITS,
  ],

  whitelabel: [
    // Everything from smartmarketer
    ...PACKAGE_FEATURES.smartmarketer,
    // Plus white label features
    FeatureKey.WHITE_LABEL,
    FeatureKey.WHITE_LABEL_CUSTOMIZATION,
    FeatureKey.WHITE_LABEL_MANAGEMENT,
    FeatureKey.MULTI_TENANT_FEATURES,
    FeatureKey.CUSTOM_BRANDING,
    FeatureKey.DOMAIN_MANAGEMENT,
    FeatureKey.PACKAGE_BUILDER,
    FeatureKey.REVENUE_SHARING,
    FeatureKey.PARTNER_DASHBOARD,
    FeatureKey.PARTNER_ONBOARDING,
    FeatureKey.BRAND_ASSET_MANAGEMENT,
    FeatureKey.THEME_CUSTOMIZATION,
    FeatureKey.CUSTOM_DOMAIN_SETUP,
    FeatureKey.FEATURE_PACKAGE_CONFIGURATION,
  ],

  super_admin: ['*'], // Wildcard for all features
};

// Route to feature mapping
export const ROUTE_FEATURE_MAP: Record<string, FeatureKey> = {
  '/dashboard': FeatureKey.DASHBOARD,
  '/contacts': FeatureKey.CONTACTS,
  '/pipeline': FeatureKey.PIPELINE,
  '/calendar': FeatureKey.CALENDAR,
  '/tasks': FeatureKey.TASK_MANAGEMENT,
  '/ai-goals': FeatureKey.AI_GOALS,
  '/ai-tools': FeatureKey.AI_TOOLS,
  '/analytics': FeatureKey.ANALYTICS,
  '/analytics/deals': FeatureKey.DEAL_INTELLIGENCE_DASHBOARD,
  '/analytics/contacts': FeatureKey.CONTACT_ANALYTICS_DASHBOARD,
  '/pipeline-intelligence': FeatureKey.PIPELINE_INTELLIGENCE,
  '/deal-risk-monitor': FeatureKey.DEAL_RISK_MONITOR,
  '/smart-conversion-insights': FeatureKey.SMART_CONVERSION_INSIGHTS,
  '/pipeline-health-dashboard': FeatureKey.PIPELINE_HEALTH_DASHBOARD,
  '/sales-cycle-analytics': FeatureKey.SALES_CYCLE_ANALYTICS,
  '/win-rate-intelligence': FeatureKey.WIN_RATE_INTELLIGENCE,
  '/ai-sales-forecast': FeatureKey.AI_SALES_FORECAST,
  '/live-deal-analysis': FeatureKey.LIVE_DEAL_ANALYSIS,
  '/competitor-insights': FeatureKey.COMPETITOR_INSIGHTS,
  '/revenue-intelligence': FeatureKey.REVENUE_INTELLIGENCE,
  '/appointments': FeatureKey.APPOINTMENTS,
  '/video-email': FeatureKey.VIDEO_EMAIL,
  '/text-messages': FeatureKey.TEXT_MESSAGES,
  '/phone-system': FeatureKey.PHONE_SYSTEM,
  '/voice-profiles': FeatureKey.VOICE_PROFILES,
  '/invoicing': FeatureKey.INVOICING,
  '/lead-automation': FeatureKey.LEAD_AUTOMATION,
  '/forms-surveys': FeatureKey.FORMS_SURVEYS,
  '/business-analyzer': FeatureKey.BUSINESS_ANALYZER,
  '/content-library': FeatureKey.CONTENT_LIBRARY,
  '/circle-prospecting': FeatureKey.CIRCLE_PROSPECTING,
  '/funnelcraft-ai': FeatureKey.FUNNELCRAFT_AI,
  '/smartcrm-closer': FeatureKey.SMARTCRM_CLOSER,
  '/content-ai': FeatureKey.CONTENT_AI,
  '/white-label': FeatureKey.WHITE_LABEL_CUSTOMIZATION,
  '/white-label-management': FeatureKey.WHITE_LABEL_MANAGEMENT,
  '/revenue-sharing': FeatureKey.REVENUE_SHARING,
  '/package-builder': FeatureKey.PACKAGE_BUILDER,
  '/partner-dashboard': FeatureKey.PARTNER_DASHBOARD,
  '/partner-onboarding': FeatureKey.PARTNER_ONBOARDING,
  '/buy-credits': FeatureKey.BUY_CREDITS,
  '/openclaw': FeatureKey.OPENCLAW,
  '/admin': FeatureKey.ADMIN_PANEL,
  '/admin/feature-management': FeatureKey.FEATURE_MANAGEMENT,
  '/admin/users': FeatureKey.USER_MANAGEMENT,
};

/**
 * Check if a user can access a feature based on their entitlement
 */
export function canAccessFeature(
  entitlement: UserEntitlement | null,
  featureKey: FeatureKey | string
): boolean {
  if (!entitlement?.package) return false;

  // Super admin gets everything
  if (entitlement.package === 'super_admin') return true;

  // No access package blocks everything
  if (entitlement.package === 'no_access') return false;

  // OpenClaw is a separate flag
  if (featureKey === FeatureKey.OPENCLAW) {
    return entitlement.openclaw_enabled === true;
  }

  // Admin panel requires admin flag
  if (
    featureKey === FeatureKey.ADMIN_PANEL ||
    featureKey === FeatureKey.FEATURE_MANAGEMENT ||
    featureKey === FeatureKey.USER_MANAGEMENT
  ) {
    return entitlement.admin_enabled === true;
  }

  // Check if feature is in package's feature list
  const features = PACKAGE_FEATURES[entitlement.package] || [];
  return features.includes(featureKey as FeatureKey) || features.includes('*');
}

/**
 * Get the feature key required for a given route
 */
export function getFeatureForRoute(route: string): FeatureKey | undefined {
  return ROUTE_FEATURE_MAP[route];
}

/**
 * Check if user can access a route
 */
export function canAccessRoute(entitlement: UserEntitlement | null, route: string): boolean {
  const feature = getFeatureForRoute(route);
  if (!feature) return true; // No restriction if route not mapped
  return canAccessFeature(entitlement, feature);
}
