-- ============================================================================
-- AUTH TRIGGER FIX: Create missing trigger for automatic profile creation
-- ============================================================================
-- Run this in Supabase Dashboard SQL Editor: https://supabase.com/dashboard/project/gadedbrnqzpfqtsdfzcg/sql
-- ============================================================================

-- Step 1: Create the handle_new_user function
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

-- Step 2: Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 3: Create the trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- FIX EXISTING USERS: Create profiles for users who don't have them
-- ============================================================================

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
-- VERIFICATION QUERIES (Run these to verify)
-- ============================================================================

-- Check if trigger exists
-- SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Check for users without profiles
-- SELECT COUNT(*) as users_without_profiles FROM auth.users u LEFT JOIN public.profiles p ON u.id = p.id WHERE p.id IS NULL;

-- Check profile counts by role
-- SELECT role, COUNT(*) FROM public.profiles GROUP BY role;

-- Show all users with their profile status
-- SELECT u.email, u.email_confirmed_at, p.id as profile_id, p.role FROM auth.users u LEFT JOIN public.profiles p ON u.id = p.id ORDER BY u.created_at DESC;
