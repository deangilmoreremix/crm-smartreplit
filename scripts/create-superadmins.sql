-- ⚠️  SECURITY WARNING ⚠️
-- This script contains hardcoded passwords and should NEVER be committed to version control
-- Users should change their passwords immediately after first login
-- For production, use the TypeScript script (create-superadmins.ts) or Supabase's invite system instead

-- Note: This SQL only creates the profiles. You still need to create the auth users
-- in Supabase Dashboard (Authentication → Users → Add user) or via the Admin API

-- Insert super admin profiles
-- These assume you've already created the auth.users in Supabase dashboard
-- and you're using their actual user IDs from auth.users

-- STEP 1: First create these users in Supabase Dashboard:
-- Go to Authentication → Users → Add user
-- Email: dean@smartcrm.vip, Password: VideoRemix2025
-- Email: samuel@smartcrm.vip, Password: VideoRemix2025  
-- Email: victor@smartcrm.vip, Password: VideoRemix2025

-- STEP 2: After creating the auth users, get their IDs and run this SQL:
-- (Replace the UUIDs below with the actual IDs from auth.users)

INSERT INTO profiles (id, username, first_name, last_name, role, product_tier, app_context, email_template_set, created_at)
VALUES
  -- Replace these UUIDs with actual user IDs from auth.users table
  ('REPLACE-WITH-DEAN-USER-ID', 'dean', 'Dean', 'Gilmore', 'super_admin', 'ai_boost_unlimited', 'smartcrm', 'smartcrm', NOW()),
  ('REPLACE-WITH-SAMUEL-USER-ID', 'samuel', 'Samuel', '', 'super_admin', 'ai_boost_unlimited', 'smartcrm', 'smartcrm', NOW()),
  ('REPLACE-WITH-VICTOR-USER-ID', 'victor', 'Victor', '', 'super_admin', 'ai_boost_unlimited', 'smartcrm', 'smartcrm', NOW())
ON CONFLICT (id) DO UPDATE SET
  role = 'super_admin',
  product_tier = 'ai_boost_unlimited';

-- ⚠️  IMPORTANT: Instruct users to change their passwords immediately!
-- You can force a password reset by running:
-- UPDATE auth.users SET email_confirmed_at = NULL WHERE email IN ('dean@smartcrm.vip', 'samuel@smartcrm.vip', 'victor@smartcrm.vip');
