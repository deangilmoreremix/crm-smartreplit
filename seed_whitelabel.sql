-- =====================================================
-- WHITELABEL USERS
-- These users keep whitelabel even if duplicated elsewhere
-- =====================================================

insert into public.user_entitlements
(email, package, openclaw_enabled, admin_enabled, source, notes)
values
('fredrik.kaada@gmail.com', 'whitelabel', false, false, 'Smart CRM Whitelabel Lifetime', 'Fredrik Asche Kaada - Whitelabel lifetime buyer'),
('bayonnca@yahoo.com', 'whitelabel', false, false, 'Smart CRM Whitelabel Lifetime', 'Carolyn Bayonne - Whitelabel lifetime buyer'),
('trcole3@theritegroup.com', 'whitelabel', false, false, 'Smart CRM Whitelabel Lifetime', 'Truman Cole - Whitelabel lifetime buyer'),
('charles@charlesedge.net', 'whitelabel', false, false, 'Smart CRM Whitelabel Lifetime', 'Charles Edgerton - Whitelabel lifetime buyer'),
('james.otto.gray@gmail.com', 'whitelabel', false, false, 'Smart CRM Whitelabel Lifetime', 'James Gray - Whitelabel lifetime buyer'),
('tomnus@msn.com', 'whitelabel', false, false, 'Smart CRM Whitelabel Lifetime', 'Thomas Omnus - Whitelabel lifetime buyer'),
('jehpruitt@gmail.com', 'whitelabel', false, false, 'Smart CRM Whitelabel Lifetime', 'Jermelle Pruitt - Whitelabel lifetime buyer'),
('rinslr@earthlink.net', 'whitelabel', false, false, 'Smart CRM Whitelabel Lifetime', 'William Roberts - Whitelabel lifetime buyer'),
('jwnet2044@yahoo.com', 'whitelabel', false, false, 'Smart CRM Whitelabel Lifetime', 'Joseph Steffey - Whitelabel lifetime buyer'),
('rthompson98@yahoo.com', 'whitelabel', false, false, 'Smart CRM Whitelabel Lifetime', 'Rodney Thompson - Whitelabel lifetime buyer')
on conflict (email) do update set
  package = case
    when public.user_entitlements.package = 'super_admin' then 'super_admin'::smartcrm_package
    else 'whitelabel'::smartcrm_package
  end,
  openclaw_enabled = false,
  admin_enabled = false,
  source = excluded.source,
  notes = excluded.notes,
  updated_at = now();