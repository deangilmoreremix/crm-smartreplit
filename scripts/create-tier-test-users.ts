import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createUser(email: string, password: string, name: string, tier: string) {
  console.log(`\n📧 Creating user: ${email}`);

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: name,
      product_tier: tier,
      app_context: 'smartcrm',
      email_template_set: 'smartcrm',
    },
  });

  if (error) {
    if (error.message.includes('already been registered')) {
      console.log(`⚠️  User already exists, skipping...`);
    } else {
      console.error('❌ Error creating user:', error);
    }
    return;
  }

  console.log(`✅ User created: ${email}`);
  console.log(`   User ID: ${data.user.id}`);
  console.log(`   Product Tier: ${tier}`);
  console.log(`   Password: ${password}`);
}

async function createTestUsers() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   Creating Test Users for Product Tier Testing        ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  await createUser('test-smartcrm@example.com', 'Test123!', 'SmartCRM User', 'smartcrm');

  await createUser(
    'test-sales-maximizer@example.com',
    'Test123!',
    'Sales Maximizer User',
    'sales_maximizer'
  );

  await createUser('test-ai-boost@example.com', 'Test123!', 'AI Boost User', 'ai_boost_unlimited');

  console.log('\n\n╔════════════════════════════════════════════════════════╗');
  console.log('║              Test Users Created Successfully!          ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  console.log('🔐 Login Credentials:\n');
  console.log('1️⃣  SmartCRM Base Tier');
  console.log('   Email: test-smartcrm@example.com');
  console.log('   Password: Test123!');
  console.log('   Access: ✅ Dashboard, Contacts, Pipeline, Calendar');
  console.log('           ❌ AI Goals, AI Tools\n');

  console.log('2️⃣  Sales Maximizer Tier');
  console.log('   Email: test-sales-maximizer@example.com');
  console.log('   Password: Test123!');
  console.log('   Access: ✅ Dashboard, Contacts, Pipeline, Calendar, AI Goals');
  console.log('           ❌ AI Tools\n');

  console.log('3️⃣  AI Boost Unlimited');
  console.log('   Email: test-ai-boost@example.com');
  console.log('   Password: Test123!');
  console.log('   Access: ✅ All Features (including AI Tools)\n');
}

createTestUsers().catch(console.error);
