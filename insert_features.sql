-- =====================================================
-- CLEAR OLD FEATURE MAPPINGS
-- =====================================================

delete from public.package_features;

-- =====================================================
-- NO ACCESS
-- =====================================================
-- no_access gets no features


-- =====================================================
-- REGULAR USERS: Core CRM only
-- =====================================================

insert into public.package_features (package, feature_key) values
('regular', 'core_crm'),
('regular', 'dashboard'),
('regular', 'contacts'),
('regular', 'pipeline'),
('regular', 'calendar');


-- =====================================================
-- SMARTMARKETER USERS
-- Smart Marketer / SalesPype-style platform
-- No white label, no admin, no OpenClaw
-- =====================================================

insert into public.package_features (package, feature_key) values
('smartmarketer', 'core_crm'),
('smartmarketer', 'dashboard'),
('smartmarketer', 'contacts'),
('smartmarketer', 'pipeline'),
('smartmarketer', 'calendar'),

-- Enhanced CRM
('smartmarketer', 'contact_enhancements'),
('smartmarketer', 'ai_contact_enrichment'),
('smartmarketer', 'ai_lead_scoring'),
('smartmarketer', 'custom_fields'),
('smartmarketer', 'contact_activity_tracking'),
('smartmarketer', 'bulk_contact_operations'),
('smartmarketer', 'pipeline_management'),
('smartmarketer', 'task_management'),

-- AI Tools
('smartmarketer', 'ai_tools'),
('smartmarketer', 'email_analysis'),
('smartmarketer', 'meeting_summarizer'),
('smartmarketer', 'proposal_generator'),
('smartmarketer', 'call_script_generator'),
('smartmarketer', 'subject_line_optimizer'),
('smartmarketer', 'vision_analyzer'),
('smartmarketer', 'image_generator'),
('smartmarketer', 'semantic_search'),
('smartmarketer', 'function_assistant'),
('smartmarketer', 'streaming_chat'),
('smartmarketer', 'live_deal_analysis'),
('smartmarketer', 'instant_response_generator'),
('smartmarketer', 'ai_goals'),

-- Analytics / Intelligence
('smartmarketer', 'analytics'),
('smartmarketer', 'advanced_analytics'),
('smartmarketer', 'business_intelligence'),
('smartmarketer', 'sales_intelligence'),
('smartmarketer', 'deal_intelligence_dashboard'),
('smartmarketer', 'contact_analytics_dashboard'),
('smartmarketer', 'pipeline_intelligence'),
('smartmarketer', 'deal_risk_monitor'),
('smartmarketer', 'smart_conversion_insights'),
('smartmarketer', 'pipeline_health_dashboard'),
('smartmarketer', 'sales_cycle_analytics'),
('smartmarketer', 'win_rate_intelligence'),
('smartmarketer', 'ai_sales_forecast'),
('smartmarketer', 'competitor_insights'),
('smartmarketer', 'revenue_intelligence'),

-- Communication Hub
('smartmarketer', 'communication_hub'),
('smartmarketer', 'appointments'),
('smartmarketer', 'video_email'),
('smartmarketer', 'text_messages'),
('smartmarketer', 'phone_system'),
('smartmarketer', 'voice_profiles'),

-- Smart Marketer / SalesPype-style tools
('smartmarketer', 'invoicing'),
('smartmarketer', 'lead_automation'),
('smartmarketer', 'forms_surveys'),
('smartmarketer', 'business_analyzer'),
('smartmarketer', 'content_library'),
('smartmarketer', 'circle_prospecting'),

-- Connected apps, excluding OpenClaw
('smartmarketer', 'connected_apps'),
('smartmarketer', 'funnelcraft_ai'),
('smartmarketer', 'smartcrm_closer'),
('smartmarketer', 'content_ai'),

-- Billing/Credits
('smartmarketer', 'billing_credits'),
('smartmarketer', 'buy_credits');


-- =====================================================
-- WHITELABEL USERS
-- Everything SmartMarketer gets + White Label
-- No admin, no OpenClaw
-- =====================================================

insert into public.package_features (package, feature_key)
select 'whitelabel', feature_key
from public.package_features
where package = 'smartmarketer';

insert into public.package_features (package, feature_key) values
('whitelabel', 'white_label'),
('whitelabel', 'white_label_customization'),
('whitelabel', 'white_label_management'),
('whitelabel', 'multi_tenant_features'),
('whitelabel', 'custom_branding'),
('whitelabel', 'domain_management'),
('whitelabel', 'package_builder'),
('whitelabel', 'revenue_sharing'),
('whitelabel', 'partner_dashboard'),
('whitelabel', 'partner_onboarding'),
('whitelabel', 'brand_asset_management'),
('whitelabel', 'theme_customization'),
('whitelabel', 'custom_domain_setup'),
('whitelabel', 'feature_package_configuration');


-- =====================================================
-- SUPER ADMIN
-- Everything including OpenClaw and Admin
-- =====================================================

insert into public.package_features (package, feature_key) values
('super_admin', '*'),
('super_admin', 'openclaw'),
('super_admin', 'admin_panel'),
('super_admin', 'feature_management'),
('super_admin', 'user_management'),
('super_admin', 'system_monitoring'),
('super_admin', 'security_audit_logs'),
('super_admin', 'compliance_tools'),
('super_admin', 'security_compliance');