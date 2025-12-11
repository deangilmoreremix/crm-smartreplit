import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function insertProfiles() {
  console.log('🔍 Getting super admin users...\n');

  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.error('Error:', error);
    return;
  }

  const emails = ['dean@smartcrm.vip', 'samuel@smartcrm.vip', 'victor@smartcrm.vip'];
  const admins = users.filter(u => emails.includes(u.email || ''));

  console.log(`Found ${admins.length} users\n`);

  for (const user of admins) {
    console.log(`Inserting profile for ${user.email}...`);
    
    const { data, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        role: 'super_admin',
        username: user.email?.split('@')[0]
      })
      .select();

    if (insertError) {
      console.error(`Error: ${insertError.message}`);
    } else {
      console.log(`✅ Success!\n`);
    }
  }
}

insertProfiles();
