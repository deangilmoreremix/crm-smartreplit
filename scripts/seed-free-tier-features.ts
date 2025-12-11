import { db } from '../server/db';
import { features, tierFeatures } from '../shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Seed Free Tier Features
 * 
 * FREE tier gets minimal access to demonstrate the app:
 * - Dashboard (view only)
 * - Limited contacts view (no editing)
 * 
 * This prevents abuse while allowing users to see the value of upgrading
 */

async function seedFreeTierFeatures() {
  console.log('🆓 Seeding FREE tier features...');

  try {
    // Get all features
    const allFeatures = await db.select().from(features);
    console.log(`📊 Found ${allFeatures.length} total features`);

    // Define which features are included in FREE tier
    const freeFeatureKeys = [
      'dashboard',  // Allow dashboard view only
    ];

    // Get feature IDs for FREE tier
    const freeTierFeatureIds = allFeatures
      .filter(f => freeFeatureKeys.includes(f.featureKey))
      .map(f => f.id);

    console.log(`✅ FREE tier will include ${freeTierFeatureIds.length} features:`, freeFeatureKeys);

    // Clear existing FREE tier features
    await db.delete(tierFeatures).where(eq(tierFeatures.productTier, 'free'));
    console.log('🧹 Cleared existing FREE tier features');

    // Insert FREE tier features
    for (const featureId of freeTierFeatureIds) {
      await db.insert(tierFeatures).values({
        productTier: 'free',
        featureId,
        includedByDefault: true,
      });
    }

    console.log('✅ FREE tier features seeded successfully!');
    console.log(`
    📋 FREE Tier Summary:
    - Product Tier: free
    - Features Included: ${freeFeatureKeys.length}
    - Features: ${freeFeatureKeys.join(', ')}
    
    🎯 This tier allows new users to see the dashboard but requires
       upgrade for contacts, pipeline, AI tools, and other features.
    `);

  } catch (error) {
    console.error('❌ Error seeding FREE tier features:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

// Run the seed script
seedFreeTierFeatures();
