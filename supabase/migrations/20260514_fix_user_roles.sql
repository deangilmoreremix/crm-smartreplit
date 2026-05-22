-- ============================================================================
-- FIX: Assign proper roles to all users based on user_profiles.role
-- ============================================================================
-- Maps user_profiles.role to roles table and populates user_roles

-- Step 1: Get role IDs
-- Super Admin: 00000000-0000-0000-0000-000000000001
-- Tenant Owner: 00000000-0000-0000-0000-000000000002
-- Tenant Admin: 00000000-0000-0000-0000-000000000003
-- Content Creator: 00000000-0000-0000-0000-000000000004
-- Viewer: 00000000-0000-0000-0000-000000000005

-- Step 2: Assign roles based on user_profiles.role
-- Delete existing user_roles entries first
DELETE FROM public.user_roles;

-- Super Admin (admin users)
INSERT INTO public.user_roles (user_id, role_id, tenant_id, granted_by)
SELECT 
  id,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'f948089b-50bc-445d-9137-85b580574455'::uuid,
  '12d69594-82f1-4fff-ad9b-8d7ff2bfc7fd'::uuid
FROM public.user_profiles 
WHERE role = 'admin' OR is_tenant_admin = true;

-- Tenant Owner (users with 'owner' role or who should have full tenant access)
INSERT INTO public.user_roles (user_id, role_id, tenant_id, granted_by)
SELECT 
  id,
  '00000000-0000-0000-0000-000000000002'::uuid,
  'f948089b-50bc-445d-9137-85b580574455'::uuid,
  '12d69594-82f1-4fff-ad9b-8d7ff2bfc7fd'::uuid
FROM public.user_profiles 
WHERE role = 'owner';

-- Tenant Admin
INSERT INTO public.user_roles (user_id, role_id, tenant_id, granted_by)
SELECT 
  id,
  '00000000-0000-0000-0000-000000000003'::uuid,
  'f948089b-50bc-445d-9137-85b580574455'::uuid,
  '12d69594-82f1-4fff-ad9b-8d7ff2bfc7fd'::uuid
FROM public.user_profiles 
WHERE role = 'admin';

-- Content Creator
INSERT INTO public.user_roles (user_id, role_id, tenant_id, granted_by)
SELECT 
  id,
  '00000000-0000-0000-0000-000000000004'::uuid,
  'f948089b-50bc-445d-9137-85b580574455'::uuid,
  '12d69594-82f1-4fff-ad9b-8d7ff2bfc7fd'::uuid
FROM public.user_profiles 
WHERE role = 'member';

-- Viewer (for users who should have read-only access)
INSERT INTO public.user_roles (user_id, role_id, tenant_id, granted_by)
SELECT 
  id,
  '00000000-0000-0000-0000-000000000005'::uuid,
  'f948089b-50bc-445d-9137-85b580574455'::uuid,
  '12d69594-82f1-4fff-ad9b-8d7ff2bfc7fd'::uuid
FROM public.user_profiles 
WHERE role = 'viewer';

-- Step 3: Verify assignments
-- SELECT r.name, COUNT(*) FROM public.user_roles ur JOIN public.roles r ON ur.role_id = r.id GROUP BY r.name;
