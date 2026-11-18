-- Allow per-user OpenClaw settings in user_api_keys.
-- user_api_keys is one row per (user_id, provider); OpenClaw is stored as provider = 'openclaw'
-- with api_key = the OpenClaw key and metadata->>'base_url' = optional self-hosted URL.
-- The existing provider list matches the live constraint as of 2026-11-04, plus 'openclaw'.

ALTER TABLE public.user_api_keys DROP CONSTRAINT IF EXISTS user_api_keys_provider_check;

ALTER TABLE public.user_api_keys
  ADD CONSTRAINT user_api_keys_provider_check CHECK (
    (provider)::text = ANY (ARRAY[
      'openai', 'anthropic', 'gemini', 'elevenlabs', 'cohere', 'together', 'xai', 'google',
      'aws', 'azure', 'github', 'slack', 'notion', 'youtube', 'gmail', 'custom', 'openclaw'
    ]::text[])
  );
