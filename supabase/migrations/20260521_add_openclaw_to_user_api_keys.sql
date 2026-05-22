-- Migration: Add OpenClaw AI provider support to user_api_keys
-- This integrates OpenClaw into the unified AI API key management system

ALTER TABLE user_api_keys 
ADD COLUMN IF NOT EXISTS openclaw_api_key text,
ADD COLUMN IF NOT EXISTS openclaw_model text DEFAULT 'default',
ADD COLUMN IF NOT EXISTS openclaw_base_url text;

-- Add comment for documentation
COMMENT ON COLUMN user_api_keys.openclaw_api_key IS 'API key for OpenClaw CRM AI integration (per-user)';
COMMENT ON COLUMN user_api_keys.openclaw_model IS 'Model or configuration identifier for OpenClaw';
COMMENT ON COLUMN user_api_keys.openclaw_base_url IS 'Optional custom base URL for self-hosted OpenClaw instances';

-- No need to update RLS policies — existing policies are based on user_id and will automatically cover new columns
