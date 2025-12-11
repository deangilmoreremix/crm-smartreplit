# Supabase Profile Sync Fix - Apply Instructions

## What This Fixes

The original Supabase trigger only captured `full_name` and `avatar_url` from user signups. This fix ensures ALL metadata is saved to profiles:

- ✅ `first_name` 
- ✅ `last_name`
- ✅ `role` (with auto super_admin assignment)
- ✅ `app_context` 
- ✅ `email_template_set`

## Step 1: Apply the Migration to Supabase

### Option A: Via Supabase Dashboard (Recommended)

1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor**
4. Click **New Query**
5. Copy and paste the contents of `supabase/migrations/20250117000000_fix_profile_sync.sql`
6. Click **Run** to execute

### Option B: Via Supabase CLI

```bash
# Make sure you have Supabase CLI installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Push the migration
supabase db push
```

## Step 2: Backfill Existing Users

After applying the migration, run the backfill script to update existing users:

```bash
npx tsx scripts/backfill-user-profiles.ts
```

This will:
- ✅ Create missing profiles for auth users
- ✅ Update incomplete profiles with metadata
- ✅ Auto-assign super_admin role to designated emails
- ✅ Set default app_context and email_template_set

## Step 3: Verify the Fix

### Test New User Signup

1. Create a test user via signup page
2. Check Supabase **Table Editor** → `profiles` table
3. Verify all fields are populated:
   - first_name ✅
   - last_name ✅
   - role ✅
   - app_context ✅
   - email_template_set ✅

### Check Existing Users

Run this SQL in Supabase to verify:

```sql
SELECT 
  p.id,
  au.email,
  p.first_name,
  p.last_name,
  p.role,
  p.app_context,
  p.email_template_set
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
ORDER BY au.created_at DESC
LIMIT 10;
```

## Super Admin Emails

These emails are automatically assigned `super_admin` role:
- dean@videoremix.io
- victor@videoremix.io
- samuel@videoremix.io
- jvzoo@gmail.com

## Troubleshooting

### Migration Fails
- Make sure you have `SUPABASE_SERVICE_ROLE_KEY` in your environment
- Check that the profiles table exists
- Verify you have admin permissions

### Backfill Fails
- Ensure `VITE_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set
- Check console output for specific errors
- Verify profiles table has correct columns

### Users Still Missing Data
- Re-run the backfill script: `npm run backfill:profiles`
- Check auth.users raw_user_meta_data has the fields
- Manually update via Supabase Table Editor if needed
