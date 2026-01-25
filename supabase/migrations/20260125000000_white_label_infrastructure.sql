-- White Label Infrastructure Migration
-- Creates all necessary tables for complete white label functionality
-- Run with: supabase db push

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- DOMAINS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS domains (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  domain VARCHAR(255) UNIQUE NOT NULL,
  subdomain VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'verifying', 'active', 'failed', 'suspended')),
  dns_verified BOOLEAN DEFAULT FALSE,
  ssl_status VARCHAR(50) DEFAULT 'pending' CHECK (ssl_status IN ('pending', 'provisioning', 'active', 'expired', 'failed')),
  ssl_expires_at TIMESTAMP,
  verification_token VARCHAR(255) NOT NULL,
  verification_method VARCHAR(50) DEFAULT 'txt' CHECK (verification_method IN ('txt', 'cname', 'http')),
  last_checked_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for domains
CREATE INDEX IF NOT EXISTS idx_domains_tenant ON domains(tenant_id);
CREATE INDEX IF NOT EXISTS idx_domains_status ON domains(status);
CREATE INDEX IF NOT EXISTS idx_domains_domain ON domains(domain);
CREATE INDEX IF NOT EXISTS idx_domains_ssl_expires ON domains(ssl_expires_at) WHERE ssl_status = 'active';

-- ============================================================================
-- ASSETS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('logo', 'icon', 'image', 'document', 'video')),
  url TEXT NOT NULL,
  cdn_url TEXT,
  thumbnail_url TEXT,
  width INTEGER,
  height INTEGER,
  optimized BOOLEAN DEFAULT FALSE,
  version INTEGER DEFAULT 1,
  parent_asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  usage_count INTEGER DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for assets
CREATE INDEX IF NOT EXISTS idx_assets_tenant ON assets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_assets_category ON assets(category);
CREATE INDEX IF NOT EXISTS idx_assets_created_at ON assets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assets_parent ON assets(parent_asset_id) WHERE parent_asset_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_assets_search ON assets USING gin(to_tsvector('english', name || ' ' || original_name));

-- ============================================================================
-- TENANT TEMPLATES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenant_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  config JSONB NOT NULL DEFAULT '{}',
  features JSONB DEFAULT '{}',
  default_settings JSONB DEFAULT '{}',
  onboarding_steps JSONB DEFAULT '[]',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for tenant templates
CREATE INDEX IF NOT EXISTS idx_tenant_templates_default ON tenant_templates(is_default) WHERE is_default = TRUE;

-- ============================================================================
-- TENANT ONBOARDING TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenant_onboarding (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL UNIQUE,
  current_step INTEGER DEFAULT 1,
  total_steps INTEGER NOT NULL,
  completed_steps JSONB DEFAULT '[]',
  status VARCHAR(50) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'skipped')),
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  metadata JSONB DEFAULT '{}'
);

-- Indexes for tenant onboarding
CREATE INDEX IF NOT EXISTS idx_tenant_onboarding_tenant ON tenant_onboarding(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_onboarding_status ON tenant_onboarding(status);

-- ============================================================================
-- THEMES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS themes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT FALSE,
  config JSONB NOT NULL,
  preview_url TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for themes
CREATE INDEX IF NOT EXISTS idx_themes_tenant ON themes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_themes_active ON themes(tenant_id, is_active) WHERE is_active = TRUE;

-- ============================================================================
-- ANALYTICS METRICS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS analytics_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  metric_type VARCHAR(100) NOT NULL,
  metric_value DECIMAL(15,2) NOT NULL,
  metadata JSONB DEFAULT '{}',
  recorded_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for analytics metrics
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_tenant ON analytics_metrics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_type ON analytics_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_recorded ON analytics_metrics(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_tenant_type ON analytics_metrics(tenant_id, metric_type, recorded_at DESC);

-- ============================================================================
-- ANALYTICS REPORTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS analytics_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  config JSONB NOT NULL,
  schedule VARCHAR(50) CHECK (schedule IN ('daily', 'weekly', 'monthly', 'custom', 'manual')),
  last_generated_at TIMESTAMP,
  next_generation_at TIMESTAMP,
  recipients JSONB DEFAULT '[]',
  format VARCHAR(20) DEFAULT 'pdf' CHECK (format IN ('pdf', 'csv', 'excel', 'json')),
  created_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for analytics reports
CREATE INDEX IF NOT EXISTS idx_analytics_reports_tenant ON analytics_reports(tenant_id);
CREATE INDEX IF NOT EXISTS idx_analytics_reports_schedule ON analytics_reports(next_generation_at) WHERE schedule != 'manual';

-- ============================================================================
-- SSO CONFIGURATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS sso_configurations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  provider VARCHAR(50) NOT NULL CHECK (provider IN ('saml', 'oauth', 'oidc', 'google', 'microsoft', 'okta')),
  config JSONB NOT NULL,
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for SSO configurations
CREATE INDEX IF NOT EXISTS idx_sso_configurations_tenant ON sso_configurations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sso_configurations_active ON sso_configurations(tenant_id, is_active) WHERE is_active = TRUE;

-- ============================================================================
-- SECURITY POLICIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS security_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  policy_type VARCHAR(100) NOT NULL CHECK (policy_type IN ('ip_whitelist', 'password_policy', 'session_policy', 'mfa_policy', 'api_access')),
  config JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for security policies
CREATE INDEX IF NOT EXISTS idx_security_policies_tenant ON security_policies(tenant_id);
CREATE INDEX IF NOT EXISTS idx_security_policies_type ON security_policies(policy_type);
CREATE INDEX IF NOT EXISTS idx_security_policies_active ON security_policies(tenant_id, is_active) WHERE is_active = TRUE;

-- ============================================================================
-- AUDIT LOGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID,
  user_id UUID,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100),
  resource_id VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- ============================================================================
-- TENANT FEATURES TABLE (for feature toggles)
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenant_features (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  feature_key VARCHAR(100) NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, feature_key)
);

-- Indexes for tenant features
CREATE INDEX IF NOT EXISTS idx_tenant_features_tenant ON tenant_features(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_features_enabled ON tenant_features(tenant_id, enabled) WHERE enabled = TRUE;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE sso_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_features ENABLE ROW LEVEL SECURITY;

-- Domains policies
CREATE POLICY "Tenants can view their own domains" ON domains
  FOR SELECT USING (tenant_id::text = auth.uid()::text);

CREATE POLICY "Tenants can insert their own domains" ON domains
  FOR INSERT WITH CHECK (tenant_id::text = auth.uid()::text);

CREATE POLICY "Tenants can update their own domains" ON domains
  FOR UPDATE USING (tenant_id::text = auth.uid()::text);

CREATE POLICY "Tenants can delete their own domains" ON domains
  FOR DELETE USING (tenant_id::text = auth.uid()::text);

-- Assets policies
CREATE POLICY "Tenants can view their own assets" ON assets
  FOR SELECT USING (tenant_id::text = auth.uid()::text);

CREATE POLICY "Tenants can insert their own assets" ON assets
  FOR INSERT WITH CHECK (tenant_id::text = auth.uid()::text);

CREATE POLICY "Tenants can update their own assets" ON assets
  FOR UPDATE USING (tenant_id::text = auth.uid()::text);

CREATE POLICY "Tenants can delete their own assets" ON assets
  FOR DELETE USING (tenant_id::text = auth.uid()::text);

-- Themes policies
CREATE POLICY "Tenants can view their own themes" ON themes
  FOR SELECT USING (tenant_id::text = auth.uid()::text);

CREATE POLICY "Tenants can insert their own themes" ON themes
  FOR INSERT WITH CHECK (tenant_id::text = auth.uid()::text);

CREATE POLICY "Tenants can update their own themes" ON themes
  FOR UPDATE USING (tenant_id::text = auth.uid()::text);

CREATE POLICY "Tenants can delete their own themes" ON themes
  FOR DELETE USING (tenant_id::text = auth.uid()::text);

-- Analytics policies
CREATE POLICY "Tenants can view their own metrics" ON analytics_metrics
  FOR SELECT USING (tenant_id::text = auth.uid()::text);

CREATE POLICY "Tenants can view their own reports" ON analytics_reports
  FOR SELECT USING (tenant_id::text = auth.uid()::text);

-- Audit logs policies (read-only for tenants)
CREATE POLICY "Tenants can view their own audit logs" ON audit_logs
  FOR SELECT USING (tenant_id::text = auth.uid()::text);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_domains_updated_at BEFORE UPDATE ON domains
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_templates_updated_at BEFORE UPDATE ON tenant_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_themes_updated_at BEFORE UPDATE ON themes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analytics_reports_updated_at BEFORE UPDATE ON analytics_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sso_configurations_updated_at BEFORE UPDATE ON sso_configurations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_security_policies_updated_at BEFORE UPDATE ON security_policies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_features_updated_at BEFORE UPDATE ON tenant_features
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- DEFAULT DATA
-- ============================================================================

-- Insert default tenant template
INSERT INTO tenant_templates (name, description, config, features, default_settings, onboarding_steps, is_default)
VALUES (
  'Starter Template',
  'Basic configuration for new tenants',
  '{"companyName": "My CRM", "primaryColor": "#3B82F6", "secondaryColor": "#6366F1"}',
  '{"contacts": true, "deals": true, "tasks": true, "calendar": true}',
  '{"seedData": false, "enableDemo": true}',
  '[
    {"id": "welcome", "title": "Welcome", "description": "Get started", "action": "view_dashboard", "completed": false, "order": 1},
    {"id": "branding", "title": "Customize Branding", "description": "Upload logo and colors", "action": "configure_branding", "completed": false, "order": 2},
    {"id": "domain", "title": "Set Up Domain", "description": "Configure custom domain", "action": "configure_domain", "completed": false, "order": 3},
    {"id": "users", "title": "Invite Team", "description": "Add team members", "action": "invite_users", "completed": false, "order": 4},
    {"id": "data", "title": "Import Data", "description": "Import your data", "action": "import_data", "completed": false, "order": 5}
  ]',
  TRUE
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE domains IS 'Custom domain configurations for white label tenants';
COMMENT ON TABLE assets IS 'Asset management for logos, images, and documents';
COMMENT ON TABLE tenant_templates IS 'Configuration templates for tenant provisioning';
COMMENT ON TABLE tenant_onboarding IS 'Onboarding progress tracking for tenants';
COMMENT ON TABLE themes IS 'Advanced theme configurations for white label customization';
COMMENT ON TABLE analytics_metrics IS 'Time-series metrics for analytics and reporting';
COMMENT ON TABLE analytics_reports IS 'Scheduled and custom report configurations';
COMMENT ON TABLE sso_configurations IS 'Single Sign-On provider configurations';
COMMENT ON TABLE security_policies IS 'Tenant-specific security policies';
COMMENT ON TABLE audit_logs IS 'Security and compliance audit trail';
COMMENT ON TABLE tenant_features IS 'Feature flags and toggles per tenant';

-- ============================================================================
-- GRANTS (if using service role)
-- ============================================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON domains TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON assets TO authenticated;
GRANT SELECT ON tenant_templates TO authenticated;
GRANT SELECT, UPDATE ON tenant_onboarding TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON themes TO authenticated;
GRANT SELECT ON analytics_metrics TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON analytics_reports TO authenticated;
GRANT SELECT ON sso_configurations TO authenticated;
GRANT SELECT ON security_policies TO authenticated;
GRANT SELECT ON audit_logs TO authenticated;
GRANT SELECT ON tenant_features TO authenticated;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'White Label Infrastructure Migration completed successfully';
  RAISE NOTICE 'Created tables: domains, assets, tenant_templates, tenant_onboarding, themes, analytics_metrics, analytics_reports, sso_configurations, security_policies, audit_logs, tenant_features';
  RAISE NOTICE 'RLS policies enabled on all tables';
  RAISE NOTICE 'Default tenant template inserted';
END $$;
