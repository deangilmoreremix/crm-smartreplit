import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { db } from '../db';
import { userUsageLimits, usagePlans, billingCycles } from '../../shared/schema';
import { UsageTrackingService } from './usageTrackingService';

export interface UsageLimitCheck {
  allowed: boolean;
  currentUsage: number;
  limit: number;
  percentage: number;
  isHardLimit: boolean;
  resetDate?: Date;
}

export interface LimitEnforcementResult {
  allowed: boolean;
  reason?: string;
  retryAfter?: number;
}

export class UsageLimitService {
  /**
   * Check if a user can perform an action based on their usage limits
   */
  static async checkLimit(
    userId: string,
    featureName: string,
    requestedQuantity: number = 1
  ): Promise<UsageLimitCheck> {
    try {
      // Get current usage limit for the feature
      const limits = await db
        .select()
        .from(userUsageLimits)
        .where(and(
          eq(userUsageLimits.userId, userId),
          eq(userUsageLimits.featureName, featureName)
        ));

      if (limits.length === 0) {
        // No limit set, allow unlimited usage
        return {
          allowed: true,
          currentUsage: 0,
          limit: -1,
          percentage: 0,
          isHardLimit: false
        };
      }

      const limit = limits[0];
      const currentUsage = parseFloat(limit.usedValue);
      const maxLimit = parseFloat(limit.limitValue);

      if (maxLimit <= 0) {
        // Unlimited
        return {
          allowed: true,
          currentUsage,
          limit: maxLimit,
          percentage: 0,
          isHardLimit: limit.isHardLimit
        };
      }

      const newUsage = currentUsage + requestedQuantity;
      const percentage = (newUsage / maxLimit) * 100;

      return {
        allowed: !limit.isHardLimit || newUsage <= maxLimit,
        currentUsage,
        limit: maxLimit,
        percentage,
        isHardLimit: limit.isHardLimit,
        resetDate: limit.resetDate ? new Date(limit.resetDate) : undefined
      };
    } catch (error) {
      console.error('Error checking usage limit:', error);
      // Allow usage if check fails
      return {
        allowed: true,
        currentUsage: 0,
        limit: -1,
        percentage: 0,
        isHardLimit: false
      };
    }
  }

  /**
   * Enforce usage limits for an action
   */
  static async enforceLimit(
    userId: string,
    featureName: string,
    requestedQuantity: number = 1
  ): Promise<LimitEnforcementResult> {
    try {
      const limitCheck = await this.checkLimit(userId, featureName, requestedQuantity);

      if (!limitCheck.allowed) {
        return {
          allowed: false,
          reason: `Usage limit exceeded for ${featureName}. Current: ${limitCheck.currentUsage}, Limit: ${limitCheck.limit}`,
          retryAfter: limitCheck.resetDate ? Math.ceil((limitCheck.resetDate.getTime() - Date.now()) / 1000) : undefined
        };
      }

      // Pre-allocate usage (reserve it)
      await this.reserveUsage(userId, featureName, requestedQuantity);

      return { allowed: true };
    } catch (error) {
      console.error('Error enforcing usage limit:', error);
      return { allowed: true }; // Allow on error
    }
  }

  /**
   * Reserve usage (temporary allocation)
   */
  private static async reserveUsage(
    userId: string,
    featureName: string,
    quantity: number
  ): Promise<void> {
    try {
      // For now, just update the usage immediately
      // In a more sophisticated system, you might want to implement temporary reservations
      // that expire if not confirmed
      await UsageTrackingService['updateUsageLimits'](userId, featureName, quantity);
    } catch (error) {
      console.error('Error reserving usage:', error);
    }
  }

  /**
   * Set usage limits for a user based on their plan
   */
  static async setUserLimitsFromPlan(userId: string, planId: string): Promise<void> {
    try {
      // Get plan details
      const plan = await db
        .select()
        .from(usagePlans)
        .where(eq(usagePlans.id, planId))
        .limit(1);

      if (plan.length === 0) {
        throw new Error(`Plan ${planId} not found`);
      }

      const planData = plan[0];
      const limits = planData.limits as Record<string, any> || {};

      // Get current billing cycle
      const currentCycle = await db
        .select()
        .from(billingCycles)
        .where(and(
          eq(billingCycles.userId, userId),
          eq(billingCycles.status, 'active')
        ))
        .limit(1);

      const billingCycleId = currentCycle.length > 0 ? currentCycle[0].id : undefined;

      // Convert plan limits to user limits
      const userLimits = Object.entries(limits).map(([featureName, limitConfig]) => ({
        userId,
        featureName,
        limitValue: typeof limitConfig === 'number' ? limitConfig : parseFloat(limitConfig as string),
        isHardLimit: true, // Plans typically have hard limits
        billingCycleId
      }));

      await UsageTrackingService.setUsageLimits(userLimits);
    } catch (error) {
      console.error('Error setting user limits from plan:', error);
      throw error;
    }
  }

  /**
   * Reset usage limits for a billing cycle
   */
  static async resetLimitsForBillingCycle(billingCycleId: string): Promise<void> {
    try {
      await db
        .update(userUsageLimits)
        .set({
          usedValue: '0',
          resetDate: new Date(),
          updatedAt: new Date()
        })
        .where(eq(userUsageLimits.billingCycleId, billingCycleId));
    } catch (error) {
      console.error('Error resetting limits for billing cycle:', error);
      throw error;
    }
  }

  /**
   * Get usage limits for a user
   */
  static async getUserLimits(userId: string): Promise<any[]> {
    try {
      const limits = await db
        .select()
        .from(userUsageLimits)
        .where(eq(userUsageLimits.userId, userId));

      return limits.map(limit => ({
        id: limit.id,
        featureName: limit.featureName,
        limitValue: parseFloat(limit.limitValue),
        usedValue: parseFloat(limit.usedValue),
        percentage: parseFloat(limit.limitValue) > 0
          ? (parseFloat(limit.usedValue) / parseFloat(limit.limitValue)) * 100
          : 0,
        isHardLimit: limit.isHardLimit,
        resetDate: limit.resetDate,
        billingCycleId: limit.billingCycleId
      }));
    } catch (error) {
      console.error('Error getting user limits:', error);
      return [];
    }
  }

  /**
   * Update usage limits dynamically
   */
  static async updateUserLimit(
    userId: string,
    featureName: string,
    newLimit: number,
    isHardLimit: boolean = false
  ): Promise<void> {
    try {
      await db
        .update(userUsageLimits)
        .set({
          limitValue: newLimit.toString(),
          isHardLimit,
          updatedAt: new Date()
        })
        .where(and(
          eq(userUsageLimits.userId, userId),
          eq(userUsageLimits.featureName, featureName)
        ));
    } catch (error) {
      console.error('Error updating user limit:', error);
      throw error;
    }
  }

  /**
   * Check if user is approaching limits and should be warned
   */
  static async getLimitWarnings(userId: string): Promise<any[]> {
    try {
      const limits = await this.getUserLimits(userId);
      const warnings: any[] = [];

      for (const limit of limits) {
        if (limit.limitValue <= 0) continue; // Unlimited

        const percentage = limit.percentage;

        if (percentage >= 90) {
          warnings.push({
            featureName: limit.featureName,
            severity: 'critical',
            percentage,
            used: limit.usedValue,
            limit: limit.limitValue,
            message: `Critical: ${limit.featureName} usage at ${percentage.toFixed(1)}%`
          });
        } else if (percentage >= 75) {
          warnings.push({
            featureName: limit.featureName,
            severity: 'warning',
            percentage,
            used: limit.usedValue,
            limit: limit.limitValue,
            message: `Warning: ${limit.featureName} usage at ${percentage.toFixed(1)}%`
          });
        }
      }

      return warnings;
    } catch (error) {
      console.error('Error getting limit warnings:', error);
      return [];
    }
  }

  /**
   * Get usage analytics for admin purposes
   */
  static async getUsageAnalytics(
    startDate: Date,
    endDate: Date,
    featureName?: string
  ): Promise<any> {
    try {
      let whereConditions = [
        gte(userUsageLimits.updatedAt, startDate),
        lte(userUsageLimits.updatedAt, endDate)
      ];

      if (featureName) {
        whereConditions.push(eq(userUsageLimits.featureName, featureName));
      }

      const analytics = await db
        .select({
          featureName: userUsageLimits.featureName,
          totalUsers: sql<number>`count(distinct ${userUsageLimits.userId})`,
          avgUsage: sql<number>`avg(cast(${userUsageLimits.usedValue} as decimal))`,
          maxUsage: sql<number>`max(cast(${userUsageLimits.usedValue} as decimal))`,
          totalLimit: sql<number>`sum(cast(${userUsageLimits.limitValue} as decimal))`
        })
        .from(userUsageLimits)
        .where(and(...whereConditions))
        .groupBy(userUsageLimits.featureName);

      return {
        period: { startDate, endDate },
        analytics,
        totalFeatures: analytics.length
      };
    } catch (error) {
      console.error('Error getting usage analytics:', error);
      throw error;
    }
  }
}