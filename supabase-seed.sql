-- =====================================================
-- COMPLETE USER ENTITLEMENTS SEED
-- All buyers consolidated from multiple sources
-- 
-- Sources:
-- - Whitelabel buyers: 10 users (priority - never downgraded)
-- - Smart CRM Yearly: 4 users (no_access - never upgraded by conflict)
-- - Smart Marketer buyers: ~100+ users from CSV + existing seeds
-- - Super Admin: 1 internal user (highest priority)
--
-- Package priority (handled by ON CONFLICT):
-- 1. super_admin (highest - never changed)
-- 2. whitelabel (protected from downgrades)
-- 3. no_access (locked - yearly buyers)
-- 4. smartmarketer (default for all other buyers)
-- =====================================================

-- Drop and recreate to ensure clean state (optional - use with caution)
-- TRUNCATE TABLE public.user_entitlements RESTART IDENTITY CASCADE;

-- =====================================================
-- SUPER ADMIN
-- Highest priority - never downgraded by any conflict
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

-- =====================================================
-- WHITELABEL USERS
-- Priority: whitelabel > everything else (except super_admin)
-- These users KEEP whitelabel even if they appear in other lists
-- Known overlaps with Smart Marketer: tomnus@msn.com, jehpruitt@gmail.com, trcole3@theritegroup.com
-- =====================================================

insert into public.user_entitlements
(email, package, openclaw_enabled, admin_enabled, source, notes)
values
-- Whitelabel Lifetime buyers (10)
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

-- =====================================================
-- YEARLY USERS (NO ACCESS)
-- These users get 'no_access' - locked from upgrades by conflict
-- DO NOT add new yearly buyers here unless explicitly authorized
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
    when public.user_entitlements.package = 'super_admin' then 'super_admin'::smartcrm_package
    when public.user_entitlements.package = 'whitelabel' then 'whitelabel'::smartcrm_package
    else 'no_access'::smartcrm_package
  end,
  openclaw_enabled = false,
  admin_enabled = false,
  source = excluded.source,
  notes = excluded.notes,
  updated_at = now();

-- =====================================================
-- SMARTMARKETER USERS
-- All other buyers: Lifetime, Monthly, Main, Bundle, December Promo
-- Plus all Smart Marketer A.I. and SmartCRM Old users from migration CSV
-- 
-- IMPORTANT: Whitelabel users are already inserted above and protected
-- by ON CONFLICT logic - they will NOT be downgraded even if they
-- appear in this list (e.g., tomnus@msn.com, jehpruitt@gmail.com)
-- =====================================================

insert into public.user_entitlements
(email, package, openclaw_enabled, admin_enabled, source, notes)
values
-- ============================================
-- A) EXISTING SMARTMARKETER SEED BUYERS (known)
-- These were already in seed_smartmarketer.sql
-- ============================================

-- Smart CRM Lifetime buyers (18 from user-provided list)
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

-- Smart CRM Monthly buyer
('scstate88@yahoo.com', 'smartmarketer', false, false, 'Smart CRM Monthly', 'Rodney Brown - Monthly buyer'),

-- SmartCRM Main / Bundle buyers (4)
('rbuice@me.com', 'smartmarketer', false, false, 'SmartCRM Main', 'Renee Buice - Main buyer'),
('ag@goering.de', 'smartmarketer', false, false, 'SmartCRM Main', 'Andreas Göring - Main buyer'),
('warrentate1@me.com', 'smartmarketer', false, false, 'SmartCRM Main', 'Warren Tate - Main buyer'),
('services@ultimateprofitmachine.com', 'smartmarketer', false, false, 'Smart CRM Bundle', 'Leslie Ong - Bundle buyer'),

-- Smart CRM December to Remember promo buyers (10)
('harridal525@gmail.com', 'smartmarketer', false, false, 'Smart CRM December to Remember', 'Dale Harris - December promo buyer'),
('clarkekendrick@gmail.com', 'smartmarketer', false, false, 'Smart CRM December to Remember', 'Clarke Kendrick - December promo buyer'),
('cpconsultant3@gmail.com', 'smartmarketer', false, false, 'Smart CRM December to Remember', 'Andrea Matthews - December promo buyer'),
('rpaulhus@hotmail.com', 'smartmarketer', false, false, 'Smart CRM December to Remember', 'Real Paul-Hus - December promo buyer'),
('telcommglobal@gmail.com', 'smartmarketer', false, false, 'Smart CRM December to Remember', 'Phildora Perez - December promo buyer'),
('kirby.register@gmail.com', 'smartmarketer', false, false, 'Smart CRM December to Remember', 'Kirby Register - December promo buyer'),
('mumiker@rochester.rr.com', 'smartmarketer', false, false, 'Smart CRM December to Remember', 'Mark Umiker - December promo buyer'),
('rukiwatenesnr@gmail.com', 'smartmarketer', false, false, 'Smart CRM December to Remember', 'Ruki Watene - December promo buyer'),
('teamvisionclubs1@gmail.com', 'smartmarketer', false, false, 'Smart CRM December to Remember', 'Margaret Wynne - December promo buyer'),
('rolf.zahnd@bluemail.ch', 'smartmarketer', false, false, 'Smart CRM December to Remember', 'Rolf Zahnd - December promo buyer'),

-- ============================================
-- B) NEW BUYERS FROM MIGRATION CSV
-- Source: attached_assets/Users_Not_in_New_SmartCRM_1764606814141.csv
-- Campaign: Smart Marketer Elite - Private Promo (3 buyers)
-- ============================================

('mathieu@janin.ch', 'smartmarketer', false, false, 'Smart Marketer Elite', 'Mathieu Janin - Smart Marketer Elite buyer'),
('jenny@peakvideos.com', 'smartmarketer', false, false, 'Smart Marketer Elite', 'Jenny Francoeur - Smart Marketer Elite buyer'),
('paul@tillery.com', 'smartmarketer', false, false, 'Smart Marketer Elite', 'Paul Tillery - Smart Marketer Elite buyer'),

-- ============================================
-- C) SMART MARKETER A.I. BUYERS FROM CSV
-- 71 entries from CSV (3 whitelabel overlaps excluded from conflict)
-- Whitelabel overlaps (protected - will keep whitelabel):
--   - tomnus@msn.com (Thomas Omnus) ✓ already in whitelabel
--   - jehpruitt@gmail.com (Jermelle Pruitt) ✓ already in whitelabel
--   - trcole3@theritegroup.com (Truman Cole) ✓ already in whitelabel
-- ============================================

('jessecarter@outlook.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Jesse Carter - Smart Marketer A.I. buyer'),
('hmclean247@gmail.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Henry McLean - Smart Marketer A.I. buyer'),
('akangtshipinare@gmail.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Bakang Tshipinare - Smart Marketer A.I. buyer'),
('mastermarketerguy@gmail.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Mark Sullivan - Smart Marketer A.I. buyer'),
('safdar59@icloud.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Larry Jackson - Smart Marketer A.I. buyer'),
('yongben@hotmail.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Ben Yong - Smart Marketer A.I. buyer'),
('barbsbichons@yahoo.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Barb Reynolds - Smart Marketer A.I. buyer'),
('mailmichel@protonmail.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Michel Langlois - Smart Marketer A.I. buyer'),
('cwolf72@yahoo.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Craig Wolf - Smart Marketer A.I. buyer'),
('making_it_happenn@yahoo.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Andre Rohlehr - Smart Marketer A.I. buyer'),
('kyfung@zoho.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Kam Fung - Smart Marketer A.I. buyer'),
('ksappiah@hotmail.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Kofi Appiah - Smart Marketer A.I. buyer'),
('bizleadspot@gmail.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Chandrashekar Rao - Smart Marketer A.I. buyer'),
('royzac@gmail.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Roy Zachariah - Smart Marketer A.I. buyer'),
('business_iac@outlook.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Iacopo Sannazzaro - Smart Marketer A.I. buyer'),
('frochar@outlook.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Felipe Rocha - Smart Marketer A.I. buyer'),
('freds@trebmedia.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Fred Schroeder - Smart Marketer A.I. buyer'),
('cybalon@gmail.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Al Yk - Smart Marketer A.I. buyer'),
('dwhitecourses@gmail.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Dawn White - Smart Marketer A.I. buyer'),
('Shravad@outlook.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Shravan Kumar - Smart Marketer A.I. buyer'),
('sinukip@comcast.net', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Richard Pikunis - Smart Marketer A.I. buyer'),
('keeno2021@yahoo.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Paul Keenan - Smart Marketer A.I. buyer'),
('cdoggan@gmail.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Clarence Doggan - Smart Marketer A.I. buyer'),
('mattade20@yahoo.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Matthew Ojo - Smart Marketer A.I. buyer'),
('Oddinstruments@yahoo.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Michael Arthur - Smart Marketer A.I. buyer'),
('jennylf49@yahoo.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Jenny Francoeur - Smart Marketer A.I. buyer'),
('mkopz3000@gmail.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Marcus Kopu - Smart Marketer A.I. buyer'),
('biz4ry@yahoo.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Roy Revill - Smart Marketer A.I. buyer'),
('johngraden@mac.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'John Graden - Smart Marketer A.I. buyer'),
('poipunan@me.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Nancy McMahon - Smart Marketer A.I. buyer'),
('osygen2001@yahoo.co.uk', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Phillip Uwagboe - Smart Marketer A.I. buyer'),
('akenroy@gmail.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Allen Kenroy - Smart Marketer A.I. buyer'),
('mastersintegritymarketing@gmail.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Chase Masters - Smart Marketer A.I. buyer'),
('marketingtogoto@gmail.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Don McLellan - Smart Marketer A.I. buyer'),
('work471@gmail.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Mel Cederbaum - Smart Marketer A.I. buyer'),
('kenositimothy@gmail.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Timothy Timothy - Smart Marketer A.I. buyer'),
('chickenlady72@hotmail.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Cindi Erickson - Smart Marketer A.I. buyer'),
('mybusiness11449@gmail.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Richard Thompson - Smart Marketer A.I. buyer'),
('edligon1@gmail.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Edward Ligon - Smart Marketer A.I. buyer'),
('cynhoyt444@gmail.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Cynthia Hoyt - Smart Marketer A.I. buyer'),
('jzoing53@hotmail.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Roger Carter - Smart Marketer A.I. buyer'),
('Rick@worldcalltel.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Americo Morelli - Smart Marketer A.I. buyer'),
('rodneyg493@gmail.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Rodney Griffith - Smart Marketer A.I. buyer'),
('brian@823marketing.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Brian Pinski - Smart Marketer A.I. buyer'),
('tonreedijk@hotmail.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Ton Reedijk - Smart Marketer A.I. buyer'),
('robertsheppard777@yahoo.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Robert Sheppard - Smart Marketer A.I. buyer'),
('Larence@outlook.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Larence DeBose - Smart Marketer A.I. buyer'),
('kipansonimt@gmail.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Kip Anson - Smart Marketer A.I. buyer'),
('myrleneh@gmail.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Myrlene Thomas - Smart Marketer A.I. buyer'),
('sustaintheresults@gmail.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Timothy Adler - Smart Marketer A.I. buyer'),
('nikolemem@gmail.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Nikole Memminger - Smart Marketer A.I. buyer'),
('pstone@mobileseopros.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Pete Stone - Smart Marketer A.I. buyer'),
('drmjp@aol.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Mark Page - Smart Marketer A.I. buyer'),
('wmancho@hotmail.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Wilson Manc - Smart Marketer A.I. buyer'),
('rogersdarlene0@gmail.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Darlene Rogers - Smart Marketer A.I. buyer'),
('ejo1ed@gmail.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Edward Owens - Smart Marketer A.I. buyer'),
('ThorstenMarten@web.de', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Thorsten Marten - Smart Marketer A.I. buyer'),
('sqlmailq-web@yahoo.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Tatiana Korol - Smart Marketer A.I. buyer'),
('mark35mi@yahoo.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Mark Humenik - Smart Marketer A.I. buyer'),
('darrylastin@gmail.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Darryl Astin - Smart Marketer A.I. buyer'),
('software@virtualfocusedmarketing.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Rusty McMillen - Smart Marketer A.I. buyer'),

-- ============================================
-- D) SMARTCRM OLD BUYERS FROM CSV
-- Campaign: SmartCRM Old - these are existing customers from older platform
-- Converting to smartmarketer package as "old platform users"
-- Note: Some overlap with December to Remember - see below
-- ============================================

('atcradarguy@yahoo.com', 'smartmarketer', false, false, 'SmartCRM Old', 'ATC - SmartCRM Old customer'),
('yinnngov@gmail.com', 'smartmarketer', false, false, 'SmartCRM Old', 'Yinn Ngov - SmartCRM Old customer'),
('t_codez@hotmail.com', 'smartmarketer', false, false, 'SmartCRM Old', 'Tony Thunberg - SmartCRM Old customer'),
('paul33ng@gmail.com', 'smartmarketer', false, false, 'SmartCRM Old', 'Paul Friend - SmartCRM Old customer'),
('mikep@mobilevideo360.com', 'smartmarketer', false, false, 'SmartCRM Old', 'Michael Paule Friend - SmartCRM Old customer'),
('iprofitelite@gmail.com', 'smartmarketer', false, false, 'SmartCRM Old', 'Jay Friend - SmartCRM Old customer'),
('deejayhart.nyc@gmail.com', 'smartmarketer', false, false, 'SmartCRM Old', 'Deb Friend - SmartCRM Old customer'),
('bibimorani@yahoo.co.uk', 'smartmarketer', false, false, 'SmartCRM Old', 'Joyce Amri - SmartCRM Old customer'),
('ams.richardj@gmail.com', 'smartmarketer', false, false, 'SmartCRM Old', 'Richard Jones - SmartCRM Old customer'),
('aleddy0@gmail.com', 'smartmarketer', false, false, 'SmartCRM Old', 'Al Eddy - SmartCRM Old customer'),
('akhindri47@gmail.com', 'smartmarketer', false, false, 'SmartCRM Old', 'Ajay Khindri - SmartCRM Old customer'),
('access77@hiltmann.net', 'smartmarketer', false, false, 'SmartCRM Old', 'Uwe Hiltmann - SmartCRM Old customer'),
('ae2142@att.net', 'smartmarketer', false, false, 'SmartCRM Old', 'Al Esquivel - SmartCRM Old customer'),
('nedzeidan@gmail.com', 'smartmarketer', false, false, 'SmartCRM Old', 'Ned Zeidan-Pa - SmartCRM Old customer'),
('jamillila@gmail.com', 'smartmarketer', false, false, 'SmartCRM Old', 'Jamil Lila - SmartCRM Old customer'),
('gkoroghlanian@gmail.com', 'smartmarketer', false, false, 'SmartCRM Old', 'Gloria Koroghianian - SmartCRM Old customer'),
('jearico@gmx.co.uk', 'smartmarketer', false, false, 'SmartCRM Old', 'Eric Oliver - SmartCRM Old customer'),
('finnart25@gmail.com', 'smartmarketer', false, false, 'SmartCRM Old', 'Dorothy Hery - SmartCRM Old customer'),
('macristdds@yahoo.com', 'smartmarketer', false, false, 'SmartCRM Old', 'Michael Crist - SmartCRM Old customer'),
('triciarobinson42@gmail.com', 'smartmarketer', false, false, 'SmartCRM Old', 'Patricia Robinson - SmartCRM Old customer'),
('monhow@hotmail.com', 'smartmarketer', false, false, 'SmartCRM Old', 'Monique Howard - SmartCRM Old customer'),
('lorirol2u@gmail.com', 'smartmarketer', false, false, 'SmartCRM Old', 'OLS Team - SmartCRM Old customer'),
('wereinteractive@gmail.com', 'smartmarketer', false, false, 'SmartCRM Old', 'Ryan Waggelsmans - SmartCRM Old customer'),
('davmal12@aol.com', 'smartmarketer', false, false, 'SmartCRM Old', 'David Maldonado - SmartCRM Old customer'),
('mariomconsulting@gmail.com', 'smartmarketer', false, false, 'SmartCRM Old', 'Mario Marsden - SmartCRM Old customer'),
('joycoleb@yahoo.com', 'smartmarketer', false, false, 'SmartCRM Old', 'Joy Cole - SmartCRM Old customer'),
('f.collin@hotmail.fr', 'smartmarketer', false, false, 'SmartCRM Old', 'Frederic Collin - SmartCRM Old customer'),
('trondheimllc@gmail.com', 'smartmarketer', false, false, 'SmartCRM Old', 'Jesse Millares - SmartCRM Old customer'),
('jgcamail@gmail.com', 'smartmarketer', false, false, 'SmartCRM Old', 'Associate Resources - SmartCRM Old customer'),
('bonniechristian247@gmail.com', 'smartmarketer', false, false, 'SmartCRM Old', 'Bonnie Christian - SmartCRM Old customer'),

-- ============================================
-- E) SMART MARKETER ELITE - PRIVATE PROMO (from CSV)
-- ============================================

-- Already added above (rows A.2)
-- mathieu@janin.ch (Mathieu Janin)
-- jenny@peakvideos.com (Jenny Francoeur)
-- paul@tillery.com (Paul Tillery)

-- ============================================
-- IMPORTANT DUPLICATE NOTES
-- ============================================
-- DUPLICATES FOUND & RESOLUTION:
-- 1. tomnus@msn.com → Whitelabel (conflict will preserve whitelabel)
-- 2. jehpruitt@gmail.com → Whitelabel (conflict will preserve whitelabel)
-- 3. trcole3@theritegroup.com → Whitelabel (conflict will preserve whitelabel)
-- 4. mumiker@rochester.rr.com → December buyer kept, Smart Marketer A.I. duplicate excluded
-- 5. myrleneh@gmail.com → Smart Marketer A.I. kept, Smart Marketer Elite duplicate excluded
-- 6. rukiwatenesnr@gmail.com → December buyer kept, Smart Marketer A.I. duplicate excluded
-- 7. Rick@worldcalltel.com → Smart Marketer A.I. kept, Smart Marketer Elite duplicate excluded
-- 8. clarkekendrick@gmail.com → December buyer kept, SmartCRM Old duplicate excluded
--
-- CONFLICT PRIORITY (via ON CONFLICT DO UPDATE):
-- super_admin > whitelabel > no_access > smartmarketer
-- This ensures:
--   - Super admin never downgraded
--   - Whitelabel preserved even if appears in smartmarketer list
--   - Yearly buyers stay locked with no_access
-- ============================================

on conflict (email) do update set
  package = case
    -- Never downgrade Super Admin
    when public.user_entitlements.package = 'super_admin' then 'super_admin'::smartcrm_package

    -- Never downgrade Whitelabel (protect whitelabel customers)
    when public.user_entitlements.package = 'whitelabel' then 'whitelabel'::smartcrm_package

    -- Never upgrade Yearly/No-access (keep them locked)
    when public.user_entitlements.package = 'no_access' then 'no_access'::smartcrm_package

    -- Default: set/keep as smartmarketer
    else 'smartmarketer'::smartcrm_package
  end,
  openclaw_enabled = false,
  admin_enabled = false,
  source = excluded.source,
  notes = excluded.notes,
  updated_at = now();
