-- Create user_api_keys table for secure API key storage
create table if not exists user_api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users not null,
  openai_api_key text,
  gemini_api_key text,
  openai_model text default 'gpt-4o-mini',
  gemini_model text default 'gemini-1.5-flash',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique (user_id)
);

-- Enable RLS
alter table user_api_keys enable row level security;

-- Create policy: Users can view their own API keys
create policy if not exists "Users can view their own API keys"
  on user_api_keys for select
  using (auth.uid() = user_id);

-- Create policy: Users can insert their own API keys
create policy if not exists "Users can insert their own API keys"
  on user_api_keys for insert
  with check (auth.uid() = user_id);

-- Create policy: Users can update their own API keys
create policy if not exists "Users can update their own API keys"
  on user_api_keys for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Create policy: Users can delete their own API keys
create policy if not exists "Users can delete their own API keys"
  on user_api_keys for delete
  using (auth.uid() = user_id);

-- Create trigger function for updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language 'plpgsql';

-- Create trigger
drop trigger if exists update_user_api_keys_updated_at on user_api_keys;
create trigger update_user_api_keys_updated_at
  before update on user_api_keys
  for each row execute procedure update_updated_at_column();