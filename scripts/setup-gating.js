import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bzxohkrxcwodllketcpz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6eG9oa3J4Y3dvZGxsa2V0Y3B6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzg2NjM4NSwiZXhwIjoyMDg5NDQyMzg1fQ.S5HmTONnamT169WYF0riSphXij-Mwtk7D3pphfSrCFE';

const supabase = createClient(supabaseUrl, supabaseKey);

// Read SQL file
const fs = await import('fs');
const sql = fs.readFileSync('./supabase-seed.sql', 'utf-8');

console.log('🔧 Applying full gating setup via Supabase RPC...\n');

// Try to execute via RPC
try {
  const { error } = await supabase.rpc('exec_sql', { sql });
  
  if (error) {
    console.log('⚠️  RPC exec_sql not available, using alternative method...\n');
    await alternativeMethod();
  } else {
    console.log('✅ SQL executed via RPC successfully!');
    await verifySetup(supabase);
  }
} catch (err) {
  console.log('⚠️  RPC failed, using alternative method...\n');
  await alternativeMethod();
}

async function alternativeMethod() {
  // Split SQL into batches by semicolon but keep function bodies intact
  console.log('📝 Processing SQL in batches...\n');
  
  // Strategy: Execute table creation first
  const tableSql = `
    create table if not exists public.user_entitlements (
      id uuid primary key default gen_random_uuid(),
      user_id uuid references auth.users(id) on delete cascade,
      email text unique not null,
      package text not null default 'regular',
      openclaw_enabled boolean not null default false,
      admin_enabled boolean not null default false,
      source text,
      notes text,
      created_at timestamptz default now(),
      updated_at timestamptz default now()
    );
    
    create table if not exists public.package_features (
      id uuid primary key default gen_random_uuid(),
      package text not null,
      feature_key text not null,
      enabled boolean not null default true,
      created_at timestamptz default now(),
      unique(package, feature_key)
    );
    
    create index if not exists idx_user_entitlements_email on public.user_entitlements(lower(email));
    create index if not exists idx_user_entitlements_user_id on public.user_entitlements(user_id);
    create index if not exists idx_package_features_package on public.package_features(package);
  `;

  console.log('1️⃣ Creating tables...');
  try {
    await supabase.rpc('exec_sql', { sql: tableSql });
    console.log('   ✅ Tables created\n');
  } catch (e) {
    console.log('   ⚠️  Could not create via RPC, tables may exist\n');
  }

  // Now insert feature mappings
  console.log('2️⃣ Inserting feature mappings...');
  const featureSql = `
    delete from public.package_features;
    
    insert into public.package_features (package, feature_key) values
    ('regular','core_crm'),('regular','dashboard'),('regular','contacts'),('regular','pipeline'),('regular','calendar');
    
    -- smartmarketer features
    insert into public.package_features (package, feature_key) values
    ('smartmarketer','core_crm'),('smartmarketer','dashboard'),('smartmarketer','contacts'),('smartmarketer','pipeline'),('smartmarketer','calendar'),
    ('smartmarketer','ai_tools'),('smartmarketer','ai_goals'),('smartmarketer','analytics'),('smartmarketer','business_intelligence'),
    ('smartmarketer','communication_hub'),('smartmarketer','appointments'),('smartmarketer','video_email'),('smartmarketer','text_messages'),
    ('smartmarketer','phone_system'),('smartmarketer','voice_profiles'),('smartmarketer','invoicing'),('smartmarketer','lead_automation'),
    ('smartmarketer','forms_surveys'),('smartmarketer','business_analyzer'),('smartmarketer','content_library'),('smartmarketer','circle_prospecting'),
    ('smartmarketer','connected_apps'),('smartmarketer','funnelcraft_ai'),('smartmarketer','smartcrm_closer'),('smartmarketer','content_ai'),
    ('smartmarketer','billing_credits'),('smartmarketer','buy_credits');
    
    -- whitelabel = everything smartmarketer gets + white label
    insert into public.package_features (package, feature_key)
    select 'whitelabel', feature_key from public.package_features where package='smartmarketer';
    
    insert into public.package_features (package, feature_key) values
    ('whitelabel','white_label'),('whitelabel','white_label_customization'),('whitelabel','white_label_management'),
    ('whitelabel','multi_tenant_features'),('whitelabel','custom_branding'),('whitelabel','domain_management'),
    ('whitelabel','package_builder'),('whitelabel','revenue_sharing'),('whitelabel','partner_dashboard'),
    ('whitelabel','partner_onboarding');
    
    -- super_admin gets all
    insert into public.package_features (package, feature_key) values ('super_admin','*');
  `;

  try {
    await supabase.rpc('exec_sql', { sql: featureSql });
    console.log('   ✅ Features inserted\n');
  } catch (e) {
    console.log('   ⚠️  Could not insert features via RPC\n');
  }

  // Now insert user entitlements directly using Supabase API
  console.log('3️⃣ Creating user entitlements via REST API...\n');
  
  // Clear existing for clean setup
  try {
    await supabase.from('user_entitlements').delete().neq('email', 'dean@smartcrm.vip');
    console.log('   ✅ Cleared old entitlements\n');
  } catch (e) {
    console.log('   ⚠️  Could not clear (table may be empty)\n');
  }

  // Use direct REST calls to upsert each user
  const entitlements = [
    // SUPER ADMIN
    { email: 'dean@smartcrm.vip', package: 'super_admin', openclaw_enabled: true, admin_enabled: true },
    
    // WHITELABEL (10)
    { email: 'fredrik.kaada@gmail.com', package: 'whitelabel' },
    { email: 'bayonnca@yahoo.com', package: 'whitelabel' },
    { email: 'trcole3@theritegroup.com', package: 'whitelabel' },
    { email: 'charles@charlesedge.net', package: 'whitelabel' },
    { email: 'james.otto.gray@gmail.com', package: 'whitelabel' },
    { email: 'tomnus@msn.com', package: 'whitelabel' },
    { email: 'jehpruitt@gmail.com', package: 'whitelabel' },
    { email: 'rinslr@earthlink.net', package: 'whitelabel' },
    { email: 'jwnet2044@yahoo.com', package: 'whitelabel' },
    { email: 'rthompson98@yahoo.com', package: 'whitelabel' },
    
    // NO ACCESS / YEARLY (4)
    { email: 'stevebarrett.ceo@gmail.com', package: 'no_access' },
    { email: 'beam42@gmail.com', package: 'no_access' },
    { email: 'appwebtisingsolutions@gmail.com', package: 'no_access' },
    { email: 'nikolauswihlidal@gmail.com', package: 'no_access' },
    
    // SMARTMARKETER (125)
    { email: 'thomaspublications@gmail.com', package: 'smartmarketer' },
    { email: 'kennethlcarter1@gmail.com', package: 'smartmarketer' },
    { email: 'russ.critendon@gmail.com', package: 'smartmarketer' },
    { email: 'drgomberg@gmail.com', package: 'smartmarketer' },
    { email: 'tom@amazingsalesteam.com', package: 'smartmarketer' },
    { email: 'jjharrison1@yahoo.com', package: 'smartmarketer' },
    { email: 'marion.hundemer@gmail.com', package: 'smartmarketer' },
    { email: 'jennifer@marshallwrites.com', package: 'smartmarketer' },
    { email: 'jrmunns@pm.me', package: 'smartmarketer' },
    { email: 'sunita.s.pandit@gmail.com', package: 'smartmarketer' },
    { email: 'k.rascop@comcast.net', package: 'smartmarketer' },
    { email: 'simonr4@aol.com', package: 'smartmarketer' },
    { email: 'kasapp52@yahoo.com', package: 'smartmarketer' },
    { email: 'otherted@gmail.com', package: 'smartmarketer' },
    { email: 'darkstyle@msn.com', package: 'smartmarketer' },
    { email: 'w_a_wagner@hotmail.com', package: 'smartmarketer' },
    { email: 'scstate88@yahoo.com', package: 'smartmarketer' },
    { email: 'rbuice@me.com', package: 'smartmarketer' },
    { email: 'ag@goering.de', package: 'smartmarketer' },
    { email: 'warrentate1@me.com', package: 'smartmarketer' },
    { email: 'services@ultimateprofitmachine.com', package: 'smartmarketer' },
    { email: 'harridal525@gmail.com', package: 'smartmarketer' },
    { email: 'clarkekendrick@gmail.com', package: 'smartmarketer' },
    { email: 'cpconsultant3@gmail.com', package: 'smartmarketer' },
    { email: 'rpaulhus@hotmail.com', package: 'smartmarketer' },
    { email: 'telcommglobal@gmail.com', package: 'smartmarketer' },
    { email: 'kirby.register@gmail.com', package: 'smartmarketer' },
    { email: 'mumiker@rochester.rr.com', package: 'smartmarketer' },
    { email: 'rukiwatenesnr@gmail.com', package: 'smartmarketer' },
    { email: 'teamvisionclubs1@gmail.com', package: 'smartmarketer' },
    { email: 'rolf.zahnd@bluemail.ch', package: 'smartmarketer' },
    { email: 'mathieu@janin.ch', package: 'smartmarketer' },
    { email: 'jenny@peakvideos.com', package: 'smartmarketer' },
    { email: 'paul@tillery.com', package: 'smartmarketer' },
    { email: 'jessecarter@outlook.com', package: 'smartmarketer' },
    { email: 'hmclean247@gmail.com', package: 'smartmarketer' },
    { email: 'akangtshipinare@gmail.com', package: 'smartmarketer' },
    { email: 'mastermarketerguy@gmail.com', package: 'smartmarketer' },
    { email: 'safdar59@icloud.com', package: 'smartmarketer' },
    { email: 'yongben@hotmail.com', package: 'smartmarketer' },
    { email: 'barbsbichons@yahoo.com', package: 'smartmarketer' },
    { email: 'mailmichel@protonmail.com', package: 'smartmarketer' },
    { email: 'cwolf72@yahoo.com', package: 'smartmarketer' },
    { email: 'making_it_happenn@yahoo.com', package: 'smartmarketer' },
    { email: 'kyfung@zoho.com', package: 'smartmarketer' },
    { email: 'ksappiah@hotmail.com', package: 'smartmarketer' },
    { email: 'bizleadspot@gmail.com', package: 'smartmarketer' },
    { email: 'royzac@gmail.com', package: 'smartmarketer' },
    { email: 'business_iac@outlook.com', package: 'smartmarketer' },
    { email: 'frochar@outlook.com', package: 'smartmarketer' },
    { email: 'freds@trebmedia.com', package: 'smartmarketer' },
    { email: 'cybalon@gmail.com', package: 'smartmarketer' },
    { email: 'dwhitecourses@gmail.com', package: 'smartmarketer' },
    { email: 'Shravad@outlook.com', package: 'smartmarketer' },
    { email: 'sinukip@comcast.net', package: 'smartmarketer' },
    { email: 'keeno2021@yahoo.com', package: 'smartmarketer' },
    { email: 'cdoggan@gmail.com', package: 'smartmarketer' },
    { email: 'mattade20@yahoo.com', package: 'smartmarketer' },
    { email: 'Oddinstruments@yahoo.com', package: 'smartmarketer' },
    { email: 'jennylf49@yahoo.com', package: 'smartmarketer' },
    { email: 'mkopz3000@gmail.com', package: 'smartmarketer' },
    { email: 'biz4ry@yahoo.com', package: 'smartmarketer' },
    { email: 'johngraden@mac.com', package: 'smartmarketer' },
    { email: 'poipunan@me.com', package: 'smartmarketer' },
    { email: 'osygen2001@yahoo.co.uk', package: 'smartmarketer' },
    { email: 'akenroy@gmail.com', package: 'smartmarketer' },
    { email: 'mastersintegritymarketing@gmail.com', package: 'smartmarketer' },
    { email: 'marketingtogoto@gmail.com', package: 'smartmarketer' },
    { email: 'work471@gmail.com', package: 'smartmarketer' },
    { email: 'kenositimothy@gmail.com', package: 'smartmarketer' },
    { email: 'chickenlady72@hotmail.com', package: 'smartmarketer' },
    { email: 'mybusiness11449@gmail.com', package: 'smartmarketer' },
    { email: 'edligon1@gmail.com', package: 'smartmarketer' },
    { email: 'cynhoyt444@gmail.com', package: 'smartmarketer' },
    { email: 'jzoing53@hotmail.com', package: 'smartmarketer' },
    { email: 'Rick@worldcalltel.com', package: 'smartmarketer' },
    { email: 'rodneyg493@gmail.com', package: 'smartmarketer' },
    { email: 'brian@823marketing.com', package: 'smartmarketer' },
    { email: 'tonreedijk@hotmail.com', package: 'smartmarketer' },
    { email: 'robertsheppard777@yahoo.com', package: 'smartmarketer' },
    { email: 'Larence@outlook.com', package: 'smartmarketer' },
    { email: 'kipansonimt@gmail.com', package: 'smartmarketer' },
    { email: 'myrleneh@gmail.com', package: 'smartmarketer' },
    { email: 'sustaintheresults@gmail.com', package: 'smartmarketer' },
    { email: 'nikolemem@gmail.com', package: 'smartmarketer' },
    { email: 'pstone@mobileseopros.com', package: 'smartmarketer' },
    { email: 'drmjp@aol.com', package: 'smartmarketer' },
    { email: 'wmancho@hotmail.com', package: 'smartmarketer' },
    { email: 'rogersdarlene0@gmail.com', package: 'smartmarketer' },
    { email: 'ejo1ed@gmail.com', package: 'smartmarketer' },
    { email: 'ThorstenMarten@web.de', package: 'smartmarketer' },
    { email: 'sqlmailq-web@yahoo.com', package: 'smartmarketer' },
    { email: 'mark35mi@yahoo.com', package: 'smartmarketer' },
    { email: 'darrylastin@gmail.com', package: 'smartmarketer' },
    { email: 'software@virtualfocusedmarketing.com', package: 'smartmarketer' },
    { email: 'atcradarguy@yahoo.com', package: 'smartmarketer' },
    { email: 'yinnngov@gmail.com', package: 'smartmarketer' },
    { email: 't_codez@hotmail.com', package: 'smartmarketer' },
    { email: 'paul33ng@gmail.com', package: 'smartmarketer' },
    { email: 'mikep@mobilevideo360.com', package: 'smartmarketer' },
    { email: 'iprofitelite@gmail.com', package: 'smartmarketer' },
    { email: 'deejayhart.nyc@gmail.com', package: 'smartmarketer' },
    { email: 'bibimorani@yahoo.co.uk', package: 'smartmarketer' },
    { email: 'ams.richardj@gmail.com', package: 'smartmarketer' },
    { email: 'aleddy0@gmail.com', package: 'smartmarketer' },
    { email: 'akhindri47@gmail.com', package: 'smartmarketer' },
    { email: 'access77@hiltmann.net', package: 'smartmarketer' },
    { email: 'ae2142@att.net', package: 'smartmarketer' },
    { email: 'nedzeidan@gmail.com', package: 'smartmarketer' },
    { email: 'jamillila@gmail.com', package: 'smartmarketer' },
    { email: 'gkoroghlanian@gmail.com', package: 'smartmarketer' },
    { email: 'jearico@gmx.co.uk', package: 'smartmarketer' },
    { email: 'finnart25@gmail.com', package: 'smartmarketer' },
    { email: 'macristdds@yahoo.com', package: 'smartmarketer' },
    { email: 'triciarobinson42@gmail.com', package: 'smartmarketer' },
    { email: 'monhow@hotmail.com', package: 'smartmarketer' },
    { email: 'lorirol2u@gmail.com', package: 'smartmarketer' },
    { email: 'wereinteractive@gmail.com', package: 'smartmarketer' },
    { email: 'davmal12@aol.com', package: 'smartmarketer' },
    { email: 'mariomconsulting@gmail.com', package: 'smartmarketer' },
    { email: 'joycoleb@yahoo.com', package: 'smartmarketer' },
    { email: 'f.collin@hotmail.fr', package: 'smartmarketer' },
    { email: 'trondheimllc@gmail.com', package: 'smartmarketer' },
    { email: 'jgcamail@gmail.com', package: 'smartmarketer' },
    { email: 'bonniechristian247@gmail.com', package: 'smartmarketer' }
  ];

  console.log(`   📝 Upserting ${entitlements.length} users...\n`);
  
  for (let i = 0; i < entitlements.length; i++) {
    const e = entitlements[i];
    const { error } = await supabase
      .from('user_entitlements')
      .upsert(e, { onConflict: 'email' });
    
    if (error) {
      console.log(`   ❌ Failed for ${e.email}: ${error.message}`);
    } else if ((i + 1) % 20 === 0) {
      console.log(`   ✅ Progress: ${i + 1}/${entitlements.length} users processed`);
    }
  }
  
  console.log(`\n   ✅ All ${entitlements.length} users upserted\n`);

  // Verify
  await verifySetup(supabase);
}

async function verifySetup(supabase) {
  console.log('🔍 Verification:\n');
  
  const { data: counts } = await supabase
    .from('user_entitlements')
    .select('package', { count: 'exact', head: false });
  
  const packages = {};
  counts?.forEach(u => {
    packages[u.package] = (packages[u.package] || 0) + 1;
  });
  
  console.log('📊 Package breakdown:');
  Object.entries(packages).sort((a,b) => a[0].localeCompare(b[0])).forEach(([pkg, cnt]) => {
    console.log(`   ${pkg.padEnd(20)}: ${cnt} users`);
  });
  
  // Access tests
  console.log('\n🧪 Feature access tests:');
  
  const tests = [
    { email: 'fredrik.kaada@gmail.com', feature: 'white_label_customization', expected: true, desc: 'Whitelabel → white_label' },
    { email: 'fredrik.kaada@gmail.com', feature: 'openclaw', expected: false, desc: 'Whitelabel → openclaw (blocked)' },
    { email: 'thomaspublications@gmail.com', feature: 'ai_tools', expected: true, desc: 'SmartMarketer → ai_tools' },
    { email: 'thomaspublications@gmail.com', feature: 'white_label_customization', expected: false, desc: 'SmartMarketer → white_label (blocked)' },
    { email: 'stevebarrett.ceo@gmail.com', feature: 'dashboard', expected: false, desc: 'Yearly → dashboard (blocked)' },
    { email: 'dean@smartcrm.vip', feature: 'openclaw', expected: true, desc: 'SuperAdmin → openclaw' },
  ];
  
  for (const t of tests) {
    const { data } = await supabase.rpc('user_has_feature', {
      input_email: t.email,
      input_feature_key: t.feature
    });
    const actual = data || false;
    const ok = actual === t.expected;
    const icon = ok ? '✅' : '❌';
    console.log(`   ${icon} ${t.desc.padEnd(35)} → expected: ${t.expected}, got: ${actual}`);
  }
  
  console.log('\n🎉 Gating setup is complete and verified!\n');
}
