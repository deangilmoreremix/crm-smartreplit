-- Multi-Tenant Company System Migration
-- This migration creates the foundation for a multi-tenant whitelabel system

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  domain text UNIQUE, -- Custom domain (optional)
  logo_url text,
  primary_color text NOT NULL DEFAULT '#3B82F6',
  secondary_color text NOT NULL DEFAULT '#6366F1',
  description text,
  industry text,
  website text,
  support_email text,
  support_phone text,
  subscription_tier text NOT NULL DEFAULT 'whitelabel',
  subscription_status text NOT NULL DEFAULT 'active',
  max_users integer DEFAULT 10,
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create company_users table (junction table for user-company relationships)
CREATE TABLE IF NOT EXISTS company_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('owner', 'admin', 'manager', 'user')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'suspended')),
  invited_by uuid REFERENCES auth.users(id),
  invited_at timestamptz,
  joined_at timestamptz DEFAULT now(),
  permissions jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, user_id)
);

-- Create company_invitations table
CREATE TABLE IF NOT EXISTS company_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
  token text NOT NULL UNIQUE,
  invited_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create company_whitelabel_configs table
CREATE TABLE IF NOT EXISTS company_whitelabel_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  company_name text NOT NULL DEFAULT 'Smart CRM',
  logo_url text,
  primary_color text NOT NULL DEFAULT '#3B82F6',
  secondary_color text NOT NULL DEFAULT '#6366F1',
  hero_title text NOT NULL DEFAULT 'Transform Your Sales Process with AI',
  hero_subtitle text NOT NULL DEFAULT 'Smart CRM combines powerful sales tools with advanced AI capabilities.',
  cta_buttons jsonb NOT NULL DEFAULT '[
    {
      "id": "trial",
      "text": "Start Your Free Trial",
      "url": "/dashboard",
      "color": "#3B82F6",
      "variant": "primary",
      "enabled": true
    }
  ]'::jsonb,
  redirect_mappings jsonb NOT NULL DEFAULT '{}'::jsonb,
  show_pricing boolean NOT NULL DEFAULT true,
  show_testimonials boolean NOT NULL DEFAULT true,
  show_features boolean NOT NULL DEFAULT true,
  custom_css text,
  email_templates jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id)
);

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_whitelabel_configs ENABLE ROW LEVEL SECURITY;

-- Companies policies
CREATE POLICY "Company owners and admins can manage their companies"
  ON companies
  FOR ALL
  TO authenticated
  USING (
    owner_user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM company_users
      WHERE company_users.company_id = companies.id
      AND company_users.user_id = auth.uid()
      AND company_users.role IN ('owner', 'admin')
      AND company_users.status = 'active'
    )
  );

-- Company users policies
CREATE POLICY "Users can view company memberships"
  ON company_users
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Company admins can manage company users"
  ON company_users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM company_users cu
      WHERE cu.company_id = company_users.company_id
      AND cu.user_id = auth.uid()
      AND cu.role IN ('owner', 'admin')
      AND cu.status = 'active'
    )
  );

-- Company invitations policies
CREATE POLICY "Company admins can manage invitations"
  ON company_invitations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM company_users
      WHERE company_users.company_id = company_invitations.company_id
      AND company_users.user_id = auth.uid()
      AND company_users.role IN ('owner', 'admin')
      AND company_users.status = 'active'
    )
  );

-- Company whitelabel configs policies
CREATE POLICY "Company members can view whitelabel config"
  ON company_whitelabel_configs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM company_users
      WHERE company_users.company_id = company_whitelabel_configs.company_id
      AND company_users.user_id = auth.uid()
      AND company_users.status = 'active'
    )
  );

CREATE POLICY "Company admins can manage whitelabel config"
  ON company_whitelabel_configs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM company_users cu
      WHERE cu.company_id = company_whitelabel_configs.company_id
      AND cu.user_id = auth.uid()
      AND cu.role IN ('owner', 'admin')
      AND cu.status = 'active'
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_companies_owner_user_id ON companies(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_companies_domain ON companies(domain);
CREATE INDEX IF NOT EXISTS idx_companies_subscription_tier ON companies(subscription_tier);

CREATE INDEX IF NOT EXISTS idx_company_users_company_id ON company_users(company_id);
CREATE INDEX IF NOT EXISTS idx_company_users_user_id ON company_users(user_id);
CREATE INDEX IF NOT EXISTS idx_company_users_role ON company_users(role);
CREATE INDEX IF NOT EXISTS idx_company_users_status ON company_users(status);

CREATE INDEX IF NOT EXISTS idx_company_invitations_company_id ON company_invitations(company_id);
CREATE INDEX IF NOT EXISTS idx_company_invitations_token ON company_invitations(token);
CREATE INDEX IF NOT EXISTS idx_company_invitations_expires_at ON company_invitations(expires_at);

CREATE INDEX IF NOT EXISTS idx_company_whitelabel_configs_company_id ON company_whitelabel_configs(company_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_users_updated_at
  BEFORE UPDATE ON company_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_invitations_updated_at
  BEFORE UPDATE ON company_invitations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_whitelabel_configs_updated_at
  BEFORE UPDATE ON company_whitelabel_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
