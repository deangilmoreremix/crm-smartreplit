// Test script to verify entitlement database mappings
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testEntitlements() {
  console.log('🧪 Testing SmartCRM Entitlement Feature Mappings\n');

  // Test 1: Package distribution
  console.log('📦 Package Distribution:');
  const { data: entitlements } = await supabase
    .from('user_entitlements')
    .select('package');

  const packageCounts = {};
  entitlements?.forEach(row => {
    packageCounts[row.package] = (packageCounts[row.package] || 0) + 1;
  });

  console.log('  super_admin:', packageCounts.super_admin || 0);
  console.log('  whitelabel:', packageCounts.whitelabel || 0);
  console.log('  smartmarketer:', packageCounts.smartmarketer || 0);
  console.log('  no_access:', packageCounts.no_access || 0);

  // Test 2: Feature access verification
  const tests = [
    { email: 'dean@smartcrm.vip', package: 'super_admin', expected: { '*': true, openclaw: true, ai_tools: true } },
    { email: 'fredrik.kaada@gmail.com', package: 'whitelabel', expected: { white_label_customization: true, ai_tools: true, openclaw: false } },
    { email: 'thomaspublications@gmail.com', package: 'smartmarketer', expected: { ai_tools: true, white_label_customization: false, openclaw: false } },
    { email: 'stevebarrett.ceo@gmail.com', package: 'no_access', expected: { dashboard: false, contacts: false, ai_tools: false } }
  ];

  console.log('\n🔐 Feature Access Tests:');
  for (const test of tests) {
    console.log(`\n  ${test.package}: ${test.email}`);
    
    for (const [feature, expected] of Object.entries(test.expected)) {
      try {
        const { data } = await supabase.rpc('user_has_feature', {
          input_email: test.email,
          input_feature_key: feature
        });
        const status = data === expected ? '✅' : '❌';
        console.log(`    ${feature}: ${data} ${status} (expected: ${expected})`);
      } catch (err) {
        console.log(`    ${feature}: ERROR ${err.message}`);
      }
    }
  }

  console.log('\n🎯 Database verification completed!');
}

testEntitlements().catch(console.error);
