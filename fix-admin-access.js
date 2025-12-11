
const { createClient } = require('@supabase/supabase-js');

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

async function fixAdminAccess() {
  console.log('🔧 Fixing admin access for VideoRemix team...\n');

  try {
    for (const email of ADMIN_EMAILS) {
      console.log(`--- Processing ${email} ---`);
      
      // Check if user exists
      const { data: users } = await supabase.auth.admin.listUsers();
      let user = users?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
      
      if (!user) {
        console.log('📝 Creating new admin user...');
        
        // Create user
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: email,
          email_confirm: true, // Auto-confirm email
          user_metadata: {
            first_name: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
            last_name: 'Admin',
            role: 'super_admin',
            app_context: 'smartcrm',
            email_template_set: 'smartcrm'
          }
        });
        
        if (createError) {
          console.error(`❌ Failed to create user: ${createError.message}`);
          continue;
        }
        
        user = newUser.user;
        console.log(`✅ User created with ID: ${user?.id}`);
      } else {
        console.log(`✅ User exists with ID: ${user.id}`);
        
        // Update user metadata to ensure proper role
        const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
          email_confirm: true,
          user_metadata: {
            ...user.user_metadata,
            role: 'super_admin',
            app_context: 'smartcrm',
            email_template_set: 'smartcrm',
            first_name: user.user_metadata?.first_name || email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
            last_name: user.user_metadata?.last_name || 'Admin'
          }
        });
        
        if (updateError) {
          console.error(`❌ Failed to update user metadata: ${updateError.message}`);
        } else {
          console.log(`✅ User metadata updated`);
        }
      }
      
      // Ensure profile exists with correct role
      if (user) {
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (!existingProfile) {
          console.log('📝 Creating profile...');
          
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              username: email.split('@')[0],
              first_name: user.user_metadata?.first_name || email.split('@')[0],
              last_name: user.user_metadata?.last_name || 'Admin',
              role: 'super_admin',
              status: 'active'
            });
          
          if (profileError) {
            console.error(`❌ Failed to create profile: ${profileError.message}`);
          } else {
            console.log(`✅ Profile created`);
          }
        } else {
          console.log('📝 Updating existing profile...');
          
          const { error: profileUpdateError } = await supabase
            .from('profiles')
            .update({
              role: 'super_admin',
              status: 'active',
              username: email.split('@')[0],
              first_name: user.user_metadata?.first_name || email.split('@')[0],
              last_name: user.user_metadata?.last_name || 'Admin'
            })
            .eq('id', user.id);
          
          if (profileUpdateError) {
            console.error(`❌ Failed to update profile: ${profileUpdateError.message}`);
          } else {
            console.log(`✅ Profile updated`);
          }
        }
        
        // Generate a sign-in link
        console.log('🔗 Generating sign-in link...');
        const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
          type: 'magiclink',
          email: email,
          options: {
            redirectTo: 'https://smartcrm-videoremix.replit.app/auth/callback'
          }
        });
        
        if (linkError) {
          console.error(`❌ Failed to generate link: ${linkError.message}`);
        } else {
          console.log(`✅ Magic link: ${linkData.properties?.action_link}`);
        }
      }
      
      console.log('');
    }
    
    console.log('🎉 Admin access fix complete!');
    console.log('\n📋 Next Steps:');
    console.log('1. Use the magic links above to sign in');
    console.log('2. Or use the dev bypass: https://smartcrm-videoremix.replit.app/dev');
    console.log('3. Check User Management page to verify admin roles');

  } catch (error) {
    console.error('❌ Fix failed:', error);
  }
}

// Run the fix
fixAdminAccess()
  .then(() => {
    console.log('\n✅ Admin fix script complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fix script failed:', error);
    process.exit(1);
  });
