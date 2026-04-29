-- =====================================================
-- YEARLY USERS
-- These users are tracked but receive no access right now
-- =====================================================

insert into public.user_entitlements
(email, package, openclaw_enabled, admin_enabled, source, notes)
values
('stevebarrett.ceo@gmail.com', 'no_access', false, false, 'Smart CRM Yearly', 'Steven Barrett - Yearly buyer - no access during yearly run'),
('beam42@gmail.com', 'no_access', false, false, 'Smart CRM Yearly', 'Robert Lazor - Yearly buyer - no access during yearly run'),
('appwebtisingsolutions@gmail.com', 'no_access', false, false, 'Smart CRM Yearly', 'Garry Lewis - Yearly buyer - no access during yearly run'),
('nikolauswihlidal@gmail.com', 'no_access', false, false, 'Smart CRM Yearly', 'Nikolaus Wihlidal - Yearly buyer - no access during yearly run')
on conflict (email) do update set
  package = case
    -- Never downgrade Super Admin
    when public.user_entitlements.package = 'super_admin' then 'super_admin'::smartcrm_package

    -- Never downgrade Whitelabel
    when public.user_entitlements.package = 'whitelabel' then 'whitelabel'::smartcrm_package

    else 'no_access'::smartcrm_package
  end,
  openclaw_enabled = false,
  admin_enabled = false,
  source = excluded.source,
  notes = excluded.notes,
  updated_at = now();