import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Use service role key for admin operations

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const superAdmins = [
  { email: 'dean@smartcrm.vip', firstName: 'Dean', lastName: 'Gilmore' },
  { email: 'samuel@smartcrm.vip', firstName: 'Samuel', lastName: '' },
  { email: 'victor@smartcrm.vip', firstName: 'Victor', lastName: '' }
];

async function createSuperAdmins() {
  console.log('🚀 Creating super admin users...\n');

  for (const admin of superAdmins) {
    try {
      // Create user in Supabase Auth with temporary password
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: admin.email,
        password: 'VideoRemix2025', // Temporary password
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          first_name: admin.firstName,
          last_name: admin.lastName
        }
      });

      if (authError) {
        console.error(`❌ Error creating ${admin.email}:`, authError.message);
        continue;
      }

      console.log(`✅ Created auth user: ${admin.email}`);

      // Create profile with super_admin role
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          username: admin.email.split('@')[0],
          first_name: admin.firstName,
          last_name: admin.lastName,
          role: 'super_admin',
          product_tier: 'ai_boost_unlimited',
          app_context: 'smartcrm',
          email_template_set: 'smartcrm'
        });

      if (profileError) {
        console.error(`❌ Error creating profile for ${admin.email}:`, profileError.message);
      } else {
        console.log(`✅ Created profile with super_admin role: ${admin.email}\n`);
      }

    } catch (error: any) {
      console.error(`❌ Unexpected error for ${admin.email}:`, error.message);
    }
  }

  console.log('\n🎉 Super admin creation complete!');
  console.log('\n⚠️  IMPORTANT: These users should change their passwords immediately after first login.');
}

createSuperAdmins();
