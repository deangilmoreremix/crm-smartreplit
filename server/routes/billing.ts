console.log('Loading billing.ts');

import { Router, Request, Response } from 'express';
import { requireAuth } from './auth';
import { UsageTrackingService } from '../services/usageTrackingService';
import { BillingCalculationService } from '../services/billingCalculationService';
import { StripeMeteredBillingService } from '../services/stripeMeteredBillingService';
import { CreditService } from '../services/creditService';
import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { usagePlans, billingCycles, userUsageLimits } from '../../shared/schema';

const router = Router();

const router = Router();

// Apply authentication to all billing routes
router.use(requireAuth);

/**
 * GET /api/billing/plans
 * Get available billing plans
 */
router.get('/plans', async (req: Request, res: Response) => {
  try {
    const plans = await db
      .select()
      .from(usagePlans)
      .where(eq(usagePlans.isActive, true));

    res.json({ plans });
  } catch (error) {
    console.error('Error fetching billing plans:', error);
    res.status(500).json({ error: 'Failed to fetch billing plans' });
  }
});

/**
  * GET /api/billing/summary
  * Get user's billing summary (credit balance and usage)
  */
 router.get('/summary', async (req: Request, res: Response) => {
   try {
     const userId = (req as any).user.id;

     // Get credit balance
     const creditBalance = await CreditService.getCreditBalance(userId);

     // Get recent usage stats
     const usageStats = await UsageTrackingService.getUsageStats(userId);

     // Get credit transaction history (last 10)
     const transactions = await CreditService.getCreditTransactionHistory(userId, 10);

     const summary = {
       credits: creditBalance,
       usage: usageStats,
       recentTransactions: transactions,
     };

     res.json(summary);
   } catch (error) {
     console.error('Error fetching billing summary:', error);
     res.status(500).json({ error: 'Failed to fetch billing summary' });
   }
 });

/**
 * GET /api/billing/usage
 * Get user's usage statistics
 */
router.get('/usage', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;

    const usageStats = await UsageTrackingService.getUsageStats(userId, start, end);
    res.json(usageStats);
  } catch (error) {
    console.error('Error fetching usage stats:', error);
    res.status(500).json({ error: 'Failed to fetch usage statistics' });
  }
});

/**
  * GET /api/billing/credits
  * Get user's credit balance
  */
 router.get('/credits', async (req: Request, res: Response) => {
   try {
     const userId = (req as any).user.id;
     const balance = await CreditService.getCreditBalance(userId);
     res.json({ credits: balance });
   } catch (error) {
     console.error('Error fetching credit balance:', error);
     res.status(500).json({ error: 'Failed to fetch credit balance' });
   }
 });

/**
 * GET /api/billing/credit-packages
 * Get available credit packages for purchase
 */
 router.get('/credit-packages', async (req: Request, res: Response) => {
   try {
     console.log('Credit packages endpoint called');
     const packages = await CreditService.getCreditPackages();
     console.log('Credit packages:', packages);
     res.json({ packages, test: 'working' });
   } catch (error) {
     console.error('Error fetching credit packages:', error);
     res.status(500).json({ error: 'Failed to fetch credit packages' });
   }
 });

 // Test route
 router.get('/test', async (req: Request, res: Response) => {
   console.log('Billing test route called');
   res.json({ message: 'Billing routes are working', timestamp: new Date().toISOString() });
 });

/**
  * POST /api/billing/purchase-credits
  * Purchase credits
  */
 router.post('/purchase-credits', async (req: Request, res: Response) => {
   try {
     const userId = (req as any).user.id;
     const { planId, stripePaymentMethodId } = req.body;

     if (!planId) {
       return res.status(400).json({ error: 'Plan ID is required' });
     }

     // Here you would integrate with Stripe for payment processing
     // For now, we'll simulate the purchase
     const result = await CreditService.purchaseCredits({
       userId,
       planId,
       stripeTransactionId: `simulated_${Date.now()}`, // In real implementation, this would come from Stripe
     });

     res.json(result);
   } catch (error) {
     console.error('Error purchasing credits:', error);
     res.status(500).json({ error: 'Failed to purchase credits' });
   }
 });

// Subscription endpoints removed - now using credit-based billing

/**
 * GET /api/billing/invoices
 * Get user's invoices
 */
router.get('/invoices', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const billingCycles = await db
      .select()
      .from(billingCycles)
      .where(and(
        eq(billingCycles.userId, userId),
        eq(billingCycles.status, 'completed')
      ))
      .orderBy(billingCycles.endDate);

    const invoices = await Promise.all(
      billingCycles.map(async (cycle) => {
        const invoice = await BillingCalculationService.generateInvoice(cycle.id);
        return {
          id: cycle.id,
          billingCycleId: cycle.id,
          startDate: cycle.startDate,
          endDate: cycle.endDate,
          totalAmountCents: cycle.totalCostCents,
          status: cycle.status,
          stripeInvoiceId: cycle.stripeInvoiceId,
          invoicePdfUrl: cycle.invoicePdfUrl,
          lineItems: invoice.lineItems
        };
      })
    );

    res.json({ invoices });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

/**
 * GET /api/billing/notifications
 * Get user's billing notifications
 */
router.get('/notifications', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const notifications = await UsageTrackingService.getUnreadNotifications(userId);
    res.json({ notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

/**
 * POST /api/billing/notifications/mark-read
 * Mark notifications as read
 */
router.post('/notifications/mark-read', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { notificationIds } = req.body;

    if (!Array.isArray(notificationIds)) {
      return res.status(400).json({ error: 'notificationIds must be an array' });
    }

    await UsageTrackingService.markNotificationsRead(userId, notificationIds);
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
});

/**
 * POST /api/billing/estimate
 * Estimate costs for a plan and usage pattern
 */
router.post('/estimate', async (req: Request, res: Response) => {
  try {
    const { planId, usagePattern } = req.body;

    if (!planId || !usagePattern) {
      return res.status(400).json({ error: 'Plan ID and usage pattern are required' });
    }

    const estimate = await BillingCalculationService.estimateCosts(planId, usagePattern);
    res.json(estimate);
  } catch (error) {
    console.error('Error estimating costs:', error);
    res.status(500).json({ error: 'Failed to estimate costs' });
  }
});

/**
 * POST /api/billing/prorate
 * Calculate prorated charges for plan changes
 */
router.post('/prorate', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { currentPlanId, newPlanId, changeDate } = req.body;

    if (!currentPlanId || !newPlanId) {
      return res.status(400).json({ error: 'Current and new plan IDs are required' });
    }

    const proration = await BillingCalculationService.calculateProratedCharge(
      userId,
      currentPlanId,
      newPlanId,
      changeDate ? new Date(changeDate) : undefined
    );

    res.json(proration);
  } catch (error) {
    console.error('Error calculating proration:', error);
    res.status(500).json({ error: 'Failed to calculate proration' });
  }
});

export { router as billingRoutes };