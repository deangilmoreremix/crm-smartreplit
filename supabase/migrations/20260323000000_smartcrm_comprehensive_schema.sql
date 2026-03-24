-- ============================================================================
-- SMART CRM COMPREHENSIVE MULTI-TENANT MIGRATION
-- Project: bzxohkrxcwodllketcpz
-- App Slug: smartcrm
-- 
-- This migration adds app_slug columns to existing tables for multi-tenant
-- isolation and creates comprehensive RLS policies for Smart CRM features
-- ============================================================================

-- ============================================================================
-- CONTACTS TABLE - Add app_slug for multi-tenancy
-- ============================================================================
ALTER TABLE public.contacts 
    ADD COLUMN IF NOT EXISTS app_slug VARCHAR(50) DEFAULT 'smartcrm',
    ADD COLUMN IF NOT EXISTS tenant_id UUID;

CREATE INDEX IF NOT EXISTS idx_contacts_app_tenant ON public.contacts(app_slug, tenant_id);
CREATE INDEX IF NOT EXISTS idx_contacts_tenant ON public.contacts(tenant_id) WHERE tenant_id IS NOT NULL;

-- ============================================================================
-- DEALS TABLE - Add app_slug for multi-tenancy
-- ============================================================================
ALTER TABLE public.deals 
    ADD COLUMN IF NOT EXISTS app_slug VARCHAR(50) DEFAULT 'smartcrm',
    ADD COLUMN IF NOT EXISTS tenant_id UUID;

CREATE INDEX IF NOT EXISTS idx_deals_app_tenant ON public.deals(app_slug, tenant_id);
CREATE INDEX IF NOT EXISTS idx_deals_tenant ON public.deals(tenant_id) WHERE tenant_id IS NOT NULL;

-- ============================================================================
-- DEAL_STAGES TABLE - Add app_slug for multi-tenancy
-- ============================================================================
ALTER TABLE public.deal_stages 
    ADD COLUMN IF NOT EXISTS app_slug VARCHAR(50) DEFAULT 'smartcrm',
    ADD COLUMN IF NOT EXISTS tenant_id UUID;

CREATE INDEX IF NOT EXISTS idx_deal_stages_app_tenant ON public.deal_stages(app_slug, tenant_id);

-- ============================================================================
-- TASKS TABLE - Add app_slug for multi-tenancy
-- ============================================================================
ALTER TABLE public.tasks 
    ADD COLUMN IF NOT EXISTS app_slug VARCHAR(50) DEFAULT 'smartcrm',
    ADD COLUMN IF NOT EXISTS tenant_id UUID;

CREATE INDEX IF NOT EXISTS idx_tasks_app_tenant ON public.tasks(app_slug, tenant_id);
CREATE INDEX IF NOT EXISTS idx_tasks_tenant ON public.tasks(tenant_id) WHERE tenant_id IS NOT NULL;

-- ============================================================================
-- SALES_GOALS TABLE - Add app_slug for multi-tenancy
-- ============================================================================
ALTER TABLE public.sales_goals 
    ADD COLUMN IF NOT EXISTS app_slug VARCHAR(50) DEFAULT 'smartcrm',
    ADD COLUMN IF NOT EXISTS tenant_id UUID;

CREATE INDEX IF NOT EXISTS idx_sales_goals_app_tenant ON public.sales_goals(app_slug, tenant_id);

-- ============================================================================
-- USER_GOALS TABLE - Add app_slug for multi-tenancy
-- ============================================================================
ALTER TABLE public.user_goals 
    ADD COLUMN IF NOT EXISTS app_slug VARCHAR(50) DEFAULT 'smartcrm',
    ADD COLUMN IF NOT EXISTS tenant_id UUID;

CREATE INDEX IF NOT EXISTS idx_user_goals_app_tenant ON public.user_goals(app_slug, tenant_id);

-- ============================================================================
-- CONTACT_ACTIVITIES TABLE - Add app_slug for multi-tenancy
-- ============================================================================
ALTER TABLE public.contact_activities 
    ADD COLUMN IF NOT EXISTS app_slug VARCHAR(50) DEFAULT 'smartcrm',
    ADD COLUMN IF NOT EXISTS tenant_id UUID;

CREATE INDEX IF NOT EXISTS idx_contact_activities_app_tenant ON public.contact_activities(app_slug, tenant_id);

-- ============================================================================
-- SALES_ACTIVITIES TABLE - Add app_slug for multi-tenancy
-- ============================================================================
ALTER TABLE public.sales_activities 
    ADD COLUMN IF NOT EXISTS app_slug VARCHAR(50) DEFAULT 'smartcrm',
    ADD COLUMN IF NOT EXISTS tenant_id UUID;

CREATE INDEX IF NOT EXISTS idx_sales_activities_app_tenant ON public.sales_activities(app_slug, tenant_id);

-- ============================================================================
-- AUTOMATION_RULES TABLE - Add app_slug for multi-tenancy
-- ============================================================================
ALTER TABLE public.automation_rules 
    ADD COLUMN IF NOT EXISTS app_slug VARCHAR(50) DEFAULT 'smartcrm',
    ADD COLUMN IF NOT EXISTS tenant_id UUID;

CREATE INDEX IF NOT EXISTS idx_automation_rules_app_tenant ON public.automation_rules(app_slug, tenant_id);

-- ============================================================================
-- AUTOMATION_EXECUTIONS TABLE - Add app_slug for multi-tenancy
-- ============================================================================
ALTER TABLE public.automation_executions 
    ADD COLUMN IF NOT EXISTS app_slug VARCHAR(50) DEFAULT 'smartcrm',
    ADD COLUMN IF NOT EXISTS tenant_id UUID;

CREATE INDEX IF NOT EXISTS idx_automation_executions_app_tenant ON public.automation_executions(app_slug, tenant_id);

-- ============================================================================
-- AI_WORKFLOWS TABLE - Add app_slug for multi-tenancy
-- ============================================================================
ALTER TABLE public.ai_workflows 
    ADD COLUMN IF NOT EXISTS app_slug VARCHAR(50) DEFAULT 'smartcrm',
    ADD COLUMN IF NOT EXISTS tenant_id UUID;

CREATE INDEX IF NOT EXISTS idx_ai_workflows_app_tenant ON public.ai_workflows(app_slug, tenant_id);

-- ============================================================================
-- WORKFLOW_EXECUTIONS TABLE - Add app_slug for multi-tenancy
-- ============================================================================
ALTER TABLE public.workflow_executions 
    ADD COLUMN IF NOT EXISTS app_slug VARCHAR(50) DEFAULT 'smartcrm',
    ADD COLUMN IF NOT EXISTS tenant_id UUID;

CREATE INDEX IF NOT EXISTS idx_workflow_executions_app_tenant ON public.workflow_executions(app_slug, tenant_id);

-- ============================================================================
-- CAMPAIGNS TABLE - Add app_slug for multi-tenancy
-- ============================================================================
ALTER TABLE public.campaigns 
    ADD COLUMN IF NOT EXISTS app_slug VARCHAR(50) DEFAULT 'smartcrm',
    ADD COLUMN IF NOT EXISTS tenant_id UUID;

CREATE INDEX IF NOT EXISTS idx_campaigns_app_tenant ON public.campaigns(app_slug, tenant_id);

-- ============================================================================
-- COMMUNICATIONS TABLE - Add app_slug for multi-tenancy
-- ============================================================================
ALTER TABLE public.communications 
    ADD COLUMN IF NOT EXISTS app_slug VARCHAR(50) DEFAULT 'smartcrm',
    ADD COLUMN IF NOT EXISTS tenant_id UUID;

CREATE INDEX IF NOT EXISTS idx_communications_app_tenant ON public.communications(app_slug, tenant_id);

-- ============================================================================
-- EMAIL_TEMPLATES TABLE - Add app_slug for multi-tenancy
-- ============================================================================
ALTER TABLE public.email_templates 
    ADD COLUMN IF NOT EXISTS app_slug VARCHAR(50) DEFAULT 'smartcrm',
    ADD COLUMN IF NOT EXISTS tenant_id UUID;

CREATE INDEX IF NOT EXISTS idx_email_templates_app_tenant ON public.email_templates(app_slug, tenant_id);

-- ============================================================================
-- SALES_SEQUENCES TABLE - Add app_slug for multi-tenancy
-- ============================================================================
ALTER TABLE public.sales_sequences 
    ADD COLUMN IF NOT EXISTS app_slug VARCHAR(50) DEFAULT 'smartcrm',
    ADD COLUMN IF NOT EXISTS tenant_id UUID;

CREATE INDEX IF NOT EXISTS idx_sales_sequences_app_tenant ON public.sales_sequences(app_slug, tenant_id);

-- ============================================================================
-- CONTACT_SEGMENTS TABLE - Add app_slug for multi-tenancy
-- ============================================================================
ALTER TABLE public.contact_segments 
    ADD COLUMN IF NOT EXISTS app_slug VARCHAR(50) DEFAULT 'smartcrm',
    ADD COLUMN IF NOT EXISTS tenant_id UUID;

CREATE INDEX IF NOT EXISTS idx_contact_segments_app_tenant ON public.contact_segments(app_slug, tenant_id);

-- ============================================================================
-- DEAL_ATTACHMENTS TABLE - Add app_slug for multi-tenancy
-- ============================================================================
ALTER TABLE public.deal_attachments 
    ADD COLUMN IF NOT EXISTS app_slug VARCHAR(50) DEFAULT 'smartcrm',
    ADD COLUMN IF NOT EXISTS tenant_id UUID;

CREATE INDEX IF NOT EXISTS idx_deal_attachments_app_tenant ON public.deal_attachments(app_slug, tenant_id);

-- ============================================================================
-- DEAL_PIPELINE_METRICS TABLE - Add app_slug for multi-tenancy
-- ============================================================================
ALTER TABLE public.deal_pipeline_metrics 
    ADD COLUMN IF NOT EXISTS app_slug VARCHAR(50) DEFAULT 'smartcrm',
    ADD COLUMN IF NOT EXISTS tenant_id UUID;

CREATE INDEX IF NOT EXISTS idx_deal_pipeline_metrics_app_tenant ON public.deal_pipeline_metrics(app_slug, tenant_id);

-- ============================================================================
-- CONTACT_INSIGHTS TABLE - Add app_slug for multi-tenancy
-- ============================================================================
ALTER TABLE public.contact_insights 
    ADD COLUMN IF NOT EXISTS app_slug VARCHAR(50) DEFAULT 'smartcrm',
    ADD COLUMN IF NOT EXISTS tenant_id UUID;

CREATE INDEX IF NOT EXISTS idx_contact_insights_app_tenant ON public.contact_insights(app_slug, tenant_id);

-- ============================================================================
-- CONTACT_ANALYTICS TABLE - Add app_slug for multi-tenancy
-- ============================================================================
ALTER TABLE public.contact_analytics 
    ADD COLUMN IF NOT EXISTS app_slug VARCHAR(50) DEFAULT 'smartcrm',
    ADD COLUMN IF NOT EXISTS tenant_id UUID;

CREATE INDEX IF NOT EXISTS idx_contact_analytics_app_tenant ON public.contact_analytics(app_slug, tenant_id);

-- ============================================================================
-- AI_ENRICHMENT_HISTORY TABLE - Add app_slug for multi-tenancy
-- ============================================================================
ALTER TABLE public.ai_enrichment_history 
    ADD COLUMN IF NOT EXISTS app_slug VARCHAR(50) DEFAULT 'smartcrm',
    ADD COLUMN IF NOT EXISTS tenant_id UUID;

CREATE INDEX IF NOT EXISTS idx_ai_enrichment_history_app_tenant ON public.ai_enrichment_history(app_slug, tenant_id);

-- ============================================================================
-- AI_INSIGHTS TABLE - Add app_slug for multi-tenancy
-- ============================================================================
ALTER TABLE public.ai_insights 
    ADD COLUMN IF NOT EXISTS app_slug VARCHAR(50) DEFAULT 'smartcrm',
    ADD COLUMN IF NOT EXISTS tenant_id UUID;

CREATE INDEX IF NOT EXISTS idx_ai_insights_app_tenant ON public.ai_insights(app_slug, tenant_id);

-- ============================================================================
-- AI_USAGE_LOGS TABLE - Add app_slug for multi-tenancy
-- ============================================================================
ALTER TABLE public.ai_usage_logs 
    ADD COLUMN IF NOT EXISTS app_slug VARCHAR(50) DEFAULT 'smartcrm',
    ADD COLUMN IF NOT EXISTS tenant_id UUID;

CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_app_tenant ON public.ai_usage_logs(app_slug, tenant_id);

-- ============================================================================
-- AI_USAGE_METRICS TABLE - Add app_slug for multi-tenancy
-- ============================================================================
ALTER TABLE public.ai_usage_metrics 
    ADD COLUMN IF NOT EXISTS app_slug VARCHAR(50) DEFAULT 'smartcrm',
    ADD COLUMN IF NOT EXISTS tenant_id UUID;

CREATE INDEX IF NOT EXISTS idx_ai_usage_metrics_app_tenant ON public.ai_usage_metrics(app_slug, tenant_id);

-- ============================================================================
-- CONVERSATION_CONTEXTS TABLE - Add app_slug for multi-tenancy
-- ============================================================================
ALTER TABLE public.conversation_contexts 
    ADD COLUMN IF NOT EXISTS app_slug VARCHAR(50) DEFAULT 'smartcrm',
    ADD COLUMN IF NOT EXISTS tenant_id UUID;

CREATE INDEX IF NOT EXISTS idx_conversation_contexts_app_tenant ON public.conversation_contexts(app_slug, tenant_id);

-- ============================================================================
-- CONVERSATION_MESSAGES TABLE - Add app_slug for multi-tenancy
-- ============================================================================
ALTER TABLE public.conversation_messages 
    ADD COLUMN IF NOT EXISTS app_slug VARCHAR(50) DEFAULT 'smartcrm',
    ADD COLUMN IF NOT EXISTS tenant_id UUID;

CREATE INDEX IF NOT EXISTS idx_conversation_messages_app_tenant ON public.conversation_messages(app_slug, tenant_id);

-- ============================================================================
-- COMMUNICATION_LOGS TABLE - Add app_slug for multi-tenancy
-- ============================================================================
ALTER TABLE public.communication_logs 
    ADD COLUMN IF NOT EXISTS app_slug VARCHAR(50) DEFAULT 'smartcrm',
    ADD COLUMN IF NOT EXISTS tenant_id UUID;

CREATE INDEX IF NOT EXISTS idx_communication_logs_app_tenant ON public.communication_logs(app_slug, tenant_id);

-- ============================================================================
-- APPOINTMENTS TABLE - Add app_slug for multi-tenancy
-- ============================================================================
ALTER TABLE public.appointments 
    ADD COLUMN IF NOT EXISTS app_slug VARCHAR(50) DEFAULT 'smartcrm',
    ADD COLUMN IF NOT EXISTS tenant_id UUID;

CREATE INDEX IF NOT EXISTS idx_appointments_app_tenant ON public.appointments(app_slug, tenant_id);

-- ============================================================================
-- TASK_TEMPLATES TABLE - Add app_slug for multi-tenancy
-- ============================================================================
ALTER TABLE public.task_templates 
    ADD COLUMN IF NOT EXISTS app_slug VARCHAR(50) DEFAULT 'smartcrm',
    ADD COLUMN IF NOT EXISTS tenant_id UUID;

CREATE INDEX IF NOT EXISTS idx_task_templates_app_tenant ON public.task_templates(app_slug, tenant_id);

-- ============================================================================
-- TASK_EXECUTIONS TABLE - Add app_slug for multi-tenancy
-- ============================================================================
ALTER TABLE public.task_executions 
    ADD COLUMN IF NOT EXISTS app_slug VARCHAR(50) DEFAULT 'smartcrm',
    ADD COLUMN IF NOT EXISTS tenant_id UUID;

CREATE INDEX IF NOT EXISTS idx_task_executions_app_tenant ON public.task_executions(app_slug, tenant_id);

-- ============================================================================
-- ENHANCED_TASK_EXECUTIONS TABLE - Add app_slug for multi-tenancy
-- ============================================================================
ALTER TABLE public.enhanced_task_executions 
    ADD COLUMN IF NOT EXISTS app_slug VARCHAR(50) DEFAULT 'smartcrm',
    ADD COLUMN IF NOT EXISTS tenant_id UUID;

CREATE INDEX IF NOT EXISTS idx_enhanced_task_executions_app_tenant ON public.enhanced_task_executions(app_slug, tenant_id);

-- ============================================================================
-- CONTENT_ITEMS TABLE - Add app_slug for multi-tenancy
-- ============================================================================
ALTER TABLE public.content_items 
    ADD COLUMN IF NOT EXISTS app_slug VARCHAR(50) DEFAULT 'smartcrm',
    ADD COLUMN IF NOT EXISTS tenant_id UUID;

CREATE INDEX IF NOT EXISTS idx_content_items_app_tenant ON public.content_items(app_slug, tenant_id);

-- ============================================================================
-- CONTENT_TEMPLATES TABLE - Add app_slug for multi-tenancy
-- ============================================================================
ALTER TABLE public.content_templates 
    ADD COLUMN IF NOT EXISTS app_slug VARCHAR(50) DEFAULT 'smartcrm',
    ADD COLUMN IF NOT EXISTS tenant_id UUID;

CREATE INDEX IF NOT EXISTS idx_content_templates_app_tenant ON public.content_templates(app_slug, tenant_id);

-- ============================================================================
-- GENERATED_CONTENT TABLE - Add app_slug for multi-tenancy
-- ============================================================================
ALTER TABLE public.generated_content 
    ADD COLUMN IF NOT EXISTS app_slug VARCHAR(50) DEFAULT 'smartcrm',
    ADD COLUMN IF NOT EXISTS tenant_id UUID;

CREATE INDEX IF NOT EXISTS idx_generated_content_app_tenant ON public.generated_content(app_slug, tenant_id);

-- ============================================================================
-- ANALYTICS_TIME_SERIES TABLE - Add app_slug for multi-tenancy
-- ============================================================================
ALTER TABLE public.analytics_time_series 
    ADD COLUMN IF NOT EXISTS app_slug VARCHAR(50) DEFAULT 'smartcrm',
    ADD COLUMN IF NOT EXISTS tenant_id UUID;

CREATE INDEX IF NOT EXISTS idx_analytics_time_series_app_tenant ON public.analytics_time_series(app_slug, tenant_id);

-- ============================================================================
-- USER_ANALYTICS TABLE - Add app_slug for multi-tenancy
-- ============================================================================
ALTER TABLE public.user_analytics 
    ADD COLUMN IF NOT EXISTS app_slug VARCHAR(50) DEFAULT 'smartcrm',
    ADD COLUMN IF NOT EXISTS tenant_id UUID;

CREATE INDEX IF NOT EXISTS idx_user_analytics_app_tenant ON public.user_analytics(app_slug, tenant_id);

-- ============================================================================
-- FUNNELS TABLE - Add app_slug for multi-tenancy
-- ============================================================================
ALTER TABLE public.funnels 
    ADD COLUMN IF NOT EXISTS app_slug VARCHAR(50) DEFAULT 'smartcrm',
    ADD COLUMN IF NOT EXISTS tenant_id UUID;

CREATE INDEX IF NOT EXISTS idx_funnels_app_tenant ON public.funnels(app_slug, tenant_id);

-- ============================================================================
-- FUNNEL_STEPS TABLE - Add app_slug for multi-tenancy
-- ============================================================================
ALTER TABLE public.funnel_steps 
    ADD COLUMN IF NOT EXISTS app_slug VARCHAR(50) DEFAULT 'smartcrm',
    ADD COLUMN IF NOT EXISTS tenant_id UUID;

CREATE INDEX IF NOT EXISTS idx_funnel_steps_app_tenant ON public.funnel_steps(app_slug, tenant_id);

-- ============================================================================
-- USER_INTEGRATIONS TABLE - Add app_slug for multi-tenancy
-- ============================================================================
ALTER TABLE public.user_integrations 
    ADD COLUMN IF NOT EXISTS app_slug VARCHAR(50) DEFAULT 'smartcrm',
    ADD COLUMN IF NOT EXISTS tenant_id UUID;

CREATE INDEX IF NOT EXISTS idx_user_integrations_app_tenant ON public.user_integrations(app_slug, tenant_id);

-- ============================================================================
-- SOCIAL_PLATFORM_CONNECTIONS TABLE - Add app_slug for multi-tenancy
-- ============================================================================
ALTER TABLE public.social_platform_connections 
    ADD COLUMN IF NOT EXISTS app_slug VARCHAR(50) DEFAULT 'smartcrm',
    ADD COLUMN IF NOT EXISTS tenant_id UUID;

CREATE INDEX IF NOT EXISTS idx_social_platform_connections_app_tenant ON public.social_platform_connections(app_slug, tenant_id);

-- ============================================================================
-- PROFILES TABLE - Add app_slug for multi-tenancy
-- ============================================================================
ALTER TABLE public.profiles 
    ADD COLUMN IF NOT EXISTS app_slug VARCHAR(50) DEFAULT 'smartcrm',
    ADD COLUMN IF NOT EXISTS tenant_id UUID;

CREATE INDEX IF NOT EXISTS idx_profiles_app_tenant ON public.profiles(app_slug, tenant_id);

-- ============================================================================
-- TENANTS TABLE - Add app_slug for multi-tenancy
-- ============================================================================
ALTER TABLE public.tenants 
    ADD COLUMN IF NOT EXISTS app_slug VARCHAR(50) DEFAULT 'smartcrm';

CREATE INDEX IF NOT EXISTS idx_tenants_app_slug ON public.tenants(app_slug);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES FOR CONTACTS
-- ============================================================================
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contacts_select_smartcrm" ON public.contacts;
CREATE POLICY "contacts_select_smartcrm" ON public.contacts
    FOR SELECT USING (
        app_slug = 'smartcrm'
        AND (tenant_id = (auth.jwt()->>'tenant_id')::uuid OR user_id = auth.uid() OR user_id IS NULL)
    );

DROP POLICY IF EXISTS "contacts_insert_smartcrm" ON public.contacts;
CREATE POLICY "contacts_insert_smartcrm" ON public.contacts
    FOR INSERT WITH CHECK (
        app_slug = 'smartcrm'
        AND (tenant_id = (auth.jwt()->>'tenant_id')::uuid OR user_id = auth.uid())
    );

DROP POLICY IF EXISTS "contacts_update_smartcrm" ON public.contacts;
CREATE POLICY "contacts_update_smartcrm" ON public.contacts
    FOR UPDATE USING (
        app_slug = 'smartcrm'
        AND (tenant_id = (auth.jwt()->>'tenant_id')::uuid OR user_id = auth.uid())
    );

DROP POLICY IF EXISTS "contacts_delete_smartcrm" ON public.contacts;
CREATE POLICY "contacts_delete_smartcrm" ON public.contacts
    FOR DELETE USING (
        app_slug = 'smartcrm'
        AND tenant_id = (auth.jwt()->>'tenant_id')::uuid
    );

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES FOR DEALS
-- ============================================================================
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "deals_select_smartcrm" ON public.deals;
CREATE POLICY "deals_select_smartcrm" ON public.deals
    FOR SELECT USING (
        app_slug = 'smartcrm'
        AND tenant_id = (auth.jwt()->>'tenant_id')::uuid
    );

DROP POLICY IF EXISTS "deals_insert_smartcrm" ON public.deals;
CREATE POLICY "deals_insert_smartcrm" ON public.deals
    FOR INSERT WITH CHECK (
        app_slug = 'smartcrm'
        AND tenant_id = (auth.jwt()->>'tenant_id')::uuid
    );

DROP POLICY IF EXISTS "deals_update_smartcrm" ON public.deals;
CREATE POLICY "deals_update_smartcrm" ON public.deals
    FOR UPDATE USING (
        app_slug = 'smartcrm'
        AND tenant_id = (auth.jwt()->>'tenant_id')::uuid
    );

DROP POLICY IF EXISTS "deals_delete_smartcrm" ON public.deals;
CREATE POLICY "deals_delete_smartcrm" ON public.deals
    FOR DELETE USING (
        app_slug = 'smartcrm'
        AND tenant_id = (auth.jwt()->>'tenant_id')::uuid
    );

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES FOR TASKS
-- ============================================================================
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tasks_select_smartcrm" ON public.tasks;
CREATE POLICY "tasks_select_smartcrm" ON public.tasks
    FOR SELECT USING (
        app_slug = 'smartcrm'
        AND (tenant_id = (auth.jwt()->>'tenant_id')::uuid OR user_id = auth.uid())
    );

DROP POLICY IF EXISTS "tasks_insert_smartcrm" ON public.tasks;
CREATE POLICY "tasks_insert_smartcrm" ON public.tasks
    FOR INSERT WITH CHECK (
        app_slug = 'smartcrm'
        AND (tenant_id = (auth.jwt()->>'tenant_id')::uuid OR user_id = auth.uid())
    );

DROP POLICY IF EXISTS "tasks_update_smartcrm" ON public.tasks;
CREATE POLICY "tasks_update_smartcrm" ON public.tasks
    FOR UPDATE USING (
        app_slug = 'smartcrm'
        AND (tenant_id = (auth.jwt()->>'tenant_id')::uuid OR user_id = auth.uid())
    );

DROP POLICY IF EXISTS "tasks_delete_smartcrm" ON public.tasks;
CREATE POLICY "tasks_delete_smartcrm" ON public.tasks
    FOR DELETE USING (
        app_slug = 'smartcrm'
        AND (tenant_id = (auth.jwt()->>'tenant_id')::uuid OR user_id = auth.uid())
    );

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES FOR SALES_GOALS
-- ============================================================================
ALTER TABLE public.sales_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sales_goals_select_smartcrm" ON public.sales_goals;
CREATE POLICY "sales_goals_select_smartcrm" ON public.sales_goals
    FOR SELECT USING (
        app_slug = 'smartcrm'
        AND tenant_id = (auth.jwt()->>'tenant_id')::uuid
    );

DROP POLICY IF EXISTS "sales_goals_insert_smartcrm" ON public.sales_goals;
CREATE POLICY "sales_goals_insert_smartcrm" ON public.sales_goals
    FOR INSERT WITH CHECK (
        app_slug = 'smartcrm'
        AND tenant_id = (auth.jwt()->>'tenant_id')::uuid
    );

DROP POLICY IF EXISTS "sales_goals_update_smartcrm" ON public.sales_goals;
CREATE POLICY "sales_goals_update_smartcrm" ON public.sales_goals
    FOR UPDATE USING (
        app_slug = 'smartcrm'
        AND tenant_id = (auth.jwt()->>'tenant_id')::uuid
    );

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES FOR CONTACT_ACTIVITIES
-- ============================================================================
ALTER TABLE public.contact_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contact_activities_select_smartcrm" ON public.contact_activities;
CREATE POLICY "contact_activities_select_smartcrm" ON public.contact_activities
    FOR SELECT USING (
        app_slug = 'smartcrm'
        AND tenant_id = (auth.jwt()->>'tenant_id')::uuid
    );

DROP POLICY IF EXISTS "contact_activities_insert_smartcrm" ON public.contact_activities;
CREATE POLICY "contact_activities_insert_smartcrm" ON public.contact_activities
    FOR INSERT WITH CHECK (
        app_slug = 'smartcrm'
        AND tenant_id = (auth.jwt()->>'tenant_id')::uuid
    );

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES FOR SALES_ACTIVITIES
-- ============================================================================
ALTER TABLE public.sales_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sales_activities_select_smartcrm" ON public.sales_activities;
CREATE POLICY "sales_activities_select_smartcrm" ON public.sales_activities
    FOR SELECT USING (
        app_slug = 'smartcrm'
        AND tenant_id = (auth.jwt()->>'tenant_id')::uuid
    );

DROP POLICY IF EXISTS "sales_activities_insert_smartcrm" ON public.sales_activities;
CREATE POLICY "sales_activities_insert_smartcrm" ON public.sales_activities
    FOR INSERT WITH CHECK (
        app_slug = 'smartcrm'
        AND tenant_id = (auth.jwt()->>'tenant_id')::uuid
    );

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES FOR AUTOMATION_RULES
-- ============================================================================
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "automation_rules_select_smartcrm" ON public.automation_rules;
CREATE POLICY "automation_rules_select_smartcrm" ON public.automation_rules
    FOR SELECT USING (
        app_slug = 'smartcrm'
        AND tenant_id = (auth.jwt()->>'tenant_id')::uuid
    );

DROP POLICY IF EXISTS "automation_rules_insert_smartcrm" ON public.automation_rules;
CREATE POLICY "automation_rules_insert_smartcrm" ON public.automation_rules
    FOR INSERT WITH CHECK (
        app_slug = 'smartcrm'
        AND tenant_id = (auth.jwt()->>'tenant_id')::uuid
    );

DROP POLICY IF EXISTS "automation_rules_update_smartcrm" ON public.automation_rules;
CREATE POLICY "automation_rules_update_smartcrm" ON public.automation_rules
    FOR UPDATE USING (
        app_slug = 'smartcrm'
        AND tenant_id = (auth.jwt()->>'tenant_id')::uuid
    );

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES FOR AI_WORKFLOWS
-- ============================================================================
ALTER TABLE public.ai_workflows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_workflows_select_smartcrm" ON public.ai_workflows;
CREATE POLICY "ai_workflows_select_smartcrm" ON public.ai_workflows
    FOR SELECT USING (
        app_slug = 'smartcrm'
        AND tenant_id = (auth.jwt()->>'tenant_id')::uuid
    );

DROP POLICY IF EXISTS "ai_workflows_insert_smartcrm" ON public.ai_workflows;
CREATE POLICY "ai_workflows_insert_smartcrm" ON public.ai_workflows
    FOR INSERT WITH CHECK (
        app_slug = 'smartcrm'
        AND tenant_id = (auth.jwt()->>'tenant_id')::uuid
    );

DROP POLICY IF EXISTS "ai_workflows_update_smartcrm" ON public.ai_workflows;
CREATE POLICY "ai_workflows_update_smartcrm" ON public.ai_workflows
    FOR UPDATE USING (
        app_slug = 'smartcrm'
        AND tenant_id = (auth.jwt()->>'tenant_id')::uuid
    );

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES FOR WORKFLOW_EXECUTIONS
-- ============================================================================
ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workflow_executions_select_smartcrm" ON public.workflow_executions;
CREATE POLICY "workflow_executions_select_smartcrm" ON public.workflow_executions
    FOR SELECT USING (
        app_slug = 'smartcrm'
        AND tenant_id = (auth.jwt()->>'tenant_id')::uuid
    );

DROP POLICY IF EXISTS "workflow_executions_insert_smartcrm" ON public.workflow_executions;
CREATE POLICY "workflow_executions_insert_smartcrm" ON public.workflow_executions
    FOR INSERT WITH CHECK (
        app_slug = 'smartcrm'
        AND tenant_id = (auth.jwt()->>'tenant_id')::uuid
    );

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES FOR CAMPAIGNS
-- ============================================================================
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "campaigns_select_smartcrm" ON public.campaigns;
CREATE POLICY "campaigns_select_smartcrm" ON public.campaigns
    FOR SELECT USING (
        app_slug = 'smartcrm'
        AND tenant_id = (auth.jwt()->>'tenant_id')::uuid
    );

DROP POLICY IF EXISTS "campaigns_insert_smartcrm" ON public.campaigns;
CREATE POLICY "campaigns_insert_smartcrm" ON public.campaigns
    FOR INSERT WITH CHECK (
        app_slug = 'smartcrm'
        AND tenant_id = (auth.jwt()->>'tenant_id')::uuid
    );

DROP POLICY IF EXISTS "campaigns_update_smartcrm" ON public.campaigns;
CREATE POLICY "campaigns_update_smartcrm" ON public.campaigns
    FOR UPDATE USING (
        app_slug = 'smartcrm'
        AND tenant_id = (auth.jwt()->>'tenant_id')::uuid
    );

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES FOR COMMUNICATIONS
-- ============================================================================
ALTER TABLE public.communications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "communications_select_smartcrm" ON public.communications;
CREATE POLICY "communications_select_smartcrm" ON public.communications
    FOR SELECT USING (
        app_slug = 'smartcrm'
        AND tenant_id = (auth.jwt()->>'tenant_id')::uuid
    );

DROP POLICY IF EXISTS "communications_insert_smartcrm" ON public.communications;
CREATE POLICY "communications_insert_smartcrm" ON public.communications
    FOR INSERT WITH CHECK (
        app_slug = 'smartcrm'
        AND tenant_id = (auth.jwt()->>'tenant_id')::uuid
    );

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES FOR EMAIL_TEMPLATES
-- ============================================================================
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "email_templates_select_smartcrm" ON public.email_templates;
CREATE POLICY "email_templates_select_smartcrm" ON public.email_templates
    FOR SELECT USING (
        app_slug = 'smartcrm'
        AND tenant_id = (auth.jwt()->>'tenant_id')::uuid
    );

DROP POLICY IF EXISTS "email_templates_insert_smartcrm" ON public.email_templates;
CREATE POLICY "email_templates_insert_smartcrm" ON public.email_templates
    FOR INSERT WITH CHECK (
        app_slug = 'smartcrm'
        AND tenant_id = (auth.jwt()->>'tenant_id')::uuid
    );

DROP POLICY IF EXISTS "email_templates_update_smartcrm" ON public.email_templates;
CREATE POLICY "email_templates_update_smartcrm" ON public.email_templates
    FOR UPDATE USING (
        app_slug = 'smartcrm'
        AND tenant_id = (auth.jwt()->>'tenant_id')::uuid
    );

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES FOR SALES_SEQUENCES
-- ============================================================================
ALTER TABLE public.sales_sequences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sales_sequences_select_smartcrm" ON public.sales_sequences;
CREATE POLICY "sales_sequences_select_smartcrm" ON public.sales_sequences
    FOR SELECT USING (
        app_slug = 'smartcrm'
        AND tenant_id = (auth.jwt()->>'tenant_id')::uuid
    );

DROP POLICY IF EXISTS "sales_sequences_insert_smartcrm" ON public.sales_sequences;
CREATE POLICY "sales_sequences_insert_smartcrm" ON public.sales_sequences
    FOR INSERT WITH CHECK (
        app_slug = 'smartcrm'
        AND tenant_id = (auth.jwt()->>'tenant_id')::uuid
    );

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES FOR CONTACT_SEGMENTS
-- ============================================================================
ALTER TABLE public.contact_segments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contact_segments_select_smartcrm" ON public.contact_segments;
CREATE POLICY "contact_segments_select_smartcrm" ON public.contact_segments
    FOR SELECT USING (
        app_slug = 'smartcrm'
        AND tenant_id = (auth.jwt()->>'tenant_id')::uuid
    );

DROP POLICY IF EXISTS "contact_segments_insert_smartcrm" ON public.contact_segments;
CREATE POLICY "contact_segments_insert_smartcrm" ON public.contact_segments
    FOR INSERT WITH CHECK (
        app_slug = 'smartcrm'
        AND tenant_id = (auth.jwt()->>'tenant_id')::uuid
    );

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES FOR DEAL_STAGES
-- ============================================================================
ALTER TABLE public.deal_stages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "deal_stages_select_smartcrm" ON public.deal_stages;
CREATE POLICY "deal_stages_select_smartcrm" ON public.deal_stages
    FOR SELECT USING (
        app_slug = 'smartcrm'
        AND tenant_id = (auth.jwt()->>'tenant_id')::uuid
    );

DROP POLICY IF EXISTS "deal_stages_insert_smartcrm" ON public.deal_stages;
CREATE POLICY "deal_stages_insert_smartcrm" ON public.deal_stages
    FOR INSERT WITH CHECK (
        app_slug = 'smartcrm'
        AND tenant_id = (auth.jwt()->>'tenant_id')::uuid
    );

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES FOR PROFILES
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_smartcrm" ON public.profiles;
CREATE POLICY "profiles_select_smartcrm" ON public.profiles
    FOR SELECT USING (
        app_slug = 'smartcrm'
        AND (tenant_id = (auth.jwt()->>'tenant_id')::uuid OR id = auth.uid())
    );

DROP POLICY IF EXISTS "profiles_insert_smartcrm" ON public.profiles;
CREATE POLICY "profiles_insert_smartcrm" ON public.profiles
    FOR INSERT WITH CHECK (
        app_slug = 'smartcrm'
        AND id = auth.uid()
    );

DROP POLICY IF EXISTS "profiles_update_smartcrm" ON public.profiles;
CREATE POLICY "profiles_update_smartcrm" ON public.profiles
    FOR UPDATE USING (
        app_slug = 'smartcrm'
        AND id = auth.uid()
    );

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES FOR USER_GOALS
-- ============================================================================
ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_goals_select_smartcrm" ON public.user_goals;
CREATE POLICY "user_goals_select_smartcrm" ON public.user_goals
    FOR SELECT USING (
        app_slug = 'smartcrm'
        AND (tenant_id = (auth.jwt()->>'tenant_id')::uuid OR user_id = auth.uid())
    );

DROP POLICY IF EXISTS "user_goals_insert_smartcrm" ON public.user_goals;
CREATE POLICY "user_goals_insert_smartcrm" ON public.user_goals
    FOR INSERT WITH CHECK (
        app_slug = 'smartcrm'
        AND (tenant_id = (auth.jwt()->>'tenant_id')::uuid OR user_id = auth.uid())
    );

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES FOR APPOINTMENTS
-- ============================================================================
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "appointments_select_smartcrm" ON public.appointments;
CREATE POLICY "appointments_select_smartcrm" ON public.appointments
    FOR SELECT USING (
        app_slug = 'smartcrm'
        AND (tenant_id = (auth.jwt()->>'tenant_id')::uuid OR user_id = auth.uid())
    );

DROP POLICY IF EXISTS "appointments_insert_smartcrm" ON public.appointments;
CREATE POLICY "appointments_insert_smartcrm" ON public.appointments
    FOR INSERT WITH CHECK (
        app_slug = 'smartcrm'
        AND (tenant_id = (auth.jwt()->>'tenant_id')::uuid OR user_id = auth.uid())
    );

DROP POLICY IF EXISTS "appointments_update_smartcrm" ON public.appointments;
CREATE POLICY "appointments_update_smartcrm" ON public.appointments
    FOR UPDATE USING (
        app_slug = 'smartcrm'
        AND (tenant_id = (auth.jwt()->>'tenant_id')::uuid OR user_id = auth.uid())
    );

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES FOR AI_ENRICHMENT_HISTORY
-- ============================================================================
ALTER TABLE public.ai_enrichment_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_enrichment_history_select_smartcrm" ON public.ai_enrichment_history;
CREATE POLICY "ai_enrichment_history_select_smartcrm" ON public.ai_enrichment_history
    FOR SELECT USING (
        app_slug = 'smartcrm'
        AND tenant_id = (auth.jwt()->>'tenant_id')::uuid
    );

DROP POLICY IF EXISTS "ai_enrichment_history_insert_smartcrm" ON public.ai_enrichment_history;
CREATE POLICY "ai_enrichment_history_insert_smartcrm" ON public.ai_enrichment_history
    FOR INSERT WITH CHECK (
        app_slug = 'smartcrm'
        AND tenant_id = (auth.jwt()->>'tenant_id')::uuid
    );

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES FOR AI_INSIGHTS
-- ============================================================================
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_insights_select_smartcrm" ON public.ai_insights;
CREATE POLICY "ai_insights_select_smartcrm" ON public.ai_insights
    FOR SELECT USING (
        app_slug = 'smartcrm'
        AND tenant_id = (auth.jwt()->>'tenant_id')::uuid
    );

DROP POLICY IF EXISTS "ai_insights_insert_smartcrm" ON public.ai_insights;
CREATE POLICY "ai_insights_insert_smartcrm" ON public.ai_insights
    FOR INSERT WITH CHECK (
        app_slug = 'smartcrm'
        AND tenant_id = (auth.jwt()->>'tenant_id')::uuid
    );

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES FOR USER_INTEGRATIONS
-- ============================================================================
ALTER TABLE public.user_integrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_integrations_select_smartcrm" ON public.user_integrations;
CREATE POLICY "user_integrations_select_smartcrm" ON public.user_integrations
    FOR SELECT USING (
        app_slug = 'smartcrm'
        AND (tenant_id = (auth.jwt()->>'tenant_id')::uuid OR user_id = auth.uid())
    );

DROP POLICY IF EXISTS "user_integrations_insert_smartcrm" ON public.user_integrations;
CREATE POLICY "user_integrations_insert_smartcrm" ON public.user_integrations
    FOR INSERT WITH CHECK (
        app_slug = 'smartcrm'
        AND (tenant_id = (auth.jwt()->>'tenant_id')::uuid OR user_id = auth.uid())
    );

DROP POLICY IF EXISTS "user_integrations_update_smartcrm" ON public.user_integrations;
CREATE POLICY "user_integrations_update_smartcrm" ON public.user_integrations
    FOR UPDATE USING (
        app_slug = 'smartcrm'
        AND (tenant_id = (auth.jwt()->>'tenant_id')::uuid OR user_id = auth.uid())
    );

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES FOR SOCIAL_PLATFORM_CONNECTIONS
-- ============================================================================
ALTER TABLE public.social_platform_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "social_platform_connections_select_smartcrm" ON public.social_platform_connections;
CREATE POLICY "social_platform_connections_select_smartcrm" ON public.social_platform_connections
    FOR SELECT USING (
        app_slug = 'smartcrm'
        AND (tenant_id = (auth.jwt()->>'tenant_id')::uuid OR user_id = auth.uid())
    );

DROP POLICY IF EXISTS "social_platform_connections_insert_smartcrm" ON public.social_platform_connections;
CREATE POLICY "social_platform_connections_insert_smartcrm" ON public.social_platform_connections
    FOR INSERT WITH CHECK (
        app_slug = 'smartcrm'
        AND (tenant_id = (auth.jwt()->>'tenant_id')::uuid OR user_id = auth.uid())
    );

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES FOR CONTENT_ITEMS
-- ============================================================================
ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "content_items_select_smartcrm" ON public.content_items;
CREATE POLICY "content_items_select_smartcrm" ON public.content_items
    FOR SELECT USING (
        app_slug = 'smartcrm'
        AND tenant_id = (auth.jwt()->>'tenant_id')::uuid
    );

DROP POLICY IF EXISTS "content_items_insert_smartcrm" ON public.content_items;
CREATE POLICY "content_items_insert_smartcrm" ON public.content_items
    FOR INSERT WITH CHECK (
        app_slug = 'smartcrm'
        AND tenant_id = (auth.jwt()->>'tenant_id')::uuid
    );

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES FOR GENERATED_CONTENT
-- ============================================================================
ALTER TABLE public.generated_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "generated_content_select_smartcrm" ON public.generated_content;
CREATE POLICY "generated_content_select_smartcrm" ON public.generated_content
    FOR SELECT USING (
        app_slug = 'smartcrm'
        AND tenant_id = (auth.jwt()->>'tenant_id')::uuid
    );

DROP POLICY IF EXISTS "generated_content_insert_smartcrm" ON public.generated_content;
CREATE POLICY "generated_content_insert_smartcrm" ON public.generated_content
    FOR INSERT WITH CHECK (
        app_slug = 'smartcrm'
        AND tenant_id = (auth.jwt()->>'tenant_id')::uuid
    );

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES FOR FUNNELS
-- ============================================================================
ALTER TABLE public.funnels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "funnels_select_smartcrm" ON public.funnels;
CREATE POLICY "funnels_select_smartcrm" ON public.funnels
    FOR SELECT USING (
        app_slug = 'smartcrm'
        AND tenant_id = (auth.jwt()->>'tenant_id')::uuid
    );

DROP POLICY IF EXISTS "funnels_insert_smartcrm" ON public.funnels;
CREATE POLICY "funnels_insert_smartcrm" ON public.funnels
    FOR INSERT WITH CHECK (
        app_slug = 'smartcrm'
        AND tenant_id = (auth.jwt()->>'tenant_id')::uuid
    );

-- ============================================================================
-- COMPLETE
-- ============================================================================
