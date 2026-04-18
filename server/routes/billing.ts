import type { Express } from 'express';
import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { productTiers } from '../../shared/schema';

const router = Router();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Pricing for OpenClaw upgrade tiers
const upgradePricing = {
  smartcrm_bundle: {
    priceId: process.env.STRIPE_SMARTCRM_BUNDLE_PRICE_ID!,
    amount: 97,
    name: 'SmartCRM Bundle'
  },
  sales_maximizer: {
    priceId: process.env.STRIPE_SALES_MAXIMIZER_PRICE_ID!,
    amount: 67,
    name: 'Sales Maximizer'
  }
};

/**
 * POST /api/billing/upgrade
 * Upgrade user to a new product tier with OpenClaw access
 */
router.post('/upgrade', async (req: Request, res: Response) => {
  try {
    const { tierId, currentTier } = req.body;
    const userId = (req as any).session?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!productTiers.includes(tierId)) {
      return res.status(400).json({ error: 'Invalid tier ID' });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      return res.status(500).json({ error: 'Failed to get user profile' });
    }

    // Check if tier is valid for upgrade
    const openClawEnabledTiers = ['super_admin', 'whitelabel', 'smartcrm_bundle', 'sales_maximizer'];
    if (!openClawEnabledTiers.includes(tierId)) {
      return res.status(400).json({ error: 'Tier does not include OpenClaw access' });
    }

    // Check if user already has this tier or higher
    const tierHierarchy = {
      'ai_communication': 1,
      'ai_boost_unlimited': 2,
      'sales_maximizer': 3,
      'smartcrm': 4,
      'smartcrm_bundle': 5,
      'whitelabel': 6,
      'super_admin': 7
    };

    const currentTierLevel = tierHierarchy[profile.productTier as keyof typeof tierHierarchy] || 0;
    const targetTierLevel = tierHierarchy[tierId as keyof typeof tierHierarchy] || 0;

    if (targetTierLevel <= currentTierLevel) {
      return res.status(400).json({ error: 'User already has this tier or higher' });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: upgradePricing[tierId as keyof typeof upgradePricing].priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/settings?upgrade=success&tier=${tierId}`,
      cancel_url: `${process.env.FRONTEND_URL}/settings?upgrade=cancelled`,
      metadata: {
        userId,
        tierId,
        upgradeType: 'openclaw'
      },
      customer_email: profile.email,
    });

    res.json({
      sessionId: session.id,
      url: session.url,
      tier: tierId,
      amount: upgradePricing[tierId as keyof typeof upgradePricing].amount
    });

  } catch (error: any) {
    console.error('Upgrade error:', error);
    res.status(500).json({ error: 'Failed to create upgrade session' });
  }
});

/**
 * POST /api/billing/webhook
 * Handle Stripe webhooks for successful payments
 */
router.post('/webhook', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err: any) {
    console.log(`Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      if (session.metadata?.upgradeType === 'openclaw') {
        const userId = session.metadata.userId;
        const tierId = session.metadata.tierId;

        // Update user tier in database
        const { error } = await supabase
          .from('profiles')
          .update({ 
            productTier: tierId,
            updatedAt: new Date().toISOString()
          })
          .eq('id', userId);

        if (error) {
          console.error('Failed to update user tier:', error);
        } else {
          console.log(`Successfully upgraded user ${userId} to ${tierId}`);
        }
      }
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * GET /api/billing/plans
 * Get available upgrade plans with pricing
 */
router.get('/plans', async (req: Request, res: Response) => {
  try {
    const plans = Object.entries(upgradePricing).map(([tierId, config]) => ({
      id: tierId,
      name: config.name,
      price: config.amount,
      priceId: config.priceId
    }));

    res.json({ plans });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get plans' });
  }
});

export { router as billingRoutes };
