import { eq, and, gte, lte, sql } from "drizzle-orm";
import { db } from "../db";
import { usageEvents, billingCycles, usagePlans } from "../../shared/schema";
import { UsageTrackingService } from "./usageTrackingService";

export interface BillingCalculation {
  billingCycleId: string;
  totalUsage: Record<string, number>;
  totalCostCents: number;
  breakdown: Record<string, any>;
}

export interface InvoiceData {
  userId: string;
  billingCycleId: string;
  startDate: Date;
  endDate: Date;
  totalAmountCents: number;
  currency: string;
  lineItems: InvoiceLineItem[];
  metadata?: Record<string, any>;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
  metadata?: Record<string, any>;
}

export class BillingCalculationService {
  /**
   * Calculate billing for a specific billing cycle
   */
  static async calculateBilling(billingCycleId: string): Promise<BillingCalculation> {
    try {
      // Get billing cycle details
      const cycle = await db
        .select()
        .from(billingCycles)
        .where(eq(billingCycles.id, billingCycleId))
        .limit(1);

      if (cycle.length === 0) {
        throw new Error(`Billing cycle ${billingCycleId} not found`);
      }

      const billingCycle = cycle[0];

      // Get all usage events for this billing cycle
      const events = await db
        .select()
        .from(usageEvents)
        .where(eq(usageEvents.billingCycleId, billingCycleId));

      // Aggregate usage by feature
      const usageByFeature = events.reduce((acc, event) => {
        const feature = event.featureName;
        if (!acc[feature]) {
          acc[feature] = {
            totalQuantity: 0,
            totalCost: 0,
            events: []
          };
        }
        acc[feature].totalQuantity += parseFloat(event.quantity);
        acc[feature].totalCost += event.costCents;
        acc[feature].events.push(event);
        return acc;
      }, {} as Record<string, any>);

      // Calculate total cost
      const totalCostCents = Object.values(usageByFeature).reduce(
        (sum: number, feature: any) => sum + feature.totalCost,
        0
      );

      // Add base subscription cost if applicable
      let finalTotalCost = totalCostCents;
      const breakdown: Record<string, any> = {
        usage: usageByFeature,
        baseSubscription: 0,
        total: totalCostCents
      };

      if (billingCycle.billingPlanId) {
        const plan = await db
          .select()
          .from(usagePlans)
          .where(eq(usagePlans.id, billingCycle.billingPlanId))
          .limit(1);

        if (plan.length > 0 && plan[0].billingType === 'subscription') {
          const baseCost = plan[0].basePriceCents;
          finalTotalCost += baseCost;
          breakdown.baseSubscription = baseCost;
          breakdown.total = finalTotalCost;
        }
      }

      return {
        billingCycleId,
        totalUsage: Object.keys(usageByFeature).reduce((acc, feature) => {
          acc[feature] = usageByFeature[feature].totalQuantity;
          return acc;
        }, {} as Record<string, number>),
        totalCostCents: finalTotalCost,
        breakdown
      };
    } catch (error) {
      console.error('Error calculating billing:', error);
      throw error;
    }
  }

  /**
   * Generate invoice data for a billing cycle
   */
  static async generateInvoice(billingCycleId: string): Promise<InvoiceData> {
    try {
      const calculation = await this.calculateBilling(billingCycleId);

      // Get billing cycle details
      const cycle = await db
        .select()
        .from(billingCycles)
        .where(eq(billingCycles.id, billingCycleId))
        .limit(1);

      if (cycle.length === 0) {
        throw new Error(`Billing cycle ${billingCycleId} not found`);
      }

      const billingCycle = cycle[0];

      // Generate line items
      const lineItems: InvoiceLineItem[] = [];

      // Add base subscription line item
      if (calculation.breakdown.baseSubscription > 0) {
        const plan = await db
          .select()
          .from(usagePlans)
          .where(eq(usagePlans.id, billingCycle.billingPlanId!))
          .limit(1);

        if (plan.length > 0) {
          lineItems.push({
            description: `${plan[0].displayName} - Base Subscription`,
            quantity: 1,
            unitPriceCents: plan[0].basePriceCents,
            totalCents: plan[0].basePriceCents,
            metadata: {
              planName: plan[0].planName,
              billingInterval: plan[0].billingInterval
            }
          });
        }
      }

      // Add usage-based line items
      for (const [featureName, featureData] of Object.entries(calculation.breakdown.usage)) {
        if (featureData.totalCost > 0) {
          lineItems.push({
            description: `${featureName} usage`,
            quantity: featureData.totalQuantity,
            unitPriceCents: Math.round(featureData.totalCost / featureData.totalQuantity),
            totalCents: featureData.totalCost,
            metadata: {
              featureName,
              unit: featureData.events[0]?.unit || 'units',
              eventCount: featureData.events.length
            }
          });
        }
      }

      return {
        userId: billingCycle.userId,
        billingCycleId,
        startDate: billingCycle.startDate,
        endDate: billingCycle.endDate,
        totalAmountCents: calculation.totalCostCents,
        currency: 'USD',
        lineItems,
        metadata: {
          billingPlanId: billingCycle.billingPlanId,
          stripeSubscriptionId: billingCycle.stripeSubscriptionId
        }
      };
    } catch (error) {
      console.error('Error generating invoice:', error);
      throw error;
    }
  }

  /**
   * Calculate prorated charges for plan changes
   */
  static async calculateProratedCharge(
    userId: string,
    currentPlanId: string,
    newPlanId: string,
    changeDate: Date = new Date()
  ): Promise<{ creditCents: number; chargeCents: number; netChangeCents: number }> {
    try {
      // Get current and new plans
      const [currentPlan, newPlan] = await Promise.all([
        db.select().from(usagePlans).where(eq(usagePlans.id, currentPlanId)).limit(1),
        db.select().from(usagePlans).where(eq(usagePlans.id, newPlanId)).limit(1)
      ]);

      if (currentPlan.length === 0 || newPlan.length === 0) {
        throw new Error('Plan not found');
      }

      const currentPlanData = currentPlan[0];
      const newPlanData = newPlan[0];

      // Get current billing cycle
      const currentCycle = await db
        .select()
        .from(billingCycles)
        .where(and(
          eq(billingCycles.userId, userId),
          eq(billingCycles.status, 'active')
        ))
        .limit(1);

      if (currentCycle.length === 0) {
        // No proration needed if no active cycle
        return { creditCents: 0, chargeCents: newPlanData.basePriceCents, netChangeCents: newPlanData.basePriceCents };
      }

      const cycle = currentCycle[0];
      const cycleStart = cycle.startDate;
      const cycleEnd = cycle.endDate;

      // Calculate days remaining in cycle
      const totalDaysInCycle = Math.ceil((cycleEnd.getTime() - cycleStart.getTime()) / (1000 * 60 * 60 * 24));
      const daysRemaining = Math.ceil((cycleEnd.getTime() - changeDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysUsed = totalDaysInCycle - daysRemaining;

      // Calculate prorated amounts
      const currentDailyRate = currentPlanData.basePriceCents / totalDaysInCycle;
      const newDailyRate = newPlanData.basePriceCents / totalDaysInCycle;

      const creditCents = Math.round(currentDailyRate * daysRemaining);
      const chargeCents = Math.round(newDailyRate * daysRemaining);
      const netChangeCents = chargeCents - creditCents;

      return { creditCents, chargeCents, netChangeCents };
    } catch (error) {
      console.error('Error calculating prorated charge:', error);
      throw error;
    }
  }

  /**
   * Calculate usage costs for a specific period
   */
  static async calculateUsageCosts(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{ totalCostCents: number; breakdown: Record<string, any> }> {
    try {
      // Get usage events for the period
      const events = await db
        .select()
        .from(usageEvents)
        .where(and(
          eq(usageEvents.userId, userId),
          gte(usageEvents.createdAt, startDate),
          lte(usageEvents.createdAt, endDate)
        ));

      // Aggregate costs by feature
      const breakdown = events.reduce((acc, event) => {
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

      const totalCostCents = Object.values(breakdown).reduce(
        (sum: number, feature: any) => sum + feature.totalCost,
        0
      );

      return { totalCostCents, breakdown };
    } catch (error) {
      console.error('Error calculating usage costs:', error);
      throw error;
    }
  }

  /**
   * Estimate costs for a given usage pattern
   */
  static async estimateCosts(
    planId: string,
    usagePattern: Record<string, number>
  ): Promise<{ totalCostCents: number; breakdown: Record<string, any> }> {
    try {
      // Get the plan
      const plan = await db
        .select()
        .from(usagePlans)
        .where(eq(usagePlans.id, planId))
        .limit(1);

      if (plan.length === 0) {
        throw new Error(`Plan ${planId} not found`);
      }

      const planData = plan[0];
      let totalCostCents = planData.basePriceCents;
      const breakdown: Record<string, any> = {
        baseSubscription: planData.basePriceCents,
        usage: {}
      };

      // Calculate usage costs based on pricing tiers
      if (planData.billingType === 'pay_per_use' && planData.pricingTiers) {
        const pricingTiers = planData.pricingTiers as any[];

        for (const [featureName, quantity] of Object.entries(usagePattern)) {
          let remainingQuantity = quantity;
          let featureCost = 0;

          for (const tier of pricingTiers) {
            if (tier.unit !== 'request' && tier.unit !== 'token') continue; // Generic handling

            const tierMin = tier.minQuantity || 0;
            const tierMax = tier.maxQuantity || Infinity;
            const pricePerUnit = tier.pricePerUnit || 0;

            if (remainingQuantity <= 0) break;

            const applicableQuantity = Math.min(remainingQuantity, tierMax - tierMin);
            featureCost += applicableQuantity * pricePerUnit;
            remainingQuantity -= applicableQuantity;
          }

          const featureCostCents = Math.round(featureCost * 100);
          breakdown.usage[featureName] = featureCostCents;
          totalCostCents += featureCostCents;
        }
      }

      breakdown.total = totalCostCents;

      return { totalCostCents, breakdown };
    } catch (error) {
      console.error('Error estimating costs:', error);
      throw error;
    }
  }

  /**
   * Get billing summary for a user
   */
  static async getBillingSummary(userId: string): Promise<any> {
    try {
      // Get current billing cycle
      const currentCycle = await db
        .select()
        .from(billingCycles)
        .where(and(
          eq(billingCycles.userId, userId),
          eq(billingCycles.status, 'active')
        ))
        .limit(1);

      // Get current usage stats
      const usageStats = await UsageTrackingService.getUsageStats(userId);

      // Get current plan
      let currentPlan = null;
      if (currentCycle.length > 0 && currentCycle[0].billingPlanId) {
        const plan = await db
          .select()
          .from(usagePlans)
          .where(eq(usagePlans.id, currentCycle[0].billingPlanId))
          .limit(1);
        currentPlan = plan[0] || null;
      }

      // Calculate current billing
      let currentBilling = null;
      if (currentCycle.length > 0) {
        currentBilling = await this.calculateBilling(currentCycle[0].id);
      }

      return {
        currentCycle: currentCycle[0] || null,
        currentPlan,
        usageStats,
        currentBilling,
        nextBillingDate: currentCycle[0]?.endDate || null
      };
    } catch (error) {
      console.error('Error getting billing summary:', error);
      throw error;
    }
  }
}