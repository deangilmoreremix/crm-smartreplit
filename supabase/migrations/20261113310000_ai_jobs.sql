-- Long-running AI jobs processed by the Netlify background function ai-jobs-background.
-- Owners can read their own jobs; all writes go through the service role (bypasses RLS).
CREATE TABLE IF NOT EXISTS public.ai_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('bulk_lead_score', 'image_generate_hq', 'batch_respond')),
  input jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'done', 'failed')),
  result jsonb,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_jobs_user_created_idx ON public.ai_jobs (user_id, created_at DESC);

ALTER TABLE public.ai_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_jobs_owner_read" ON public.ai_jobs;
CREATE POLICY "ai_jobs_owner_read" ON public.ai_jobs
  FOR SELECT USING (auth.uid() = user_id);

-- Public bucket for generated images (written with the service role only).
INSERT INTO storage.buckets (id, name, public)
VALUES ('generated-images', 'generated-images', true)
ON CONFLICT (id) DO NOTHING;
