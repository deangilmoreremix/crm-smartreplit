import Stripe from 'stripe';
import { getUncachableStripeClient } from '../stripeClient';
import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { billingCycles, usageEvents, usagePlans } from '../../shared/schema';
import { UsageTrackingService } from './usageTrackingService';

export interface MeteredSubscriptionData {
  userId: string;
  planId: string;
  customerId?: string;
  metadata?: Record<string, any>;
}

export interface UsageRecordData {
  subscriptionItemId: string;
  quantity: number;
  timestamp?: number;
  metadata?: Record<string, any>;
}

export class StripeMeteredBillingService {
  private static stripe: Stripe | null = null;

  private static async getStripe(): Promise<Stripe> {
    if (!this.stripe) {
      this.stripe = await getUncachableStripeClient();
    }
    return this.stripe;
  }

  /**
   * Create a metered subscription
   */
  static async createMeteredSubscription(data: MeteredSubscriptionData): Promise<any> {
    try {
      const stripe = await this.getStripe();

      // Get the plan details
      const plan = await db
        .select()
        .from(usagePlans)
        .where(eq(usagePlans.id, data.planId))
        .limit(1);

      if (plan.length === 0) {
        throw new Error(`Plan ${data.planId} not found`);
      }

      const planData = plan[0];

      if (!planData.stripeProductId || !planData.stripePriceId) {
        throw new Error(`Plan ${data.planId} is not configured for Stripe billing`);
      }

      // Create or get customer
      let customerId = data.customerId;
      if (!customerId) {
        // Try to find existing customer by user ID
        const existingCustomers = await stripe.customers.list({
          email: data.metadata?.email,
          limit: 1
        });

        if (existingCustomers.data.length > 0) {
          customerId = existingCustomers.data[0].id;
        } else {
          // Create new customer
          const customer = await stripe.customers.create({
            email: data.metadata?.email,
            name: data.metadata?.name,
            metadata: {
              userId: data.userId,
              ...data.metadata
            }
          });
          customerId = customer.id;
        }
      }

      // Create subscription with metered price
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{
          price: planData.stripePriceId,
          quantity: 1,
        }],
        metadata: {
          userId: data.userId,
          planId: data.planId,
          ...data.metadata
        },
        billing_behavior: 'default_incomplete', // Allow incomplete subscriptions
      });

      // Create billing cycle
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1); // Monthly billing cycle

      const billingCycleId = await UsageTrackingService.createBillingCycle({
        userId: data.userId,
        billingPlanId: data.planId,
        startDate,
        endDate,
        stripeSubscriptionId: subscription.id
      });

      // Set usage limits based on plan
      if (planData.limits) {
        const limits = Object.entries(planData.limits).map(([featureName, limitValue]) => ({
          userId: data.userId,
          featureName,
          limitValue: typeof limitValue === 'number' ? limitValue : parseFloat(limitValue as string),
          billingCycleId
        }));
        await UsageTrackingService.setUsageLimits(limits);
      }

      return {
        subscriptionId: subscription.id,
        customerId,
        billingCycleId,
        status: subscription.status
      };
    } catch (error) {
      console.error('Error creating metered subscription:', error);
      throw error;
    }
  }

  /**
   * Report usage to Stripe for metered billing
   */
  static async reportUsage(data: UsageRecordData): Promise<any> {
    try {
      const stripe = await this.getStripe();

      const usageRecord = await stripe.subscriptionItems.createUsageRecord(
        data.subscriptionItemId,
        {
          quantity: Math.round(data.quantity),
          timestamp: data.timestamp || Math.floor(Date.now() / 1000),
          metadata: data.metadata
        }
      );

      return usageRecord;
    } catch (error) {
      console.error('Error reporting usage to Stripe:', error);
      throw error;
    }
  }

  /**
   * Report usage events to Stripe (batch operation)
   */
  static async reportUsageEvents(userId: string, billingCycleId?: string): Promise<void> {
    try {
      const stripe = await this.getStripe();

      // Get usage events that haven't been reported to Stripe yet
      let eventsQuery = db
        .select()
        .from(usageEvents)
        .where(eq(usageEvents.userId, userId));

      if (billingCycleId) {
        eventsQuery = eventsQuery.where(eq(usageEvents.billingCycleId, billingCycleId));
      }

      const events = await eventsQuery;

      // Group events by subscription item
      const eventsBySubscriptionItem = events.reduce((acc, event) => {
        const itemId = event.stripeSubscriptionItemId;
        if (!itemId) return acc;

        if (!acc[itemId]) {
          acc[itemId] = [];
        }
        acc[itemId].push(event);
        return acc;
      }, {} as Record<string, typeof events>);

      // Report usage for each subscription item
      for (const [subscriptionItemId, itemEvents] of Object.entries(eventsBySubscriptionItem)) {
        // Aggregate usage by timestamp (Stripe requires chronological order)
        const usageByTimestamp = itemEvents.reduce((acc, event) => {
          const timestamp = Math.floor(event.createdAt.getTime() / 1000);
          if (!acc[timestamp]) {
            acc[timestamp] = 0;
          }
          acc[timestamp] += parseFloat(event.quantity);
          return acc;
        }, {} as Record<number, number>);

        // Report each timestamp's usage
        for (const [timestamp, quantity] of Object.entries(usageByTimestamp)) {
          await this.reportUsage({
            subscriptionItemId,
            quantity,
            timestamp: parseInt(timestamp),
            metadata: {
              eventCount: itemEvents.length,
              billingCycleId
            }
          });
        }
      }
    } catch (error) {
      console.error('Error reporting usage events to Stripe:', error);
      throw error;
    }
  }

  /**
   * Update subscription plan
   */
  static async updateSubscriptionPlan(
    subscriptionId: string,
    newPlanId: string,
    prorate: boolean = true
  ): Promise<any> {
    try {
      const stripe = await this.getStripe();

      // Get new plan details
      const newPlan = await db
        .select()
        .from(usagePlans)
        .where(eq(usagePlans.id, newPlanId))
        .limit(1);

      if (newPlan.length === 0) {
        throw new Error(`Plan ${newPlanId} not found`);
      }

      const planData = newPlan[0];

      if (!planData.stripePriceId) {
        throw new Error(`Plan ${newPlanId} is not configured for Stripe billing`);
      }

      // Update subscription
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const subscriptionItemId = subscription.items.data[0].id;

      const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
        items: [{
          id: subscriptionItemId,
          price: planData.stripePriceId,
        }],
        proration_behavior: prorate ? 'create_prorations' : 'none',
        metadata: {
          ...subscription.metadata,
          planId: newPlanId
        }
      });

      // Update billing cycle
      await db
        .update(billingCycles)
        .set({
          billingPlanId: newPlanId,
          updatedAt: new Date()
        })
        .where(eq(billingCycles.stripeSubscriptionId, subscriptionId));

      return updatedSubscription;
    } catch (error) {
      console.error('Error updating subscription plan:', error);
      throw error;
    }
  }

  /**
   * Cancel subscription
   */
  static async cancelSubscription(
    subscriptionId: string,
    cancelAtPeriodEnd: boolean = true
  ): Promise<any> {
    try {
      const stripe = await this.getStripe();

      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: cancelAtPeriodEnd,
      });

      // Update billing cycle status
      await db
        .update(billingCycles)
        .set({
          status: cancelAtPeriodEnd ? 'active' : 'cancelled',
          updatedAt: new Date()
        })
        .where(eq(billingCycles.stripeSubscriptionId, subscriptionId));

      return subscription;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }
  }

  /**
   * Reactivate cancelled subscription
   */
  static async reactivateSubscription(subscriptionId: string): Promise<any> {
    try {
      const stripe = await this.getStripe();

      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false,
      });

      // Update billing cycle status
      await db
        .update(billingCycles)
        .set({
          status: 'active',
          updatedAt: new Date()
        })
        .where(eq(billingCycles.stripeSubscriptionId, subscriptionId));

      return subscription;
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      throw error;
    }
  }

  /**
   * Get subscription details
   */
  static async getSubscription(subscriptionId: string): Promise<any> {
    try {
      const stripe = await this.getStripe();
      return await stripe.subscriptions.retrieve(subscriptionId);
    } catch (error) {
      console.error('Error getting subscription:', error);
      throw error;
    }
  }

  /**
   * List customer subscriptions
   */
  static async listCustomerSubscriptions(customerId: string): Promise<any[]> {
    try {
      const stripe = await this.getStripe();
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'all'
      });
      return subscriptions.data;
    } catch (error) {
      console.error('Error listing customer subscriptions:', error);
      return [];
    }
  }

  /**
   * Handle Stripe webhook events for metered billing
   */
  static async handleWebhookEvent(event: any): Promise<void> {
    try {
      switch (event.type) {
        case 'invoice.payment_succeeded':
          await this.handleInvoicePaymentSucceeded(event.data.object);
          break;
        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(event.data.object);
          break;
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object);
          break;
        default:
          console.log(`Unhandled Stripe metered billing event: ${event.type}`);
      }
    } catch (error) {
      console.error('Error handling Stripe webhook event:', error);
      throw error;
    }
  }

  /**
   * Handle successful invoice payment
   */
  private static async handleInvoicePaymentSucceeded(invoice: any): Promise<void> {
    try {
      const subscriptionId = invoice.subscription;
      if (!subscriptionId) return;

      // Update billing cycle status
      await db
        .update(billingCycles)
        .set({
          status: 'completed',
          stripeInvoiceId: invoice.id,
          invoicePdfUrl: invoice.invoice_pdf,
          totalCostCents: invoice.amount_due,
          updatedAt: new Date()
        })
        .where(eq(billingCycles.stripeSubscriptionId, subscriptionId));

      console.log(`Invoice payment succeeded for subscription ${subscriptionId}`);
    } catch (error) {
      console.error('Error handling invoice payment succeeded:', error);
    }
  }

  /**
   * Handle failed invoice payment
   */
  private static async handleInvoicePaymentFailed(invoice: any): Promise<void> {
    try {
      const subscriptionId = invoice.subscription;
      if (!subscriptionId) return;

      // Update billing cycle status
      await db
        .update(billingCycles)
        .set({
          status: 'failed',
          updatedAt: new Date()
        })
        .where(eq(billingCycles.stripeSubscriptionId, subscriptionId));

      console.log(`Invoice payment failed for subscription ${subscriptionId}`);
    } catch (error) {
      console.error('Error handling invoice payment failed:', error);
    }
  }

  /**
   * Handle subscription updated
   */
  private static async handleSubscriptionUpdated(subscription: any): Promise<void> {
    try {
      // Update billing cycle with new period
      await db
        .update(billingCycles)
        .set({
          startDate: new Date(subscription.current_period_start * 1000),
          endDate: new Date(subscription.current_period_end * 1000),
          updatedAt: new Date()
        })
        .where(eq(billingCycles.stripeSubscriptionId, subscription.id));

      console.log(`Subscription updated: ${subscription.id}`);
    } catch (error) {
      console.error('Error handling subscription updated:', error);
    }
  }

  /**
   * Handle subscription deleted
   */
  private static async handleSubscriptionDeleted(subscription: any): Promise<void> {
    try {
      // Mark billing cycle as cancelled
      await db
        .update(billingCycles)
        .set({
          status: 'cancelled',
          updatedAt: new Date()
        })
        .where(eq(billingCycles.stripeSubscriptionId, subscription.id));

      console.log(`Subscription cancelled: ${subscription.id}`);
    } catch (error) {
      console.error('Error handling subscription deleted:', error);
    }
  }
}