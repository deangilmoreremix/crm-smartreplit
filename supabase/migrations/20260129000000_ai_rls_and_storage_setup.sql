-- AI Tables Row Level Security and Storage Buckets Migration
-- This migration configures RLS policies for all AI-related tables and sets up storage buckets
-- Run with: supabase db push

-- ============================================================================
-- PART 1: ENABLE RLS ON AI-RELATED TABLES
-- ============================================================================

-- Core AI tables
ALTER TABLE IF EXISTS public.ai_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ai_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ai_insights_enhanced ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ai_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ai_usage_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ai_execution_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ai_function_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ai_context_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ai_automation_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ai_user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ai_pending_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ai_undo_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ai_model_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ai_enrichment_history ENABLE ROW LEVEL SECURITY;

-- Storage-related tables
ALTER TABLE IF EXISTS public.storage_bucket_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.storage_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_upload_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 2: RLS POLICIES FOR AI_PROMPTS
-- ============================================================================

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can view own and public AI prompts" ON public.ai_prompts;
DROP POLICY IF EXISTS "Users can insert own AI prompts" ON public.ai_prompts;
DROP POLICY IF EXISTS "Users can update own AI prompts" ON public.ai_prompts;
DROP POLICY IF EXISTS "Users can delete own AI prompts" ON public.ai_prompts;

-- Users can view their own prompts and public prompts
CREATE POLICY "Users can view own and public AI prompts"
  ON public.ai_prompts
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR is_public = true
  );

-- Users can insert their own prompts
CREATE POLICY "Users can insert own AI prompts"
  ON public.ai_prompts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
  );

-- Users can update their own prompts
CREATE POLICY "Users can update own AI prompts"
  ON public.ai_prompts
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
  )
  WITH CHECK (
    user_id = auth.uid()
  );

-- Users can delete their own prompts
CREATE POLICY "Users can delete own AI prompts"
  ON public.ai_prompts
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
  );

-- ============================================================================
-- PART 3: RLS POLICIES FOR AI_GENERATIONS
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own AI generations" ON public.ai_generations;
DROP POLICY IF EXISTS "Users can insert own AI generations" ON public.ai_generations;

-- Users can view their own generations
CREATE POLICY "Users can view own AI generations"
  ON public.ai_generations
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
  );

-- Users can insert their own generations
CREATE POLICY "Users can insert own AI generations"
  ON public.ai_generations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
  );

-- ============================================================================
-- PART 4: RLS POLICIES FOR AI_INSIGHTS
-- ============================================================================

DROP POLICY IF EXISTS "Tenant access to AI insights" ON public.ai_insights;

-- Users can view insights for customers in their tenant
CREATE POLICY "Tenant access to AI insights"
  ON public.ai_insights
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.customers c
      WHERE c.id = ai_insights.customer_id
      AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.customers c
      WHERE c.id = ai_insights.customer_id
      AND c.user_id = auth.uid()
    )
  );

-- ============================================================================
-- PART 5: RLS POLICIES FOR AI_INSIGHTS_ENHANCED
-- ============================================================================

DROP POLICY IF EXISTS "Users can access their own AI insights" ON public.ai_insights_enhanced;

-- Users can access their own enhanced insights
CREATE POLICY "Users can access their own AI insights"
  ON public.ai_insights_enhanced
  FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid()
  )
  WITH CHECK (
    user_id = auth.uid()
  );

-- ============================================================================
-- PART 6: RLS POLICIES FOR AI_WORKFLOWS
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own workflows" ON public.ai_workflows;
DROP POLICY IF EXISTS "Users can insert own workflows" ON public.ai_workflows;
DROP POLICY IF EXISTS "Users can update own workflows" ON public.ai_workflows;

-- Users can view their own workflows
CREATE POLICY "Users can view own workflows"
  ON public.ai_workflows
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
  );

-- Users can insert their own workflows
CREATE POLICY "Users can insert own workflows"
  ON public.ai_workflows
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
  );

-- Users can update their own workflows
CREATE POLICY "Users can update own workflows"
  ON public.ai_workflows
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
  )
  WITH CHECK (
    user_id = auth.uid()
  );

-- ============================================================================
-- PART 7: RLS POLICIES FOR AI_USAGE_LOGS
-- ============================================================================

DROP POLICY IF EXISTS "Tenant access to ai_usage_logs" ON public.ai_usage_logs;

-- Users can access usage logs for their customers
CREATE POLICY "Tenant access to ai_usage_logs"
  ON public.ai_usage_logs
  FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.customers c
      WHERE c.id = ai_usage_logs.customer_id
      AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.customers c
      WHERE c.id = ai_usage_logs.customer_id
      AND c.user_id = auth.uid()
    )
  );

-- ============================================================================
-- PART 8: RLS POLICIES FOR AI_USAGE_METRICS
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own usage metrics" ON public.ai_usage_metrics;

-- Users can view their own usage metrics
CREATE POLICY "Users can view own usage metrics"
  ON public.ai_usage_metrics
  FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid()
  )
  WITH CHECK (
    user_id = auth.uid()
  );

-- ============================================================================
-- PART 9: RLS POLICIES FOR AI_EXECUTION_HISTORY
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own execution history" ON public.ai_execution_history;
DROP POLICY IF EXISTS "System can insert execution history" ON public.ai_execution_history;

-- Users can view their own execution history
CREATE POLICY "Users can view own execution history"
  ON public.ai_execution_history
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
  );

-- Users can insert their own execution history
CREATE POLICY "Users can insert own execution history"
  ON public.ai_execution_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
  );

-- ============================================================================
-- PART 10: RLS POLICIES FOR AI_FUNCTION_CALLS
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own function calls" ON public.ai_function_calls;
DROP POLICY IF EXISTS "Users can insert own function calls" ON public.ai_function_calls;
DROP POLICY IF EXISTS "Users can update own function calls" ON public.ai_function_calls;

-- Users can view their own function calls
CREATE POLICY "Users can view own function calls"
  ON public.ai_function_calls
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
  );

-- Users can insert their own function calls
CREATE POLICY "Users can insert own function calls"
  ON public.ai_function_calls
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
  );

-- Users can update their own function calls
CREATE POLICY "Users can update own function calls"
  ON public.ai_function_calls
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
  )
  WITH CHECK (
    user_id = auth.uid()
  );

-- ============================================================================
-- PART 11: RLS POLICIES FOR AI_CONTEXT_STATE
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own context state" ON public.ai_context_state;
DROP POLICY IF EXISTS "Users can insert own context state" ON public.ai_context_state;
DROP POLICY IF EXISTS "Users can update own context state" ON public.ai_context_state;
DROP POLICY IF EXISTS "Users can delete own context state" ON public.ai_context_state;

-- Users can view their own context state
CREATE POLICY "Users can view own context state"
  ON public.ai_context_state
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
  );

-- Users can insert their own context state
CREATE POLICY "Users can insert own context state"
  ON public.ai_context_state
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
  );

-- Users can update their own context state
CREATE POLICY "Users can update own context state"
  ON public.ai_context_state
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
  )
  WITH CHECK (
    user_id = auth.uid()
  );

-- Users can delete their own context state
CREATE POLICY "Users can delete own context state"
  ON public.ai_context_state
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
  );

-- ============================================================================
-- PART 12: RLS POLICIES FOR AI_MODELS
-- ============================================================================

DROP POLICY IF EXISTS "Allow authenticated read access to ai_models" ON public.ai_models;

-- All authenticated users can read AI models (read-only system table)
CREATE POLICY "Allow authenticated read access to ai_models"
  ON public.ai_models
  FOR SELECT
  TO authenticated
  USING (
    is_active = true
  );

-- ============================================================================
-- PART 13: RLS POLICIES FOR AI_AUTOMATION_SETTINGS
-- ============================================================================

DROP POLICY IF EXISTS "Users can manage automation settings" ON public.ai_automation_settings;

-- Users can read automation settings
CREATE POLICY "Users can view automation settings"
  ON public.ai_automation_settings
  FOR SELECT
  TO authenticated
  USING (
    is_enabled = true
  );

-- ============================================================================
-- PART 14: RLS POLICIES FOR AI_USER_PERMISSIONS
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own permissions" ON public.ai_user_permissions;
DROP POLICY IF EXISTS "Users can insert own permissions" ON public.ai_user_permissions;
DROP POLICY IF EXISTS "Users can update own permissions" ON public.ai_user_permissions;

-- Users can view their own permissions
CREATE POLICY "Users can view own permissions"
  ON public.ai_user_permissions
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
  );

-- Users can insert their own permissions
CREATE POLICY "Users can insert own permissions"
  ON public.ai_user_permissions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
  );

-- Users can update their own permissions
CREATE POLICY "Users can update own permissions"
  ON public.ai_user_permissions
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
  )
  WITH CHECK (
    user_id = auth.uid()
  );

-- ============================================================================
-- PART 15: RLS POLICIES FOR AI_PENDING_ACTIONS
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own pending actions" ON public.ai_pending_actions;
DROP POLICY IF EXISTS "Users can insert own pending actions" ON public.ai_pending_actions;
DROP POLICY IF EXISTS "Users can update own pending actions" ON public.ai_pending_actions;

-- Users can view their own pending actions
CREATE POLICY "Users can view own pending actions"
  ON public.ai_pending_actions
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
  );

-- Users can insert their own pending actions
CREATE POLICY "Users can insert own pending actions"
  ON public.ai_pending_actions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
  );

-- Users can update their own pending actions
CREATE POLICY "Users can update own pending actions"
  ON public.ai_pending_actions
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
  )
  WITH CHECK (
    user_id = auth.uid()
  );

-- ============================================================================
-- PART 16: RLS POLICIES FOR AI_UNDO_SNAPSHOTS
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own undo snapshots" ON public.ai_undo_snapshots;
DROP POLICY IF EXISTS "System can insert undo snapshots" ON public.ai_undo_snapshots;

-- Users can view their own undo snapshots
CREATE POLICY "Users can view own undo snapshots"
  ON public.ai_undo_snapshots
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
  );

-- Users can insert their own undo snapshots
CREATE POLICY "Users can insert own undo snapshots"
  ON public.ai_undo_snapshots
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
  );

-- ============================================================================
-- PART 17: RLS POLICIES FOR AI_MODEL_PREFERENCES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own model preferences" ON public.ai_model_preferences;
DROP POLICY IF EXISTS "Users can insert own model preferences" ON public.ai_model_preferences;
DROP POLICY IF EXISTS "Users can update own model preferences" ON public.ai_model_preferences;

-- Users can view their own model preferences
CREATE POLICY "Users can view own model preferences"
  ON public.ai_model_preferences
  FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid()
  )
  WITH CHECK (
    user_id = auth.uid()
  );

-- ============================================================================
-- PART 18: RLS POLICIES FOR AI_ENRICHMENT_HISTORY
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own enrichment history" ON public.ai_enrichment_history;

-- Users can view their own enrichment history
CREATE POLICY "Users can view own enrichment history"
  ON public.ai_enrichment_history
  FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid()
  )
  WITH CHECK (
    user_id = auth.uid()
  );

-- ============================================================================
-- PART 19: RLS POLICIES FOR STORAGE_BUCKET_CONFIG
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can read bucket config" ON public.storage_bucket_config;
DROP POLICY IF EXISTS "Service role can manage config" ON public.storage_bucket_config;

-- Authenticated users can read bucket config
CREATE POLICY "Authenticated users can read bucket config"
  ON public.storage_bucket_config
  FOR SELECT
  TO authenticated
  USING (
    true
  );

-- Service role can manage bucket config
CREATE POLICY "Service role can manage config"
  ON public.storage_bucket_config
  FOR ALL
  TO service_role
  USING (
    true
  )
  WITH CHECK (
    true
  );

-- ============================================================================
-- PART 20: RLS POLICIES FOR STORAGE_USAGE
-- ============================================================================

DROP POLICY IF EXISTS "Users can manage own storage usage" ON public.storage_usage;

-- Users can view their own storage usage
CREATE POLICY "Users can view own storage usage"
  ON public.storage_usage
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
  );

-- ============================================================================
-- PART 21: RLS POLICIES FOR USER_UPLOAD_LOGS
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own upload logs" ON public.user_upload_logs;
DROP POLICY IF EXISTS "Users can insert their own upload logs" ON public.user_upload_logs;

-- Users can view their own upload logs
CREATE POLICY "Users can view their own upload logs"
  ON public.user_upload_logs
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
  );

-- Users can insert their own upload logs
CREATE POLICY "Users can insert their own upload logs"
  ON public.user_upload_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
  );

-- ============================================================================
-- PART 22: STORAGE BUCKETS SETUP
-- ============================================================================

-- Create storage buckets for user files
-- Note: These use the Supabase storage schema (storage.buckets)

-- User uploads bucket (for general user file uploads)
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
  'user-uploads',
  'user-uploads',
  false,
  false,
  52428800, -- 50MB limit
  ARRAY[
    'image/*',
    'application/pdf',
    'text/*',
    'application/json',
    'application/vnd.openxmlformats-officedocument.*',
    'application/vnd.ms-excel',
    'application/msword'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- User avatars bucket (for profile pictures)
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  true,
  2097152, -- 2MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- AI generated content bucket (for AI-generated images, documents)
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
  'ai-generated',
  'ai-generated',
  false,
  false,
  10485760, -- 10MB limit
  ARRAY[
    'image/*',
    'application/pdf',
    'text/plain',
    'text/markdown',
    'application/json'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Tenant assets bucket (for white-label tenant assets like logos)
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
  'tenant-assets',
  'tenant-assets',
  true,
  true,
  10485760, -- 10MB limit
  ARRAY['image/*', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Email attachments bucket (for email system attachments)
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
  'email-attachments',
  'email-attachments',
  false,
  false,
  26214400, -- 25MB limit
  ARRAY[
    'image/*',
    'application/pdf',
    'text/*',
    'application/vnd.openxmlformats-officedocument.*',
    'application/vnd.ms-*',
    'application/msword',
    'application/zip'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================================
-- PART 23: STORAGE RLS POLICIES
-- ============================================================================

-- Policy for user-uploads bucket: Users can only access their own folder
DROP POLICY IF EXISTS "Users can upload to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their own uploads" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own uploads" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own uploads" ON storage.objects;

-- Users can upload files to their own folder
CREATE POLICY "Users can upload to their own folder"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'user-uploads' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can read their own files
CREATE POLICY "Users can read their own uploads"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'user-uploads' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can update their own files
CREATE POLICY "Users can update their own uploads"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'user-uploads' AND
    (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'user-uploads' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own files
CREATE POLICY "Users can delete their own uploads"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'user-uploads' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy for avatars bucket: Users can manage their own avatar
CREATE POLICY "Users can upload their own avatar"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' AND
    name = auth.uid()::text || '/avatar'
  );

CREATE POLICY "Users can read avatars"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'avatars'
  );

CREATE POLICY "Users can update their own avatar"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars' AND
    name = auth.uid()::text || '/avatar'
  )
  WITH CHECK (
    bucket_id = 'avatars' AND
    name = auth.uid()::text || '/avatar'
  );

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars' AND
    name = auth.uid()::text || '/avatar'
  );

-- Policy for ai-generated bucket: Users can access their own AI-generated content
CREATE POLICY "Users can upload AI-generated content"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'ai-generated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can read their AI-generated content"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'ai-generated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their AI-generated content"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'ai-generated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'ai-generated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their AI-generated content"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'ai-generated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy for tenant-assets bucket: Tenant admins can manage their tenant assets
CREATE POLICY "Tenant admins can manage tenant assets"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (
    bucket_id = 'tenant-assets' AND
    EXISTS (
      SELECT 1 FROM public.user_tenant_roles utr
      WHERE utr.user_id = auth.uid()
      AND utr.role IN ('admin', 'owner')
    )
  )
  WITH CHECK (
    bucket_id = 'tenant-assets' AND
    EXISTS (
      SELECT 1 FROM public.user_tenant_roles utr
      WHERE utr.user_id = auth.uid()
      AND utr.role IN ('admin', 'owner')
    )
  );

-- Everyone can read tenant assets (for white-label branding)
CREATE POLICY "Everyone can read tenant assets"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'tenant-assets'
  );

-- Policy for email-attachments bucket: Users can manage their email attachments
CREATE POLICY "Users can upload email attachments"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'email-attachments' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can read their email attachments"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'email-attachments' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their email attachments"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'email-attachments' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================================
-- PART 24: STORAGE BUCKET CONFIG ENTRIES
-- ============================================================================

-- Insert bucket configuration metadata
INSERT INTO public.storage_bucket_config (
  bucket_name,
  purpose,
  max_file_size,
  allowed_mime_types,
  is_public,
  retention_days
) VALUES 
  (
    'user-uploads',
    'General user file uploads including documents and images',
    52428800,
    ARRAY['image/*', 'application/pdf', 'text/*', 'application/json', 'application/vnd.openxmlformats-officedocument.*', 'application/vnd.ms-excel', 'application/msword'],
    false,
    365
  ),
  (
    'avatars',
    'User profile pictures and avatars',
    2097152,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    true,
    NULL
  ),
  (
    'ai-generated',
    'AI-generated content including images and documents',
    10485760,
    ARRAY['image/*', 'application/pdf', 'text/plain', 'text/markdown', 'application/json'],
    false,
    90
  ),
  (
    'tenant-assets',
    'White-label tenant assets like logos and branding',
    10485760,
    ARRAY['image/*', 'application/pdf'],
    true,
    NULL
  ),
  (
    'email-attachments',
    'Email system attachments',
    26214400,
    ARRAY['image/*', 'application/pdf', 'text/*', 'application/vnd.openxmlformats-officedocument.*', 'application/vnd.ms-*', 'application/msword', 'application/zip'],
    false,
    30
  )
ON CONFLICT (bucket_name) DO UPDATE SET
  purpose = EXCLUDED.purpose,
  max_file_size = EXCLUDED.max_file_size,
  allowed_mime_types = EXCLUDED.allowed_mime_types,
  is_public = EXCLUDED.is_public,
  retention_days = EXCLUDED.retention_days,
  updated_at = NOW();

-- ============================================================================
-- PART 25: GRANT PERMISSIONS
-- ============================================================================

-- Grant table permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_prompts TO authenticated;
GRANT SELECT, INSERT ON public.ai_generations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_insights TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_insights_enhanced TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_workflows TO authenticated;
GRANT SELECT, INSERT ON public.ai_usage_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.ai_usage_metrics TO authenticated;
GRANT SELECT, INSERT ON public.ai_execution_history TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.ai_function_calls TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_context_state TO authenticated;
GRANT SELECT ON public.ai_models TO authenticated;
GRANT SELECT ON public.ai_automation_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.ai_user_permissions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.ai_pending_actions TO authenticated;
GRANT SELECT, INSERT ON public.ai_undo_snapshots TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.ai_model_preferences TO authenticated;
GRANT SELECT, INSERT ON public.ai_enrichment_history TO authenticated;

-- Grant storage table permissions
GRANT SELECT ON public.storage_bucket_config TO authenticated;
GRANT SELECT ON public.storage_usage TO authenticated;
GRANT SELECT, INSERT ON public.user_upload_logs TO authenticated;

-- Grant service role full access
GRANT ALL ON public.ai_prompts TO service_role;
GRANT ALL ON public.ai_generations TO service_role;
GRANT ALL ON public.ai_insights TO service_role;
GRANT ALL ON public.ai_insights_enhanced TO service_role;
GRANT ALL ON public.ai_workflows TO service_role;
GRANT ALL ON public.ai_usage_logs TO service_role;
GRANT ALL ON public.ai_usage_metrics TO service_role;
GRANT ALL ON public.ai_execution_history TO service_role;
GRANT ALL ON public.ai_function_calls TO service_role;
GRANT ALL ON public.ai_context_state TO service_role;
GRANT ALL ON public.ai_models TO service_role;
GRANT ALL ON public.ai_automation_settings TO service_role;
GRANT ALL ON public.ai_user_permissions TO service_role;
GRANT ALL ON public.ai_pending_actions TO service_role;
GRANT ALL ON public.ai_undo_snapshots TO service_role;
GRANT ALL ON public.ai_model_preferences TO service_role;
GRANT ALL ON public.ai_enrichment_history TO service_role;
GRANT ALL ON public.storage_bucket_config TO service_role;
GRANT ALL ON public.storage_usage TO service_role;
GRANT ALL ON public.user_upload_logs TO service_role;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

COMMENT ON TABLE public.ai_prompts IS 'AI prompt templates with RLS enabled - users can only access their own and public prompts';
COMMENT ON TABLE public.ai_generations IS 'AI content generations with RLS enabled - users can only access their own generations';
COMMENT ON TABLE public.ai_insights IS 'AI-generated insights with RLS enabled - tenant-scoped access';
COMMENT ON TABLE public.ai_workflows IS 'AI workflow executions with RLS enabled - user-scoped access';
COMMENT ON TABLE public.ai_usage_logs IS 'AI usage tracking with RLS enabled - tenant-scoped access';
COMMENT ON TABLE public.ai_function_calls IS 'AI function calls with RLS enabled - user-scoped access';
COMMENT ON TABLE public.ai_context_state IS 'AI conversation context with RLS enabled - user-scoped access';
COMMENT ON TABLE public.ai_user_permissions IS 'AI user permission settings with RLS enabled - user-scoped access';
COMMENT ON TABLE public.ai_pending_actions IS 'AI pending user actions with RLS enabled - user-scoped access';
COMMENT ON TABLE public.ai_undo_snapshots IS 'AI operation undo snapshots with RLS enabled - user-scoped access';
