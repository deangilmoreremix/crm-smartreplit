-- Add whitelabel users to SmartCRM
-- This script creates user accounts and sets up whitelabel lifetime access

-- User data to insert
-- Fredrik Asche Kaa: fredrik.kaada@gmail.com
-- Carolyn Bayonne: bayonnca@yahoo.com
-- Truman Cole: trcole3@theritegroup.com
-- Charles Edgerton: charles@charlesedge.net
-- James Gray: james.otto.gray@gmail.com
-- Thomas Omnus: tomnus@msn.com
-- Jermelle Pruitt: jehpruitt@gmail.com
-- William Roberts: rinslr@earthlink.net
-- Joseph Steffey: jwnet2044@yahoo.com
-- Rodney Thompson: rthompson98@yahoo.com

-- All with password: SmartCRM2026
-- Product tier: whitelabel (lifetime access)

-- Note: This script assumes users will be created through Supabase Auth first
-- Then their profiles and entitlements will be set up

-- Insert profiles for existing auth users (run this after auth users are created)
INSERT INTO public.profiles (id, username, first_name, last_name, product_tier, app_context, created_at, updated_at)
SELECT
  au.id,
  SPLIT_PART(au.email, '@', 1) as username,
  CASE
    WHEN au.email = 'fredrik.kaada@gmail.com' THEN 'Fredrik Asche'
    WHEN au.email = 'bayonnca@yahoo.com' THEN 'Carolyn'
    WHEN au.email = 'trcole3@theritegroup.com' THEN 'Truman'
    WHEN au.email = 'charles@charlesedge.net' THEN 'Charles'
    WHEN au.email = 'james.otto.gray@gmail.com' THEN 'James'
    WHEN au.email = 'tomnus@msn.com' THEN 'Thomas'
    WHEN au.email = 'jehpruitt@gmail.com' THEN 'Jermelle'
    WHEN au.email = 'rinslr@earthlink.net' THEN 'William'
    WHEN au.email = 'jwnet2044@yahoo.com' THEN 'Joseph'
    WHEN au.email = 'rthompson98@yahoo.com' THEN 'Rodney'
  END as first_name,
  CASE
    WHEN au.email = 'fredrik.kaada@gmail.com' THEN 'Kaa'
    WHEN au.email = 'bayonnca@yahoo.com' THEN 'Bayonne'
    WHEN au.email = 'trcole3@theritegroup.com' THEN 'Cole'
    WHEN au.email = 'charles@charlesedge.net' THEN 'Edgerton'
    WHEN au.email = 'james.otto.gray@gmail.com' THEN 'Gray'
    WHEN au.email = 'tomnus@msn.com' THEN 'Omnus'
    WHEN au.email = 'jehpruitt@gmail.com' THEN 'Pruitt'
    WHEN au.email = 'rinslr@earthlink.net' THEN 'Roberts'
    WHEN au.email = 'jwnet2044@yahoo.com' THEN 'Steffey'
    WHEN au.email = 'rthompson98@yahoo.com' THEN 'Thompson'
  END as last_name,
  'whitelabel' as product_tier,
  'smartcrm' as app_context,
  NOW() as created_at,
  NOW() as updated_at
FROM auth.users au
WHERE au.email IN (
  'fredrik.kaada@gmail.com',
  'bayonnca@yahoo.com',
  'trcole3@theritegroup.com',
  'charles@charlesedge.net',
  'james.otto.gray@gmail.com',
  'tomnus@msn.com',
  'jehpruitt@gmail.com',
  'rinslr@earthlink.net',
  'jwnet2044@yahoo.com',
  'rthompson98@yahoo.com'
)
ON CONFLICT (id) DO UPDATE SET
  product_tier = 'whitelabel',
  updated_at = NOW();

-- Insert entitlements for lifetime access
INSERT INTO public.entitlements (
  user_id,
  status,
  product_type,
  plan_name,
  created_at,
  updated_at
)
SELECT
  p.id,
  'active',
  'lifetime',
  'Smart CRM Whitelabel Lifetime',
  NOW(),
  NOW()
FROM public.profiles p
WHERE p.product_tier = 'whitelabel'
  AND p.email IN (
    'fredrik.kaada@gmail.com',
    'bayonnca@yahoo.com',
    'trcole3@theritegroup.com',
    'charles@charlesedge.net',
    'james.otto.gray@gmail.com',
    'tomnus@msn.com',
    'jehpruitt@gmail.com',
    'rinslr@earthlink.net',
    'jwnet2044@yahoo.com',
    'rthompson98@yahoo.com'
  )
ON CONFLICT (user_id) DO UPDATE SET
  status = 'active',
  product_type = 'lifetime',
  plan_name = 'Smart CRM Whitelabel Lifetime',
  updated_at = NOW();

-- Verify the insertions
SELECT
  p.first_name,
  p.last_name,
  p.email,
  p.product_tier,
  e.status,
  e.product_type,
  e.plan_name
FROM public.profiles p
LEFT JOIN public.entitlements e ON p.id = e.user_id
WHERE p.product_tier = 'whitelabel'
ORDER BY p.created_at DESC
LIMIT 10;