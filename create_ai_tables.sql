-- Create ai_models table
create table if not exists public.ai_models (
  id text primary key,
  provider text not null check (provider in ('anthropic', 'gemini', 'mistral', 'openai', 'other')),
  model_name text not null,
  display_name text not null,
  endpoint_url text,
  pricing jsonb,
  capabilities text[] not null,
  context_window integer not null,
  max_tokens integer not null,
  is_active boolean not null default true,
  is_recommended boolean not null default false,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create ai_usage_logs table
create table if not exists public.ai_usage_logs (
  id uuid primary key default gen_random_uuid(),
  customer_id text,
  user_id text,
  model_id text not null,
  feature_used text not null,
  tokens_used integer not null,
  cost numeric not null,
  response_time_ms integer not null,
  success boolean not null default true,
  error_message text,
  created_at timestamptz default now()
);

-- Add indexes for performance
create index if not exists idx_ai_models_provider on public.ai_models(provider);
create index if not exists idx_ai_models_active on public.ai_models(is_active);
create index if not exists idx_ai_usage_logs_customer on public.ai_usage_logs(customer_id);
create index if not exists idx_ai_usage_logs_model on public.ai_usage_logs(model_id);
create index if not exists idx_ai_usage_logs_created on public.ai_usage_logs(created_at);

-- Insert fallback models as initial data
insert into public.ai_models (
  id, provider, model_name, display_name, pricing, capabilities, 
  context_window, max_tokens, is_active, is_recommended, description
) values
('gemini-2.5-flash', 'gemini', 'gemini-2.5-flash', 'Gemini 2.5 Flash', 
 '{"input_per_1m_tokens": 0.075, "output_per_1m_tokens": 0.3}', 
 ARRAY['text-generation', 'reasoning', 'code-generation'], 
 1000000, 8192, true, true, 'Fast and efficient model for most tasks'),
('gemini-2.5-flash-8b', 'gemini', 'gemini-2.5-flash-8b', 'Gemini 2.5 Flash 8B', 
 '{"input_per_1m_tokens": 0.0375, "output_per_1m_tokens": 0.15}', 
 ARRAY['text-generation', 'reasoning'], 
 1000000, 8192, true, false, 'Smaller, faster model for simple tasks'),
('gemma-2-2b-it', 'gemini', 'gemma-2-2b-it', 'Gemma 2 2B Instruct', 
 '{"input_per_1m_tokens": 0.035, "output_per_1m_tokens": 0.105}', 
 ARRAY['text-generation', 'instruction-following'], 
 8192, 4096, true, false, 'Lightweight model for basic tasks'),
('gemma-2-9b-it', 'gemini', 'gemma-2-9b-it', 'Gemma 2 9B Instruct', 
 '{"input_per_1m_tokens": 0.05, "output_per_1m_tokens": 0.15}', 
 ARRAY['text-generation', 'instruction-following', 'reasoning'], 
 8192, 4096, true, true, 'Mid-size model with good performance'),
('gemma-2-27b-it', 'gemini', 'gemma-2-27b-it', 'Gemma 2 27B Instruct', 
 '{"input_per_1m_tokens": 0.125, "output_per_1m_tokens": 0.375}', 
 ARRAY['text-generation', 'instruction-following', 'reasoning', 'complex-tasks'], 
 8192, 4096, true, false, 'Large model for complex tasks'),
('gpt-4o-mini', 'openai', 'gpt-4o-mini', 'GPT-4o Mini', 
 '{"input_per_1m_tokens": 0.15, "output_per_1m_tokens": 0.6}', 
 ARRAY['text-generation', 'reasoning', 'function-calling', 'code-generation'], 
 128000, 16384, true, true, 'Cost-effective GPT-4 level model'),
('gpt-3.5-turbo', 'openai', 'gpt-3.5-turbo', 'GPT-3.5 Turbo', 
 '{"input_per_1m_tokens": 0.5, "output_per_1m_tokens": 1.5}', 
 ARRAY['text-generation', 'function-calling'], 
 16385, 4096, true, false, 'Fast and affordable model')
on conflict (id) do update set
  pricing = excluded.pricing,
  capabilities = excluded.capabilities,
  context_window = excluded.context_window,
  max_tokens = excluded.max_tokens,
  is_active = excluded.is_active,
  is_recommended = excluded.is_recommended,
  description = excluded.description,
  updated_at = now();