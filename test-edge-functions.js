// Test Edge Functions Deployment
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'your_supabase_anon_key';

const headers = {
  'Content-Type': 'application/json',
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  Prefer: 'return=representation',
};

async function testContactsFunction() {
  console.log('\n🔍 Testing CONTACTS Edge Function...');

  try {
    // Test GET (list contacts)
    console.log('📋 Testing GET /contacts...');
    const getResponse = await fetch(`${SUPABASE_URL}/functions/v1/contacts`, {
      method: 'GET',
      headers,
    });

    if (getResponse.ok) {
      const contacts = await getResponse.json();
      console.log('✅ CONTACTS function deployed and working!');
      console.log(`📊 Found ${contacts.length || 0} contacts`);
      return true;
    } else {
      console.log('❌ CONTACTS function not found or not working');
      console.log('Status:', getResponse.status);
      return false;
    }
  } catch (error) {
    console.log('❌ CONTACTS function error:', error.message);
    return false;
  }
}

async function testDealsFunction() {
  console.log('\n🔍 Testing DEALS Edge Function...');

  try {
    // Test GET (list deals)
    console.log('📋 Testing GET /deals...');
    const getResponse = await fetch(`${SUPABASE_URL}/functions/v1/deals`, {
      method: 'GET',
      headers,
    });

    if (getResponse.ok) {
      const deals = await getResponse.json();
      console.log('✅ DEALS function deployed and working!');
      console.log(`📊 Found ${deals.length || 0} deals`);
      return true;
    } else {
      console.log('❌ DEALS function not found or not working');
      console.log('Status:', getResponse.status);
      return false;
    }
  } catch (error) {
    console.log('❌ DEALS function error:', error.message);
    return false;
  }
}

async function testDatabaseTables() {
  console.log('\n🔍 Testing Database Tables...');

  try {
    // Test contacts table
    console.log('📋 Testing contacts table...');
    const contactsResponse = await fetch(`${SUPABASE_URL}/rest/v1/contacts?limit=1`, {
      method: 'GET',
      headers,
    });

    if (contactsResponse.ok) {
      console.log('✅ Contacts table exists');
    } else {
      console.log('❌ Contacts table missing or inaccessible');
    }

    // Test deals table
    console.log('📋 Testing deals table...');
    const dealsResponse = await fetch(`${SUPABASE_URL}/rest/v1/deals?limit=1`, {
      method: 'GET',
      headers,
    });

    if (dealsResponse.ok) {
      console.log('✅ Deals table exists');
    } else {
      console.log('❌ Deals table missing or inaccessible');
    }
  } catch (error) {
    console.log('❌ Database test error:', error.message);
  }
}

async function main() {
  console.log('🚀 Testing Supabase Edge Functions Deployment');
  console.log('==========================================');

  const contactsWorking = await testContactsFunction();
  const dealsWorking = await testDealsFunction();

  await testDatabaseTables();

  console.log('\n📊 DEPLOYMENT STATUS SUMMARY:');
  console.log('==========================================');
  console.log(`Contacts Function: ${contactsWorking ? '✅ DEPLOYED' : '❌ MISSING'}`);
  console.log(`Deals Function: ${dealsWorking ? '✅ DEPLOYED' : '❌ MISSING'}`);

  if (contactsWorking && dealsWorking) {
    console.log('\n🎉 ALL FUNCTIONS DEPLOYED! Ready for Netlify deployment.');
  } else {
    console.log('\n⚠️  FUNCTIONS MISSING! Please deploy them to Supabase first.');
    console.log('Go to: https://supabase.com/dashboard/project/gadedbrnqzpftsdmfzcg/functions');
  }
}

main().catch(console.error);
