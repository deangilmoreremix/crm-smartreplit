#!/usr/bin/env tsx
/**
 * Setup whitelabel users from seed_whitelabel.sql
 * This script:
 * 1. Creates users in Supabase Auth if they don't exist
 * 2. Sets up their profiles with whitelabel product_tier
 * 3. Creates user_entitlements records for feature access
 * 4. Creates entitlements records for subscription tracking
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

// Whitelabel users from seed_whitelabel.sql
const WHITELABEL_USERS = [
  { email: 'fredrik.kaada@gmail.com', first_name: 'Fredrik Asche', last_name: 'Kaa', notes: 'Fredrik Asche Kaada - Whitelabel lifetime buyer' },
  { email: 'bayonnca@yahoo.com', first_name: 'Carolyn', last_name: 'Bayonne', notes: 'Carolyn Bayonne - Whitelabel lifetime buyer' },
  { email: 'trcole3@theritegroup.com', first_name: 'Truman', last_name: 'Cole', notes: 'Truman Cole - Whitelabel lifetime buyer' },
  { email: 'charles@charlesedge.net', first_name: 'Charles', last_name: 'Edgerton', notes: 'Charles Edgerton - Whitelabel lifetime buyer' },
  { email: 'james.otto.gray@gmail.com', first_name: 'James', last_name: 'Gray', notes: 'James Gray - Whitelabel lifetime buyer' },
  { email: 'tomnus@msn.com', first_name: 'Thomas', last_name: 'Omnus', notes: 'Thomas Omnus - Whitelabel lifetime buyer' },
  { email: 'jehpruitt@gmail.com', first_name: 'Jermelle', last_name: 'Pruitt', notes: 'Jermelle Pruitt - Whitelabel lifetime buyer' },
  { email: 'rinslr@earthlink.net', first_name: 'William', last_name: 'Roberts', notes: 'William Roberts - Whitelabel lifetime buyer' },
  { email: 'jwnet2044@yahoo.com', first_name: 'Joseph', last_name: 'Steffey', notes: 'Joseph Steffey - Whitelabel lifetime buyer' },
  { email: 'rthompson98@yahoo.com', first_name: 'Rodney', last_name: 'Thompson', notes: 'Rodney Thompson - Whitelabel lifetime buyer' },
];

async function userExists(email: string): Promise<{ exists: boolean; id?: string; user?: any }> {
  // Fetch ALL users with pagination
  let allUsers: any[] = [];
  let page = 1;
  
  while (true) {
    const { data } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
    const users = (data as any)?.users || [];
    allUsers = allUsers.concat(users);
    if (users.length < 100) break;
    page++;
  }
  
  const user = allUsers.find((u: any) => u.email === email);
  return user ? { exists: true, id: user.id, user } : { exists: false };
}

async function createUser(email: string, firstName: string, lastName: string): Promise<string | null> {
  const tempPassword = Math.random().toString(36).slice(-12) + 'Aa1!';
  
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: {
      first_name: firstName,
      last_name: lastName,
      app_context: 'smartcrm',
      email_template_set: 'smartcrm',
      product_tier: 'whitelabel',
      bulk_imported: true,
      imported_at: new Date().toISOString(),
    },
  });

  if (error) {
    console.error(`❌ Error creating user ${email}:`, error.message);
    return null;
  }

  console.log(`✅ Created user: ${email}`);
  return data.user?.id || null;
}

async function setupUserProfile(userId: string, email: string, firstName: string, lastName: string) {
  // Update the profile via the profiles table
  // Note: app_context and email_template_set may not exist in all schemas
  const profileData: any = {
    id: userId,
    first_name: firstName,
    last_name: lastName,
    username: email.split('@')[0],
    product_tier: 'whitelabel',
    updated_at: new Date().toISOString(),
  };
  
  // Add optional columns if they exist
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert(profileData, { onConflict: 'id' });

  if (profileError) {
    console.error(`❌ Error updating profile for ${email}:`, profileError.message);
  } else {
    console.log(`✅ Updated profile for: ${email}`);
  }
}

async function setupUserEntitlement(email: string, userId: string, notes: string) {
  const { error } = await supabase
    .from('user_entitlements')
    .upsert({
      email,
      user_id: userId,
      package: 'whitelabel',
      openclaw_enabled: false,
      admin_enabled: false,
      source: 'Smart CRM Whitelabel Lifetime',
      notes,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'email' });

  if (error) {
    console.error(`❌ Error creating user_entitlement for ${email}:`, error.message);
  } else {
    console.log(`✅ Created user_entitlement for: ${email}`);
  }
}

async function setupEntitlement(userId: string) {
  const { error } = await supabase
    .from('entitlements')
    .upsert({
      user_id: userId,
      status: 'active',
      product_type: 'lifetime',
      plan_name: 'Smart CRM Whitelabel Lifetime',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

  if (error) {
    console.error(`❌ Error creating entitlement for user ${userId}:`, error.message);
  } else {
    console.log(`✅ Created entitlement for user: ${userId}`);
  }
}

async function setupWhitelabelUsers() {
  console.log('🔄 Setting up whitelabel users...\n');

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const user of WHITELABEL_USERS) {
    console.log(`\nProcessing: ${user.email}`);
    
    const { exists, id: existingId, user: existingUser } = await userExists(user.email);

    let userId: string;

    if (exists && existingId) {
      console.log(`   User already exists, updating...`);
      userId = existingId;
      updated++;
      
      // Update metadata for existing user
      const { error: updateError } = await supabase.auth.admin.updateUserById(existingId, {
        user_metadata: {
          ...existingUser?.user_metadata,
          product_tier: 'whitelabel',
          app_context: 'smartcrm',
        },
      });
      
      if (updateError) {
        console.error(`   ❌ Error updating metadata:`, updateError.message);
      }
    } else {
      userId = await createUser(user.email, user.first_name, user.last_name);
      if (!userId) {
        skipped++;
        continue;
      }
      created++;
    }

    if (userId) {
      await setupUserProfile(userId, user.email, user.first_name, user.last_name);
      await setupUserEntitlement(user.email, userId, user.notes);
      await setupEntitlement(userId);
    }
  }

  console.log('\n📊 Whitelabel setup complete!');
  console.log(`   Created: ${created}`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Skipped: ${skipped}`);
}

// Run the setup
setupWhitelabelUsers()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Setup failed:', err);
    process.exit(1);
  });