# AI Tables RLS and Storage Buckets Setup Guide

This document describes the Row Level Security (RLS) configuration for all AI-related tables and the storage bucket setup for user files in the Supabase PostgreSQL database.

## Overview

This setup ensures that:
1. All AI-related tables have RLS enabled with appropriate policies
2. Users can only access their own data
3. Tenant-scoped data is properly isolated
4. Storage buckets are configured for different file types with appropriate access controls

## Migration File

**File**: [`supabase/migrations/20260129000000_ai_rls_and_storage_setup.sql`](supabase/migrations/20260129000000_ai_rls_and_storage_setup.sql)

## AI Tables with RLS

### Core AI Tables

| Table | Scope | Policies |
|-------|-------|----------|
| [`ai_prompts`](supabase/migrations/20260129000000_ai_rls_and_storage_setup.sql:25) | User + Public | View own + public, CRUD own |
| [`ai_generations`](supabase/migrations/20260129000000_ai_rls_and_storage_setup.sql:72) | User | View own, Insert own |
| [`ai_insights`](supabase/migrations/20260129000000_ai_rls_and_storage_setup.sql:92) | Tenant | Access via customer relationship |
| [`ai_insights_enhanced`](supabase/migrations/20260129000000_ai_rls_and_storage_setup.sql:115) | User | Full CRUD own |
| [`ai_workflows`](supabase/migrations/20260129000000_ai_rls_and_storage_setup.sql:138) | User | View, Insert, Update own |
| [`ai_usage_logs`](supabase/migrations/20260129000000_ai_rls_and_storage_setup.sql:173) | User/Tenant | Access via user_id or customer relationship |
| [`ai_usage_metrics`](supabase/migrations/20260129000000_ai_rls_and_storage_setup.sql:197) | User | Full CRUD own |
| [`ai_execution_history`](supabase/migrations/20260129000000_ai_rls_and_storage_setup.sql:215) | User | View, Insert own |
| [`ai_function_calls`](supabase/migrations/20260129000000_ai_rls_and_storage_setup.sql:239) | User | View, Insert, Update own |
| [`ai_context_state`](supabase/migrations/20260129000000_ai_rls_and_storage_setup.sql:271) | User | Full CRUD own |
| [`ai_models`](supabase/migrations/20260129000000_ai_rls_and_storage_setup.sql:311) | System | Read-only for authenticated users (active models only) |
| [`ai_automation_settings`](supabase/migrations/20260129000000_ai_rls_and_storage_setup.sql:327) | System | Read-only for authenticated users (enabled settings only) |
| [`ai_user_permissions`](supabase/migrations/20260129000000_ai_rls_and_storage_setup.sql:342) | User | Full CRUD own |
| [`ai_pending_actions`](supabase/migrations/20260129000000_ai_rls_and_storage_setup.sql:373) | User | View, Insert, Update own |
| [`ai_undo_snapshots`](supabase/migrations/20260129000000_ai_rls_and_storage_setup.sql:404) | User | View, Insert own |
| [`ai_model_preferences`](supabase/migrations/20260129000000_ai_rls_and_storage_setup.sql:425) | User | Full CRUD own |
| [`ai_enrichment_history`](supabase/migrations/20260129000000_ai_rls_and_storage_setup.sql:443) | User | Full CRUD own |

### Storage Tables

| Table | Scope | Policies |
|-------|-------|----------|
| [`storage_bucket_config`](supabase/migrations/20260129000000_ai_rls_and_storage_setup.sql:461) | System | Read for authenticated, Full for service_role |
| [`storage_usage`](supabase/migrations/20260129000000_ai_rls_and_storage_setup.sql:482) | User | Read own |
| [`user_upload_logs`](supabase/migrations/20260129000000_ai_rls_and_storage_setup.sql:496) | User | Read, Insert own |

## Storage Buckets

### Bucket Configuration

| Bucket | Public | Size Limit | Retention | MIME Types |
|--------|--------|------------|-----------|------------|
| [`user-uploads`](supabase/migrations/20260129000000_ai_rls_and_storage_setup.sql:524) | No | 50MB | 365 days | Images, PDFs, Office docs, JSON |
| [`avatars`](supabase/migrations/20260129000000_ai_rls_and_storage_setup.sql:540) | Yes | 2MB | Permanent | JPEG, PNG, WebP, GIF |
| [`ai-generated`](supabase/migrations/20260129000000_ai_rls_and_storage_setup.sql:556) | No | 10MB | 90 days | Images, PDFs, Text, Markdown, JSON |
| [`tenant-assets`](supabase/migrations/20260129000000_ai_rls_and_storage_setup.sql:572) | Yes | 10MB | Permanent | Images, PDFs |
| [`email-attachments`](supabase/migrations/20260129000000_ai_rls_and_storage_setup.sql:588) | No | 25MB | 30 days | Images, PDFs, Office docs, ZIP |

### Storage RLS Policies

#### user-uploads Bucket
- **Upload**: Users can upload to their own folder (`auth.uid()/filename`)
- **Read**: Users can read their own files
- **Update**: Users can update their own files
- **Delete**: Users can delete their own files

#### avatars Bucket
- **Upload**: Users can upload their own avatar (`auth.uid()/avatar`)
- **Read**: All authenticated users can read avatars
- **Update**: Users can update their own avatar
- **Delete**: Users can delete their own avatar

#### ai-generated Bucket
- **Upload**: Users can upload to their own folder
- **Read**: Users can read their own AI-generated content
- **Update**: Users can update their own content
- **Delete**: Users can delete their own content

#### tenant-assets Bucket
- **Upload/Update/Delete**: Tenant admins (role = 'admin' or 'owner') only
- **Read**: All authenticated users can read tenant assets

#### email-attachments Bucket
- **Upload**: Users can upload to their own folder
- **Read**: Users can read their own email attachments
- **Delete**: Users can delete their own email attachments

## Applying the Migration

### Using Supabase CLI

```bash
# Navigate to your project directory
cd /workspaces/crm-smartreplit

# Push the migration to your Supabase project
supabase db push
```

### Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy the contents of [`supabase/migrations/20260129000000_ai_rls_and_storage_setup.sql`](supabase/migrations/20260129000000_ai_rls_and_storage_setup.sql)
4. Paste into the SQL Editor and run

## Testing the Configuration

Run the test script to verify the configuration:

```sql
-- Run the test script in Supabase SQL Editor
\i scripts/test-ai-rls-policies.sql
```

Or manually verify:

```sql
-- Check RLS is enabled on AI tables
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename LIKE 'ai_%';

-- Check policies exist
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename LIKE 'ai_%';

-- Check storage buckets
SELECT id, name, public, file_size_limit 
FROM storage.buckets;
```

## Security Considerations

1. **User Isolation**: Each user can only access their own data through the `auth.uid()` check
2. **Tenant Isolation**: Tenant-scoped data uses relationships through the `customers` table
3. **Public Data**: Some tables (like `ai_models`, `ai_automation_settings`) allow read access to all authenticated users but only for active/enabled records
4. **Service Role**: The service_role has full access for backend operations
5. **Storage Security**: File paths include the user UUID to ensure isolation

## Troubleshooting

### RLS Not Working
- Ensure you're testing as an authenticated user, not as postgres/admin
- Check that the `auth.uid()` function returns the expected UUID
- Verify the user_id column in tables matches the auth.users.id format

### Storage Access Denied
- Verify the file path includes the user's UUID as the first folder
- Check that the bucket exists in `storage.buckets`
- Ensure the user is authenticated (not anon)

### Policy Conflicts
- The migration uses `DROP POLICY IF EXISTS` to ensure idempotency
- If you have existing policies, they will be replaced

## Related Documentation

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [GDPR Compliance Guide](GDPR_COMPLIANCE_GUIDE.md)
