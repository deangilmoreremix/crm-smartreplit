do $$
begin
  if not exists (select 1 from pg_type where typname = 'smartcrm_package') then
    create type smartcrm_package as enum (
      'no_access',
      'regular',
      'smartmarketer',
      'whitelabel',
      'super_admin'
    );
  end if;
end $$;

alter type smartcrm_package add value if not exists 'no_access';

create table if not exists public.user_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,

  email text unique not null,
  package smartcrm_package not null default 'regular',

  openclaw_enabled boolean not null default false,
  admin_enabled boolean not null default false,

  source text,
  notes text,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.package_features (
  id uuid primary key default gen_random_uuid(),
  package smartcrm_package not null,
  feature_key text not null,
  enabled boolean not null default true,
  created_at timestamptz default now(),

  unique(package, feature_key)
);

create index if not exists idx_user_entitlements_email
on public.user_entitlements(lower(email));

create index if not exists idx_user_entitlements_user_id
on public.user_entitlements(user_id);

create index if not exists idx_package_features_package
on public.package_features(package);