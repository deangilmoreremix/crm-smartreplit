import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Super Admin emails
const SUPER_ADMIN_EMAILS = [
  'dean@videoremix.io',
  'victor@videoremix.io', 
  'samuel@videoremix.io'
];

/**
 * Migrates existing users to new role structure
 * - Super admins: dean@, victor@, samuel@ → 'super_admin'
 * - All other existing users → 'wl_user' (since you said they're WL users)
 * - New users will default to 'regular_user'
 */
export async function migrateUserRoles() {
  console.log('🔄 Starting user role migration...');
  
  try {
    // Get all existing users from profiles table
    const { data: users, error: fetchError } = await supabase
      .from('profiles')
      .select('id, username, first_name, last_name, role')
      .order('created_at');

    if (fetchError) {
      throw new Error(`Failed to fetch users: ${fetchError.message}`);
    }

    if (!users || users.length === 0) {
      console.log('✅ No users found to migrate');
      return;
    }

    console.log(`📊 Found ${users.length} users to process`);

    const updates = [];
    let superAdmins = 0;
    let wlUsers = 0;
    let alreadyCorrect = 0;

    for (const user of users) {
      const email = user.username ? `${user.username}@videoremix.io` : null;
      let newRole: string;

      // Determine correct role
      if (email && SUPER_ADMIN_EMAILS.includes(email.toLowerCase())) {
        newRole = 'super_admin';
        superAdmins++;
      } else {
        // All existing users (except super admins) become WL users
        newRole = 'wl_user';
        wlUsers++;
      }

      // Only update if role is different
      if (user.role !== newRole) {
        updates.push({
          id: user.id,
          oldRole: user.role,
          newRole: newRole,
          name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
          username: user.username
        });
      } else {
        alreadyCorrect++;
      }
    }

    console.log(`\n📋 Migration Summary:`);
    console.log(`   Super Admins: ${superAdmins}`);
    console.log(`   WL Users: ${wlUsers}`);
    console.log(`   Already Correct: ${alreadyCorrect}`);
    console.log(`   Need Updates: ${updates.length}\n`);

    if (updates.length === 0) {
      console.log('✅ All users already have correct roles!');
      return;
    }

    // Show what will be updated
    console.log('🔄 Users to be updated:');
    updates.forEach(update => {
      console.log(`   ${update.name || update.username} (${update.username}): ${update.oldRole} → ${update.newRole}`);
    });

    // Perform the updates
    let successCount = 0;
    let errorCount = 0;

    for (const update of updates) {
      try {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ role: update.newRole })
          .eq('id', update.id);

        if (updateError) {
          console.error(`❌ Failed to update ${update.username}: ${updateError.message}`);
          errorCount++;
        } else {
          console.log(`✅ Updated ${update.username}: ${update.oldRole} → ${update.newRole}`);
          successCount++;
        }
      } catch (error) {
        console.error(`❌ Error updating ${update.username}:`, error);
        errorCount++;
      }
    }

    console.log(`\n🎉 Migration Complete!`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

/**
 * Gets current user role distribution
 */
export async function getUserRoleStats() {
  try {
    const { data: users, error } = await supabase
      .from('profiles')
      .select('role')
      .order('created_at');

    if (error) throw error;

    const stats: Record<string, number> = {};
    users?.forEach(user => {
      stats[user.role || 'unknown'] = (stats[user.role || 'unknown'] || 0) + 1;
    });

    return stats;
  } catch (error) {
    console.error('Failed to get user stats:', error);
    return {};
  }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateUserRoles()
    .then(() => {
      console.log('✅ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}