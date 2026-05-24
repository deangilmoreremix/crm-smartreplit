-- ============================================================================
-- Fix: Missing Legacy Entitlements Infrastructure
-- Date: 2026-05-23
-- Purpose: Create the user_entitlements + package_features tables and
--          user_has_feature RPC that the current application code depends on.
--          These were never added as proper migrations for this project.
-- ============================================================================

-- 1. Create user_entitlements table
CREATE TABLE IF NOT EXISTS public.user_entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  package text NOT NULL DEFAULT 'regular',
  openclaw_enabled boolean NOT NULL DEFAULT false,
  admin_enabled boolean NOT NULL DEFAULT false,
  source text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_entitlements_email 
  ON public.user_entitlements (lower(email));

CREATE INDEX IF NOT EXISTS idx_user_entitlements_user_id 
  ON public.user_entitlements (user_id);

-- 2. Create package_features table
CREATE TABLE IF NOT EXISTS public.package_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package text NOT NULL,
  feature_key text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE (package, feature_key)
);

CREATE INDEX IF NOT EXISTS idx_package_features_package 
  ON public.package_features (package);

-- 3. Create the critical RPC used by middleware and frontend
CREATE OR REPLACE FUNCTION public.user_has_feature(
  input_email text,
  input_feature_key text
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_entitlements ue
    LEFT JOIN public.package_features pf 
      ON pf.package = ue.package
    WHERE lower(ue.email) = lower(input_email)
      AND ue.package != 'no_access'
      AND (
        ue.package = 'super_admin'
        OR pf.feature_key = '*'
        OR pf.feature_key = input_feature_key
        OR (
          input_feature_key = 'openclaw'
          AND ue.openclaw_enabled = true
        )
        OR (
          input_feature_key IN ('admin_panel', 'feature_management', 'user_management')
          AND ue.admin_enabled = true
        )
      )
  );
$$;

-- 4. RLS Policies
ALTER TABLE public.user_entitlements ENABLE ROW LEVEL SECURITY;

-- Users can view their own entitlement
DROP POLICY IF EXISTS "Users can view own entitlements" ON public.user_entitlements;
CREATE POLICY "Users can view own entitlements"
  ON public.user_entitlements
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() 
    OR lower(email) = lower((auth.jwt() ->> 'email'))
  );

-- Allow users to auto-create their own default 'regular' row on first login
DROP POLICY IF EXISTS "Users can insert own default entitlement" ON public.user_entitlements;
CREATE POLICY "Users can insert own default entitlement"
  ON public.user_entitlements
  FOR INSERT
  TO authenticated
  WITH CHECK (lower(email) = lower((auth.jwt() ->> 'email')));

-- Service role has full access
DROP POLICY IF EXISTS "Service role full access" ON public.user_entitlements;
CREATE POLICY "Service role full access"
  ON public.user_entitlements
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Grants
GRANT SELECT, INSERT ON public.user_entitlements TO authenticated;
GRANT ALL ON public.user_entitlements TO service_role;

GRANT SELECT ON public.package_features TO authenticated, anon;
GRANT ALL ON public.package_features TO service_role;

-- 5. Populate package_features (from the authoritative insert_features.sql)
-- Regular
INSERT INTO public.package_features (package, feature_key) VALUES
  ('regular','core_crm'),('regular','dashboard'),('regular','contacts'),
  ('regular','pipeline'),('regular','calendar')
ON CONFLICT (package, feature_key) DO NOTHING;

-- Smartmarketer
INSERT INTO public.package_features (package, feature_key) VALUES
  ('smartmarketer','core_crm'),('smartmarketer','dashboard'),('smartmarketer','contacts'),
  ('smartmarketer','pipeline'),('smartmarketer','calendar'),
  ('smartmarketer','ai_tools'),('smartmarketer','ai_goals'),('smartmarketer','analytics'),
  ('smartmarketer','business_intelligence'),('smartmarketer','communication_hub'),
  ('smartmarketer','appointments'),('smartmarketer','video_email'),
  ('smartmarketer','text_messages'),('smartmarketer','phone_system'),
  ('smartmarketer','voice_profiles'),('smartmarketer','invoicing'),
  ('smartmarketer','lead_automation'),('smartmarketer','forms_surveys'),
  ('smartmarketer','business_analyzer'),('smartmarketer','content_library'),
  ('smartmarketer','circle_prospecting'),('smartmarketer','connected_apps'),
  ('smartmarketer','funnelcraft_ai'),('smartmarketer','smartcrm_closer'),
  ('smartmarketer','content_ai'),('smartmarketer','billing_credits'),
  ('smartmarketer','buy_credits')
ON CONFLICT (package, feature_key) DO NOTHING;

-- Whitelabel (inherits smartmarketer + extras)
INSERT INTO public.package_features (package, feature_key)
SELECT 'whitelabel', feature_key FROM public.package_features WHERE package = 'smartmarketer'
ON CONFLICT (package, feature_key) DO NOTHING;

INSERT INTO public.package_features (package, feature_key) VALUES
  ('whitelabel','white_label'),('whitelabel','white_label_customization'),
  ('whitelabel','white_label_management'),('whitelabel','multi_tenant_features'),
  ('whitelabel','custom_branding'),('whitelabel','domain_management'),
  ('whitelabel','package_builder'),('whitelabel','revenue_sharing'),
  ('whitelabel','partner_dashboard'),('whitelabel','partner_onboarding'),
  ('whitelabel','brand_asset_management'),('whitelabel','theme_customization'),
  ('whitelabel','custom_domain_setup'),('whitelabel','feature_package_configuration')
ON CONFLICT (package, feature_key) DO NOTHING;

-- Super admin
INSERT INTO public.package_features (package, feature_key) VALUES ('super_admin','*')
ON CONFLICT (package, feature_key) DO NOTHING;

-- ============================================================================
-- Fix Keith Troup (whitelabel access)
-- ============================================================================
INSERT INTO public.user_entitlements (email, user_id, package, openclaw_enabled, admin_enabled, source, notes)
VALUES (
  'keith@beappsolute.com',
  '56b75547-1797-41d5-999c-1fed03dd55de',
  'whitelabel',
  false,
  false,
  'Migration fix - CSV import + missing infrastructure',
  'Keith Troup - whitelabel access restored 2026-05-23'
)
ON CONFLICT (email) DO UPDATE SET
  package = 'whitelabel',
  user_id = EXCLUDED.user_id,
  updated_at = now();

UPDATE public.user_profiles 
SET role = 'whitelabel_user', updated_at = now()
WHERE id = '56b75547-1797-41d5-999c-1fed03dd55de';

SELECT public.sync_user_features('56b75547-1797-41d5-999c-1fed03dd55de');
