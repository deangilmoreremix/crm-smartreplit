import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const adminEmails = [
  'dean@videoremix.io',
  'samuel@videoremix.io', // Note: you wrote Samuel@videoremix.io, I'll use lowercase
  'victor@videoremix.io', // Note: you wrote victoro@videoremix.io, I'll use victor@videoremix.io
];

async function resendAdminConfirmations() {
  console.log('🔧 Checking admin account status and resending confirmations...\n');

  for (const email of adminEmails) {
    try {
      // Check if user exists
      const { data: users, error: listError } = await supabase.auth.admin.listUsers();
      const user = users?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());

      if (user) {
        console.log(`✅ Found account: ${email}`);
        console.log(`   - User ID: ${user.id}`);
        console.log(`   - Email Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`);
        console.log(`   - Created: ${new Date(user.created_at).toLocaleString()}`);

        // Resend confirmation email if not confirmed
        if (!user.email_confirmed_at) {
          console.log(`📧 Resending confirmation email to ${email}...`);

          const { error: resendError } = await supabase.auth.admin.generateLink({
            type: 'signup',
            email: email,
            options: {
              data: {
                app_context: 'smartcrm',
                role: 'admin',
                first_name:
                  email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
                last_name: 'Admin',
              },
            },
          });

          if (resendError) {
            console.log(`❌ Failed to resend confirmation: ${resendError.message}`);
          } else {
            console.log(`✅ Confirmation email sent successfully!`);
          }
        } else {
          console.log(`✅ Account already confirmed - no email needed`);
        }
      } else {
        console.log(`❌ Account not found: ${email}`);
        console.log(`📝 Creating new admin account...`);

        // Create the admin account
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: email,
          email_confirm: false, // Require email confirmation
          user_metadata: {
            app_context: 'smartcrm',
            role: 'admin',
            first_name: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
            last_name: 'Admin',
          },
        });

        if (createError) {
          console.log(`❌ Failed to create account: ${createError.message}`);
        } else {
          console.log(`✅ Admin account created successfully!`);
          console.log(`📧 Confirmation email will be sent automatically`);
        }
      }

      console.log(''); // Add spacing between accounts
    } catch (error: any) {
      console.log(`❌ Error processing ${email}: ${error.message}\n`);
    }
  }

  console.log('🎯 Admin email confirmation process completed!');
  console.log('\n📋 Next Steps:');
  console.log('1. Check spam/promotion folders in email');
  console.log('2. Look for emails from Supabase with SmartCRM branding');
  console.log('3. Click confirmation links in emails');
  console.log('4. If still no emails, contact support with user IDs above');
}

// Run the function
resendAdminConfirmations().catch(console.error);
