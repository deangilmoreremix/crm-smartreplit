#!/usr/bin/env tsx
/**
 * Backfill user_entitlements table from existing auth.users metadata
 * This script ensures users who purchased apps can access them
 */

import { createClient } from '@supabase/supabase-js';
import { ProductTier } from '../shared/schema';

const supabaseUrl = process.env.SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const PRODUCT_TIERS: ProductTier[] = [
  'super_admin',
  'whitelabel',
  'smartcrm_bundle',
  'smartcrm',
  'sales_maximizer',
  'ai_boost_unlimited',
  'ai_communication',
];

function getPackageFromTier(productTier: ProductTier | null): 'smartmarketer' | 'super_admin' | 'whitelabel' | 'regular' | 'no_access' {
  if (!productTier) return 'regular';
  if (productTier === 'super_admin') return 'super_admin';
  if (productTier === 'whitelabel') return 'whitelabel';
  // All paid tiers map to smartmarketer
  if (PRODUCT_TIERS.includes(productTier)) return 'smartmarketer';
  return 'regular';
}

async function backfillUserEntitlements() {
  console.log('🔄 Starting user_entitlements backfill...\n');

  // Get all users via auth admin API
  const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();

  if (usersError) {
    console.error('❌ Error fetching users:', usersError);
    return;
  }

  const users = usersData?.users || [];
  console.log(`📊 Found ${users.length} users to process\n`);

  let updated = 0;
  let created = 0;
  let skipped = 0;
  let alreadyCorrect = 0;

  for (const user of users) {
    const email = user.email;
    const productTier = user.user_metadata?.product_tier as ProductTier;

    if (!email) {
      console.log(`⚠️ Skipping user ${user.id} - no email`);
      skipped++;
      continue;
    }

    const packageType = getPackageFromTier(productTier);
    const openclawEnabled = productTier === 'super_admin' || productTier === 'smartcrm_bundle';
    const adminEnabled = productTier === 'super_admin';

    // Check if user_entitlements record already exists
    const { data: existing } = await supabase
      .from('user_entitlements')
      .select('id, package')
      .eq('email', email)
      .single();

    if (existing) {
      // Update if different
      if (existing.package !== packageType) {
        const { error: updateError } = await supabase
          .from('user_entitlements')
          .update({
            package: packageType,
            openclaw_enabled: openclawEnabled,
            admin_enabled: adminEnabled,
            updated_at: new Date().toISOString(),
          })
          .eq('email', email);

        if (updateError) {
          console.error(`❌ Error updating ${email}:`, updateError);
        } else {
          console.log(`✅ Updated ${email}: ${existing.package} → ${packageType}`);
          updated++;
        }
      } else {
        alreadyCorrect++;
      }
    } else {
      // Create new record
      const { error: insertError } = await supabase
        .from('user_entitlements')
        .insert({
          email,
          user_id: user.id,
          package: packageType,
          openclaw_enabled: openclawEnabled,
          admin_enabled: adminEnabled,
          source: 'Backfilled from auth.users',
          notes: `Product tier: ${productTier || 'none'}`,
        });

      if (insertError) {
        console.error(`❌ Error creating ${email}:`, insertError);
      } else {
        console.log(`✅ Created ${email}: package=${packageType}`);
        created++;
      }
    }
  }

  console.log('\n📊 Backfill complete!');
  console.log(`   Updated: ${updated}`);
  console.log(`   Created: ${created}`);
  console.log(`   Already correct: ${alreadyCorrect}`);
  console.log(`   Skipped: ${skipped}`);
}

// Run the backfill
backfillUserEntitlements()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Backfill failed:', err);
    process.exit(1);
  });