import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase not configured. Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestUsers() {
  console.log('Creating test users...\n');

  const testUsers = [
    {
      email: 'test-smartcrm@example.com',
      password: 'Test123!',
      name: 'SmartCRM User',
      tier: 'smartcrm',
    },
    {
      email: 'test-sales-maximizer@example.com',
      password: 'Test123!',
      name: 'Sales Maximizer User',
      tier: 'sales_maximizer',
    },
    {
      email: 'test-ai-boost@example.com',
      password: 'Test123!',
      name: 'AI Boost User',
      tier: 'ai_boost_unlimited',
    },
  ];

  for (const user of testUsers) {
    console.log(`\n📧 Creating user: ${user.email}`);

    // Check if user already exists
    const { data: existingUser } = await supabase.auth.admin.getUserByEmail(user.email);

    if (existingUser) {
      console.log(`⚠️  User already exists, updating product tier...`);

      // Update product tier in profiles table
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          product_tier: user.tier,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingUser.id);

      if (updateError) {
        console.error('❌ Error updating profile:', updateError);
      } else {
        // Update auth metadata
        await supabase.auth.admin.updateUserById(existingUser.id, {
          user_metadata: {
            full_name: user.name,
            product_tier: user.tier,
            app_context: 'smartcrm',
            email_template_set: 'smartcrm',
          },
        });
        console.log(`✅ Updated to ${user.tier} tier`);
      }
    } else {
      // Create new user
      const { data: newUser, error: signUpError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          full_name: user.name,
          product_tier: user.tier,
          app_context: 'smartcrm',
          email_template_set: 'smartcrm',
        },
      });

      if (signUpError) {
        console.error('❌ Error creating user:', signUpError);
        continue;
      }

      console.log(`✅ User created with ID: ${newUser.user.id}`);

      // Create/update profile
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: newUser.user.id,
        first_name: user.name.split(' ')[0],
        last_name: user.name.split(' ')[1] || '',
        role: 'regular_user',
        product_tier: user.tier,
        app_context: 'smartcrm',
        email_template_set: 'smartcrm',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (profileError) {
        console.error('❌ Error creating profile:', profileError);
      } else {
        console.log(`✅ Profile created with ${user.tier} tier`);
      }
    }
  }

  console.log('\n\n📋 Test Users Created:\n');
  console.log('══════════════════════════════════════════════════════════════');
  console.log('1. SmartCRM Base Tier (Dashboard, Contacts, Pipeline, Calendar)');
  console.log('   Email: test-smartcrm@example.com');
  console.log('   Password: Test123!');
  console.log('   Access: ✅ Dashboard, Contacts, Pipeline, Calendar, Communication');
  console.log('           ❌ AI Goals, AI Tools');
  console.log('');
  console.log('2. Sales Maximizer Tier (Base + AI Goals)');
  console.log('   Email: test-sales-maximizer@example.com');
  console.log('   Password: Test123!');
  console.log('   Access: ✅ Dashboard, Contacts, Pipeline, Calendar, Communication, AI Goals');
  console.log('           ❌ AI Tools');
  console.log('');
  console.log('3. AI Boost Unlimited (All Features)');
  console.log('   Email: test-ai-boost@example.com');
  console.log('   Password: Test123!');
  console.log(
    '   Access: ✅ All Features (Dashboard, Contacts, Pipeline, Calendar, AI Goals, AI Tools)'
  );
  console.log('══════════════════════════════════════════════════════════════\n');
}

createTestUsers().catch(console.error);
