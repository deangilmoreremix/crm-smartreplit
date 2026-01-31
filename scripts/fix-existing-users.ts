#!/usr/bin/env tsx
/**
 * Fix Existing Users Script
 *
 * This script creates profiles for existing auth.users who don't have
 * corresponding records in the public.profiles table.
 *
 * Usage:
 *   npx tsx scripts/fix-existing-users.ts
 *
 * Environment variables required:
 *   - SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('  - SUPABASE_URL or VITE_SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Super admin emails
const SUPER_ADMIN_EMAILS = [
  'dean@videoremix.io',
  'victor@videoremix.io',
  'samuel@videoremix.io',
  'dean@smartcrm.vip',
  'jvzoo@gmail.com'
];

async function fixExistingUsers() {
  console.log('🔧 Starting fix for existing users...\n');

  try {
    // Get all auth users
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) throw authError;

    console.log(`📊 Found ${authData.users.length} total users in auth.users`);

    // Get all existing profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id');

    if (profilesError) throw profilesError;

    const existingProfileIds = new Set(profiles?.map(p => p.id) || []);
    console.log(`📊 Found ${existingProfileIds.size} existing profiles\n`);

    // Find users without profiles
    const usersWithoutProfiles = authData.users.filter(u => !existingProfileIds.has(u.id));
    console.log(`⚠️  Found ${usersWithoutProfiles.length} users without profiles\n`);

    if (usersWithoutProfiles.length === 0) {
      console.log('✅ All users have profiles. No action needed.');
      return;
    }

    // Create profiles for users without them
    let created = 0;
    let failed = 0;

    for (const user of usersWithoutProfiles) {
      const email = user.email || '';
      const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(email.toLowerCase());
      const role = isSuperAdmin ? 'super_admin' : (user.user_metadata?.role || 'regular_user');
      const username = user.user_metadata?.username || email.split('@')[0] || 'user';
      const firstName = user.user_metadata?.first_name || '';
      const lastName = user.user_metadata?.last_name || '';

      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          username: username,
          first_name: firstName,
          last_name: lastName,
          role: role,
          avatar_url: user.user_metadata?.avatar_url || null,
          app_context: user.user_metadata?.app_context || 'smartcrm',
          email_template_set: user.user_metadata?.email_template_set || 'smartcrm',
          created_at: user.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertError) {
        console.error(`❌ Failed to create profile for ${email}:`, insertError.message);
        failed++;
      } else {
        console.log(`✅ Created profile for ${email} (role: ${role})`);
        created++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Created: ${created}`);
    console.log(`   Failed:  ${failed}`);
    console.log(`   Total:   ${usersWithoutProfiles.length}`);

    // Verify the fix
    console.log('\n🔍 Verifying fix...');
    const { data: verifyProfiles } = await supabase
      .from('profiles')
      .select('id');

    const newProfileCount = verifyProfiles?.length || 0;
    console.log(`   Profiles before: ${existingProfileIds.size}`);
    console.log(`   Profiles after:  ${newProfileCount}`);
    console.log(`   Difference:      ${newProfileCount - existingProfileIds.size}`);

    if (failed === 0) {
      console.log('\n✅ All profiles created successfully!');
    } else {
      console.log(`\n⚠️  ${failed} profiles failed to create. Check errors above.`);
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the fix
fixExistingUsers();
