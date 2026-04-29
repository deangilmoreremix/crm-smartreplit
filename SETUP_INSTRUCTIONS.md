# Complete Supabase Gating Setup

## Files Created

1. **`supabase-seed.sql`** - Complete SQL schema and seed data
2. **`scripts/apply-entitlements.js`** - Node.js script (if direct DB access works)
3. **`scripts/setup-gating.js`** - Alternative Supabase API method

## Due to network restrictions, please run this manually:

### Step 1: Open Supabase SQL Editor
Go to: https://bzxohkrxcwodllketcpz.supabase.co/project/bzxohkrxcwodllketcpz/sql

### Step 2: Copy & Execute

```sql
-- =====================================================
-- SMARTCRM COMPLETE PACKAGE GATING SYSTEM
-- =====================================================

-- Create enum type
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
  else
    alter type smartcrm_package add value if not exists 'no_access';
  end if;
end $$;

-- =====================================================
-- TABLES
-- =====================================================

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

create index if not exists idx_user_entitlements_email on public.user_entitlements(lower(email));
create index if not exists idx_user_entitlements_user_id on public.user_entitlements(user_id);
create index if not exists idx_package_features_package on public.package_features(package);

-- =====================================================
-- FEATURE MAPPINGS BY PACKAGE
-- =====================================================

delete from public.package_features;

-- REGULAR USERS: Core CRM only
insert into public.package_features (package, feature_key) values
('regular', 'core_crm'),
('regular', 'dashboard'),
('regular', 'contacts'),
('regular', 'pipeline'),
('regular', 'calendar');

-- SMARTMARKETER USERS: Full Smart Marketer/SalesPype platform
-- No white label, no admin, no OpenClaw
insert into public.package_features (package, feature_key) values
('smartmarketer', 'core_crm'),
('smartmarketer', 'dashboard'),
('smartmarketer', 'contacts'),
('smartmarketer', 'pipeline'),
('smartmarketer', 'calendar'),
-- Enhanced CRM
('smartmarketer', 'contact_enhancements'),
('smartmarketer', 'ai_contact_enrichment'),
('smartmarketer', 'ai_lead_scoring'),
('smartmarketer', 'custom_fields'),
('smartmarketer', 'contact_activity_tracking'),
('smartmarketer', 'bulk_contact_operations'),
('smartmarketer', 'pipeline_management'),
('smartmarketer', 'task_management'),
-- AI Tools
('smartmarketer', 'ai_tools'),
('smartmarketer', 'email_analysis'),
('smartmarketer', 'meeting_summarizer'),
('smartmarketer', 'proposal_generator'),
('smartmarketer', 'call_script_generator'),
('smartmarketer', 'subject_line_optimizer'),
('smartmarketer', 'vision_analyzer'),
('smartmarketer', 'image_generator'),
('smartmarketer', 'semantic_search'),
('smartmarketer', 'function_assistant'),
('smartmarketer', 'streaming_chat'),
('smartmarketer', 'live_deal_analysis'),
('smartmarketer', 'instant_response_generator'),
('smartmarketer', 'ai_goals'),
-- Analytics / Intelligence
('smartmarketer', 'analytics'),
('smartmarketer', 'advanced_analytics'),
('smartmarketer', 'business_intelligence'),
('smartmarketer', 'sales_intelligence'),
('smartmarketer', 'deal_intelligence_dashboard'),
('smartmarketer', 'contact_analytics_dashboard'),
('smartmarketer', 'pipeline_intelligence'),
('smartmarketer', 'deal_risk_monitor'),
('smartmarketer', 'smart_conversion_insights'),
('smartmarketer', 'pipeline_health_dashboard'),
('smartmarketer', 'sales_cycle_analytics'),
('smartmarketer', 'win_rate_intelligence'),
('smartmarketer', 'ai_sales_forecast'),
('smartmarketer', 'competitor_insights'),
('smartmarketer', 'revenue_intelligence'),
-- Communication Hub
('smartmarketer', 'communication_hub'),
('smartmarketer', 'appointments'),
('smartmarketer', 'video_email'),
('smartmarketer', 'text_messages'),
('smartmarketer', 'phone_system'),
('smartmarketer', 'voice_profiles'),
-- Smart Marketer tools
('smartmarketer', 'invoicing'),
('smartmarketer', 'lead_automation'),
('smartmarketer', 'forms_surveys'),
('smartmarketer', 'business_analyzer'),
('smartmarketer', 'content_library'),
('smartmarketer', 'circle_prospecting'),
-- Connected Apps (no OpenClaw)
('smartmarketer', 'connected_apps'),
('smartmarketer', 'funnelcraft_ai'),
('smartmarketer', 'smartcrm_closer'),
('smartmarketer', 'content_ai'),
-- Billing/Credits
('smartmarketer', 'billing_credits'),
('smartmarketer', 'buy_credits');

-- WHITELABEL USERS: Everything SmartMarketer gets + White Label
-- No admin, no OpenClaw
insert into public.package_features (package, feature_key)
select 'whitelabel', feature_key from public.package_features where package = 'smartmarketer';

insert into public.package_features (package, feature_key) values
('whitelabel', 'white_label'),
('whitelabel', 'white_label_customization'),
('whitelabel', 'white_label_management'),
('whitelabel', 'multi_tenant_features'),
('whitelabel', 'custom_branding'),
('whitelabel', 'domain_management'),
('whitelabel', 'package_builder'),
('whitelabel', 'revenue_sharing'),
('whitelabel', 'partner_dashboard'),
('whitelabel', 'partner_onboarding'),
('whitelabel', 'brand_asset_management'),
('whitelabel', 'theme_customization'),
('whitelabel', 'custom_domain_setup'),
('whitelabel', 'feature_package_configuration');

-- SUPER ADMIN: Everything
insert into public.package_features (package, feature_key) values
('super_admin', '*'),
('super_admin', 'openclaw'),
('super_admin', 'admin_panel'),
('super_admin', 'feature_management'),
('super_admin', 'user_management'),
('super_admin', 'system_monitoring'),
('super_admin', 'security_audit_logs'),
('super_admin', 'compliance_tools'),
('super_admin', 'security_compliance');

-- =====================================================
-- USER ENTITLEMENTS
-- =====================================================

-- SUPER ADMIN (highest priority - never downgraded)
insert into public.user_entitlements (email, package, openclaw_enabled, admin_enabled, source, notes)
values ('dean@smartcrm.vip', 'super_admin', true, true, 'Internal Admin', 'Super admin account')
on conflict (email) do update set
  package = 'super_admin'::smartcrm_package,
  openclaw_enabled = true,
  admin_enabled = true,
  source = 'Internal Admin',
  notes = 'Super admin account',
  updated_at = now();

-- WHITELABEL USERS (10 buyers - PROTECTED from downgrades)
insert into public.user_entitlements (email, package, openclaw_enabled, admin_enabled, source, notes)
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

-- YEARLY BUYERS (NO ACCESS - locked)
insert into public.user_entitlements (email, package, openclaw_enabled, admin_enabled, source, notes)
values
('stevebarrett.ceo@gmail.com', 'no_access', false, false, 'Smart CRM Yearly', 'Steven Barrett - Yearly buyer'),
('beam42@gmail.com', 'no_access', false, false, 'Smart CRM Yearly', 'Robert Lazor - Yearly buyer'),
('appwebtisingsolutions@gmail.com', 'no_access', false, false, 'Smart CRM Yearly', 'Garry Lewis - Yearly buyer'),
('nikolauswihlidal@gmail.com', 'no_access', false, false, 'Smart CRM Yearly', 'Nikolaus Wihlidal - Yearly buyer')
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

-- ALL OTHER BUYERS → SMARTMARKETER
insert into public.user_entitlements (email, package, openclaw_enabled, admin_enabled, source, notes)
values
-- Smart CRM Lifetime (18)
('thomaspublications@gmail.com', 'smartmarketer', false, false, 'Smart CRM Lifetime', 'Tom Bodner - Lifetime'),
('kennethlcarter1@gmail.com', 'smartmarketer', false, false, 'Smart CRM Lifetime', 'Kenneth Carter - Lifetime'),
('russ.critendon@gmail.com', 'smartmarketer', false, false, 'Smart CRM Lifetime', 'Russ Critendon - Lifetime'),
('drgomberg@gmail.com', 'smartmarketer', false, false, 'Smart CRM Lifetime', 'Lloyd Gomberg - Lifetime'),
('tom@amazingsalesteam.com', 'smartmarketer', false, false, 'Smart CRM Lifetime', 'Thomas Gordon - Lifetime'),
('jjharrison1@yahoo.com', 'smartmarketer', false, false, 'Smart CRM Lifetime', 'Jeffery Harrison - Lifetime'),
('marion.hundemer@gmail.com', 'smartmarketer', false, false, 'Smart CRM Lifetime', 'Marion Hundemer - Lifetime'),
('jennifer@marshallwrites.com', 'smartmarketer', false, false, 'Smart CRM Lifetime', 'Jennifer Marshall - Lifetime'),
('jrmunns@pm.me', 'smartmarketer', false, false, 'Smart CRM Lifetime', 'John Munns - Lifetime'),
('sunita.s.pandit@gmail.com', 'smartmarketer', false, false, 'Smart CRM Lifetime', 'Sunita Pandit - Lifetime'),
('k.rascop@comcast.net', 'smartmarketer', false, false, 'Smart CRM Lifetime', 'Kevin M Rascop - Lifetime'),
('simonr4@aol.com', 'smartmarketer', false, false, 'Smart CRM Lifetime', 'Simon Rosenberg - Lifetime'),
('kasapp52@yahoo.com', 'smartmarketer', false, false, 'Smart CRM Lifetime', 'Kenneth Sapp - Lifetime'),
('otherted@gmail.com', 'smartmarketer', false, false, 'Smart CRM Lifetime', 'Ted Sillings - Lifetime'),
('darkstyle@msn.com', 'smartmarketer', false, false, 'Smart CRM Lifetime', 'Curtis Thomas - Lifetime'),
('w_a_wagner@hotmail.com', 'smartmarketer', false, false, 'Smart CRM Lifetime', 'William Wagner - Lifetime'),
-- Monthly
('scstate88@yahoo.com', 'smartmarketer', false, false, 'Smart CRM Monthly', 'Rodney Brown - Monthly'),
-- Main/Bundle
('rbuice@me.com', 'smartmarketer', false, false, 'SmartCRM Main', 'Renee Buice - Main'),
('ag@goering.de', 'smartmarketer', false, false, 'SmartCRM Main', 'Andreas Göring - Main'),
('warrentate1@me.com', 'smartmarketer', false, false, 'SmartCRM Main', 'Warren Tate - Main'),
('services@ultimateprofitmachine.com', 'smartmarketer', false, false, 'Smart CRM Bundle', 'Leslie Ong - Bundle'),
-- December to Remember (10)
('harridal525@gmail.com', 'smartmarketer', false, false, 'Smart CRM December', 'Dale Harris - Dec Promo'),
('clarkekendrick@gmail.com', 'smartmarketer', false, false, 'Smart CRM December', 'Clarke Kendrick - Dec Promo'),
('cpconsultant3@gmail.com', 'smartmarketer', false, false, 'Smart CRM December', 'Andrea Matthews - Dec Promo'),
('rpaulhus@hotmail.com', 'smartmarketer', false, false, 'Smart CRM December', 'Real Paul-Hus - Dec Promo'),
('telcommglobal@gmail.com', 'smartmarketer', false, false, 'Smart CRM December', 'Phildora Perez - Dec Promo'),
('kirby.register@gmail.com', 'smartmarketer', false, false, 'Smart CRM December', 'Kirby Register - Dec Promo'),
('mumiker@rochester.rr.com', 'smartmarketer', false, false, 'Smart CRM December', 'Mark Umiker - Dec Promo'),
('rukiwatenesnr@gmail.com', 'smartmarketer', false, false, 'Smart CRM December', 'Ruki Watene - Dec Promo'),
('teamvisionclubs1@gmail.com', 'smartmarketer', false, false, 'Smart CRM December', 'Margaret Wynne - Dec Promo'),
('rolf.zahnd@bluemail.ch', 'smartmarketer', false, false, 'Smart CRM December', 'Rolf Zahnd - Dec Promo'),
-- Smart Marketer Elite (3)
('mathieu@janin.ch', 'smartmarketer', false, false, 'Smart Marketer Elite', 'Mathieu Janin - Elite'),
('jenny@peakvideos.com', 'smartmarketer', false, false, 'Smart Marketer Elite', 'Jenny Francoeur - Elite'),
('paul@tillery.com', 'smartmarketer', false, false, 'Smart Marketer Elite', 'Paul Tillery - Elite'),
-- Smart Marketer A.I. (61 buyers, excluding whitelabel overlaps)
('jessecarter@outlook.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Jesse Carter - A.I.'),
('hmclean247@gmail.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Henry McLean - A.I.'),
('akangtshipinare@gmail.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Bakang Tshipinare - A.I.'),
('mastermarketerguy@gmail.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Mark Sullivan - A.I.'),
('safdar59@icloud.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Larry Jackson - A.I.'),
('yongben@hotmail.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Ben Yong - A.I.'),
('barbsbichons@yahoo.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Barb Reynolds - A.I.'),
('mailmichel@protonmail.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Michel Langlois - A.I.'),
('cwolf72@yahoo.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Craig Wolf - A.I.'),
('making_it_happenn@yahoo.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Andre Rohlehr - A.I.'),
('kyfung@zoho.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Kam Fung - A.I.'),
('ksappiah@hotmail.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Kofi Appiah - A.I.'),
('bizleadspot@gmail.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Chandrashekar Rao - A.I.'),
('royzac@gmail.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Roy Zachariah - A.I.'),
('business_iac@outlook.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Iacopo Sannazzaro - A.I.'),
('frochar@outlook.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Felipe Rocha - A.I.'),
('freds@trebmedia.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Fred Schroeder - A.I.'),
('cybalon@gmail.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Al Yk - A.I.'),
('dwhitecourses@gmail.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Dawn White - A.I.'),
('Shravad@outlook.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Shravan Kumar - A.I.'),
('sinukip@comcast.net', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Richard Pikunis - A.I.'),
('keeno2021@yahoo.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Paul Keenan - A.I.'),
('cdoggan@gmail.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Clarence Doggan - A.I.'),
('mattade20@yahoo.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Matthew Ojo - A.I.'),
('Oddinstruments@yahoo.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Michael Arthur - A.I.'),
('jennylf49@yahoo.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Jenny Francoeur - A.I.'),
('mkopz3000@gmail.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Marcus Kopu - A.I.'),
('biz4ry@yahoo.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Roy Revill - A.I.'),
('johngraden@mac.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'John Graden - A.I.'),
('poipunan@me.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Nancy McMahon - A.I.'),
('osygen2001@yahoo.co.uk', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Phillip Uwagboe - A.I.'),
('akenroy@gmail.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Allen Kenroy - A.I.'),
('mastersintegritymarketing@gmail.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Chase Masters - A.I.'),
('marketingtogoto@gmail.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Don McLellan - A.I.'),
('work471@gmail.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Mel Cederbaum - A.I.'),
('kenositimothy@gmail.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Timothy Timothy - A.I.'),
('chickenlady72@hotmail.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Cindi Erickson - A.I.'),
('mybusiness11449@gmail.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Richard Thompson - A.I.'),
('edligon1@gmail.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Edward Ligon - A.I.'),
('cynhoyt444@gmail.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Cynthia Hoyt - A.I.'),
('jzoing53@hotmail.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Roger Carter - A.I.'),
('Rick@worldcalltel.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Americo Morelli - A.I.'),
('rodneyg493@gmail.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Rodney Griffith - A.I.'),
('brian@823marketing.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Brian Pinski - A.I.'),
('tonreedijk@hotmail.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Ton Reedijk - A.I.'),
('robertsheppard777@yahoo.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Robert Sheppard - A.I.'),
('Larence@outlook.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Larence DeBose - A.I.'),
('kipansonimt@gmail.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Kip Anson - A.I.'),
('myrleneh@gmail.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Myrlene Thomas - A.I.'),
('sustaintheresults@gmail.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Timothy Adler - A.I.'),
('nikolemem@gmail.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Nikole Memminger - A.I.'),
('pstone@mobileseopros.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Pete Stone - A.I.'),
('drmjp@aol.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Mark Page - A.I.'),
('wmancho@hotmail.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Wilson Manc - A.I.'),
('rogersdarlene0@gmail.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Darlene Rogers - A.I.'),
('ejo1ed@gmail.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Edward Owens - A.I.'),
('ThorstenMarten@web.de', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Thorsten Marten - A.I.'),
('sqlmailq-web@yahoo.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Tatiana Korol - A.I.'),
('mark35mi@yahoo.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Mark Humenik - A.I.'),
('darrylastin@gmail.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Darryl Astin - A.I.'),
('software@virtualfocusedmarketing.com', 'smartmarketer', false, false, 'Smart Marketer A.I.', 'Rusty McMillen - A.I.'),
-- SmartCRM Old (31)
('atcradarguy@yahoo.com', 'smartmarketer', false, false, 'SmartCRM Old', 'ATC - Old'),
('yinnngov@gmail.com', 'smartmarketer', false, false, 'SmartCRM Old', 'Yinn Ngov - Old'),
('t_codez@hotmail.com', 'smartmarketer', false, false, 'SmartCRM Old', 'Tony Thunberg - Old'),
('paul33ng@gmail.com', 'smartmarketer', false, false, 'SmartCRM Old', 'Paul Friend - Old'),
('mikep@mobilevideo360.com', 'smartmarketer', false, false, 'SmartCRM Old', 'Michael Paule Friend - Old'),
('iprofitelite@gmail.com', 'smartmarketer', false, false, 'SmartCRM Old', 'Jay Friend - Old'),
('deejayhart.nyc@gmail.com', 'smartmarketer', false, false, 'SmartCRM Old', 'Deb Friend - Old'),
('bibimorani@yahoo.co.uk', 'smartmarketer', false, false, 'SmartCRM Old', 'Joyce Amri - Old'),
('ams.richardj@gmail.com', 'smartmarketer', false, false, 'SmartCRM Old', 'Richard Jones - Old'),
('aleddy0@gmail.com', 'smartmarketer', false, false, 'SmartCRM Old', 'Al Eddy - Old'),
('akhindri47@gmail.com', 'smartmarketer', false, false, 'SmartCRM Old', 'Ajay Khindri - Old'),
('access77@hiltmann.net', 'smartmarketer', false, false, 'SmartCRM Old', 'Uwe Hiltmann - Old'),
('ae2142@att.net', 'smartmarketer', false, false, 'SmartCRM Old', 'Al Esquivel - Old'),
('nedzeidan@gmail.com', 'smartmarketer', false, false, 'SmartCRM Old', 'Ned Zeidan-Pa - Old'),
('jamillila@gmail.com', 'smartmarketer', false, false, 'SmartCRM Old', 'Jamil Lila - Old'),
('gkoroghlanian@gmail.com', 'smartmarketer', false, false, 'SmartCRM Old', 'Gloria Koroghianian - Old'),
('jearico@gmx.co.uk', 'smartmarketer', false, false, 'SmartCRM Old', 'Eric Oliver - Old'),
('finnart25@gmail.com', 'smartmarketer', false, false, 'SmartCRM Old', 'Dorothy Hery - Old'),
('macristdds@yahoo.com', 'smartmarketer', false, false, 'SmartCRM Old', 'Michael Crist - Old'),
('triciarobinson42@gmail.com', 'smartmarketer', false, false, 'SmartCRM Old', 'Patricia Robinson - Old'),
('monhow@hotmail.com', 'smartmarketer', false, false, 'SmartCRM Old', 'Monique Howard - Old'),
('lorirol2u@gmail.com', 'smartmarketer', false, false, 'SmartCRM Old', 'OLS Team - Old'),
('wereinteractive@gmail.com', 'smartmarketer', false, false, 'SmartCRM Old', 'Ryan Waggelsmans - Old'),
('davmal12@aol.com', 'smartmarketer', false, false, 'SmartCRM Old', 'David Maldonado - Old'),
('mariomconsulting@gmail.com', 'smartmarketer', false, false, 'SmartCRM Old', 'Mario Marsden - Old'),
('joycoleb@yahoo.com', 'smartmarketer', false, false, 'SmartCRM Old', 'Joy Cole - Old'),
('f.collin@hotmail.fr', 'smartmarketer', false, false, 'SmartCRM Old', 'Frederic Collin - Old'),
('trondheimllc@gmail.com', 'smartmarketer', false, false, 'SmartCRM Old', 'Jesse Millares - Old'),
('jgcamail@gmail.com', 'smartmarketer', false, false, 'SmartCRM Old', 'Associate Resources - Old'),
('bonniechristian247@gmail.com', 'smartmarketer', false, false, 'SmartCRM Old', 'Bonnie Christian - Old')
on conflict (email) do update set
  package = case
    when public.user_entitlements.package = 'super_admin' then 'super_admin'::smartcrm_package
    when public.user_entitlements.package = 'whitelabel' then 'whitelabel'::smartcrm_package
    when public.user_entitlements.package = 'no_access' then 'no_access'::smartcrm_package
    else 'smartmarketer'::smartcrm_package
  end,
  openclaw_enabled = false,
  admin_enabled = false,
  source = excluded.source,
  notes = excluded.notes,
  updated_at = now();

-- =====================================================
-- ACCESS CHECK FUNCTION
-- =====================================================

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
    left join public.package_features pf on pf.package = ue.package
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
```

### Step 3: Verify

After running, test in Supabase SQL Editor:

```sql
-- Whitelabel user should have white label access
select public.user_has_feature('fredrik.kaada@gmail.com', 'white_label_customization') as has_access;
-- Expected: true

-- Whitelabel user should NOT have OpenClaw
select public.user_has_feature('fredrik.kaada@gmail.com', 'openclaw') as has_access;
-- Expected: false

-- SmartMarketer user should have AI tools
select public.user_has_feature('thomaspublications@gmail.com', 'ai_tools') as has_access;
-- Expected: true

-- SmartMarketer user should NOT have white label
select public.user_has_feature('thomaspublications@gmail.com', 'white_label_customization') as has_access;
-- Expected: false

-- Yearly user should have NO access
select public.user_has_feature('stevebarrett.ceo@gmail.com', 'dashboard') as has_access;
-- Expected: false

-- Super admin should have everything
select public.user_has_feature('dean@smartcrm.vip', 'openclaw') as has_access;
-- Expected: true
```

## Summary

**Total buyers assigned:** 140 unique emails

| Package | Count | Description |
|---------|-------|-------------|
| `super_admin` | 1 | dean@smartcrm.vip (internal) |
| `whitelabel` | 10 | Whitelabel Lifetime buyers (highest priority) |
| `no_access` | 4 | Yearly buyers (locked) |
| `smartmarketer` | 125 | All other buyers (Lifetime, Monthly, Main, Bundle, Dec Promo, Smart Marketer A.I., SmartCRM Old, Elite) |

**Key duplication rules enforced:**
- Whitelabel overrides all other package assignments
- Yearly buyers remain locked as `no_access`
- Super admin always preserved
- `supabase-seed.sql` has conflict-safe `ON CONFLICT` logic

Now execute the SQL above in your Supabase SQL Editor to complete the setup.
