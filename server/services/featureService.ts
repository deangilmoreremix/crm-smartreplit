import { db } from "../db";
import { features, userFeatures, tierFeatures, featureUsage, profiles } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";

export class FeatureService {
  /**
   * Get all features with optional filtering
   */
  async getAllFeatures(filters?: { category?: string; isEnabled?: boolean }) {
    const conditions = [];
    
    if (filters?.category) {
      conditions.push(eq(features.category, filters.category));
    }
    
    if (filters?.isEnabled !== undefined) {
      conditions.push(eq(features.isEnabled, filters.isEnabled));
    }
    
    if (conditions.length === 0) {
      return await db.select().from(features);
    } else if (conditions.length === 1) {
      return await db.select().from(features).where(conditions[0]);
    } else {
      return await db.select().from(features).where(and(...conditions));
    }
  }

  /**
   * Get a single feature by ID or key
   */
  async getFeature(idOrKey: number | string) {
    if (typeof idOrKey === 'number') {
      const result = await db.select().from(features).where(eq(features.id, idOrKey));
      return result[0];
    } else {
      const result = await db.select().from(features).where(eq(features.featureKey, idOrKey));
      return result[0];
    }
  }

  /**
   * Create a new feature
   */
  async createFeature(featureData: {
    featureKey: string;
    name: string;
    description?: string;
    category: string;
    isEnabled?: boolean;
    dependsOn?: string[];
    metadata?: any;
  }) {
    const result = await db.insert(features).values(featureData).returning();
    return result[0];
  }

  /**
   * Update an existing feature
   */
  async updateFeature(id: number, updates: Partial<{
    name: string;
    description: string;
    category: string;
    isEnabled: boolean;
    dependsOn: string[];
    metadata: any;
  }>) {
    const result = await db.update(features)
      .set({ ...updates, updatedAt: sql`NOW()` })
      .where(eq(features.id, id))
      .returning();
    return result[0];
  }

  /**
   * Delete a feature
   */
  async deleteFeature(id: number) {
    // Delete related records first
    await db.delete(userFeatures).where(eq(userFeatures.featureId, id));
    await db.delete(tierFeatures).where(eq(tierFeatures.featureId, id));
    await db.delete(featureUsage).where(eq(featureUsage.featureId, id));
    
    // Delete the feature
    await db.delete(features).where(eq(features.id, id));
    return { success: true };
  }

  /**
   * Get features for a specific product tier
   */
  async getTierFeatures(tier: string) {
    const result = await db.select({
      id: tierFeatures.id,
      productTier: tierFeatures.productTier,
      includedByDefault: tierFeatures.includedByDefault,
      featureId: features.id,
      featureKey: features.featureKey,
      name: features.name,
      description: features.description,
      category: features.category,
      isEnabled: features.isEnabled,
    })
    .from(tierFeatures)
    .leftJoin(features, eq(tierFeatures.featureId, features.id))
    .where(eq(tierFeatures.productTier, tier));
    
    return result;
  }

  /**
   * Set features for a product tier
   */
  async setTierFeatures(tier: string, featureIds: number[]) {
    // Delete existing tier features
    await db.delete(tierFeatures).where(eq(tierFeatures.productTier, tier));
    
    // Insert new tier features
    if (featureIds.length > 0) {
      const values = featureIds.map(featureId => ({
        productTier: tier,
        featureId,
        includedByDefault: true,
      }));
      
      await db.insert(tierFeatures).values(values);
    }
    
    return await this.getTierFeatures(tier);
  }

  /**
   * Get user-specific feature overrides
   */
  async getUserFeatures(userId: string) {
    const result = await db.select({
      id: userFeatures.id,
      profileId: userFeatures.profileId,
      featureId: userFeatures.featureId,
      enabled: userFeatures.enabled,
      expiresAt: userFeatures.expiresAt,
      grantedBy: userFeatures.grantedBy,
      grantedAt: userFeatures.grantedAt,
      featureKey: features.featureKey,
      name: features.name,
      description: features.description,
      category: features.category,
    })
    .from(userFeatures)
    .leftJoin(features, eq(userFeatures.featureId, features.id))
    .where(eq(userFeatures.profileId, userId));
    
    return result;
  }

  /**
   * Get effective features for a user (tier features + overrides)
   */
  async getEffectiveFeatures(userId: string) {
    // Get user profile to determine tier
    const userProfile = await db.select().from(profiles).where(eq(profiles.id, userId));
    if (!userProfile.length) {
      throw new Error('User not found');
    }
    
    const user = userProfile[0];
    const tier = user.productTier || 'smartcrm';
    
    // Get tier features
    const tierFeatureList = await this.getTierFeatures(tier);
    
    // Get user overrides
    const userOverrides = await this.getUserFeatures(userId);
    
    // Build feature map with tier defaults
    const featureMap = new Map();
    tierFeatureList.forEach(tf => {
      if (tf.featureKey && tf.featureId) {
        featureMap.set(tf.featureKey, {
          featureId: tf.featureId,
          featureKey: tf.featureKey,
          name: tf.name,
          description: tf.description,
          category: tf.category,
          enabled: tf.includedByDefault && tf.isEnabled,
          source: 'tier'
        });
      }
    });
    
    // Apply user overrides
    userOverrides.forEach(uo => {
      if (uo.featureKey && uo.featureId) {
        // Check if feature is expired
        const isExpired = uo.expiresAt && new Date(uo.expiresAt) < new Date();
        
        if (!isExpired) {
          featureMap.set(uo.featureKey, {
            featureId: uo.featureId,
            overrideId: uo.id,
            featureKey: uo.featureKey,
            name: uo.name,
            description: uo.description,
            category: uo.category,
            enabled: uo.enabled,
            source: 'override',
            expiresAt: uo.expiresAt,
            grantedBy: uo.grantedBy,
            grantedAt: uo.grantedAt,
          });
        }
      }
    });
    
    return Array.from(featureMap.values());
  }

  /**
   * Grant or revoke a feature for a specific user
   */
  async setUserFeature(userId: string, featureId: number, enabled: boolean, grantedBy: string, expiresAt?: Date) {
    // Check if override already exists
    const existing = await db.select()
      .from(userFeatures)
      .where(and(
        eq(userFeatures.profileId, userId),
        eq(userFeatures.featureId, featureId)
      ));
    
    if (existing.length > 0) {
      // Update existing override
      const result = await db.update(userFeatures)
        .set({
          enabled,
          expiresAt: expiresAt || null,
          grantedBy,
          grantedAt: sql`NOW()`,
        })
        .where(eq(userFeatures.id, existing[0].id))
        .returning();
      return result[0];
    } else {
      // Create new override
      const result = await db.insert(userFeatures)
        .values({
          profileId: userId,
          featureId,
          enabled,
          expiresAt: expiresAt || null,
          grantedBy,
        })
        .returning();
      return result[0];
    }
  }

  /**
   * Remove user feature override (revert to tier default)
   */
  async removeUserFeature(userId: string, featureId: number) {
    await db.delete(userFeatures)
      .where(and(
        eq(userFeatures.profileId, userId),
        eq(userFeatures.featureId, featureId)
      ));
    return { success: true };
  }

  /**
   * Track feature usage
   */
  async trackUsage(userId: string, featureKey: string) {
    // Get feature by key
    const feature = await this.getFeature(featureKey);
    if (!feature) {
      return;
    }
    
    // Check if usage record exists
    const existing = await db.select()
      .from(featureUsage)
      .where(and(
        eq(featureUsage.profileId, userId),
        eq(featureUsage.featureId, feature.id)
      ));
    
    if (existing.length > 0) {
      // Update existing record
      await db.update(featureUsage)
        .set({
          lastAccessed: sql`NOW()`,
          accessCount: sql`${featureUsage.accessCount} + 1`,
        })
        .where(eq(featureUsage.id, existing[0].id));
    } else {
      // Create new record
      await db.insert(featureUsage).values({
        profileId: userId,
        featureId: feature.id,
        accessCount: 1,
      });
    }
  }

  /**
   * Get feature usage analytics
   */
  async getUsageAnalytics(filters?: { userId?: string; featureId?: number }) {
    let query = db.select({
      id: featureUsage.id,
      userId: featureUsage.profileId,
      featureId: featureUsage.featureId,
      featureKey: features.featureKey,
      featureName: features.name,
      lastAccessed: featureUsage.lastAccessed,
      accessCount: featureUsage.accessCount,
    })
    .from(featureUsage)
    .leftJoin(features, eq(featureUsage.featureId, features.id));
    
    if (filters?.userId) {
      query = query.where(eq(featureUsage.profileId, filters.userId)) as any;
    }
    
    if (filters?.featureId) {
      query = query.where(eq(featureUsage.featureId, filters.featureId)) as any;
    }
    
    return await query;
  }
}

export const featureService = new FeatureService();
