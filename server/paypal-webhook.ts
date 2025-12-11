import { Request, Response } from "express";
import crypto from "crypto";
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
      console.log('✅ Updated user product tier via PayPal:', { userId, productTier, role });
    }

    await supabase.auth.admin.updateUserById(userId, {
      user_metadata: {
        product_tier: productTier,
        role: role,
        product_tier_updated_at: new Date().toISOString(),
        payment_source: 'paypal'
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
        [`paypal_${reason}_at`]: new Date().toISOString()
      }
    });

    console.log(`✅ Revoked PayPal access for user ${email} due to ${reason}`);
  } catch (error) {
    console.error('Error revoking user access:', error);
  }
}

async function verifyPayPalWebhook(req: Request): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const isProduction = process.env.NODE_ENV === 'production' || process.env.REPLIT_DEPLOYMENT === '1';
  
  if (!webhookId) {
    if (isProduction) {
      console.error('❌ PayPal webhook ID not configured in production - rejecting');
      return false;
    }
    console.warn('⚠️ PayPal webhook ID not configured - skipping verification (dev only)');
    return true;
  }

  const transmissionId = req.headers['paypal-transmission-id'] as string;
  const transmissionTime = req.headers['paypal-transmission-time'] as string;
  const certUrl = req.headers['paypal-cert-url'] as string;
  const transmissionSig = req.headers['paypal-transmission-sig'] as string;
  const authAlgo = req.headers['paypal-auth-algo'] as string;

  if (!transmissionId || !transmissionTime || !certUrl || !transmissionSig) {
    console.error('Missing PayPal verification headers');
    return false;
  }

  if (!clientId || !clientSecret) {
    if (isProduction) {
      console.error('❌ PayPal credentials not configured in production - rejecting');
      return false;
    }
    console.warn('⚠️ PayPal credentials not configured - using header presence check only (dev only)');
    return true;
  }

  try {
    const paypalBaseUrl = isProduction 
      ? 'https://api-m.paypal.com' 
      : 'https://api-m.sandbox.paypal.com';

    const authResponse = await fetch(`${paypalBaseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!authResponse.ok) {
      console.error('Failed to get PayPal access token:', await authResponse.text());
      return false;
    }

    const { access_token } = await authResponse.json();

    const verifyResponse = await fetch(`${paypalBaseUrl}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        auth_algo: authAlgo,
        cert_url: certUrl,
        transmission_id: transmissionId,
        transmission_sig: transmissionSig,
        transmission_time: transmissionTime,
        webhook_id: webhookId,
        webhook_event: req.body,
      }),
    });

    if (!verifyResponse.ok) {
      console.error('PayPal webhook verification failed:', await verifyResponse.text());
      return false;
    }

    const verifyResult = await verifyResponse.json();
    const isValid = verifyResult.verification_status === 'SUCCESS';
    
    if (!isValid) {
      console.error('PayPal webhook signature invalid:', verifyResult.verification_status);
    }

    return isValid;
  } catch (error) {
    console.error('Error verifying PayPal webhook:', error);
    return false;
  }
}

async function findUserByEmail(email: string): Promise<string | null> {
  if (!supabase) return null;

  try {
    const { data: usersData } = await supabase.auth.admin.listUsers();
    const user = usersData?.users?.find(u => 
      u.email?.toLowerCase() === email.toLowerCase()
    );
    return user?.id || null;
  } catch (error) {
    console.error('Error finding user by email:', error);
    return null;
  }
}

export async function handlePayPalWebhook(req: Request, res: Response) {
  const isValid = await verifyPayPalWebhook(req);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }

  const event = req.body;
  const eventType = event.event_type;

  console.log('📥 Received PayPal webhook:', eventType);

  try {
    switch (eventType) {
      case 'CHECKOUT.ORDER.APPROVED':
      case 'PAYMENT.CAPTURE.COMPLETED': {
        const resource = event.resource;
        const payer = resource.payer || resource.purchase_units?.[0]?.payer;
        const customerEmail = payer?.email_address;
        const customData = resource.purchase_units?.[0]?.custom_id || 
                          resource.purchase_units?.[0]?.reference_id || '';
        
        let customMetadata: any = {};
        try {
          customMetadata = JSON.parse(customData);
        } catch {
          customMetadata = { product_tier: customData };
        }

        const productTier: ProductTier = customMetadata.product_tier ? 
          (PRODUCT_TIER_MAP[customMetadata.product_tier] || detectProductTierFromName(customMetadata.product_tier)) :
          'smartcrm';
        const productType: ProductType = customMetadata.product_type || 'lifetime';

        let userId = customMetadata.user_id;
        if (!userId && customerEmail) {
          userId = await findUserByEmail(customerEmail);
        }

        if (userId) {
          const role = determineRoleFromTier(productTier);
          await updateUserProductTier(userId, customerEmail || '', productTier, role);

          await handleSuccessfulPurchase(
            userId,
            productType,
            {
              planName: customMetadata.plan_name || productTier,
              planAmount: resource.amount?.value || resource.purchase_units?.[0]?.amount?.value,
              currency: resource.amount?.currency_code || 'USD',
            }
          );
          
          console.log(`✅ PayPal purchase processed: user=${userId}, tier=${productTier}, type=${productType}`);
        } else {
          console.warn('⚠️ Could not identify user for PayPal payment:', { customerEmail, customData });
        }
        break;
      }

      case 'BILLING.SUBSCRIPTION.ACTIVATED':
      case 'BILLING.SUBSCRIPTION.RENEWED': {
        const resource = event.resource;
        const subscriberEmail = resource.subscriber?.email_address;
        const customData = resource.custom_id || '';
        
        let customMetadata: any = {};
        try {
          customMetadata = JSON.parse(customData);
        } catch {
          customMetadata = { product_tier: customData };
        }

        const productTier: ProductTier = customMetadata.product_tier ? 
          (PRODUCT_TIER_MAP[customMetadata.product_tier] || detectProductTierFromName(customMetadata.product_tier)) :
          'smartcrm';
        const productType: ProductType = customMetadata.product_type || 'monthly';

        let userId = customMetadata.user_id;
        if (!userId && subscriberEmail) {
          userId = await findUserByEmail(subscriberEmail);
        }

        if (userId) {
          const role = determineRoleFromTier(productTier);
          await updateUserProductTier(userId, subscriberEmail || '', productTier, role);
          await handleInvoicePaid(userId, productType);
          console.log(`✅ PayPal subscription ${eventType}: user=${userId}, tier=${productTier}`);
        }
        break;
      }

      case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED': {
        const resource = event.resource;
        const subscriberEmail = resource.subscriber?.email_address;
        const customData = resource.custom_id || '';
        
        let customMetadata: any = {};
        try {
          customMetadata = JSON.parse(customData);
        } catch {
          customMetadata = {};
        }

        const productType: ProductType = customMetadata.product_type || 'monthly';
        let userId = customMetadata.user_id;
        if (!userId && subscriberEmail) {
          userId = await findUserByEmail(subscriberEmail);
        }

        if (userId) {
          await handlePaymentFailure(userId, productType);
          console.log(`⚠️ PayPal payment failed: user=${userId}`);
        }
        break;
      }

      case 'BILLING.SUBSCRIPTION.CANCELLED':
      case 'BILLING.SUBSCRIPTION.SUSPENDED':
      case 'BILLING.SUBSCRIPTION.EXPIRED': {
        const resource = event.resource;
        const subscriberEmail = resource.subscriber?.email_address;
        const customData = resource.custom_id || '';
        
        let customMetadata: any = {};
        try {
          customMetadata = JSON.parse(customData);
        } catch {
          customMetadata = {};
        }

        const productType: ProductType = customMetadata.product_type || 'monthly';
        let userId = customMetadata.user_id;
        if (!userId && subscriberEmail) {
          userId = await findUserByEmail(subscriberEmail);
        }

        if (userId) {
          await revokeUserAccess(userId, subscriberEmail || '', 'subscription_cancelled');
          await handleCancellation(userId, productType);
          console.log(`✅ PayPal subscription cancelled: user=${userId}`);
        }
        break;
      }

      case 'PAYMENT.CAPTURE.REFUNDED':
      case 'PAYMENT.CAPTURE.REVERSED': {
        const resource = event.resource;
        const links = resource.links || [];
        const captureLink = links.find((l: any) => l.rel === 'up');
        
        let customerEmail: string | undefined;
        let userId: string | undefined;

        if (captureLink?.href) {
          console.log('PayPal refund for capture:', captureLink.href);
        }

        const customData = resource.custom_id || resource.invoice_id || '';
        let customMetadata: any = {};
        try {
          customMetadata = JSON.parse(customData);
        } catch {
          customMetadata = {};
        }

        userId = customMetadata.user_id;
        customerEmail = customMetadata.email;
        const productType: ProductType = customMetadata.product_type || 'lifetime';

        if (!userId && customerEmail) {
          const foundUserId = await findUserByEmail(customerEmail);
          if (foundUserId) userId = foundUserId;
        }

        if (userId) {
          await revokeUserAccess(userId, customerEmail || '', 'refunded');
          await handleRefund(userId, productType);
          console.log(`💸 PayPal refund processed: user=${userId}`);
        }
        break;
      }

      case 'CUSTOMER.DISPUTE.CREATED': {
        const resource = event.resource;
        const disputedTransaction = resource.disputed_transactions?.[0];
        
        if (disputedTransaction) {
          const customData = disputedTransaction.custom || '';
          let customMetadata: any = {};
          try {
            customMetadata = JSON.parse(customData);
          } catch {
            customMetadata = {};
          }

          let userId = customMetadata.user_id;
          const customerEmail = customMetadata.email || disputedTransaction.buyer?.email;
          const productType: ProductType = customMetadata.product_type || 'lifetime';

          if (!userId && customerEmail) {
            userId = await findUserByEmail(customerEmail);
          }

          if (userId) {
            await revokeUserAccess(userId, customerEmail || '', 'disputed');
            await handleRefund(userId, productType);
            console.log(`⚠️ PayPal dispute/chargeback: user=${userId}`);
          }
        }
        break;
      }

      default:
        console.log(`ℹ️ Unhandled PayPal event type: ${eventType}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing PayPal webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
