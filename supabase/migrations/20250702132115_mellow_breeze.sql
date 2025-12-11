/*
  # Create AI Models and Usage Tables

  1. New Tables
    - `ai_models`
      - `id` (text, primary key)
      - `provider` (llm_type_enum)
      - `model_name` (text)
      - `display_name` (text)
      - `endpoint_url` (text, optional)
      - `pricing` (jsonb, optional)
      - `capabilities` (text array)
      - `context_window` (integer)
      - `max_tokens` (integer)
      - `is_active` (boolean)
      - `is_recommended` (boolean)
      - `description` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `ai_usage_logs`
      - `id` (uuid, primary key)
      - `customer_id` (uuid, optional, references customers)
      - `user_id` (uuid, optional)
      - `model_id` (text, references ai_models)
      - `feature_used` (text)
      - `tokens_used` (integer)
      - `cost` (numeric)
      - `response_time_ms` (integer)
      - `success` (boolean)
      - `error_message` (text, optional)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to read ai_models
    - Add policies for tenant access to ai_usage_logs

  3. Initial Data
    - Populate ai_models with Google AI models (Gemini and Gemma)
*/

-- Create ai_models table
CREATE TABLE IF NOT EXISTS ai_models (
  id text PRIMARY KEY,
  provider llm_type_enum NOT NULL,
  model_name text NOT NULL,
  display_name text NOT NULL,
  endpoint_url text,
  pricing jsonb,
  capabilities text[] DEFAULT '{}',
  context_window integer NOT NULL DEFAULT 8192,
  max_tokens integer NOT NULL DEFAULT 4096,
  is_active boolean DEFAULT true,
  is_recommended boolean DEFAULT false,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create ai_usage_logs table
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  user_id uuid,
  model_id text REFERENCES ai_models(id) ON DELETE CASCADE,
  feature_used text NOT NULL,
  tokens_used integer DEFAULT 0,
  cost numeric(10,6) DEFAULT 0,
  response_time_ms integer DEFAULT 0,
  success boolean DEFAULT true,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for ai_models (public read access)
CREATE POLICY "Allow public read access to ai_models"
  ON ai_models
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated read access to ai_models"
  ON ai_models
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policies for ai_usage_logs (tenant access)
CREATE POLICY "Tenant access to ai_usage_logs"
  ON ai_usage_logs
  FOR ALL
  TO authenticated
  USING (
    customer_id IN (
      SELECT customers.id
      FROM customers
      WHERE customers.id = ai_usage_logs.customer_id
    )
  )
  WITH CHECK (
    customer_id IN (
      SELECT customers.id
      FROM customers
      WHERE customers.id = ai_usage_logs.customer_id
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_models_provider ON ai_models(provider);
CREATE INDEX IF NOT EXISTS idx_ai_models_is_active ON ai_models(is_active);
CREATE INDEX IF NOT EXISTS idx_ai_models_is_recommended ON ai_models(is_recommended);

CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_customer_id ON ai_usage_logs(customer_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_model_id ON ai_usage_logs(model_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_created_at ON ai_usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_feature_used ON ai_usage_logs(feature_used);

-- Create trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_ai_models_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_models_updated_at_trigger
  BEFORE UPDATE ON ai_models
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_models_updated_at();

-- Insert initial AI models data
INSERT INTO ai_models (id, provider, model_name, display_name, pricing, capabilities, context_window, max_tokens, is_active, is_recommended, description) VALUES
-- Gemini Models
('gemini-2.5-flash', 'gemini', 'gemini-2.5-flash', 'Gemini 2.5 Flash', 
 '{"input_per_1m_tokens": 0.075, "output_per_1m_tokens": 0.30}',
 '{"text-generation", "reasoning", "code-generation", "system-instructions"}',
 1048576, 8192, true, true,
 'Fast and versatile performance across a diverse variety of tasks'),

('gemini-2.5-flash-8b', 'gemini', 'gemini-2.5-flash-8b', 'Gemini 2.5 Flash 8B',
 '{"input_per_1m_tokens": 0.0375, "output_per_1m_tokens": 0.15}',
 '{"text-generation", "reasoning", "code-generation"}',
 1048576, 8192, true, false,
 'High volume and lower intelligence tasks'),

('gemini-2.0-flash-exp', 'gemini', 'gemini-2.0-flash-exp', 'Gemini 2.0 Flash (Experimental)',
 '{"input_per_1m_tokens": 0.075, "output_per_1m_tokens": 0.30}',
 '{"text-generation", "reasoning", "multimodal", "code-generation"}',
 1048576, 8192, true, false,
 'Experimental model with multimodal capabilities'),

('gemini-1.5-flash', 'gemini', 'gemini-1.5-flash', 'Gemini 1.5 Flash',
 '{"input_per_1m_tokens": 0.075, "output_per_1m_tokens": 0.30}',
 '{"text-generation", "reasoning", "multimodal"}',
 1048576, 8192, true, false,
 'Fast and versatile performance across a diverse variety of tasks'),

('gemini-1.5-flash-8b', 'gemini', 'gemini-1.5-flash-8b', 'Gemini 1.5 Flash 8B',
 '{"input_per_1m_tokens": 0.0375, "output_per_1m_tokens": 0.15}',
 '{"text-generation", "reasoning"}',
 1048576, 8192, true, false,
 'High volume and lower intelligence tasks'),

('gemini-1.5-pro', 'gemini', 'gemini-1.5-pro', 'Gemini 1.5 Pro',
 '{"input_per_1m_tokens": 1.25, "output_per_1m_tokens": 5.00}',
 '{"text-generation", "reasoning", "multimodal", "code-generation", "system-instructions"}',
 2097152, 8192, true, false,
 'Complex reasoning tasks requiring more intelligence'),

-- Gemma Models
('gemma-2-9b-it', 'gemini', 'gemma-2-9b-it', 'Gemma 2 (9B) Instruct',
 '{"input_per_1m_tokens": 0.05, "output_per_1m_tokens": 0.05}',
 '{"text-generation", "instruction-following", "chat"}',
 8192, 8192, true, true,
 'Lightweight, state-of-the-art open model built by Google DeepMind'),

('gemma-2-27b-it', 'gemini', 'gemma-2-27b-it', 'Gemma 2 (27B) Instruct',
 '{"input_per_1m_tokens": 0.05, "output_per_1m_tokens": 0.05}',
 '{"text-generation", "instruction-following", "chat", "reasoning"}',
 8192, 8192, true, false,
 'Larger Gemma model with enhanced reasoning capabilities'),

('gemma-2-2b-it', 'gemini', 'gemma-2-2b-it', 'Gemma 2 (2B) Instruct',
 '{"input_per_1m_tokens": 0.05, "output_per_1m_tokens": 0.05}',
 '{"text-generation", "instruction-following"}',
 8192, 8192, true, false,
 'Ultra-lightweight model for basic text generation tasks')

ON CONFLICT (id) DO NOTHING;