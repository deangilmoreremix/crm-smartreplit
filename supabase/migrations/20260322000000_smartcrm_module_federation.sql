-- ============================================================================
-- SMART CRM MULTI-TENANT MODULE FEDERATION MIGRATION
-- Project: bzxohkrxcwodllketcpz
-- App Slug: smartcrm
-- 
-- NOTE: This migration adds Smart CRM features to an existing database
-- that already has an apps table (using 'slug' column for videoremixvip)
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- APP REGISTRY - Skip inserting into existing apps table
-- The apps table is managed by videoremixvip and requires tenant_id
-- We'll use app_tenants table to track smartcrm tenants instead
-- ============================================================================
-- NOTE: apps table already exists in remote DB with different schema
-- We'll create app_tenants to link tenants to smartcrm

-- ============================================================================
-- APP TENANTS - Links tenants to smartcrm app
-- Uses app_slug for identification (not foreign key to avoid conflicts)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.app_tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_slug VARCHAR(50) NOT NULL DEFAULT 'smartcrm',
    tenant_id UUID NOT NULL,
    tenant_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(app_slug, tenant_id)
);

CREATE INDEX idx_app_tenants_app ON public.app_tenants(app_slug);
CREATE INDEX idx_app_tenants_tenant ON public.app_tenants(tenant_id);

-- ============================================================================
-- PIPELINES & STAGES - For Enhanced Pipeline Deals
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.pipelines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_slug VARCHAR(50) DEFAULT 'smartcrm',
    tenant_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pipeline_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_slug VARCHAR(50) DEFAULT 'smartcrm',
    tenant_id UUID NOT NULL,
    pipeline_id UUID REFERENCES public.pipelines(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    color VARCHAR(20),
    probability INTEGER DEFAULT 50,
    is_won BOOLEAN DEFAULT FALSE,
    is_lost BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pipelines_app_tenant ON public.pipelines(app_slug, tenant_id);
CREATE INDEX idx_pipeline_stages_app_tenant ON public.pipeline_stages(app_slug, tenant_id);
CREATE INDEX idx_pipeline_stages_pipeline ON public.pipeline_stages(pipeline_id);

-- ============================================================================
-- AI AGENT TABLES - For AI Agent Suite
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.agent_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_slug VARCHAR(50) DEFAULT 'smartcrm',
    tenant_id UUID NOT NULL,
    agent_id UUID,
    config_key VARCHAR(100) NOT NULL,
    config_value JSONB NOT NULL,
    is_encrypted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(agent_id, config_key)
);

CREATE TABLE IF NOT EXISTS public.agent_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_slug VARCHAR(50) DEFAULT 'smartcrm',
    tenant_id UUID NOT NULL,
    agent_id UUID,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    input_data JSONB DEFAULT '{}',
    output_data JSONB DEFAULT '{}',
    error_message TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.agent_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_slug VARCHAR(50) DEFAULT 'smartcrm',
    tenant_id UUID NOT NULL,
    agent_id UUID REFERENCES public.agent_configurations(id) ON DELETE CASCADE,
    schedule_type VARCHAR(50) NOT NULL CHECK (schedule_type IN ('once', 'recurring', 'cron')),
    cron_expression VARCHAR(100),
    scheduled_for TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_run_at TIMESTAMP,
    next_run_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_agents_app_tenant ON public.agent_configurations(app_slug, tenant_id);
CREATE INDEX idx_agent_executions_app_tenant ON public.agent_executions(app_slug, tenant_id);
CREATE INDEX idx_agent_executions_status ON public.agent_executions(status);
CREATE INDEX idx_agent_schedules_app_tenant ON public.agent_schedules(app_slug, tenant_id);

-- ============================================================================
-- CALENDAR TABLES - For AI Calendar App
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_slug VARCHAR(50) DEFAULT 'smartcrm',
    tenant_id UUID NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_type VARCHAR(100) NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    all_day BOOLEAN DEFAULT FALSE,
    timezone VARCHAR(100) DEFAULT 'UTC',
    location VARCHAR(500),
    meeting_url TEXT,
    attendees JSONB DEFAULT '[]',
    reminders JSONB DEFAULT '[]',
    recurrence_rule TEXT,
    status VARCHAR(50) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'tentative', 'cancelled')),
    is_recurring BOOLEAN DEFAULT FALSE,
    parent_event_id UUID REFERENCES public.calendar_events(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.calendar_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_slug VARCHAR(50) DEFAULT 'smartcrm',
    tenant_id UUID NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.calendar_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_slug VARCHAR(50) DEFAULT 'smartcrm',
    tenant_id UUID NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('google', 'outlook', 'caldav', 'apple')),
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP,
    calendar_id TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sync_enabled BOOLEAN DEFAULT TRUE,
    last_sync_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_calendar_events_app_tenant ON public.calendar_events(app_slug, tenant_id);
CREATE INDEX idx_calendar_events_user ON public.calendar_events(user_id, start_time);
CREATE INDEX idx_calendar_availability_app_tenant ON public.calendar_availability(app_slug, tenant_id);
CREATE INDEX idx_calendar_integrations_app_tenant ON public.calendar_integrations(app_slug, tenant_id);

-- ============================================================================
-- STORAGE BUCKETS - For file storage
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, created_at, updated_at)
VALUES 
    ('smartcrm-contacts', 'smartcrm-contacts', true, NOW(), NOW()),
    ('smartcrm-deals', 'smartcrm-deals', true, NOW(), NOW()),
    ('smartcrm-calendar', 'smartcrm-calendar', true, NOW(), NOW()),
    ('smartcrm-agents', 'smartcrm-agents', true, NOW(), NOW()),
    ('smartcrm-avatars', 'smartcrm-avatars', true, NOW(), NOW()),
    ('smartcrm-documents', 'smartcrm-documents', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- App Tenants RLS
ALTER TABLE public.app_tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "app_tenants_select" ON public.app_tenants
    FOR SELECT USING (
        app_slug = 'smartcrm'
        AND tenant_id = (auth.jwt()->>'tenant_id')::uuid
    );

CREATE POLICY "app_tenants_insert" ON public.app_tenants
    FOR INSERT WITH CHECK (
        app_slug = 'smartcrm'
        AND tenant_id = (auth.jwt()->>'tenant_id')::uuid
    );

CREATE POLICY "app_tenants_update" ON public.app_tenants
    FOR UPDATE USING (
        app_slug = 'smartcrm'
        AND tenant_id = (auth.jwt()->>'tenant_id')::uuid
    );

-- Pipelines RLS
ALTER TABLE public.pipelines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pipelines_select" ON public.pipelines
    FOR SELECT USING (
        app_slug = 'smartcrm'
        AND tenant_id = (auth.jwt()->>'tenant_id')::uuid
    );

CREATE POLICY "pipelines_insert" ON public.pipelines
    FOR INSERT WITH CHECK (
        app_slug = 'smartcrm'
        AND tenant_id = (auth.jwt()->>'tenant_id')::uuid
    );

CREATE POLICY "pipelines_update" ON public.pipelines
    FOR UPDATE USING (
        app_slug = 'smartcrm'
        AND tenant_id = (auth.jwt()->>'tenant_id')::uuid
    );

CREATE POLICY "pipelines_delete" ON public.pipelines
    FOR DELETE USING (
        app_slug = 'smartcrm'
        AND tenant_id = (auth.jwt()->>'tenant_id')::uuid
    );

-- Pipeline Stages RLS
ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pipeline_stages_select" ON public.pipeline_stages
    FOR SELECT USING (
        app_slug = 'smartcrm'
        AND tenant_id = (auth.jwt()->>'tenant_id')::uuid
    );

CREATE POLICY "pipeline_stages_insert" ON public.pipeline_stages
    FOR INSERT WITH CHECK (
        app_slug = 'smartcrm'
        AND tenant_id = (auth.jwt()->>'tenant_id')::uuid
    );

CREATE POLICY "pipeline_stages_update" ON public.pipeline_stages
    FOR UPDATE USING (
        app_slug = 'smartcrm'
        AND tenant_id = (auth.jwt()->>'tenant_id')::uuid
    );

-- Agent Configurations RLS
ALTER TABLE public.agent_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agent_configurations_select" ON public.agent_configurations
    FOR SELECT USING (
        app_slug = 'smartcrm'
        AND tenant_id = (auth.jwt()->>'tenant_id')::uuid
    );

CREATE POLICY "agent_configurations_insert" ON public.agent_configurations
    FOR INSERT WITH CHECK (
        app_slug = 'smartcrm'
        AND tenant_id = (auth.jwt()->>'tenant_id')::uuid
    );

CREATE POLICY "agent_configurations_update" ON public.agent_configurations
    FOR UPDATE USING (
        app_slug = 'smartcrm'
        AND tenant_id = (auth.jwt()->>'tenant_id')::uuid
    );

-- Agent Executions RLS
ALTER TABLE public.agent_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agent_executions_select" ON public.agent_executions
    FOR SELECT USING (
        app_slug = 'smartcrm'
        AND tenant_id = (auth.jwt()->>'tenant_id')::uuid
    );

CREATE POLICY "agent_executions_insert" ON public.agent_executions
    FOR INSERT WITH CHECK (
        app_slug = 'smartcrm'
        AND tenant_id = (auth.jwt()->>'tenant_id')::uuid
    );

CREATE POLICY "agent_executions_update" ON public.agent_executions
    FOR UPDATE USING (
        app_slug = 'smartcrm'
        AND tenant_id = (auth.jwt()->>'tenant_id')::uuid
    );

-- Agent Schedules RLS
ALTER TABLE public.agent_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agent_schedules_select" ON public.agent_schedules
    FOR SELECT USING (
        app_slug = 'smartcrm'
        AND tenant_id = (auth.jwt()->>'tenant_id')::uuid
    );

CREATE POLICY "agent_schedules_insert" ON public.agent_schedules
    FOR INSERT WITH CHECK (
        app_slug = 'smartcrm'
        AND tenant_id = (auth.jwt()->>'tenant_id')::uuid
    );

CREATE POLICY "agent_schedules_update" ON public.agent_schedules
    FOR UPDATE USING (
        app_slug = 'smartcrm'
        AND tenant_id = (auth.jwt()->>'tenant_id')::uuid
    );

-- Calendar Events RLS
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "calendar_events_select" ON public.calendar_events
    FOR SELECT USING (
        app_slug = 'smartcrm'
        AND (tenant_id = (auth.jwt()->>'tenant_id')::uuid OR user_id = auth.uid())
    );

CREATE POLICY "calendar_events_insert" ON public.calendar_events
    FOR INSERT WITH CHECK (
        app_slug = 'smartcrm'
        AND (tenant_id = (auth.jwt()->>'tenant_id')::uuid OR user_id = auth.uid())
    );

CREATE POLICY "calendar_events_update" ON public.calendar_events
    FOR UPDATE USING (
        app_slug = 'smartcrm'
        AND (tenant_id = (auth.jwt()->>'tenant_id')::uuid OR user_id = auth.uid())
    );

CREATE POLICY "calendar_events_delete" ON public.calendar_events
    FOR DELETE USING (
        app_slug = 'smartcrm'
        AND (tenant_id = (auth.jwt()->>'tenant_id')::uuid OR user_id = auth.uid())
    );

-- Calendar Availability RLS
ALTER TABLE public.calendar_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "calendar_availability_select" ON public.calendar_availability
    FOR SELECT USING (
        app_slug = 'smartcrm'
        AND (tenant_id = (auth.jwt()->>'tenant_id')::uuid OR user_id = auth.uid())
    );

CREATE POLICY "calendar_availability_insert" ON public.calendar_availability
    FOR INSERT WITH CHECK (
        app_slug = 'smartcrm'
        AND (tenant_id = (auth.jwt()->>'tenant_id')::uuid OR user_id = auth.uid())
    );

CREATE POLICY "calendar_availability_update" ON public.calendar_availability
    FOR UPDATE USING (
        app_slug = 'smartcrm'
        AND (tenant_id = (auth.jwt()->>'tenant_id')::uuid OR user_id = auth.uid())
    );

-- Calendar Integrations RLS
ALTER TABLE public.calendar_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "calendar_integrations_select" ON public.calendar_integrations
    FOR SELECT USING (
        app_slug = 'smartcrm'
        AND user_id = auth.uid()
    );

CREATE POLICY "calendar_integrations_insert" ON public.calendar_integrations
    FOR INSERT WITH CHECK (
        app_slug = 'smartcrm'
        AND user_id = auth.uid()
    );

CREATE POLICY "calendar_integrations_update" ON public.calendar_integrations
    FOR UPDATE USING (
        app_slug = 'smartcrm'
        AND user_id = auth.uid()
    );

-- Storage Policies
-- NOTE: Storage policies must be created via Supabase Dashboard or using service role key
-- The service role key doesn't have permission to modify storage.objects table
-- Please add storage policies manually in Supabase Dashboard > Storage > Policies

-- ============================================================================
-- FUNCTIONS - Helper functions for multi-tenancy
-- ============================================================================

-- Function to get current app slug
CREATE OR REPLACE FUNCTION public.get_app_slug()
RETURNS TEXT AS $$
BEGIN
    RETURN 'smartcrm';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get tenant ID from JWT
CREATE OR REPLACE FUNCTION public.get_tenant_id()
RETURNS UUID AS $$
BEGIN
    RETURN (auth.jwt()->>'tenant_id')::uuid;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMPLETE
-- ============================================================================
