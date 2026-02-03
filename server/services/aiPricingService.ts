import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from '../db';
import { 
  aiFeatureDefinitions, 
  aiResellerPricing, 
  aiFeatureUsage,
  resellerCredits,
  resellerCreditTransactions,
  profiles,
  type InsertAIFeatureUsage,
  type InsertResellerCreditTransaction
} from '../../shared/schema';
import { CreditService } from './creditService';

export interface AIFeaturePrice {
  featureKey: string;
  featureName: string;
  description: string;
  category: string;
  baseCreditCost: number;
  retailPrice: number;
  wholesalePrice: number;
  minPrice: number;
  maxPrice: number;
}

export interface ResellerPricingConfig {
  featureKey: string;
  retailCreditCost: number;
  wholesaleCreditCost: number;
  isActive: boolean;
}

export interface UsageChargeResult {
  success: boolean;
  creditsCharged: number;
  creditsPaidToPlatform: number;
  resellerProfit: number;
  error?: string;
}

export class AIPricingService {
  /**
   * Get all AI features with pricing for a specific user context
   * For Super Admin: shows base prices
   * For Reseller: shows their configured retail prices
   * For End User: shows reseller's retail price or base price
   */
  static async getAIFeaturesWithPricing(
    userId: string,
    userRole: string,
    resellerId?: string
  ): Promise<AIFeaturePrice[]> {
    // Get all active feature definitions
    const features = await db
      .select()
      .from(aiFeatureDefinitions)
      .where(eq(aiFeatureDefinitions.isActive, true));

    const result: AIFeaturePrice[] = [];

    for (const feature of features) {
      let retailPrice = feature.baseCreditCost;
      let wholesalePrice = Math.floor(feature.baseCreditCost * 0.5); // 50% wholesale discount

      // If this is a reseller viewing, get their configured prices
      if (userRole === 'whitelabel' || userRole === 'reseller') {
        const resellerPricing = await db
          .select()
          .from(aiResellerPricing)
          .where(and(
            eq(aiResellerPricing.resellerId, userId),
            eq(aiResellerPricing.featureKey, feature.featureKey),
            eq(aiResellerPricing.isActive, true)
          ))
          .limit(1);

        if (resellerPricing.length > 0) {
          retailPrice = resellerPricing[0].retailCreditCost;
          wholesalePrice = resellerPricing[0].wholesaleCreditCost;
        }
      }
      // If this is an end user under a reseller
      else if (resellerId) {
        const resellerPricing = await db
          .select()
          .from(aiResellerPricing)
          .where(and(
            eq(aiResellerPricing.resellerId, resellerId),
            eq(aiResellerPricing.featureKey, feature.featureKey),
            eq(aiResellerPricing.isActive, true)
          ))
          .limit(1);

        if (resellerPricing.length > 0) {
          retailPrice = resellerPricing[0].retailCreditCost;
        }
      }

      result.push({
        featureKey: feature.featureKey,
        featureName: feature.featureName,
        description: feature.description || '',
        category: feature.category || 'general',
        baseCreditCost: feature.baseCreditCost,
        retailPrice,
        wholesalePrice,
        minPrice: feature.minCreditCost,
        maxPrice: feature.maxCreditCost,
      });
    }

    return result;
  }

  /**
   * Set pricing for a feature (Super Admin only)
   */
  static async setFeatureBasePrice(
    featureKey: string,
    updates: Partial<{
      baseCreditCost: number;
      minCreditCost: number;
      maxCreditCost: number;
      isActive: boolean;
    }>
  ): Promise<void> {
    await db
      .update(aiFeatureDefinitions)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(aiFeatureDefinitions.featureKey, featureKey));
  }

  /**
   * Set reseller pricing for their customers
   */
  static async setResellerPricing(
    resellerId: string,
    featureKey: string,
    retailCreditCost: number,
    wholesaleCreditCost?: number
  ): Promise<void> {
    // Get base price for wholesale calculation
    const feature = await db
      .select()
      .from(aiFeatureDefinitions)
      .where(eq(aiFeatureDefinitions.featureKey, featureKey))
      .limit(1);

    if (feature.length === 0) {
      throw new Error(`Feature ${featureKey} not found`);
    }

    const baseWholesale = wholesaleCreditCost || Math.floor(feature[0].baseCreditCost * 0.5);

    await db
      .insert(aiResellerPricing)
      .values({
        resellerId,
        featureKey,
        retailCreditCost,
        wholesaleCreditCost: baseWholesale,
        isActive: true,
      })
      .onConflictDoUpdate({
        target: [aiResellerPricing.resellerId, aiResellerPricing.featureKey],
        set: {
          retailCreditCost,
          wholesaleCreditCost: baseWholesale,
          updatedAt: new Date(),
        },
      });
  }

  /**
   * Charge user for AI feature usage
   * Returns result with credits charged and revenue split
   */
  static async chargeForFeature(
    userId: string,
    featureKey: string,
    description: string,
    options: {
      resellerId?: string;
      metadata?: Record<string, any>;
      context?: Record<string, any>;
    } = {}
  ): Promise<UsageChargeResult> {
    try {
      // Determine pricing
      let retailPrice: number;
      let wholesalePrice: number;

      if (options.resellerId) {
        // End user under a reseller
        const resellerPricing = await db
          .select()
          .from(aiResellerPricing)
          .where(and(
            eq(aiResellerPricing.resellerId, options.resellerId),
            eq(aiResellerPricing.featureKey, featureKey),
            eq(aiResellerPricing.isActive, true)
          ))
          .limit(1);

        if (resellerPricing.length > 0) {
          retailPrice = resellerPricing[0].retailCreditCost;
          wholesalePrice = resellerPricing[0].wholesaleCreditCost;
        } else {
          // Fallback to base pricing
          const feature = await db
            .select()
            .from(aiFeatureDefinitions)
            .where(eq(aiFeatureDefinitions.featureKey, featureKey))
            .limit(1);
          retailPrice = feature[0]?.baseCreditCost || 10;
          wholesalePrice = Math.floor(retailPrice * 0.5);
        }

        // Check if reseller has sufficient wholesale credits
        const resellerBalance = await this.getResellerCreditBalance(options.resellerId);
        if (resellerBalance.available < wholesalePrice) {
          return {
            success: false,
            creditsCharged: 0,
            creditsPaidToPlatform: 0,
            resellerProfit: 0,
            error: 'Reseller has insufficient credits. Please contact your reseller.',
          };
        }
      } else {
        // Direct platform user
        const feature = await db
          .select()
          .from(aiFeatureDefinitions)
          .where(eq(aiFeatureDefinitions.featureKey, featureKey))
          .limit(1);
        retailPrice = feature[0]?.baseCreditCost || 10;
        wholesalePrice = retailPrice;
      }

      // Check if end user has sufficient credits
      const hasCredits = await CreditService.hasSufficientCredits(userId, retailPrice);
      if (!hasCredits) {
        return {
          success: false,
          creditsCharged: 0,
          creditsPaidToPlatform: 0,
          resellerProfit: 0,
          error: `Insufficient credits. Need ${retailPrice} credits for this feature.`,
        };
      }

      // Deduct credits from end user
      await CreditService.deductCredits({
        userId,
        amount: retailPrice,
        description: `${description} (${featureKey})`,
        metadata: {
          featureKey,
          resellerId: options.resellerId,
          ...options.metadata,
        },
      });

      // Record usage
      const usageRecord: InsertAIFeatureUsage = {
        userId,
        resellerId: options.resellerId,
        featureKey,
        creditsCharged: retailPrice,
        creditsPaidToPlatform: wholesalePrice,
        resellerProfitCredits: options.resellerId ? retailPrice - wholesalePrice : 0,
        context: options.context || {},
      };

      await db.insert(aiFeatureUsage).values(usageRecord);

      // If reseller involved, deduct wholesale credits from their balance
      if (options.resellerId) {
        await this.deductResellerCredits(options.resellerId, wholesalePrice, userId, featureKey);
      }

      return {
        success: true,
        creditsCharged: retailPrice,
        creditsPaidToPlatform: wholesalePrice,
        resellerProfit: options.resellerId ? retailPrice - wholesalePrice : 0,
      };
    } catch (error) {
      console.error('Error charging for AI feature:', error);
      return {
        success: false,
        creditsCharged: 0,
        creditsPaidToPlatform: 0,
        resellerProfit: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get reseller credit balance
   */
  static async getResellerCreditBalance(resellerId: string): Promise<{
    purchased: number;
    used: number;
    available: number;
    totalRevenue: number;
    totalProfit: number;
  }> {
    const balance = await db
      .select()
      .from(resellerCredits)
      .where(eq(resellerCredits.resellerId, resellerId))
      .limit(1);

    if (balance.length === 0) {
      // Initialize empty balance
      await db.insert(resellerCredits).values({
        resellerId,
        wholesaleCreditsPurchased: 0,
        wholesaleCreditsUsed: 0,
        wholesaleCreditsAvailable: 0,
        totalRevenueCents: 0,
        totalProfitCents: 0,
      });
      return { purchased: 0, used: 0, available: 0, totalRevenue: 0, totalProfit: 0 };
    }

    return {
      purchased: balance[0].wholesaleCreditsPurchased,
      used: balance[0].wholesaleCreditsUsed,
      available: balance[0].wholesaleCreditsAvailable,
      totalRevenue: balance[0].totalRevenueCents,
      totalProfit: balance[0].totalProfitCents,
    };
  }

  /**
   * Purchase wholesale credits (for resellers)
   */
  static async purchaseWholesaleCredits(
    resellerId: string,
    creditsAmount: number,
    costCents: number,
    stripeTransactionId?: string
  ): Promise<void> {
    const currentBalance = await this.getResellerCreditBalance(resellerId);

    await db
      .insert(resellerCredits)
      .values({
        resellerId,
        wholesaleCreditsPurchased: creditsAmount,
        wholesaleCreditsUsed: 0,
        wholesaleCreditsAvailable: creditsAmount,
        totalRevenueCents: 0,
        totalProfitCents: 0,
        lastPurchaseAt: new Date(),
      })
      .onConflictDoUpdate({
        target: resellerCredits.resellerId,
        set: {
          wholesaleCreditsPurchased: sql`${resellerCredits.wholesaleCreditsPurchased} + ${creditsAmount}`,
          wholesaleCreditsAvailable: sql`${resellerCredits.wholesaleCreditsAvailable} + ${creditsAmount}`,
          lastPurchaseAt: new Date(),
          updatedAt: new Date(),
        },
      });

    // Record transaction
    const transaction: InsertResellerCreditTransaction = {
      resellerId,
      type: 'wholesale_purchase',
      creditsAmount,
      amountCents: costCents,
      description: `Purchased ${creditsAmount} wholesale credits`,
    };

    await db.insert(resellerCreditTransactions).values(transaction);
  }

  /**
   * Deduct wholesale credits from reseller
   */
  private static async deductResellerCredits(
    resellerId: string,
    amount: number,
    endUserId: string,
    featureKey: string
  ): Promise<void> {
    await db
      .update(resellerCredits)
      .set({
        wholesaleCreditsUsed: sql`${resellerCredits.wholesaleCreditsUsed} + ${amount}`,
        wholesaleCreditsAvailable: sql`${resellerCredits.wholesaleCreditsAvailable} - ${amount}`,
        updatedAt: new Date(),
      })
      .where(eq(resellerCredits.resellerId, resellerId));

    // Record transaction
    const transaction: InsertResellerCreditTransaction = {
      resellerId,
      type: 'retail_sale',
      creditsAmount: -amount,
      endUserId,
      featureKey,
      description: `Credits used for ${featureKey} by user ${endUserId}`,
    };

    await db.insert(resellerCreditTransactions).values(transaction);
  }

  /**
   * Get usage analytics for a reseller
   */
  static async getResellerUsageAnalytics(
    resellerId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalUsage: number;
    totalCreditsCharged: number;
    totalWholesaleCost: number;
    totalProfit: number;
    featureBreakdown: Array<{
      featureKey: string;
      usageCount: number;
      creditsCharged: number;
      profit: number;
    }>;
  }> {
    const usage = await db
      .select({
        featureKey: aiFeatureUsage.featureKey,
        count: sql<number>`count(*)`,
        totalCharged: sql<number>`sum(${aiFeatureUsage.creditsCharged})`,
        totalWholesale: sql<number>`sum(${aiFeatureUsage.creditsPaidToPlatform})`,
        totalProfit: sql<number>`sum(${aiFeatureUsage.resellerProfitCredits})`,
      })
      .from(aiFeatureUsage)
      .where(and(
        eq(aiFeatureUsage.resellerId, resellerId),
        sql`${aiFeatureUsage.createdAt} >= ${startDate}`,
        sql`${aiFeatureUsage.createdAt} <= ${endDate}`
      ))
      .groupBy(aiFeatureUsage.featureKey);

    const featureBreakdown = usage.map(u => ({
      featureKey: u.featureKey,
      usageCount: Number(u.count),
      creditsCharged: Number(u.totalCharged),
      profit: Number(u.totalProfit),
    }));

    return {
      totalUsage: featureBreakdown.reduce((sum, f) => sum + f.usageCount, 0),
      totalCreditsCharged: featureBreakdown.reduce((sum, f) => sum + f.creditsCharged, 0),
      totalWholesaleCost: usage.reduce((sum, u) => sum + Number(u.totalWholesale), 0),
      totalProfit: featureBreakdown.reduce((sum, f) => sum + f.profit, 0),
      featureBreakdown,
    };
  }

  /**
   * Get Super Admin platform-wide analytics
   */
  static async getPlatformAnalytics(
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalUsage: number;
    totalRevenueCredits: number;
    totalResellerPayouts: number;
    platformProfit: number;
    topFeatures: Array<{
      featureKey: string;
      usageCount: number;
      revenue: number;
    }>;
    topResellers: Array<{
      resellerId: string;
      usageCount: number;
      revenue: number;
    }>;
  }> {
    // This would be implemented with more complex queries
    // For now, return placeholder structure
    return {
      totalUsage: 0,
      totalRevenueCredits: 0,
      totalResellerPayouts: 0,
      platformProfit: 0,
      topFeatures: [],
      topResellers: [],
    };
  }
}
