-- =====================================================
-- SMARTMARKETER USERS
-- Lifetime, Monthly, Main, Bundle, December Promo
-- No yearly users included here
-- Duplicates with whitelabel stay whitelabel
-- =====================================================

insert into public.user_entitlements
(email, package, openclaw_enabled, admin_enabled, source, notes)
values
-- Lifetime buyers
('thomaspublications@gmail.com', 'smartmarketer', false, false, 'Smart CRM Lifetime', 'Tom Bodner - Lifetime buyer'),
('kennethlcarter1@gmail.com', 'smartmarketer', false, false, 'Smart CRM Lifetime', 'Kenneth Carter - Lifetime buyer'),
('russ.critendon@gmail.com', 'smartmarketer', false, false, 'Smart CRM Lifetime', 'Russ Critendon - Lifetime buyer'),
('drgomberg@gmail.com', 'smartmarketer', false, false, 'Smart CRM Lifetime', 'Lloyd Gomberg - Lifetime buyer'),
('tom@amazingsalesteam.com', 'smartmarketer', false, false, 'Smart CRM Lifetime', 'Thomas Gordon - Lifetime buyer'),
('jjharrison1@yahoo.com', 'smartmarketer', false, false, 'Smart CRM Lifetime', 'Jeffery Harrison - Lifetime buyer'),
('marion.hundemer@gmail.com', 'smartmarketer', false, false, 'Smart CRM Lifetime', 'Marion Hundemer - Lifetime buyer'),
('jennifer@marshallwrites.com', 'smartmarketer', false, false, 'Smart CRM Lifetime', 'Jennifer Marshall - Lifetime buyer'),
('jrmunns@pm.me', 'smartmarketer', false, false, 'Smart CRM Lifetime', 'John Munns - Lifetime buyer'),
('sunita.s.pandit@gmail.com', 'smartmarketer', false, false, 'Smart CRM Lifetime', 'Sunita Pandit - Lifetime buyer'),
('k.rascop@comcast.net', 'smartmarketer', false, false, 'Smart CRM Lifetime', 'Kevin M Rascop - Lifetime buyer'),
('simonr4@aol.com', 'smartmarketer', false, false, 'Smart CRM Lifetime', 'Simon Rosenberg - Lifetime buyer'),
('kasapp52@yahoo.com', 'smartmarketer', false, false, 'Smart CRM Lifetime', 'Kenneth Sapp - Lifetime buyer'),
('otherted@gmail.com', 'smartmarketer', false, false, 'Smart CRM Lifetime', 'Ted Sillings - Lifetime buyer'),
('darkstyle@msn.com', 'smartmarketer', false, false, 'Smart CRM Lifetime', 'Curtis Thomas - Lifetime buyer'),
('w_a_wagner@hotmail.com', 'smartmarketer', false, false, 'Smart CRM Lifetime', 'William Wagner - Lifetime buyer'),

-- Monthly buyer
('scstate88@yahoo.com', 'smartmarketer', false, false, 'Smart CRM Monthly', 'Rodney Brown - Monthly buyer'),

-- Main / Bundle buyers
('rbuice@me.com', 'smartmarketer', false, false, 'SmartCRM Main', 'Renee Buice - Main buyer'),
('ag@goering.de', 'smartmarketer', false, false, 'SmartCRM Main', 'Andreas Göring - Main buyer'),
('warrentate1@me.com', 'smartmarketer', false, false, 'SmartCRM Main', 'Warren Tate - Main buyer'),
('services@ultimateprofitmachine.com', 'smartmarketer', false, false, 'Smart CRM Bundle', 'Leslie Ong - Bundle buyer'),

-- December to Remember promo buyers
('harridal525@gmail.com', 'smartmarketer', false, false, 'Smart CRM December to Remember', 'Dale Harris - December promo buyer'),
('clarkekendrick@gmail.com', 'smartmarketer', false, false, 'Smart CRM December to Remember', 'Clarke Kendrick - December promo buyer'),
('cpconsultant3@gmail.com', 'smartmarketer', false, false, 'Smart CRM December to Remember', 'Andrea Matthews - December promo buyer'),
('rpaulhus@hotmail.com', 'smartmarketer', false, false, 'Smart CRM December to Remember', 'Real Paul-Hus - December promo buyer'),
('telcommglobal@gmail.com', 'smartmarketer', false, false, 'Smart CRM December to Remember', 'Phildora Perez - December promo buyer'),
('kirby.register@gmail.com', 'smartmarketer', false, false, 'Smart CRM December to Remember', 'Kirby Register - December promo buyer'),
('mumiker@rochester.rr.com', 'smartmarketer', false, false, 'Smart CRM December to Remember', 'Mark Umiker - December promo buyer'),
('rukiwatenesnr@gmail.com', 'smartmarketer', false, false, 'Smart CRM December to Remember', 'Ruki Watene - December promo buyer'),
('teamvisionclubs1@gmail.com', 'smartmarketer', false, false, 'Smart CRM December to Remember', 'Margaret Wynne - December promo buyer'),
('rolf.zahnd@bluemail.ch', 'smartmarketer', false, false, 'Smart CRM December to Remember', 'Rolf Zahnd - December promo buyer')
on conflict (email) do update set
  package = case
    -- Never downgrade Super Admin
    when public.user_entitlements.package = 'super_admin' then 'super_admin'::smartcrm_package

    -- Never downgrade Whitelabel
    when public.user_entitlements.package = 'whitelabel' then 'whitelabel'::smartcrm_package

    -- Keep yearly/no_access locked unless you manually change them
    when public.user_entitlements.package = 'no_access' then 'no_access'::smartcrm_package

    else 'smartmarketer'::smartcrm_package
  end,
  openclaw_enabled = false,
  admin_enabled = false,
  source = excluded.source,
  notes = excluded.notes,
  updated_at = now();