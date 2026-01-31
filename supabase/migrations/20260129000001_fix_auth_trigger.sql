-- ============================================================================
-- CRITICAL FIX: Create missing trigger for automatic profile creation
-- ============================================================================
-- This migration creates the trigger that was missing from the schema.
-- Without this trigger, when users sign up via Supabase Auth, no profile
-- record is created in the public.profiles table, causing authentication
-- failures and "User not found" errors.
--
-- Run with: supabase db push
-- ============================================================================

-- First, ensure the handle_new_user function exists and is up to date
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email text;
  user_role text;
BEGIN
  user_email := NEW.email;

  -- Determine role based on email
  IF user_email IN ('dean@videoremix.io', 'victor@videoremix.io', 'samuel@videoremix.io', 'jvzoo@gmail.com', 'dean@smartcrm.vip') THEN
    user_role := 'super_admin';
  ELSE
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'regular_user');
  END IF;

  -- Insert profile for the new user
  INSERT INTO public.profiles (
    id,
    username,
    first_name,
    last_name,
    role,
    avatar_url,
    app_context,
    email_template_set,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    user_role,
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'app_context', 'smartcrm'),
    COALESCE(NEW.raw_user_meta_data->>'email_template_set', 'smartcrm'),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    updated_at = NOW();

  RETURN NEW;
END;
$$;

-- Drop the trigger if it exists (for idempotency)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Also create a trigger for user updates to sync profile changes
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update profile when auth user metadata changes
  UPDATE public.profiles
  SET
    username = COALESCE(NEW.raw_user_meta_data->>'username', profiles.username),
    first_name = COALESCE(NEW.raw_user_meta_data->>'first_name', profiles.first_name),
    last_name = COALESCE(NEW.raw_user_meta_data->>'last_name', profiles.last_name),
    avatar_url = COALESCE(NEW.raw_user_meta_data->>'avatar_url', profiles.avatar_url),
    app_context = COALESCE(NEW.raw_user_meta_data->>'app_context', profiles.app_context),
    email_template_set = COALESCE(NEW.raw_user_meta_data->>'email_template_set', profiles.email_template_set),
    updated_at = NOW()
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

-- Drop and create update trigger
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.raw_user_meta_data IS DISTINCT FROM NEW.raw_user_meta_data)
  EXECUTE FUNCTION public.handle_user_update();

-- ============================================================================
-- FIX EXISTING USERS: Create profiles for users who don't have them
-- ============================================================================

-- Insert profiles for existing auth.users who don't have profiles yet
INSERT INTO public.profiles (
  id,
  username,
  first_name,
  last_name,
  role,
  avatar_url,
  app_context,
  email_template_set,
  created_at,
  updated_at
)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'username', split_part(u.email, '@', 1)),
  u.raw_user_meta_data->>'first_name',
  u.raw_user_meta_data->>'last_name',
  CASE
    WHEN u.email IN ('dean@videoremix.io', 'victor@videoremix.io', 'samuel@videoremix.io', 'dean@smartcrm.vip') THEN 'super_admin'
    ELSE COALESCE(u.raw_user_meta_data->>'role', 'regular_user')
  END,
  u.raw_user_meta_data->>'avatar_url',
  COALESCE(u.raw_user_meta_data->>'app_context', 'smartcrm'),
  COALESCE(u.raw_user_meta_data->>'email_template_set', 'smartcrm'),
  COALESCE(u.created_at, NOW()),
  NOW()
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

GRANT EXECUTE ON FUNCTION public.handle_user_update() TO anon;
GRANT EXECUTE ON FUNCTION public.handle_user_update() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_user_update() TO service_role;

-- ============================================================================
-- VERIFICATION QUERIES (Run these to verify the fix)
-- ============================================================================

-- Check if trigger was created:
-- SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Check if profiles were created for existing users:
-- SELECT COUNT(*) as users_without_profiles
-- FROM auth.users u
-- LEFT JOIN public.profiles p ON u.id = p.id
-- WHERE p.id IS NULL;

-- Check specific user (replace with actual email):
-- SELECT u.email, u.email_confirmed_at, p.id as profile_id, p.role, p.product_tier
-- FROM auth.users u
-- LEFT JOIN public.profiles p ON u.id = p.id
-- WHERE u.email = 'k.rascop@comcast.net';

COMMENT ON FUNCTION public.handle_new_user() IS 'Creates a profile record when a new user signs up via Supabase Auth';
COMMENT ON FUNCTION public.handle_user_update() IS 'Updates profile record when auth user metadata changes';
