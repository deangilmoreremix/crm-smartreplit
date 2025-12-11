import { Request, Response } from "express";
import { 
  handleSuccessfulPurchase,
  handleInvoicePaid,
  handlePaymentFailure,
  handleCancellation,
  handleRefund,
  ProductType,
  upsertEntitlement
} from "./entitlements-utils";
import { supabase } from "./supabase";
import { ProductTier } from "../shared/schema";
import { getUncachableStripeClient, getStripeSync } from "./stripeClient";
import { WebhookHandlers } from "./webhookHandlers";

const PRODUCT_TIER_MAP: Record<string, ProductTier> = {
  'super_admin': 'super_admin',
  'whitelabel': 'whitelabel',
  'smartcrm': 'smartcrm',
  'sales_maximizer': 'sales_maximizer',
  'ai_boost_unlimited': 'ai_boost_unlimited',
  'ai_communication': 'ai_communication',
  'smartcrm_bundle': 'smartcrm_bundle',
};

function detectProductTierFromName(productName: string): ProductTier {
  const nameLower = productName.toLowerCase();
  if (nameLower.includes('super admin')) return 'super_admin';
  if (nameLower.includes('whitelabel') || nameLower.includes('white label')) return 'whitelabel';
  if (nameLower.includes('smartcrm bundle')) return 'smartcrm_bundle';
  if (nameLower.includes('ai communication')) return 'ai_communication';
  if (nameLower.includes('ai boost unlimited')) return 'ai_boost_unlimited';
  if (nameLower.includes('sales maximizer')) return 'sales_maximizer';
  if (nameLower.includes('smartcrm')) return 'smartcrm';
  return 'smartcrm';
}

function determineRoleFromTier(productTier: ProductTier): 'super_admin' | 'wl_user' | 'regular_user' {
  if (productTier === 'super_admin') return 'super_admin';
  if (productTier === 'whitelabel' || productTier === 'smartcrm_bundle') return 'wl_user';
  return 'regular_user';
}

function determineProductTypeFromInterval(interval?: string): ProductType {
  if (!interval) return 'lifetime';
  if (interval === 'month') return 'monthly';
  if (interval === 'year') return 'yearly';
  return 'lifetime';
}

async function updateUserProductTier(userId: string, email: string, productTier: ProductTier, role: string) {
  if (!supabase) {
    console.error('Supabase not configured');
    return;
  }

  try {
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        product_tier: productTier,
        role: role,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      console.error('❌ Error updating user product tier:', updateError);
    } else {
      console.log('✅ Updated user product tier:', { userId, productTier, role });
    }

    await supabase.auth.admin.updateUserById(userId, {
      user_metadata: {
        product_tier: productTier,
        role: role,
        product_tier_updated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error updating user product tier:', error);
  }
}

async function revokeUserAccess(userId: string, email: string, reason: string) {
  if (!supabase) {
    console.error('Supabase not configured');
    return;
  }

  try {
    await supabase
      .from('profiles')
      .update({ 
        product_tier: null,
        role: 'regular_user',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    await supabase.auth.admin.updateUserById(userId, {
      user_metadata: {
        product_tier: null,
        role: 'regular_user',
        product_tier_updated_at: new Date().toISOString(),
        [`${reason}_at`]: new Date().toISOString()
      }
    });

    console.log(`✅ Revoked access for user ${email} due to ${reason}`);
  } catch (error) {
    console.error('Error revoking user access:', error);
  }
}

export async function handleStripeWebhookManaged(payload: Buffer, signature: string, uuid: string) {
  await WebhookHandlers.processWebhook(payload, signature, uuid);
}

export async function handleStripeWebhook(req: Request, res: Response) {
  const isProduction = process.env.NODE_ENV === 'production' || process.env.REPLIT_DEPLOYMENT === '1';
  
  let stripe: any;
  try {
    stripe = await getUncachableStripeClient();
  } catch (error) {
    console.error('Stripe not configured:', error);
    return res.status(400).json({ error: 'Stripe not configured' });
  }

  const sig = req.headers['stripe-signature'] as string;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig) {
    console.error('Missing stripe-signature header');
    return res.status(400).json({ error: 'Missing signature' });
  }

  if (!endpointSecret && isProduction) {
    console.error('❌ Stripe webhook secret not configured in production - rejecting');
    return res.status(400).json({ error: 'Webhook secret not configured' });
  }

  let event: any;

  try {
    if (endpointSecret) {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } else {
      event = JSON.parse(req.body.toString());
      console.warn('⚠️ Stripe webhook secret not configured - skipping signature verification (dev only)');
    }
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  try {
    console.log('📥 Received Stripe webhook:', event.type);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const metadata = session.metadata || {};
        const customerEmail = session.customer_email || session.customer_details?.email;
        
        let userId = metadata.user_id;
        let productTier: ProductTier = metadata.product_tier ? 
          (PRODUCT_TIER_MAP[metadata.product_tier] || detectProductTierFromName(metadata.product_tier)) :
          'smartcrm';
        let productType: ProductType = metadata.product_type as ProductType || 'lifetime';

        if (session.line_items?.data?.[0]?.price?.recurring?.interval) {
          productType = determineProductTypeFromInterval(session.line_items.data[0].price.recurring.interval);
        }

        if (!userId && customerEmail) {
          if (!supabase) {
            throw new Error('Supabase not configured');
          }
          const { data: usersData } = await supabase.auth.admin.listUsers();
          const existingUser = usersData?.users?.find(u => 
            u.email?.toLowerCase() === customerEmail.toLowerCase()
          );
          userId = existingUser?.id;
        }

        if (userId) {
          const role = determineRoleFromTier(productTier);
          
          await updateUserProductTier(userId, customerEmail || '', productTier, role);

          await handleSuccessfulPurchase(
            userId,
            productType,
            {
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: session.subscription as string,
              planName: metadata.plan_name || productTier,
              planAmount: session.amount_total ? (session.amount_total / 100).toString() : undefined,
              currency: session.currency?.toUpperCase(),
            }
          );
          
          console.log(`✅ Stripe purchase processed: user=${userId}, tier=${productTier}, type=${productType}`);
        } else {
          console.warn('⚠️ Could not identify user for Stripe checkout:', { customerEmail, metadata });
        }
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as any;
        const subscription = invoice.subscription;
        const customerEmail = invoice.customer_email;
        
        if (subscription && typeof subscription === 'string') {
          const subscriptionObj = await stripe.subscriptions.retrieve(subscription);
          const metadata = subscriptionObj.metadata || {};
          
          let userId = metadata.user_id;
          let productType: ProductType = metadata.product_type as ProductType || 'monthly';

          if (subscriptionObj.items?.data?.[0]?.price?.recurring?.interval) {
            productType = determineProductTypeFromInterval(subscriptionObj.items.data[0].price.recurring.interval);
          }

          if (!userId && customerEmail) {
            if (!supabase) {
              throw new Error('Supabase not configured');
            }
            const { data: usersData } = await supabase.auth.admin.listUsers();
            const existingUser = usersData?.users?.find(u => 
              u.email?.toLowerCase() === customerEmail.toLowerCase()
            );
            userId = existingUser?.id;
          }

          if (userId) {
            await handleInvoicePaid(userId, productType);
            console.log(`✅ Stripe invoice paid: user=${userId}, type=${productType}`);
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        const subscription = invoice.subscription;
        const customerEmail = invoice.customer_email;
        
        if (subscription && typeof subscription === 'string') {
          const subscriptionObj = await stripe.subscriptions.retrieve(subscription);
          const metadata = subscriptionObj.metadata || {};
          
          let userId = metadata.user_id;
          let productType: ProductType = metadata.product_type as ProductType || 'monthly';

          if (!userId && customerEmail) {
            if (!supabase) {
              throw new Error('Supabase not configured');
            }
            const { data: usersData } = await supabase.auth.admin.listUsers();
            const existingUser = usersData?.users?.find(u => 
              u.email?.toLowerCase() === customerEmail.toLowerCase()
            );
            userId = existingUser?.id;
          }

          if (userId) {
            await handlePaymentFailure(userId, productType);
            console.log(`⚠️ Stripe payment failed: user=${userId}, type=${productType}`);
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        const metadata = subscription.metadata || {};
        const customerId = subscription.customer;
        
        let userId = metadata.user_id;
        let productType: ProductType = metadata.product_type as ProductType || 'monthly';

        if (!userId && customerId) {
          const customer = await stripe.customers.retrieve(customerId);
          const customerEmail = customer.email;

          if (customerEmail && supabase) {
            const { data: usersData } = await supabase.auth.admin.listUsers();
            const existingUser = usersData?.users?.find(u => 
              u.email?.toLowerCase() === customerEmail.toLowerCase()
            );
            userId = existingUser?.id;

            if (userId) {
              await revokeUserAccess(userId, customerEmail, 'subscription_deleted');
            }
          }
        }

        if (userId) {
          await handleCancellation(userId, productType);
          console.log(`✅ Stripe subscription deleted: user=${userId}, type=${productType}`);
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as any;
        const paymentIntentId = charge.payment_intent;
        const customerEmail = charge.billing_details?.email || charge.receipt_email;
        
        let userId: string | undefined;
        let productType: ProductType = 'lifetime';

        if (typeof paymentIntentId === 'string') {
          const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
          const metadata = paymentIntent.metadata || {};
          userId = metadata.user_id;
          productType = metadata.product_type as ProductType || 'lifetime';
        }

        if (!userId && customerEmail && supabase) {
          const { data: usersData } = await supabase.auth.admin.listUsers();
          const existingUser = usersData?.users?.find(u => 
            u.email?.toLowerCase() === customerEmail.toLowerCase()
          );
          userId = existingUser?.id;
        }

        if (userId) {
          await revokeUserAccess(userId, customerEmail || '', 'refunded');
          await handleRefund(userId, productType);
          console.log(`💸 Stripe refund processed: user=${userId}`);
        }
        break;
      }

      case 'charge.dispute.created': {
        const dispute = event.data.object as any;
        const charge = dispute.charge;
        
        if (typeof charge === 'string') {
          const chargeObj = await stripe.charges.retrieve(charge);
          const customerEmail = chargeObj.billing_details?.email || chargeObj.receipt_email;
          const paymentIntentId = chargeObj.payment_intent;
          
          let userId: string | undefined;
          let productType: ProductType = 'lifetime';

          if (typeof paymentIntentId === 'string') {
            const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
            const metadata = paymentIntent.metadata || {};
            userId = metadata.user_id;
            productType = metadata.product_type as ProductType || 'lifetime';
          }

          if (!userId && customerEmail && supabase) {
            const { data: usersData } = await supabase.auth.admin.listUsers();
            const existingUser = usersData?.users?.find(u => 
              u.email?.toLowerCase() === customerEmail.toLowerCase()
            );
            userId = existingUser?.id;
          }

          if (userId) {
            await revokeUserAccess(userId, customerEmail || '', 'disputed');
            await handleRefund(userId, productType);
            console.log(`⚠️ Stripe dispute/chargeback: user=${userId}`);
          }
        }
        break;
      }

      default:
        console.log(`ℹ️ Unhandled Stripe event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing Stripe webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
