-- Create GTM Analytics Tables
-- Tables for tracking prompt performance, responses, and A/B testing

-- Prompt Performance Metrics table
CREATE TABLE IF NOT EXISTS prompt_performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id),
    prompt_id TEXT,
    category TEXT,
    performance_score DECIMAL(3,2),
    tokens_used INTEGER,
    cost DECIMAL(10,4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_prompt_performance_metrics_user_created ON prompt_performance_metrics(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prompt_performance_metrics_category ON prompt_performance_metrics(category);

-- Prompt Responses table
CREATE TABLE IF NOT EXISTS prompt_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id),
    prompt_id TEXT,
    response_text TEXT,
    quality_score DECIMAL(3,2),
    revenue_attributed DECIMAL(10,2) DEFAULT 0,
    category TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_prompt_responses_user_created ON prompt_responses(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prompt_responses_category ON prompt_responses(category);

-- Prompt A/B Tests table
CREATE TABLE IF NOT EXISTS prompt_ab_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id),
    name TEXT NOT NULL,
    description TEXT,
    prompt_a TEXT NOT NULL,
    prompt_b TEXT NOT NULL,
    category TEXT,
    status TEXT DEFAULT 'active',
    winner TEXT, -- 'a', 'b', or null
    a_responses INTEGER DEFAULT 0,
    b_responses INTEGER DEFAULT 0,
    a_score DECIMAL(3,2),
    b_score DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_prompt_ab_tests_user_created ON prompt_ab_tests(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prompt_ab_tests_status ON prompt_ab_tests(status);

-- Enable RLS on all tables
ALTER TABLE prompt_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_ab_tests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own prompt performance metrics" ON prompt_performance_metrics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own prompt performance metrics" ON prompt_performance_metrics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own prompt responses" ON prompt_responses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own prompt responses" ON prompt_responses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own A/B tests" ON prompt_ab_tests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own A/B tests" ON prompt_ab_tests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own A/B tests" ON prompt_ab_tests
    FOR UPDATE USING (auth.uid() = user_id);

-- Add table comments
COMMENT ON TABLE prompt_performance_metrics IS 'Tracks performance metrics for AI prompts including scores, costs, and usage';
COMMENT ON TABLE prompt_responses IS 'Stores prompt responses with quality scores and revenue attribution';
COMMENT ON TABLE prompt_ab_tests IS 'Manages A/B testing for prompt variations and tracks results';