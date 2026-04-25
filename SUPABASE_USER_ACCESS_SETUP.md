# User Access Configuration Guide

## Supabase Migration Complete - Access Setup Required

Your application has been fully migrated from Neon to Supabase. All database schema, RLS policies, storage buckets, and edge functions are already configured in your codebase. This guide helps you understand what's in place and what you need to do to activate user access.

---

## ✅ What's Already Configured

### 1. Database Schema & RLS Policies

Your Supabase database has comprehensive Row Level Security policies configured across 65+ tables. The key tables and their access patterns:

| Table             | Access Pattern         | RLS Policy                                 |
| ----------------- | ---------------------- | ------------------------------------------ |
| `profiles`        | User sees own profile  | `profile_id = auth.uid()`                  |
| `contacts`        | User sees own contacts | `profile_id = auth.uid()`                  |
| `deals`           | User sees own deals    | `profile_id = auth.uid()`                  |
| `tasks`           | User sees own tasks    | `profile_id = auth.uid()`                  |
| `ai_prompts`      | User sees own + public | `user_id = auth.uid() OR is_public = true` |
| `storage.objects` | User sees own files    | Folder structure based on `auth.uid()`     |

### 2. User Auto-Creation Trigger

There's an auth trigger `handle_new_user()` in `supabase/migrations/20260129000001_fix_auth_trigger.sql` that automatically creates a profile when a user signs up:

```sql
-- Super admin emails (get super_admin role):
dean@videoremix.io, victor@videoremix.io, samuel@videoremix.io, jvzoo@gmail.com, dean@smartcrm.vip

-- All other users get 'regular_user' role by default
-- App context defaults to 'smartcrm'
```

### 3. Multi-Tenant Support

Your system supports 3 tenants:

- `videoremix` (VideoRemix.vip)
- `smartcrm` (SmartCRM)
- `ai-video-agent-studio` (AI Video Agent Studio)

User roles table: `user_roles` with roles `super_admin`, `admin`, `user`

### 4. Storage Buckets

5 storage buckets configured in `supabase/migrations/20260129000000_ai_rls_and_storage_setup.sql`:

| Bucket              | Purpose              | File Size Limit | Access                      |
| ------------------- | -------------------- | --------------- | --------------------------- |
| `user-uploads`      | General user files   | 50MB            | User's own folder only      |
| `avatars`           | Profile pictures     | 2MB             | Public read, user write own |
| `ai-generated`      | AI generated content | 10MB            | User's own folder only      |
| `tenant-assets`     | White-label branding | 10MB            | Admin management            |
| `email-attachments` | Email attachments    | 25MB            | User's own folder only      |

### 5. Edge Functions

5 edge functions configured in `supabase/functions/`:

- `invite-user` - Send user invitations
- `contacts` - Contacts CRUD for module federation
- `deals` - Deals/Pipeline CRUD for module federation
- `calendar` - Calendar operations
- `ai-agents` - AI agent operations
- `send-email-hook` - Tenant-aware email renderer

All edge functions use:

- `SUPABASE_URL` environment variable
- `SUPABASE_SERVICE_ROLE_KEY` for database access

---

## 🚀 Steps to Give Users Access

### Step 1: Verify Supabase Dashboard Configuration

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/bzxohkrxcwodllketcpz)
2. Navigate to **Authentication** → **Settings**
3. Verify these settings:
   - Site URL: `https://app.smartcrm.vip`
   - Redirect URLs: `https://app.smartcrm.vip/auth/callback`, etc.
   - Enable sign up: `true`

### Step 2: Update Netlify Environment Variables

In your Netlify site settings, add these environment variables:

```
DATABASE_URL=postgresql://postgres:VideoRemix2026@db.bzxohkrxcwodllketcpz.supabase.co:5432/postgres
SUPABASE_URL=https://bzxohkrxcwodllketcpz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6eG9oa3J4Y3dvZGxsa2V0Y3B6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzg2NjM4NSwiZXhwIjoyMDg5NDQyMzg1fQ.S5HmTONnamT169WYF0riSphXij-Mwtk7D3pphfSrCFE
VITE_SUPABASE_URL=https://bzxohkrxcwodllketcpz.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_-CX9glOjtolD9mPJqjHlaQ_bFxkQZn6
```

### Step 3: Invite Users

In Supabase Dashboard:

1. Go to **Authentication** → **Users**
2. Click **Invite User**
3. Enter email address
4. User receives invitation email with branded template
5. User clicks link, creates account
6. Auth trigger automatically creates profile in `profiles` table

### Step 4: Set User Roles (if needed)

To make a user a super_admin, update their role in the `profiles` table:

```sql
UPDATE profiles
SET role = 'super_admin'
WHERE id = 'user-uuid-here';
```

Or add them to `user_roles` table for multi-tenant access:

```sql
INSERT INTO user_roles (user_id, role, tenant)
VALUES ('user-uuid-here', 'admin', 'smartcrm');
```

---

## 📧 Email Templates

Email templates are configured for 3 tenants in `supabase/email-templates/`:

- `smartcrm/` - 5 templates (confirm-signup, magic-link, reset-password, invite-user, change-email)
- `videoremix/` - 5 templates
- `ai-video-agent-studio/` - 1 template (confirm-signup)

All templates use `{{ .ConfirmationURL }}` placeholder for Supabase auth tokens.

---

## 🔐 How Access Control Works

1. **User Signs Up/Logs In** → Supabase Auth creates session with JWT
2. **JWT contains**: `user_id`, `email`, `role` (if set in metadata)
3. **RLS Policies check**: `auth.uid()` against `profile_id` or `user_id` columns
4. **Users only see**: Their own data (profile_id = auth.uid())

---

## 📊 Existing Tables with Access Control

All these tables have RLS enabled and policies configured:

- `profiles` - User profile data
- `contacts` - CRM contacts
- `deals` - Pipeline deals
- `tasks` - Task management
- `appointments` - Calendar appointments
- `notes` - Contact notes
- `documents` - File attachments
- `communications` - Email/SMS logs
- `automation_rules` - Workflow automations
- `ai_prompts` - AI prompt templates
- `ai_workflows` - AI workflow definitions
- `user_features` - Feature access control
- `user_credits` - Credit balance tracking
- `entitlements` - Subscription entitlements
- And 50+ more tables...

---

## ⚠️ Important Notes

1. **Users already in Supabase Auth** - If you have existing users, their profiles may need to be created manually if the auth trigger didn't fire for them. Run this SQL to fix:

```sql
INSERT INTO public.profiles (
  id, username, first_name, last_name, role,
  avatar_url, app_context, email_template_set, created_at, updated_at
)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'username', split_part(u.email, '@', 1)),
  u.raw_user_meta_data->>'first_name',
  u.raw_user_meta_data->>'last_name',
  COALESCE(u.raw_user_meta_data->>'role', 'regular_user'),
  u.raw_user_meta_data->>'avatar_url',
  COALESCE(u.raw_user_meta_data->>'app_context', 'smartcrm'),
  COALESCE(u.raw_user_meta_data->>'email_template_set', 'smartcrm'),
  COALESCE(u.created_at, NOW()),
  NOW()
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;
```

2. **Storage file paths** - Users upload to folders named by their user ID. The path structure is:
   - `user-uploads/{user_id}/filename.pdf`
   - `avatars/{user_id}/avatar`
   - `ai-generated/{user_id}/image.png`

3. **Edge functions** - All edge functions are designed for server-to-server communication with service role key. They don't handle user authentication directly - that's done by the client Supabase client.

---

## 🎯 Next Steps

1. **Deploy to Netlify** with updated environment variables
2. **Test user signup** - Create a test account
3. **Verify profile creation** - Check `profiles` table has new row
4. **Test data access** - Create a contact, verify user can see it
5. **Test file upload** - Upload an avatar, verify storage path

---

## 📝 Summary

| Component            | Status      | Action Needed             |
| -------------------- | ----------- | ------------------------- |
| Database Schema      | ✅ Complete | None                      |
| RLS Policies         | ✅ Complete | None                      |
| Storage Buckets      | ✅ Complete | None                      |
| Edge Functions       | ✅ Complete | None                      |
| Email Templates      | ✅ Complete | None                      |
| Auth Trigger         | ✅ Complete | None                      |
| Supabase Auth Config | ✅ Ready    | Verify in dashboard       |
| Netlify Env Vars     | ⏳ Pending  | Add Supabase credentials  |
| User Profiles        | ⏳ Pending  | Create for existing users |
| User Access          | ⏳ Pending  | Invite users              |

Your migration is complete! The infrastructure is all in place - you just need to add environment variables to Netlify and start inviting users. 🚀
