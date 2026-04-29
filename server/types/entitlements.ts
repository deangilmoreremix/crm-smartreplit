/**
 * Server-side entitlement types
 * Mirrors client FeatureKey enum for runtime feature checks
 */

export const FeatureKey = {
  // Core CRM
  CORE_CRM: 'core_crm',
  DASHBOARD: 'dashboard',
  CONTACTS: 'contacts',
  PIPELINE: 'pipeline',
  CALENDAR: 'calendar',
  // AI Tools
  AI_TOOLS: 'ai_tools',
  AI_GOALS: 'ai_goals',
  // Analytics & Intelligence
  ANALYTICS: 'analytics',
  BUSINESS_INTELLIGENCE: 'business_intelligence',
  SALES_INTELLIGENCE: 'sales_intelligence',
  DEAL_INTELLIGENCE_DASHBOARD: 'deal_intelligence_dashboard',
  CONTACT_ANALYTICS_DASHBOARD: 'contact_analytics_dashboard',
  PIPELINE_INTELLIGENCE: 'pipeline_intelligence',
  DEAL_RISK_MONITOR: 'deal_risk_monitor',
  SMART_CONVERSION_INSIGHTS: 'smart_conversion_insights',
  PIPELINE_HEALTH_DASHBOARD: 'pipeline_health_dashboard',
  SALES_CYCLE_ANALYTICS: 'sales_cycle_analytics',
  WIN_RATE_INTELLIGENCE: 'win_rate_intelligence',
  AI_SALES_FORECAST: 'ai_sales_forecast',
  COMPETITOR_INSIGHTS: 'competitor_insights',
  REVENUE_INTELLIGENCE: 'revenue_intelligence',
  // Contact Enhancements
  CONTACT_ENHANCEMENTS: 'contact_enhancements',
  AI_CONTACT_ENRICHMENT: 'ai_contact_enrichment',
  AI_LEAD_SCORING: 'ai_lead_scoring',
  CUSTOM_FIELDS: 'custom_fields',
  CONTACT_ACTIVITY_TRACKING: 'contact_activity_tracking',
  BULK_CONTACT_OPERATIONS: 'bulk_contact_operations',
  // Communication Hub
  COMMUNICATION_HUB: 'communication_hub',
  APPOINTMENTS: 'appointments',
  VIDEO_EMAIL: 'video_email',
  TEXT_MESSAGES: 'text_messages',
  PHONE_SYSTEM: 'phone_system',
  VOICE_PROFILES: 'voice_profiles',
  INVOICING: 'invoicing',
  LEAD_AUTOMATION: 'lead_automation',
  FORMS_SURVEYS: 'forms_surveys',
  BUSINESS_ANALYZER: 'business_analyzer',
  CONTENT_LIBRARY: 'content_library',
  CIRCLE_PROSPECTING: 'circle_prospecting',
  CONNECTED_APPS: 'connected_apps',
  FUNNELCRAFT_AI: 'funnelcraft_ai',
  SMARTCRM_CLOSER: 'smartcrm_closer',
  CONTENT_AI: 'content_ai',
  BILLING_CREDITS: 'billing_credits',
  BUY_CREDITS: 'buy_credits',
  // White Label
  WHITE_LABEL: 'white_label',
  WHITE_LABEL_CUSTOMIZATION: 'white_label_customization',
  WHITE_LABEL_MANAGEMENT: 'white_label_management',
  MULTI_TENANT_FEATURES: 'multi_tenant_features',
  CUSTOM_BRANDING: 'custom_branding',
  DOMAIN_MANAGEMENT: 'domain_management',
  PACKAGE_BUILDER: 'package_builder',
  REVENUE_SHARING: 'revenue_sharing',
  PARTNER_DASHBOARD: 'partner_dashboard',
  PARTNER_ONBOARDING: 'partner_onboarding',
  BRAND_ASSET_MANAGEMENT: 'brand_asset_management',
  THEME_CUSTOMIZATION: 'theme_customization',
  CUSTOM_DOMAIN_SETUP: 'custom_domain_setup',
  FEATURE_PACKAGE_CONFIGURATION: 'feature_package_configuration',
  // Admin & System
  OPENCLAW: 'openclaw',
  ADMIN_PANEL: 'admin_panel',
  FEATURE_MANAGEMENT: 'feature_management',
  USER_MANAGEMENT: 'user_management',
  SYSTEM_MONITORING: 'system_monitoring',
  SECURITY_AUDIT_LOGS: 'security_audit_logs',
  COMPLIANCE_TOOLS: 'compliance_tools',
  SECURITY_COMPLIANCE: 'security_compliance',
} as const;

export type FeatureKey = (typeof FeatureKey)[keyof typeof FeatureKey];

export interface UserEntitlement {
  id: string;
  user_id?: string;
  email: string;
  package: 'no_access' | 'regular' | 'smartmarketer' | 'whitelabel' | 'super_admin';
  openclaw_enabled: boolean;
  admin_enabled: boolean;
  source?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}
