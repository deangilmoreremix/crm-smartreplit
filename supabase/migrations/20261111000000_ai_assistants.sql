-- AI assistants on the OpenAI Responses API (replaces the sunset Assistants API).
-- assistant = saved config; thread = chain of responses (previous_response_id); messages = history.

CREATE TABLE IF NOT EXISTS public.ai_assistants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  instructions TEXT NOT NULL DEFAULT '',
  model TEXT, -- tier name (fast|default|deep|max) or concrete model id; NULL = default tier
  tools JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_assistants_user ON public.ai_assistants(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.ai_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assistant_id UUID REFERENCES public.ai_assistants(id) ON DELETE CASCADE,
  last_response_id TEXT,
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_threads_user ON public.ai_threads(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_threads_assistant ON public.ai_threads(assistant_id);

CREATE TABLE IF NOT EXISTS public.ai_thread_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.ai_threads(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_thread_messages_thread
  ON public.ai_thread_messages(thread_id, created_at);

ALTER TABLE public.ai_assistants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_thread_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_assistants_owner_all ON public.ai_assistants;
CREATE POLICY ai_assistants_owner_all ON public.ai_assistants
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS ai_threads_owner_all ON public.ai_threads;
CREATE POLICY ai_threads_owner_all ON public.ai_threads
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Messages have no user_id; ownership comes from the parent thread.
DROP POLICY IF EXISTS ai_thread_messages_owner_all ON public.ai_thread_messages;
CREATE POLICY ai_thread_messages_owner_all ON public.ai_thread_messages
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.ai_threads t WHERE t.id = thread_id AND t.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.ai_threads t WHERE t.id = thread_id AND t.user_id = auth.uid()));
