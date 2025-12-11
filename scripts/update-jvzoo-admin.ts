import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateJVZooAdmin() {
  console.log('Updating JVZoo admin account...');

  // First, find the user by email
  const { data: users, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.error('❌ Error listing users:', listError);
    return;
  }

  const jvzooUser = users.users.find(u => u.email === 'jvzoo@gmail.com');
  
  if (!jvzooUser) {
    console.error('❌ User not found');
    return;
  }

  // Update the user with new password and metadata
  const { data, error } = await supabase.auth.admin.updateUserById(jvzooUser.id, {
    password: 'VideoRemix2025',
    email_confirm: true,
    user_metadata: {
      first_name: 'JVZoo',
      last_name: 'Admin',
      role: 'super_admin',
      permissions: ['all'],
      app_context: 'smartcrm',
      email_template_set: 'smartcrm'
    }
  });

  if (error) {
    console.error('❌ Error updating user:', error);
    return;
  }

  console.log('✅ JVZoo admin account updated successfully!');
  console.log('📧 Email: jvzoo@gmail.com');
  console.log('🔑 Password: VideoRemix2025');
  console.log('👑 Role: super_admin (with all permissions)');
  console.log('🎯 User ID:', data.user.id);
  console.log('\n✨ JVZoo can now sign in at /signin with these credentials');
}

updateJVZooAdmin();
