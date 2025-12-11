
const { createClient } = require('@supabase/supabase-js');

// Get Supabase credentials from environment or use defaults
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-key';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const ADMIN_EMAILS = [
  'victor@videoremix.io',
  'samuel@videoremix.io', 
  'dean@videoremix.io'
];

async function checkAdminStatus() {
  console.log('🔍 Checking admin status for VideoRemix team...\n');

  try {
    // Get all users from Supabase Auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError.message);
      return;
    }

    // Get all profiles from database
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .in('username', ADMIN_EMAILS.map(email => email.split('@')[0]));

    if (profileError) {
      console.log('⚠️ Could not fetch profiles (table may not exist):', profileError.message);
    }

    console.log('📊 Admin Status Report:\n');

    for (const email of ADMIN_EMAILS) {
      console.log(`--- ${email} ---`);
      
      // Check in auth users
      const authUser = authUsers.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
      
      if (authUser) {
        console.log(`✅ Auth User: Found (ID: ${authUser.id})`);
        console.log(`   Email Confirmed: ${authUser.email_confirmed_at ? '✅ Yes' : '❌ No'}`);
        console.log(`   Last Sign In: ${authUser.last_sign_in_at || 'Never'}`);
        console.log(`   Created: ${authUser.created_at}`);
        console.log(`   Role in Metadata: ${authUser.user_metadata?.role || 'Not set'}`);
        console.log(`   App Context: ${authUser.user_metadata?.app_context || 'Not set'}`);
        
        // Check profile
        const username = email.split('@')[0];
        const profile = profiles?.find(p => p.username === username || p.id === authUser.id);
        
        if (profile) {
          console.log(`✅ Profile: Found (Role: ${profile.role})`);
        } else {
          console.log(`❌ Profile: Not found in database`);
        }
      } else {
        console.log(`❌ Auth User: Not found`);
        console.log(`❌ Profile: Cannot check without auth user`);
      }
      console.log('');
    }

    // Summary
    const foundUsers = ADMIN_EMAILS.filter(email => 
      authUsers.users?.some(u => u.email?.toLowerCase() === email.toLowerCase())
    );
    
    const confirmedUsers = ADMIN_EMAILS.filter(email => {
      const user = authUsers.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
      return user?.email_confirmed_at;
    });

    const adminRoleUsers = ADMIN_EMAILS.filter(email => {
      const user = authUsers.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
      const profile = profiles?.find(p => p.username === email.split('@')[0] || p.id === user?.id);
      return user?.user_metadata?.role === 'super_admin' || profile?.role === 'super_admin';
    });

    console.log('📈 Summary:');
    console.log(`   Users Found: ${foundUsers.length}/3`);
    console.log(`   Email Confirmed: ${confirmedUsers.length}/3`);
    console.log(`   Have Admin Role: ${adminRoleUsers.length}/3`);

    if (foundUsers.length < 3) {
      console.log('\n🔧 Missing users need to be created');
    }
    if (confirmedUsers.length < foundUsers.length) {
      console.log('\n🔧 Some users need email confirmation');
    }
    if (adminRoleUsers.length < foundUsers.length) {
      console.log('\n🔧 Some users need admin role assignment');
    }

  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

// Run the check
checkAdminStatus()
  .then(() => {
    console.log('\n✅ Admin status check complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Check failed:', error);
    process.exit(1);
  });
