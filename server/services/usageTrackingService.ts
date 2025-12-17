import { eq, and, gte, lte, sql } from "drizzle-orm";
import { db } from "../db";
import {
  usageEvents,
  billingCycles,
  userUsageLimits,
  billingNotifications,
  usagePlans,
  type InsertUsageEvent,
  type InsertBillingCycle,
  type InsertUserUsageLimit,
  type InsertBillingNotification,
  type UsagePlan,
  type BillingCycle
} from "../../shared/schema";
import { CreditService } from "./creditService";

export interface UsageEventData {
  userId: string;
  tenantId?: string;
  eventType: string;
  featureName: string;
  quantity: number;
  unit: string;
  metadata?: Record<string, any>;
  billingCycleId?: string;
  stripeSubscriptionItemId?: string;
}

export interface UsageLimitData {
  userId: string;
  tenantId?: string;
  featureName: string;
  limitValue: number;
  isHardLimit?: boolean;
  billingCycleId?: string;
}

export class UsageTrackingService {
  /**
    * Record a usage event
    */
   static async recordUsage(data: UsageEventData): Promise<string> {
     try {
       // Check if user has sufficient credits before recording usage
       const creditCost = await this.calculateCreditCost(data);
       if (creditCost > 0) {
         const hasCredits = await CreditService.hasSufficientCredits(data.userId, creditCost);
         if (!hasCredits) {
           throw new Error(`Insufficient credits for usage. Required: ${creditCost}`);
         }
       }

       const usageEvent: InsertUsageEvent = {
         userId: data.userId,
         tenantId: data.tenantId,
         eventType: data.eventType,
         featureName: data.featureName,
         quantity: data.quantity.toString(),
         unit: data.unit,
         costCents: 0, // Credits are deducted separately
         metadata: data.metadata || {},
         billingCycleId: data.billingCycleId,
         stripeSubscriptionItemId: data.stripeSubscriptionItemId,
       };

       const result = await db.insert(usageEvents).values(usageEvent).returning({ id: usageEvents.id });
       const eventId = result[0].id;

       // Deduct credits for usage
       if (creditCost > 0) {
         await CreditService.deductCredits({
           userId: data.userId,
           amount: creditCost,
           description: `${data.featureName} usage: ${data.quantity} ${data.unit}`,
           usageEventId: eventId,
           metadata: data.metadata,
         });
       }

       return eventId;
     } catch (error) {
       console.error('Error recording usage event:', error);
       throw error;
     }
   }

  /**
    * Calculate credit cost for usage
    */
   private static async calculateCreditCost(data: UsageEventData): Promise<number> {
     try {
       // Define credit costs per feature/unit
       // This could be configurable in the future, but for now using fixed rates
       const creditRates: Record<string, number> = {
         'api_call': 0.1,      // 1 credit per 10 API calls
         'token': 0.0002,      // 1 credit per 5000 tokens
         'gb': 10,             // 10 credits per GB
         'minute': 0.5,        // 2 credits per minute
         'request': 0.1,       // 1 credit per 10 requests
       };

       const rate = creditRates[data.unit] || 1; // Default to 1 credit per unit if not defined
       return data.quantity * rate;
     } catch (error) {
       console.error('Error calculating credit cost:', error);
       return 0;
     }
   }

  /**
   * Calculate pay-per-use cost based on pricing tiers
   */
  private static calculatePayPerUseCost(plan: UsagePlan, data: UsageEventData): number {
    const pricingTiers = plan.pricingTiers as any[] || [];
    let remainingQuantity = data.quantity;
    let totalCost = 0;

    for (const tier of pricingTiers) {
      if (tier.unit !== data.unit) continue;

      const tierMin = tier.minQuantity || 0;
      const tierMax = tier.maxQuantity || Infinity;
      const pricePerUnit = tier.pricePerUnit || 0;

      if (remainingQuantity <= 0) break;

      const applicableQuantity = Math.min(remainingQuantity, tierMax - tierMin);
      totalCost += applicableQuantity * pricePerUnit;
      remainingQuantity -= applicableQuantity;
    }

    return Math.round(totalCost * 100); // Convert to cents
  }

  /**
   * Get user's current billing plan
   */
  private static async getUserBillingPlan(userId: string): Promise<UsagePlan | null> {
    try {
      // First check if user has an active billing cycle
      const activeCycle = await db
        .select()
        .from(billingCycles)
        .where(and(
          eq(billingCycles.userId, userId),
          eq(billingCycles.status, 'active')
        ))
        .limit(1);

      if (activeCycle.length > 0 && activeCycle[0].billingPlanId) {
        const plan = await db
          .select()
          .from(usagePlans)
          .where(eq(usagePlans.id, activeCycle[0].billingPlanId))
          .limit(1);

        return plan[0] || null;
      }

      // Default to free plan if no active billing cycle
      const freePlan = await db
        .select()
        .from(usagePlans)
        .where(eq(usagePlans.planName, 'free'))
        .limit(1);

      return freePlan[0] || null;
    } catch (error) {
      console.error('Error getting user billing plan:', error);
      return null;
    }
  }

  /**
   * Update usage limits for a user
   */
  private static async updateUsageLimits(userId: string, featureName: string, quantity: number): Promise<void> {
    try {
      // Find the current usage limit for this feature
      const limits = await db
        .select()
        .from(userUsageLimits)
        .where(and(
          eq(userUsageLimits.userId, userId),
          eq(userUsageLimits.featureName, featureName)
        ));

      if (limits.length > 0) {
        const limit = limits[0];
        const newUsedValue = parseFloat(limit.usedValue) + quantity;

        await db
          .update(userUsageLimits)
          .set({
            usedValue: newUsedValue.toString(),
            updatedAt: new Date()
          })
          .where(eq(userUsageLimits.id, limit.id));
      }
    } catch (error) {
      console.error('Error updating usage limits:', error);
    }
  }

  /**
   * Check usage limits and create notifications if needed
   */
  private static async checkUsageLimits(userId: string, featureName: string): Promise<void> {
    try {
      const limits = await db
        .select()
        .from(userUsageLimits)
        .where(and(
          eq(userUsageLimits.userId, userId),
          eq(userUsageLimits.featureName, featureName)
        ));

      if (limits.length === 0) return;

      const limit = limits[0];
      const usedValue = parseFloat(limit.usedValue);
      const limitValue = parseFloat(limit.limitValue);

      if (limitValue <= 0) return; // Unlimited

      const usagePercentage = (usedValue / limitValue) * 100;

      // Create warning at 80% usage
      if (usagePercentage >= 80 && usagePercentage < 100) {
        await this.createUsageNotification(userId, 'limit_warning', featureName, usedValue, limitValue);
      }

      // Create exceeded notification at 100%
      if (usagePercentage >= 100 && !limit.isHardLimit) {
        await this.createUsageNotification(userId, 'limit_exceeded', featureName, usedValue, limitValue);
      }
    } catch (error) {
      console.error('Error checking usage limits:', error);
    }
  }

  /**
   * Create a usage notification
   */
  private static async createUsageNotification(
    userId: string,
    type: string,
    featureName: string,
    usedValue: number,
    limitValue: number
  ): Promise<void> {
    try {
      // Check if notification already exists for this period
      const existing = await db
        .select()
        .from(billingNotifications)
        .where(and(
          eq(billingNotifications.userId, userId),
          eq(billingNotifications.notificationType, type),
          gte(billingNotifications.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000)) // Last 24 hours
        ));

      if (existing.length > 0) return; // Don't spam notifications

      const notification: InsertBillingNotification = {
        userId,
        notificationType: type,
        title: this.getNotificationTitle(type, featureName),
        message: this.getNotificationMessage(type, featureName, usedValue, limitValue),
        metadata: {
          featureName,
          usedValue,
          limitValue,
          usagePercentage: (usedValue / limitValue) * 100
        }
      };

      await db.insert(billingNotifications).values(notification);
    } catch (error) {
      console.error('Error creating usage notification:', error);
    }
  }

  /**
   * Get notification title based on type
   */
  private static getNotificationTitle(type: string, featureName: string): string {
    switch (type) {
      case 'limit_warning':
        return `Usage Warning: ${featureName}`;
      case 'limit_exceeded':
        return `Usage Limit Exceeded: ${featureName}`;
      default:
        return `Usage Notification: ${featureName}`;
    }
  }

  /**
   * Get notification message based on type
   */
  private static getNotificationMessage(
    type: string,
    featureName: string,
    usedValue: number,
    limitValue: number
  ): string {
    const percentage = Math.round((usedValue / limitValue) * 100);

    switch (type) {
      case 'limit_warning':
        return `You've used ${percentage}% of your ${featureName} limit (${usedValue} of ${limitValue}). Consider upgrading your plan.`;
      case 'limit_exceeded':
        return `You've exceeded your ${featureName} limit (${usedValue} of ${limitValue}). Additional usage may be charged.`;
      default:
        return `Usage update for ${featureName}: ${usedValue} of ${limitValue} (${percentage}%).`;
    }
  }

  /**
   * Create a new billing cycle
   */
  static async createBillingCycle(data: {
    userId: string;
    tenantId?: string;
    billingPlanId?: string;
    startDate: Date;
    endDate: Date;
    stripeSubscriptionId?: string;
  }): Promise<string> {
    try {
      const billingCycle: InsertBillingCycle = {
        userId: data.userId,
        tenantId: data.tenantId,
        billingPlanId: data.billingPlanId,
        startDate: data.startDate,
        endDate: data.endDate,
        stripeSubscriptionId: data.stripeSubscriptionId,
        status: 'active',
        totalUsage: {},
        totalCostCents: 0
      };

      const result = await db.insert(billingCycles).values(billingCycle).returning({ id: billingCycles.id });
      return result[0].id;
    } catch (error) {
      console.error('Error creating billing cycle:', error);
      throw error;
    }
  }

  /**
   * Set usage limits for a user
   */
  static async setUsageLimits(limits: UsageLimitData[]): Promise<void> {
    try {
      for (const limit of limits) {
        const limitData: InsertUserUsageLimit = {
          userId: limit.userId,
          tenantId: limit.tenantId,
          featureName: limit.featureName,
          limitValue: limit.limitValue.toString(),
          usedValue: '0',
          billingCycleId: limit.billingCycleId,
          isHardLimit: limit.isHardLimit || false
        };

        await db.insert(userUsageLimits).values(limitData)
          .onConflictDoUpdate({
            target: [userUsageLimits.userId, userUsageLimits.featureName, userUsageLimits.billingCycleId],
            set: {
              limitValue: limitData.limitValue,
              isHardLimit: limitData.isHardLimit,
              updatedAt: new Date()
            }
          });
      }
    } catch (error) {
      console.error('Error setting usage limits:', error);
      throw error;
    }
  }

  /**
   * Get usage statistics for a user
   */
  static async getUsageStats(userId: string, startDate?: Date, endDate?: Date): Promise<any> {
    try {
      const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      const end = endDate || new Date();

      // Get usage events
      const events = await db
        .select()
        .from(usageEvents)
        .where(and(
          eq(usageEvents.userId, userId),
          gte(usageEvents.createdAt, start),
          lte(usageEvents.createdAt, end)
        ));

      // Aggregate by feature
      const featureUsage = events.reduce((acc, event) => {
        const feature = event.featureName;
        if (!acc[feature]) {
          acc[feature] = {
            totalQuantity: 0,
            totalCost: 0,
            eventCount: 0,
            unit: event.unit
          };
        }
        acc[feature].totalQuantity += parseFloat(event.quantity);
        acc[feature].totalCost += event.costCents;
        acc[feature].eventCount += 1;
        return acc;
      }, {} as Record<string, any>);

      // Get current limits
      const limits = await db
        .select()
        .from(userUsageLimits)
        .where(eq(userUsageLimits.userId, userId));

      const currentLimits = limits.reduce((acc, limit) => {
        acc[limit.featureName] = {
          limit: parseFloat(limit.limitValue),
          used: parseFloat(limit.usedValue),
          isHardLimit: limit.isHardLimit
        };
        return acc;
      }, {} as Record<string, any>);

      return {
        period: { start, end },
        featureUsage,
        currentLimits,
        totalEvents: events.length,
        totalCost: Object.values(featureUsage).reduce((sum: number, feature: any) => sum + feature.totalCost, 0)
      };
    } catch (error) {
      console.error('Error getting usage stats:', error);
      throw error;
    }
  }

  /**
   * Get unread billing notifications for a user
   */
  static async getUnreadNotifications(userId: string): Promise<any[]> {
    try {
      const notifications = await db
        .select()
        .from(billingNotifications)
        .where(and(
          eq(billingNotifications.userId, userId),
          eq(billingNotifications.isRead, false)
        ))
        .orderBy(sql`${billingNotifications.createdAt} DESC`);

      return notifications;
    } catch (error) {
      console.error('Error getting unread notifications:', error);
      return [];
    }
  }

  /**
   * Mark notifications as read
   */
  static async markNotificationsRead(userId: string, notificationIds: string[]): Promise<void> {
    try {
      await db
        .update(billingNotifications)
        .set({ isRead: true })
        .where(and(
          eq(billingNotifications.userId, userId),
          sql`${billingNotifications.id} IN (${notificationIds.map(id => `'${id}'`).join(',')})`
        ));
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  }
}