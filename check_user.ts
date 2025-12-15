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

async function checkUser() {
  const { data: { users }, error } = await supabase.auth.admin.listUsers();

  if (error) {
    console.error('Error:', error);
    return;
  }

  const deanUser = users.find(u => u.email === 'dean@smartcrm.vip');
  console.log('Dean user:', deanUser ? {
    id: deanUser.id,
    email: deanUser.email,
    email_confirmed_at: deanUser.email_confirmed_at,
    created_at: deanUser.created_at,
    last_sign_in_at: deanUser.last_sign_in_at
  } : 'Not found');

  if (deanUser) {
    // Set a password for the user
    const { error: updateError } = await supabase.auth.admin.updateUserById(deanUser.id, {
      password: 'VideoRemix2025'
    });
    if (updateError) {
      console.error('Error updating password:', updateError);
    } else {
      console.log('Password set to VideoRemix2025 for dean@smartcrm.vip');
    }
  }
}

checkUser();