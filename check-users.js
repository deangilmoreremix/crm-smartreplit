import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gadedbrnqzpfqtsdfzcg.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhZGVkYnJucXpwZnF0c2RmemNnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjU2NjExNSwiZXhwIjoyMDU4MTQyMTE1fQ.8tJswPmNq0inajAtfMK6nINr-WQwE_vVJO13Aqf70-w';

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
    const keith = userList.filter(u => 
      u.email && u.email.toLowerCase().includes('keith')
    );
    
    console.log('\n🔑 Users with "keith" in email:');
    keith.forEach(u => {
      console.log('  -', u.email, '| ID:', u.id, '| Deleted:', !u.deleted_at ? 'No' : 'Yes');
    });
    
    // Try to query directly by email using RPC
    console.log('\n📋 All user emails:');
    userList.forEach(u => console.log('  -', u.email));
    
  } catch (err) {
    console.error('Error:', err);
  }
}

findKeith();
