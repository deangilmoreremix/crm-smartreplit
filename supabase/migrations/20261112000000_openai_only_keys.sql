-- OpenAI-only AI stack. Non-destructive: no columns are dropped or rewritten.
-- Gemini key storage is deprecated and no longer read or written by the application.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'user_api_keys' AND column_name = 'gemini_api_key') THEN
    COMMENT ON COLUMN public.user_api_keys.gemini_api_key IS 'deprecated: OpenAI-only stack';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'user_api_keys' AND column_name = 'gemini_model') THEN
    COMMENT ON COLUMN public.user_api_keys.gemini_model IS 'deprecated: OpenAI-only stack';
  END IF;
END $$;
