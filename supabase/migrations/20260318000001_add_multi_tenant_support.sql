-- Multi-Tenant Support Migration
-- Adds user_roles, user_app_access modifications, and tenant_config for multi-tenant SaaS
-- Run with: npx supabase db push --project-ref bzxohkrxcwodllketcpz

-- ============================================================================
-- USER_ROLES TABLE (Multi-Tenant)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'user'
    CHECK (role IN ('super_admin', 'admin', 'user')),
  tenant TEXT NOT NULL DEFAULT 'videoremix'
    CHECK (tenant IN ('videoremix', 'smartcrm', 'ai-video-agent-studio')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, tenant)
);

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_tenant ON user_roles(tenant);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_tenant ON user_roles(user_id, tenant);

-- ============================================================================
-- USER_APP_ACCESS TABLE (Add tenant column)
-- ============================================================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_app_access' AND column_name = 'tenant'
  ) THEN
    ALTER TABLE user_app_access 
    ADD COLUMN tenant TEXT NOT NULL DEFAULT 'videoremix'
    CHECK (tenant IN ('videoremix', 'smartcrm', 'ai-video-agent-studio'));
  END IF;
END $$;

-- ============================================================================
-- TENANT_CONFIG TABLE
-- Central branding and routing configuration per tenant
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenant_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant TEXT NOT NULL UNIQUE,
  brand_name TEXT NOT NULL,
  brand_url TEXT NOT NULL,
  logo_url TEXT,
  support_email TEXT NOT NULL,
  from_email TEXT NOT NULL,
  from_name TEXT NOT NULL,
  color_primary TEXT NOT NULL DEFAULT '#3b82f6',
  color_secondary TEXT NOT NULL DEFAULT '#1e40af',
  site_url TEXT NOT NULL,
  dashboard_path TEXT NOT NULL DEFAULT '/dashboard',
  reset_password_path TEXT NOT NULL DEFAULT '/reset-password',
  -- Per-tenant feature bullet points shown in emails (JSON array of strings)
  email_benefits JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for tenant lookups
CREATE INDEX IF NOT EXISTS idx_tenant_config_tenant ON tenant_config(tenant);

-- ============================================================================
-- INSERT DEFAULT TENANT CONFIGURATIONS
-- ============================================================================

-- VideoRemix (default tenant)
INSERT INTO tenant_config (
  tenant,
  brand_name,
  brand_url,
  logo_url,
  support_email,
  from_email,
  from_name,
  color_primary,
  color_secondary,
  site_url,
  dashboard_path,
  reset_password_path,
  email_benefits
) VALUES (
  'videoremix',
  'VideoRemix.vip',
  'https://videoremix.vip',
  'https://videoremix.vip/logo.png',
  'support@videoremix.vip',
  'noreply@videoremix.vip',
  'VideoRemix Team',
  '#3b82f6',
  '#1e40af',
  'https://videoremix.vip',
  '/dashboard',
  '/reset-password',
  '["AI-powered video personalization", "Automated video editing", "Multi-platform publishing", "Real-time analytics"]'
) ON CONFLICT (tenant) DO NOTHING;

-- SmartCRM
INSERT INTO tenant_config (
  tenant,
  brand_name,
  brand_url,
  logo_url,
  support_email,
  from_email,
  from_name,
  color_primary,
  color_secondary,
  site_url,
  dashboard_path,
  reset_password_path,
  email_benefits
) VALUES (
  'smartcrm',
  'SmartCRM',
  'https://smartcrm.ai',
  'https://smartcrm.ai/logo.png',
  'support@smartcrm.ai',
  'noreply@smartcrm.ai',
  'SmartCRM Team',
  '#7c3aed',
  '#4c1d95',
  'https://smartcrm.ai',
  '/dashboard',
  '/reset-password',
  '["AI-powered CRM", "Smart contact management", "Automated workflows", "Sales forecasting"]'
) ON CONFLICT (tenant) DO NOTHING;

-- AI Video Agent Studio
INSERT INTO tenant_config (
  tenant,
  brand_name,
  brand_url,
  logo_url,
  support_email,
  from_email,
  from_name,
  color_primary,
  color_secondary,
  site_url,
  dashboard_path,
  reset_password_path,
  email_benefits
) VALUES (
  'ai-video-agent-studio',
  'AI Video Agent Studio',
  'https://aivideoagentstudio.com',
  'https://aivideoagentstudio.com/logo.png',
  'support@aivideoagentstudio.com',
  'noreply@aivideoagentstudio.com',
  'AI Video Agent Studio Team',
  '#F5C500',
  '#d4a900',
  'https://aivideoagentstudio.com',
  '/dashboard',
  '/reset-password',
  '["Autonomous AI video creation", "Smart script generation", "Multi-scene composition", "Automated rendering"]'
) ON CONFLICT (tenant) DO NOTHING;

-- ============================================================================
-- FUNCTION: Get user tenant from email or user_id
-- ============================================================================
CREATE OR REPLACE FUNCTION get_user_tenant(p_email TEXT)
RETURNS TEXT AS $$
DECLARE
  v_tenant TEXT;
  v_user_id UUID;
BEGIN
  -- Try to find user by email in auth.users
  SELECT id INTO v_user_id 
  FROM auth.users 
  WHERE email = p_email 
  LIMIT 1;
  
  IF v_user_id IS NOT NULL THEN
    -- Get user's tenant from user_roles
    SELECT tenant INTO v_tenant
    FROM user_roles
    WHERE user_id = v_user_id
    ORDER BY created_at ASC
    LIMIT 1;
  END IF;
  
  -- Return tenant or default to videoremix
  RETURN COALESCE(v_tenant, 'videoremix');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS on user_roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Users can read their own roles
CREATE POLICY "Users can read own roles" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can manage all roles
CREATE POLICY "Service role can manage roles" ON user_roles
  FOR ALL USING (auth.role() = 'service_role');

-- Enable RLS on tenant_config
ALTER TABLE tenant_config ENABLE ROW LEVEL SECURITY;

-- Anyone can read tenant config (needed for email rendering)
CREATE POLICY "Anyone can read tenant config" ON tenant_config
  FOR SELECT USING (true);

-- Service role can manage tenant config
CREATE POLICY "Service role can manage tenant config" ON tenant_config
  FOR ALL USING (auth.role() = 'service_role');

COMMENT ON TABLE user_roles IS 'Multi-tenant user roles - one user can exist in multiple tenants';
COMMENT ON TABLE tenant_config IS 'Central branding and routing configuration per tenant';
