import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gadedbrnqzpfqtsdfzcg.supabase.co';
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhZGVkYnJucXpwZnF0c2RmemNnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjU2NjExNSwiZXhwIjoyMDU4MTQyMTE1fQ.8tJswPmNq0inajAtfMK6nINr-WQwE_vVJO13Aqf70-w';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function restoreKeith() {
  const newPassword = 'LXKTtPz6tkde#trr';
  const userEmail = 'keith@beappsolute.com';

  console.log('🔐 Restoring ' + userEmail + ' with password...');

  try {
    // Use generateLink with password to restore deleted user
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: userEmail,
      password: newPassword,
      options: {
        data: {
          first_name: 'Keith',
          role: 'wl_user',
          tier: 'basic',
        },
      },
    });

    if (error) {
      console.error('Error restoring user:', error);
      console.log('\n📝 Alternative: Restore manually in Supabase Dashboard:');
      console.log('   1. Go to Authentication → Users');
      console.log('   2. Enable "Show deleted users" filter');
      console.log('   3. Find keith@beappsolute.com');
      console.log('   4. Click "Restore" or "Recover"');
      return;
    }

    console.log('✅ User restored successfully!');
    console.log('📧 Recovery link sent to:', userEmail);
    console.log('🔑 Password set to:', newPassword);
    console.log('👤 Role: wl_user (whitelabel access)');
    console.log('💎 Tier: basic');
    console.log('\n📧 Action URL:', data.properties.action_link);
  } catch (err) {
    console.error('Error:', err);
  }
}

restoreKeith();
