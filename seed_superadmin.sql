-- =====================================================
-- SUPER ADMIN
-- Replace with your real login email
-- =====================================================

insert into public.user_entitlements
(email, package, openclaw_enabled, admin_enabled, source, notes)
values
('dean@smartcrm.vip', 'super_admin', true, true, 'Internal Admin', 'Super admin account')
on conflict (email) do update set
  package = 'super_admin'::smartcrm_package,
  openclaw_enabled = true,
  admin_enabled = true,
  source = 'Internal Admin',
  notes = 'Super admin account',
  updated_at = now();