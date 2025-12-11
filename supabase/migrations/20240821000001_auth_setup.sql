
-- Enable RLS (Row Level Security)
alter table auth.users enable row level security;

-- Create profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text,
  website text,
  
  constraint username_length check (char_length(username) >= 3)
);

-- Set up Row Level Security (RLS)
alter table public.profiles enable row level security;

-- Create policy to allow users to view their own profile
create policy "Users can view own profile." 
  on profiles for select 
  using (auth.uid() = id);

-- Create policy to allow users to update their own profile
create policy "Users can update own profile." 
  on profiles for update 
  using (auth.uid() = id);

-- Create policy to allow users to insert their own profile
create policy "Users can insert own profile." 
  on profiles for insert 
  with check (auth.uid() = id);

-- Create function to handle new user registration
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger to automatically create profile on user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create contacts table for CRM functionality
create table public.contacts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  company text,
  position text,
  avatar text,
  status text default 'active',
  tags text[],
  notes text,
  score integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on contacts
alter table public.contacts enable row level security;

-- Create RLS policies for contacts
create policy "Users can view own contacts." 
  on contacts for select 
  using (auth.uid() = user_id);

create policy "Users can insert own contacts." 
  on contacts for insert 
  with check (auth.uid() = user_id);

create policy "Users can update own contacts." 
  on contacts for update 
  using (auth.uid() = user_id);

create policy "Users can delete own contacts." 
  on contacts for delete 
  using (auth.uid() = user_id);

-- Create deals table
create table public.deals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete cascade,
  title text not null,
  amount decimal(15,2),
  currency text default 'USD',
  stage text default 'prospecting',
  probability integer default 0,
  expected_close_date date,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on deals
alter table public.deals enable row level security;

-- Create RLS policies for deals
create policy "Users can view own deals." 
  on deals for select 
  using (auth.uid() = user_id);

create policy "Users can insert own deals." 
  on deals for insert 
  with check (auth.uid() = user_id);

create policy "Users can update own deals." 
  on deals for update 
  using (auth.uid() = user_id);

create policy "Users can delete own deals." 
  on deals for delete 
  using (auth.uid() = user_id);

-- Create tasks table
create table public.tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  deal_id uuid references public.deals(id) on delete set null,
  title text not null,
  description text,
  type text default 'task',
  status text default 'pending',
  priority text default 'medium',
  due_date timestamp with time zone,
  completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on tasks
alter table public.tasks enable row level security;

-- Create RLS policies for tasks
create policy "Users can view own tasks." 
  on tasks for select 
  using (auth.uid() = user_id);

create policy "Users can insert own tasks." 
  on tasks for insert 
  with check (auth.uid() = user_id);

create policy "Users can update own tasks." 
  on tasks for update 
  using (auth.uid() = user_id);

create policy "Users can delete own tasks." 
  on tasks for delete 
  using (auth.uid() = user_id);
