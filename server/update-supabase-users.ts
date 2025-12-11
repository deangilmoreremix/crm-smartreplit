import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Updates Supabase Auth user metadata to match profile roles
 * This ensures consistency between auth.users and profiles table
 */
export async function syncSupabaseAuthMetadata() {
  console.log('🔄 Syncing Supabase Auth metadata with profile roles...');
  
  try {
    // Get all profiles with their roles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, first_name, last_name, role')
      .order('created_at');

    if (profilesError) {
      throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
    }

    if (!profiles || profiles.length === 0) {
      console.log('✅ No profiles found');
      return;
    }

    console.log(`📊 Found ${profiles.length} profiles to sync`);

    let successCount = 0;
    let errorCount = 0;

    for (const profile of profiles) {
      try {
        // Update the auth user's metadata to match profile role
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          profile.id,
          {
            user_metadata: {
              first_name: profile.first_name,
              last_name: profile.last_name,
              role: profile.role,
              app_context: 'smartcrm',
              email_template_set: 'smartcrm',
              synced_at: new Date().toISOString()
            }
          }
        );

        if (updateError) {
          console.error(`❌ Failed to sync ${profile.username}: ${updateError.message}`);
          errorCount++;
        } else {
          console.log(`✅ Synced ${profile.username || profile.id}: role=${profile.role}`);
          successCount++;
        }
      } catch (error) {
        console.error(`❌ Error syncing ${profile.username}:`, error);
        errorCount++;
      }
    }

    console.log(`\n🎉 Metadata Sync Complete!`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);

  } catch (error) {
    console.error('❌ Metadata sync failed:', error);
    throw error;
  }
}

// Run sync if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  syncSupabaseAuthMetadata()
    .then(() => {
      console.log('✅ Metadata sync completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Metadata sync failed:', error);
      process.exit(1);
    });
}