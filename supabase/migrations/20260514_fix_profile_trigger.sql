-- ============================================================================
-- FIX: Create trigger to auto-create user profiles on signup
-- ============================================================================
-- Allowed roles: owner, admin, member, viewer

-- Step 1: Create the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id,
    tenant_id,
    email,
    full_name,
    avatar_url,
    role,
    is_tenant_admin,
    preferences,
    onboarding,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    'f948089b-50bc-445d-9137-85b580574455'::uuid,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'role', 'member'),
    FALSE,
    '{}',
    '{}',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Step 2: Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 3: Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 4: Create profiles for existing users without them (50 at a time to avoid constraint issues)
INSERT INTO public.user_profiles (
  id,
  tenant_id,
  email,
  full_name,
  role,
  is_tenant_admin,
  preferences,
  onboarding,
  created_at,
  updated_at
)
SELECT
  u.id,
  'f948089b-50bc-445d-9137-85b580574455'::uuid,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
  'member'::text,
  FALSE,
  '{}'::jsonb,
  '{}'::jsonb,
  NOW(),
  NOW()
FROM auth.users u
LEFT JOIN public.user_profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Step 5: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON user_profiles TO anon;
