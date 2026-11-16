-- Restore the AI feature pricing tables.
-- 20260202000000_ai_feature_pricing_system.sql was only partly applied to the live database:
-- reseller_credits / reseller_credit_transactions exist, but these three tables do not, so
-- server/routes/aiPricing.ts and server/services/aiPricingService.ts fail on every query.
-- Same definitions as that migration, made idempotent.

CREATE TABLE IF NOT EXISTS ai_feature_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key VARCHAR(100) UNIQUE NOT NULL,
  feature_name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  base_credit_cost INTEGER NOT NULL DEFAULT 10,
  min_credit_cost INTEGER DEFAULT 1,
  max_credit_cost INTEGER DEFAULT 1000,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_reseller_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  feature_key VARCHAR(100) NOT NULL REFERENCES ai_feature_definitions(feature_key),
  retail_credit_cost INTEGER NOT NULL,
  wholesale_credit_cost INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_reseller_feature UNIQUE (reseller_id, feature_key)
);

CREATE TABLE IF NOT EXISTS ai_feature_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  reseller_id UUID REFERENCES profiles(id),
  feature_key VARCHAR(100) NOT NULL,
  credits_charged INTEGER NOT NULL,
  credits_paid_to_platform INTEGER NOT NULL,
  reseller_profit_credits INTEGER DEFAULT 0,
  context JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_feature_usage_user ON ai_feature_usage (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_feature_usage_reseller ON ai_feature_usage (reseller_id, created_at DESC);

ALTER TABLE ai_feature_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_reseller_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_feature_usage ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_feature_definitions'
                 AND policyname = 'Super admin full access on feature definitions') THEN
    CREATE POLICY "Super admin full access on feature definitions"
      ON ai_feature_definitions FOR ALL
      USING (auth.jwt() ->> 'role' = 'super_admin');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_feature_definitions'
                 AND policyname = 'Authenticated users read active feature definitions') THEN
    CREATE POLICY "Authenticated users read active feature definitions"
      ON ai_feature_definitions FOR SELECT
      USING (auth.role() = 'authenticated' AND is_active = true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_reseller_pricing'
                 AND policyname = 'Resellers manage their own pricing') THEN
    CREATE POLICY "Resellers manage their own pricing"
      ON ai_reseller_pricing FOR ALL
      USING (reseller_id::text = auth.uid()::text);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_feature_usage'
                 AND policyname = 'Users view their own feature usage') THEN
    CREATE POLICY "Users view their own feature usage"
      ON ai_feature_usage FOR SELECT
      USING (user_id::text = auth.uid()::text OR reseller_id::text = auth.uid()::text);
  END IF;
END $$;

INSERT INTO ai_feature_definitions (feature_key, feature_name, description, category, base_credit_cost) VALUES
('gpt5_chat', 'AI Chat', 'General AI chat conversation', 'communication', 5),
('script_generation', 'Video Script Generation', 'AI-generated video scripts', 'content', 15),
('meeting_summary', 'Meeting Summary', 'Summarize meeting transcripts', 'analysis', 10),
('email_draft', 'Email Draft', 'AI-assisted email composition', 'communication', 8),
('contact_enrichment', 'Contact Enrichment', 'Enrich contact data with AI', 'analysis', 20),
('pipeline_analysis', 'Pipeline Analysis', 'AI insights on sales pipeline', 'analysis', 12),
('content_generation', 'Content Generation', 'Generate marketing content', 'content', 25),
('image_generation', 'Image Generation', 'Generate images with AI', 'content', 30),
('voice_synthesis', 'Voice Synthesis', 'Text-to-speech generation', 'content', 15),
('video_generation', 'Video Generation', 'AI video creation', 'content', 50)
ON CONFLICT (feature_key) DO NOTHING;
