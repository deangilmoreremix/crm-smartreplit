-- ============================================================================
-- AI Feature Pricing System for Super Admin & White-Label Resellers
-- ============================================================================

-- 1. AI Feature Definitions (set by Super Admin)
CREATE TABLE ai_feature_definitions (
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

-- 2. White-Label Reseller Pricing (resellers set prices for their customers)
CREATE TABLE ai_reseller_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  feature_key VARCHAR(100) NOT NULL REFERENCES ai_feature_definitions(feature_key),
  retail_credit_cost INTEGER NOT NULL,
  wholesale_credit_cost INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(reseller_id, feature_key)
);

-- 3. AI Feature Usage Tracking
CREATE TABLE ai_feature_usage (
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

-- 4. Reseller Credit Balances
CREATE TABLE reseller_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_id UUID UNIQUE NOT NULL REFERENCES profiles(id),
  wholesale_credits_purchased INTEGER DEFAULT 0,
  wholesale_credits_used INTEGER DEFAULT 0,
  wholesale_credits_available INTEGER DEFAULT 0,
  total_revenue_cents INTEGER DEFAULT 0,
  total_profit_cents INTEGER DEFAULT 0,
  last_purchase_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Reseller Credit Transactions
CREATE TABLE reseller_credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_id UUID NOT NULL REFERENCES profiles(id),
  type VARCHAR(50) NOT NULL,
  credits_amount INTEGER NOT NULL,
  amount_cents INTEGER,
  end_user_id UUID REFERENCES profiles(id),
  feature_key VARCHAR(100),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE ai_feature_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_reseller_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_feature_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE reseller_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE reseller_credit_transactions ENABLE ROW LEVEL SECURITY;

-- Super Admin policies
CREATE POLICY "Super admin full access on feature definitions"
  ON ai_feature_definitions FOR ALL
  USING (auth.jwt() ->> 'role' = 'super_admin');

-- Reseller policies
CREATE POLICY "Resellers manage their own pricing"
  ON ai_reseller_pricing FOR ALL
  USING (reseller_id::text = auth.uid()::text);

CREATE POLICY "Resellers view their own credit balance"
  ON reseller_credits FOR SELECT
  USING (reseller_id::text = auth.uid()::text);

-- Default AI Features
INSERT INTO ai_feature_definitions (feature_key, feature_name, description, category, base_credit_cost) VALUES
('gpt5_chat', 'GPT-5 Chat', 'General AI chat conversation', 'communication', 5),
('script_generation', 'Video Script Generation', 'AI-generated video scripts', 'content', 15),
('meeting_summary', 'Meeting Summary', 'Summarize meeting transcripts', 'analysis', 10),
('email_draft', 'Email Draft', 'AI-assisted email composition', 'communication', 8),
('contact_enrichment', 'Contact Enrichment', 'Enrich contact data with AI', 'analysis', 20),
('pipeline_analysis', 'Pipeline Analysis', 'AI insights on sales pipeline', 'analysis', 12),
('content_generation', 'Content Generation', 'Generate marketing content', 'content', 25),
('image_generation', 'Image Generation', 'Generate images with AI', 'content', 30),
('voice_synthesis', 'Voice Synthesis', 'Text-to-speech generation', 'content', 15),
('video_generation', 'Video Generation', 'AI video creation', 'content', 50);
