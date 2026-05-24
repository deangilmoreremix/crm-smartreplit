#!/usr/bin/env tsx
/**
 * Import users from Users_Not_in_New_SmartCRM CSV
 * Sets up proper entitlements based on Campaign column
 * 
 * Campaign mappings:
 * - "Smart Marketer Elite - Private Promo" -> smartmarketer
 * - "Smart Marketer A.I." -> smartmarketer
 * - "SmartCRM Old" -> smartcrm (basic tier)
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

// Campaign to package mapping
function getPackageFromCampaign(campaign: string): 'smartmarketer' | 'smartcrm' | 'regular' {
  const normalized = campaign?.toLowerCase() || '';
  
  if (normalized.includes('smart marketer elite') || normalized.includes('smart marketer a.i.') || normalized.includes('smart marketer')) {
    return 'smartmarketer';
  }
  
  if (normalized.includes('smartcrm old')) {
    return 'smartcrm';
  }
  
  return 'regular';
}

function getProductTierFromPackage(pkg: 'smartmarketer' | 'smartcrm' | 'regular'): 'smartmarketer' | 'smartcrm' | null {
  // Map package to product_tier
  if (pkg === 'smartmarketer') return 'smartmarketer';
  if (pkg === 'smartcrm') return 'smartcrm';
  return null; // regular users have null product_tier
}

async function userExists(email: string): Promise<{ exists: boolean; id?: string; user?: any }> {
  const { data: listData } = await supabase.auth.admin.listUsers();
  const users = (listData as any)?.users || [];
  const user = users.find((u: any) => u.email === email);
  return user ? { exists: true, id: user.id, user } : { exists: false };
}

async function createUser(email: string, firstName: string, lastName: string, packageType: 'smartmarketer' | 'smartcrm' | 'regular'): Promise<string | null> {
  const tempPassword = Math.random().toString(36).slice(-12) + 'Aa1!';
  const productTier = getProductTierFromPackage(packageType);
  
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: {
      first_name: firstName,
      last_name: lastName,
      app_context: 'smartcrm',
      email_template_set: 'smartcrm',
      product_tier: productTier,
      bulk_imported: true,
      imported_at: new Date().toISOString(),
    },
  });

  if (error) {
    console.error(`❌ Error creating user ${email}:`, error.message);
    return null;
  }

  console.log(`✅ Created user: ${email} (${packageType})`);
  return data.user?.id || null;
}

async function setupUserProfile(userId: string, email: string, firstName: string, lastName: string, packageType: 'smartmarketer' | 'smartcrm' | 'regular') {
  const productTier = getProductTierFromPackage(packageType);
  
  const { error } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      first_name: firstName,
      last_name: lastName,
      username: email.split('@')[0],
      product_tier: productTier,
      app_context: 'smartcrm',
      email_template_set: 'smartcrm',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

  if (error) {
    console.error(`❌ Error updating profile for ${email}:`, error.message);
  }
}

async function setupUserEntitlement(email: string, userId: string, packageType: 'smartmarketer' | 'smartcrm' | 'regular', campaign: string) {
  const { error } = await supabase
    .from('user_entitlements')
    .upsert({
      email,
      user_id: userId,
      package: packageType,
      openclaw_enabled: false,
      admin_enabled: false,
      source: campaign,
      notes: `Imported from Users_Not_in_New_SmartCRM CSV - ${campaign}`,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'email' });

  if (error) {
    console.error(`❌ Error creating user_entitlement for ${email}:`, error.message);
  }
}

async function setupEntitlement(userId: string, packageType: 'smartmarketer' | 'smartcrm' | 'regular') {
  if (packageType === 'regular') return; // No entitlement needed for regular users
  
  const { error } = await supabase
    .from('entitlements')
    .upsert({
      user_id: userId,
      status: 'active',
      product_type: 'lifetime',
      plan_name: packageType === 'smartmarketer' ? 'Smart Marketer' : 'SmartCRM',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

  if (error) {
    console.error(`❌ Error creating entitlement for user ${userId}:`, error.message);
  }
}
function parseCSV(csvContent: string) {
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
  
  const users: Array<{
    first_name: string;
    last_name: string;
    email: string;
    campaign: string;
  }> = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    const user: any = {};
    
    headers.forEach((header, index) => {
      if (values[index]) {
        user[header] = values[index];
      }
    });

    if (user['customer email'] && user['first name'] && user['last name'] && user.campaign) {
      users.push({
        first_name: user['first name'],
        last_name: user['last name'],
        email: user['customer email'],
        campaign: user.campaign,
      });
    }
  }

  return users;
}

async function importCSVUsers(csvContent: string) {
  console.log('🔄 Importing users from CSV...\n');

  const users = parseCSV(csvContent);
  console.log(`📊 Found ${users.length} users to process\n`);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const user of users) {
    const packageType = getPackageFromCampaign(user.campaign);
    console.log(`\nProcessing: ${user.email} (${user.campaign} -> ${packageType})`);
    
    const { exists, id: existingId, user: existingUser } = await userExists(user.email);

    let userId: string;

    if (exists && existingId) {
      console.log(`   User already exists, updating...`);
      userId = existingId;
      updated++;
      
      // Update metadata
      const { error: updateError } = await supabase.auth.admin.updateUserById(existingId, {
        user_metadata: {
          ...existingUser?.user_metadata,
          product_tier: getProductTierFromPackage(packageType),
        },
      });
      
      if (updateError) {
        console.error(`   ❌ Error updating metadata:`, updateError.message);
      }
    } else {
      userId = await createUser(user.email, user.first_name, user.last_name, packageType);
      if (!userId) {
        skipped++;
        continue;
      }
      created++;
    }

    if (userId) {
      await setupUserProfile(userId, user.email, user.first_name, user.last_name, packageType);
      await setupUserEntitlement(user.email, userId, packageType, user.campaign);
      await setupEntitlement(userId, packageType);
    }
  }

  console.log('\n📊 CSV import complete!');
  console.log(`   Created: ${created}`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Skipped: ${skipped}`);
}

// Read CSV file
async function main() {
  const fs = await import('fs');
  const path = await import('path');
  
  const csvPath = path.join(process.cwd(), 'attached_assets/Users_Not_in_New_SmartCRM_1764606814141.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ CSV file not found at: ${csvPath}`);
    process.exit(1);
  }

  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  await importCSVUsers(csvContent);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Import failed:', err);
    process.exit(1);
  });