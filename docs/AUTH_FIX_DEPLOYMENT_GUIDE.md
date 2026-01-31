of us# Authentication Fix Deployment Guide

## Problem Summary

Users cannot log into the system because the database trigger that creates profile records when users sign up is **missing**. The [`handle_new_user()`](schema.sql:1073) function exists but was never attached to the `auth.users` table via a trigger.

### Root Cause

When users sign up via Supabase Auth:
1. A record is created in `auth.users` (Supabase handles this)
2. The application expects a corresponding record in `public.profiles`
3. **The trigger to create this profile was missing**
4. The application queries `profiles` table but finds nothing
5. Users see "User not found" or authentication errors

## Solution

### Step 1: Deploy the Migration

Run the migration to create the missing trigger:

```bash
# Using Supabase CLI
supabase db push

# Or run the SQL directly in Supabase Dashboard SQL Editor
cat supabase/migrations/20260129000001_fix_auth_trigger.sql
```

The migration will:
1. Create/update the `handle_new_user()` function
2. Create the trigger `on_auth_user_created` on `auth.users`
3. Create a secondary trigger `on_auth_user_updated` for sync
4. **Create profiles for all existing users who don't have them**

### Step 2: Verify the Fix

Run these queries in Supabase SQL Editor to verify:

```sql
-- Check if trigger was created
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Check if any users still don't have profiles
SELECT COUNT(*) as users_without_profiles
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- Check specific user (Kevin Rascorp)
SELECT 
  u.email, 
  u.email_confirmed_at, 
  p.id as profile_id, 
  p.role, 
  p.product_tier,
  p.first_name,
  p.last_name
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'k.rascop@comcast.net';
```

### Step 3: Fix Existing Users (Alternative Method)

If you prefer to run the fix separately or need to re-run it:

```bash
# Set environment variables
export SUPABASE_URL="your-supabase-url"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Run the fix script
npx tsx scripts/fix-existing-users.ts
```

## What the Fix Does

### 1. Creates the Missing Trigger

```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

This ensures every new user gets a profile automatically.

### 2. Backfills Existing Users

The migration includes a query to create profiles for all existing `auth.users` who don't have profiles yet.

### 3. Adds Update Trigger

```sql
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.raw_user_meta_data IS DISTINCT FROM NEW.raw_user_meta_data)
  EXECUTE FUNCTION public.handle_user_update();
```

This keeps profiles in sync when user metadata changes.

## Verification Checklist

- [ ] Migration runs without errors
- [ ] Trigger `on_auth_user_created` exists on `auth.users`
- [ ] All existing users have profiles
- [ ] Kevin Rascorp (k.rascop@comcast.net) can log in
- [ ] New user sign-ups create profiles automatically

## Rollback (if needed)

```sql
-- Remove the triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

-- Note: This will NOT delete existing profiles, only stop creating new ones
```

## Related Files

- [`supabase/migrations/20260129000001_fix_auth_trigger.sql`](supabase/migrations/20260129000001_fix_auth_trigger.sql) - The migration
- [`scripts/fix-existing-users.ts`](scripts/fix-existing-users.ts) - Standalone fix script
- [`schema.sql`](schema.sql:1073) - Original handle_new_user function
- [`server/routes/auth.ts`](server/routes/auth.ts) - Auth middleware that queries profiles

## Support

If users still can't log in after this fix, check:

1. **Email verification**: Users must confirm their email before logging in
   ```sql
   SELECT email, email_confirmed_at FROM auth.users WHERE email = 'user@example.com';
   ```

2. **Product tier**: Users need a valid product tier for access
   ```sql
   SELECT product_tier FROM profiles WHERE id = 'user-uuid';
   ```

3. **RLS policies**: Ensure RLS policies allow users to read their own profile
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'profiles';
   ```

4. **Supabase Auth settings**: Check if email confirmation is required in Supabase Dashboard
   - Go to Authentication → Settings → Email Auth
   - Check "Confirm email" setting
