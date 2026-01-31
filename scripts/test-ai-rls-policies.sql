-- Test Script for AI Tables RLS Policies and Storage Buckets
-- Run this in the Supabase SQL Editor to verify the configuration

-- ============================================================================
-- TEST 1: Verify RLS is enabled on all AI tables
-- ============================================================================

SELECT 
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'ai_prompts',
    'ai_generations',
    'ai_insights',
    'ai_insights_enhanced',
    'ai_workflows',
    'ai_usage_logs',
    'ai_usage_metrics',
    'ai_execution_history',
    'ai_function_calls',
    'ai_context_state',
    'ai_models',
    'ai_automation_settings',
    'ai_user_permissions',
    'ai_pending_actions',
    'ai_undo_snapshots',
    'ai_model_preferences',
    'ai_enrichment_history',
    'storage_bucket_config',
    'storage_usage',
    'user_upload_logs'
  )
ORDER BY tablename;

-- ============================================================================
-- TEST 2: Verify RLS policies exist for AI tables
-- ============================================================================

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd AS operation,
  qual AS using_expression,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename LIKE 'ai_%'
ORDER BY tablename, policyname;

-- ============================================================================
-- TEST 3: Verify storage buckets were created
-- ============================================================================

SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets
WHERE id IN ('user-uploads', 'avatars', 'ai-generated', 'tenant-assets', 'email-attachments')
ORDER BY id;

-- ============================================================================
-- TEST 4: Verify storage bucket config entries
-- ============================================================================

SELECT 
  bucket_name,
  purpose,
  max_file_size,
  allowed_mime_types,
  is_public,
  retention_days,
  created_at,
  updated_at
FROM public.storage_bucket_config
ORDER BY bucket_name;

-- ============================================================================
-- TEST 5: Verify storage RLS policies
-- ============================================================================

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd AS operation
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%upload%' OR policyname LIKE '%avatar%' OR policyname LIKE '%tenant%' OR policyname LIKE '%email%'
ORDER BY policyname;

-- ============================================================================
-- TEST 6: Test RLS policy logic (as authenticated user)
-- ============================================================================

-- Note: These tests should be run as an authenticated user
-- They will fail if run as postgres/admin since RLS bypasses for superusers

-- Test 6a: Check if user can see their own data in ai_prompts
-- Expected: Returns rows where user_id matches current user
-- SELECT * FROM ai_prompts WHERE user_id = auth.uid();

-- Test 6b: Check if user can see public prompts
-- Expected: Returns rows where is_public = true
-- SELECT * FROM ai_prompts WHERE is_public = true;

-- Test 6c: Try to insert a prompt for another user (should fail)
-- Expected: RLS violation error
-- INSERT INTO ai_prompts (user_id, name, prompt, category)
-- VALUES ('00000000-0000-0000-0000-000000000000', 'Test', 'Test prompt', 'test');

-- ============================================================================
-- TEST 7: Verify grants are in place
-- ============================================================================

SELECT 
  grantee,
  table_schema,
  table_name,
  privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND table_name LIKE 'ai_%'
  AND grantee IN ('authenticated', 'service_role')
ORDER BY table_name, grantee, privilege_type;

-- ============================================================================
-- TEST 8: Count policies per table
-- ============================================================================

SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename LIKE 'ai_%'
GROUP BY tablename
ORDER BY tablename;

-- ============================================================================
-- TEST 9: Verify table comments
-- ============================================================================

SELECT 
  c.relname AS table_name,
  obj_description(c.oid) AS description
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname LIKE 'ai_%'
  AND c.relkind = 'r'
ORDER BY c.relname;

-- ============================================================================
-- TEST 10: Summary report
-- ============================================================================

WITH ai_tables AS (
  SELECT tablename
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename LIKE 'ai_%'
),
rls_status AS (
  SELECT tablename, rowsecurity
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename LIKE 'ai_%'
),
policy_count AS (
  SELECT tablename, COUNT(*) as count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename LIKE 'ai_%'
  GROUP BY tablename
),
storage_buckets AS (
  SELECT COUNT(*) as bucket_count
  FROM storage.buckets
  WHERE id IN ('user-uploads', 'avatars', 'ai-generated', 'tenant-assets', 'email-attachments')
)
SELECT 
  'AI Tables with RLS' as category,
  COUNT(*)::text as count
FROM rls_status
WHERE rowsecurity = true
UNION ALL
SELECT 
  'AI Tables without RLS' as category,
  COUNT(*)::text as count
FROM rls_status
WHERE rowsecurity = false
UNION ALL
SELECT 
  'Total AI RLS Policies' as category,
  SUM(count)::text as count
FROM policy_count
UNION ALL
SELECT 
  'Storage Buckets Created' as category,
  bucket_count::text as count
FROM storage_buckets;
