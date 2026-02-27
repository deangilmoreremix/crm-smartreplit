import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gadedbrnqzpfqtsdfzcg.supabase.co';
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhZGVkYnJucXpwZnF0c2RmemNnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjU2NjExNSwiZXhwIjoyMDU4MTQyMTE1fQ.8tJswPmNq0inajAtfMK6nINr-WQwE_vVJO13Aqf70-w';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function inviteKeith() {
  const newPassword = 'LXKTtPz6tkde#trr';
  const userEmail = 'keith@beappsolute.com';

  console.log('📧 Sending invite to ' + userEmail + '...');

  try {
    // Option 1: Use generateLink to create a password reset link for deleted user
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: userEmail,
      password: newPassword,
    });

    if (error) {
      console.error('Error generating link:', error);

      // Option 2: Try invite method
      console.log('\n🔄 Trying invite method...');
      const { data: invite, error: inviteError } =
        await supabase.auth.admin.inviteUserByEmail(userEmail);

      if (inviteError) {
        console.error('Invite error:', inviteError);
        console.log("\n⚠️  Keith's email was deleted from Supabase.");
        console.log('📝 To restore:');
        console.log('   1. Go to Supabase Dashboard → Authentication → Users');
        console.log('   2. Look for "Show deleted users" or filter option');
        console.log("   3. Restore Keith's account");
        console.log('   4. Then set password using updateUserById');
      } else {
        console.log('✅ Invite sent successfully!');
        console.log('📧 Keith will receive an email to set their password');
      }
      return;
    }

    console.log('✅ Recovery link generated!');
    console.log('📧 Action URL:', data.properties.action_link);
  } catch (err) {
    console.error('Error:', err);
  }
}

inviteKeith();
