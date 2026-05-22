-- ============================================================================
-- SmartCRM Role System Migration
-- Implements: regular_user, smartmarketer, whitelabel_user, super_admin, yearly_buyer
-- With feature flags for granular access control
-- ============================================================================
-- This migration was applied successfully on 2026-05-14
-- ============================================================================

-- ============================================================================
-- STEP 0: Drop existing constraint and migrate users
-- ============================================================================
ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;

UPDATE public.user_profiles
SET role = CASE 
  WHEN role = 'owner' THEN 'super_admin'
  WHEN role = 'admin' THEN 'super_admin'
  WHEN role = 'member' THEN 'regular_user'
  WHEN role = 'viewer' THEN 'regular_user'
  ELSE 'regular_user'
END
WHERE role IN ('owner', 'admin', 'member', 'viewer') OR role NOT IN ('regular_user', 'smartmarketer', 'whitelabel_user', 'super_admin', 'yearly_buyer');

-- ============================================================================
-- STEP 1: Create user_features table for feature flags
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  feature_key TEXT NOT NULL,
  enabled BOOLEAN DEFAULT false,
  granted_at TIMESTAMPTZ DEFAULT now(),
  granted_by UUID REFERENCES auth.users(id),
  CONSTRAINT user_features_user_key_unique UNIQUE (user_id, feature_key)
);

CREATE INDEX IF NOT EXISTS idx_user_features_user_id ON public.user_features(user_id);
CREATE INDEX IF NOT EXISTS idx_user_features_key ON public.user_features(feature_key);

-- ============================================================================
-- STEP 2: Create feature_definitions table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.feature_definitions (
  key TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  enabled_by_default TEXT DEFAULT 'none'
    CHECK (enabled_by_default IN ('none', 'regular_user', 'smartmarketer', 'whitelabel_user', 'super_admin', 'yearly_buyer')),
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO public.feature_definitions (key, name, description, enabled_by_default) VALUES
  ('crm_core', 'Core CRM', 'Dashboard, Contacts, Pipeline, Calendar, Basic CRM tools', 'regular_user'),
  ('ai_tools', 'AI Tools', 'Advanced AI sales, marketing, and content tools', 'smartmarketer'),
  ('communication_suite', 'Communication Suite', 'Email, SMS, and messaging tools', 'smartmarketer'),
  ('marketing_tools', 'Marketing Tools', 'Lead generation, campaigns, and automation', 'smartmarketer'),
  ('white_label', 'White Label', 'Branding, agency/client management, reselling', 'whitelabel_user'),
  ('admin_panel', 'Admin Panel', 'User management, role management, feature toggles', 'super_admin'),
  ('openclaw_control', 'OpenClaw Control', 'Microfrontend/admin debugging tools', 'super_admin'),
  ('unlimited_ai', 'Unlimited AI', 'No AI credit limits', 'whitelabel_user'),
  ('billing_admin', 'Billing Admin', 'Billing and subscription management', 'super_admin')
  ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- STEP 3: Create role_features table (maps roles to default features)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.role_features (
  role TEXT NOT NULL,
  feature_key TEXT NOT NULL,
  PRIMARY KEY (role, feature_key),
  FOREIGN KEY (feature_key) REFERENCES public.feature_definitions(key)
);

INSERT INTO public.role_features (role, feature_key) VALUES
  -- regular_user: Core CRM only
  ('regular_user', 'crm_core'),
  
  -- smartmarketer: Core + marketing/AI growth tools
  ('smartmarketer', 'crm_core'),
  ('smartmarketer', 'ai_tools'),
  ('smartmarketer', 'communication_suite'),
  ('smartmarketer', 'marketing_tools'),
  
  -- whitelabel_user: All features + white label
  ('whitelabel_user', 'crm_core'),
  ('whitelabel_user', 'ai_tools'),
  ('whitelabel_user', 'communication_suite'),
  ('whitelabel_user', 'marketing_tools'),
  ('whitelabel_user', 'white_label'),
  ('whitelabel_user', 'unlimited_ai'),
  
  -- super_admin: Everything
  ('super_admin', 'crm_core'),
  ('super_admin', 'ai_tools'),
  ('super_admin', 'communication_suite'),
  ('super_admin', 'marketing_tools'),
  ('super_admin', 'white_label'),
  ('super_admin', 'admin_panel'),
  ('super_admin', 'openclaw_control'),
  ('super_admin', 'unlimited_ai'),
  ('super_admin', 'billing_admin'),
  
  -- yearly_buyer: Access based on yearly offer only
  ('yearly_buyer', 'crm_core')
  ON CONFLICT (role, feature_key) DO NOTHING;

-- ============================================================================
-- STEP 4: Create new constraint
-- ============================================================================
ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_role_check
CHECK (role IN ('regular_user', 'smartmarketer', 'whitelabel_user', 'super_admin', 'yearly_buyer'));

-- ============================================================================
-- STEP 5: Create sync_user_features function
-- ============================================================================
CREATE OR REPLACE FUNCTION public.sync_user_features(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM public.user_profiles WHERE id = p_user_id LIMIT 1;
  IF v_role IS NULL THEN v_role := 'regular_user'; END IF;
  DELETE FROM public.user_features WHERE user_id = p_user_id;
  INSERT INTO public.user_features (user_id, feature_key, enabled)
  SELECT p_user_id, rf.feature_key, true FROM public.role_features rf WHERE rf.role = v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 6: Update handle_new_user trigger
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id, tenant_id, email, full_name, avatar_url, role,
    is_tenant_admin, preferences, onboarding, created_at, updated_at
  )
  VALUES (
    NEW.id, 'f948089b-50bc-445d-9137-85b580574455'::uuid, NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'role', 'regular_user'),
    FALSE, '{}', '{}', NOW(), NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email, full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url, updated_at = NOW();
  PERFORM public.sync_user_features(NEW.id);
  RETURN NEW;
END;
$$;

-- ============================================================================
-- STEP 7: Sync features for all existing users
-- ============================================================================
DO $$
DECLARE user_record UUID;
BEGIN
  FOR user_record IN SELECT id FROM public.user_profiles LOOP
    PERFORM public.sync_user_features(user_record);
  END LOOP;
END $$;

-- ============================================================================
-- STEP 8: Create has_feature function
-- ============================================================================
CREATE OR REPLACE FUNCTION public.has_feature(p_feature_key TEXT)
RETURNS BOOLEAN AS $$
DECLARE v_enabled BOOLEAN;
BEGIN
  SELECT enabled INTO v_enabled
  FROM public.user_features
  WHERE user_id = auth.uid() AND feature_key = p_feature_key
  LIMIT 1;
  RETURN COALESCE(v_enabled, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 9: Enable RLS on user_features
-- ============================================================================
ALTER TABLE public.user_features ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own features" ON public.user_features
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage features" ON public.user_features
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- Grants
-- ============================================================================
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON user_profiles, feature_definitions TO anon;
GRANT SELECT ON user_features TO authenticated;

COMMENT ON TABLE user_features IS 'Feature flags for granular access control';
COMMENT ON TABLE feature_definitions IS 'Documentation of available features';
COMMENT ON TABLE role_features IS 'Maps roles to default feature sets';