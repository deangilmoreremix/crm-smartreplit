import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

interface AuthUser {
  id: string;
  email: string;
  raw_user_meta_data: any;
  user_metadata: any;
  created_at: string;
}

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role: string | null;
  app_context: string | null;
  email_template_set: string | null;
}

async function backfillUserProfiles() {
  console.log('🔄 Starting user profile backfill...\n');

  try {
    // Get all auth users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError);
      return;
    }

    console.log(`📊 Found ${authUsers.users.length} auth users\n`);

    // Get all existing profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
      return;
    }

    const profileMap = new Map(profiles?.map((p: Profile) => [p.id, p]) || []);
    
    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const user of authUsers.users) {
      const existingProfile = profileMap.get(user.id);
      const metadata = user.raw_user_meta_data || user.user_metadata || {};
      
      // Determine role based on email
      const isSuperAdmin = ['dean@videoremix.io', 'victor@videoremix.io', 'samuel@videoremix.io', 'jvzoo@gmail.com'].includes(user.email || '');
      const role = isSuperAdmin ? 'super_admin' : (metadata.role || 'regular_user');
      
      const profileData = {
        id: user.id,
        username: metadata.username || user.email?.split('@')[0],
        first_name: metadata.first_name || metadata.firstName,
        last_name: metadata.last_name || metadata.lastName,
        role: role,
        avatar_url: metadata.avatar_url || metadata.avatarUrl,
        app_context: metadata.app_context || 'smartcrm',
        email_template_set: metadata.email_template_set || metadata.app_context || 'smartcrm',
        updated_at: new Date().toISOString()
      };

      if (!existingProfile) {
        // Create new profile
        const { error } = await supabase
          .from('profiles')
          .insert(profileData);
        
        if (error) {
          console.error(`❌ Error creating profile for ${user.email}:`, error.message);
        } else {
          console.log(`✅ Created profile for ${user.email} (${role})`);
          created++;
        }
      } else {
        // Check if profile needs updating
        const needsUpdate = 
          !existingProfile.first_name || 
          !existingProfile.last_name || 
          !existingProfile.app_context || 
          !existingProfile.email_template_set ||
          existingProfile.role !== role;

        if (needsUpdate) {
          const { error } = await supabase
            .from('profiles')
            .update({
              first_name: profileData.first_name || existingProfile.first_name,
              last_name: profileData.last_name || existingProfile.last_name,
              role: profileData.role,
              app_context: profileData.app_context || existingProfile.app_context,
              email_template_set: profileData.email_template_set || existingProfile.email_template_set,
              updated_at: profileData.updated_at
            })
            .eq('id', user.id);

          if (error) {
            console.error(`❌ Error updating profile for ${user.email}:`, error.message);
          } else {
            console.log(`🔄 Updated profile for ${user.email} (${role})`);
            updated++;
          }
        } else {
          console.log(`⏭️  Skipped ${user.email} - profile already complete`);
          skipped++;
        }
      }
    }

    console.log('\n📈 Backfill Summary:');
    console.log(`  ✅ Created: ${created}`);
    console.log(`  🔄 Updated: ${updated}`);
    console.log(`  ⏭️  Skipped: ${skipped}`);
    console.log(`  📊 Total: ${authUsers.users.length}`);

  } catch (error) {
    console.error('❌ Backfill failed:', error);
  }
}

// Run the backfill
backfillUserProfiles().then(() => {
  console.log('\n✨ Backfill complete!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
