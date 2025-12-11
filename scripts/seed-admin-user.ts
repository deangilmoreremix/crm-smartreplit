import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://gadedbrnqzpfqtsdfzcg.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

interface TestUser {
  email: string;
  password: string;
  productTier: string | null;
  role: string;
  firstName: string;
  lastName: string;
}

const testUsers: TestUser[] = [
  {
    email: 'dean@smartcrm.vip',
    password: 'VideoRemix2025',
    productTier: 'super_admin',
    role: 'super_admin',
    firstName: 'Dean',
    lastName: 'Admin'
  },
  {
    email: 'dean@videoremix.io',
    password: 'VideoRemix2025',
    productTier: 'super_admin',
    role: 'super_admin',
    firstName: 'Dean',
    lastName: 'VideoRemix'
  },
  {
    email: 'test-whitelabel@smartcrm.test',
    password: 'TestUser2025!',
    productTier: 'whitelabel',
    role: 'wl_user',
    firstName: 'Test',
    lastName: 'Whitelabel'
  },
  {
    email: 'test-bundle@smartcrm.test',
    password: 'TestUser2025!',
    productTier: 'smartcrm_bundle',
    role: 'user',
    firstName: 'Test',
    lastName: 'Bundle'
  },
  {
    email: 'test-smartcrm@smartcrm.test',
    password: 'TestUser2025!',
    productTier: 'smartcrm',
    role: 'user',
    firstName: 'Test',
    lastName: 'SmartCRM'
  },
  {
    email: 'test-sales@smartcrm.test',
    password: 'TestUser2025!',
    productTier: 'sales_maximizer',
    role: 'user',
    firstName: 'Test',
    lastName: 'Sales'
  },
  {
    email: 'test-aiboost@smartcrm.test',
    password: 'TestUser2025!',
    productTier: 'ai_boost_unlimited',
    role: 'user',
    firstName: 'Test',
    lastName: 'AIBoost'
  },
  {
    email: 'test-aicomm@smartcrm.test',
    password: 'TestUser2025!',
    productTier: 'ai_communication',
    role: 'user',
    firstName: 'Test',
    lastName: 'AIComm'
  },
  {
    email: 'test-free@smartcrm.test',
    password: 'TestUser2025!',
    productTier: null,
    role: 'user',
    firstName: 'Test',
    lastName: 'FreeUser'
  }
];

async function seedUsers() {
  console.log('🌱 Seeding test users to Supabase...\n');

  for (const user of testUsers) {
    try {
      console.log(`\n📧 Processing ${user.email}...`);

      const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
      
      if (listError) {
        console.error(`  ❌ Error checking existing users: ${listError.message}`);
        continue;
      }

      const existingUser = existingUsers.users.find(u => u.email === user.email);

      if (existingUser) {
        console.log(`  ⚠️ User already exists, updating...`);
        
        const { error: updateError } = await supabase.auth.admin.updateUserById(existingUser.id, {
          password: user.password,
          email_confirm: true,
          user_metadata: {
            first_name: user.firstName,
            last_name: user.lastName,
            product_tier: user.productTier,
            role: user.role
          }
        });

        if (updateError) {
          console.error(`  ❌ Failed to update: ${updateError.message}`);
        } else {
          console.log(`  ✅ Updated successfully`);
        }
      } else {
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
          user_metadata: {
            first_name: user.firstName,
            last_name: user.lastName,
            product_tier: user.productTier,
            role: user.role
          }
        });

        if (createError) {
          console.error(`  ❌ Failed to create: ${createError.message}`);
        } else {
          console.log(`  ✅ Created successfully (ID: ${newUser.user?.id})`);
        }
      }

      console.log(`  📋 Tier: ${user.productTier || 'none'}, Role: ${user.role}`);
    } catch (err: any) {
      console.error(`  ❌ Error: ${err.message}`);
    }
  }

  console.log('\n✨ Seeding complete!\n');
  console.log('Test accounts:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  testUsers.forEach(u => {
    console.log(`  ${u.email} / ${u.password} (${u.productTier || 'no tier'})`);
  });
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

seedUsers().catch(console.error);
