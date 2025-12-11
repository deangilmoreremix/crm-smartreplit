import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createJVZooAdmin() {
  console.log('Creating JVZoo admin account...');

  const { data, error } = await supabase.auth.admin.createUser({
    email: 'jvzoo@gmail.com',
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
    console.error('❌ Error creating user:', error);
    return;
  }

  console.log('✅ JVZoo admin account created successfully!');
  console.log('📧 Email: jvzoo@gmail.com');
  console.log('🔑 Password: VideoRemix2025');
  console.log('👑 Role: super_admin');
  console.log('🎯 User ID:', data.user.id);
}

createJVZooAdmin();
