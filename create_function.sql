create or replace function public.user_has_feature(
  input_email text,
  input_feature_key text
)
returns boolean
language sql
security definer
as $$
  select exists (
    select 1
    from public.user_entitlements ue
    left join public.package_features pf
      on pf.package = ue.package
    where lower(ue.email) = lower(input_email)
      and ue.package != 'no_access'
      and (
        ue.package = 'super_admin'
        or pf.feature_key = '*'
        or pf.feature_key = input_feature_key
        or (
          input_feature_key = 'openclaw'
          and ue.openclaw_enabled = true
        )
        or (
          input_feature_key in ('admin_panel', 'feature_management', 'user_management')
          and ue.admin_enabled = true
        )
      )
  );
$$;