-- Add admin user dean@smartcrm.vip with full access to all features
-- Run this script in your Supabase SQL Editor

-- Step 1: Create the user in auth.users with password
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    role,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'dean@smartcrm.vip',
    crypt('ParkerDean0805', gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{"role": "super_admin"}',
    now(),
    now(),
    'authenticated',
    '',
    '',
    '',
    ''
);

-- Step 2: Get the user ID for the newly created user
DO $$
DECLARE
    v_user_id uuid;
BEGIN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'dean@smartcrm.vip';
    
    -- Step 3: Insert into admin_users table with full permissions
    INSERT INTO public.admin_users (
        id,
        email,
        password_hash,
        role,
        is_active,
        permissions,
        created_at
    ) VALUES (
        v_user_id,
        'dean@smartcrm.vip',
        crypt('ParkerDean0805', gen_salt('bf')),
        'super_admin',
        true,
        '{
            "can_manage_users": true,
            "can_manage_admins": true,
            "can_manage_features": true,
            "can_manage_apps": true,
            "can_view_audit_logs": true,
            "can_manage_entitlements": true,
            "can_manage_subscriptions": true,
            "can_manage_billing": true,
            "can_manage_tenants": true,
            "can_manage_partners": true,
            "can_manage_sync_jobs": true,
            "can_manage_all_data": true,
            "full_access": true
        }'::jsonb,
        now()
    );

    -- Step 4: Insert into profiles table (if not already created by trigger)
    INSERT INTO public.profiles (
        id,
        username,
        first_name,
        last_name,
        role,
        app_context,
        email_template_set,
        created_at,
        updated_at
    ) VALUES (
        v_user_id,
        'dean',
        'Dean',
        NULL,
        'super_admin',
        'smartcrm',
        'smartcrm',
        now(),
        now()
    ) ON CONFLICT (id) DO UPDATE SET
        role = 'super_admin',
        updated_at = now();

    -- Step 5: Insert into user_roles table
    INSERT INTO public.user_roles (
        id,
        user_id,
        role,
        created_at
    ) VALUES (
        gen_random_uuid(),
        v_user_id,
        'super_admin',
        now()
    ) ON CONFLICT (user_id, role) DO NOTHING;

    RAISE NOTICE 'Admin user dean@smartcrm.vip created successfully with ID: %', v_user_id;
END $$;

-- Verify the user was created
SELECT 
    au.id,
    au.email,
    au.role,
    au.is_active,
    au.permissions,
    p.role as profile_role
FROM public.admin_users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE au.email = 'dean@smartcrm.vip';
