-- Fix profile sync to capture all user metadata
-- This migration updates the trigger to save all signup data to profiles table

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create updated function to handle new user registration with all metadata
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
  user_email TEXT;
BEGIN
  -- Get user email
  user_email := NEW.email;
  
  -- Determine role based on email (super admin emails)
  IF user_email IN ('dean@videoremix.io', 'victor@videoremix.io', 'samuel@videoremix.io', 'jvzoo@gmail.com') THEN
    user_role := 'super_admin';
  ELSE
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'regular_user');
  END IF;
  
  -- Insert comprehensive profile data
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
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    user_role,
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'app_context', 'smartcrm'),
    COALESCE(NEW.raw_user_meta_data->>'email_template_set', 'smartcrm'),
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add comment for documentation
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates a profile when a new user signs up, capturing all metadata including role, app_context, and email_template_set';
