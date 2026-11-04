import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gadedbrnqzpfqtsdfzcg.supabase.co';
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function findKeith() {
  console.log('🔍 Searching for keith@beappsolute.com...');

  try {
    // Try to list users with pagination
    const { data: users, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.error('Error:', error);
      return;
    }

    const userList = users.users || users.data || users;

    // Search for keith in all users
    const keith = userList.filter((u) => u.email && u.email.toLowerCase().includes('keith'));

    console.log('\n🔑 Users with "keith" in email:');
    keith.forEach((u) => {
      console.log('  -', u.email, '| ID:', u.id, '| Deleted:', !u.deleted_at ? 'No' : 'Yes');
    });

    // Try to query directly by email using RPC
    console.log('\n📋 All user emails:');
    userList.forEach((u) => console.log('  -', u.email));
  } catch (err) {
    console.error('Error:', err);
  }
}

findKeith();
