import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createProfiles() {
  console.log('🔍 Finding existing auth users...\n');

  // Get all users to find our superadmins
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

  if (usersError) {
    console.error('❌ Error listing users:', usersError.message);
    return;
  }

  const superAdminEmails = ['dean@smartcrm.vip', 'samuel@smartcrm.vip', 'victor@smartcrm.vip'];
  const superAdminUsers = users.filter(u => superAdminEmails.includes(u.email || ''));

  console.log(`✅ Found ${superAdminUsers.length} super admin users\n`);

  for (const user of superAdminUsers) {
    const email = user.email!;
    const firstName = email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1);

    console.log(`Creating profile for ${email}...`);

    // Insert or update profile  
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        username: email === 'dean@smartcrm.vip' ? 'dean_admin' : email.split('@')[0],
        first_name: firstName,
        last_name: '',
        role: 'super_admin',
        app_context: 'smartcrm',
        email_template_set: 'smartcrm'
      }, {
        onConflict: 'id'
      });

    if (profileError) {
      console.error(`❌ Error creating profile for ${email}:`, profileError.message);
    } else {
      console.log(`✅ Profile created with super_admin role: ${email}\n`);
    }
  }

  console.log('🎉 Super admin profiles created!');
}

createProfiles();
