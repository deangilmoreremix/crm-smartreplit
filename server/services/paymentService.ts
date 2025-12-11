import { ProductTier } from "../../shared/schema";
import { ProductType, handleSuccessfulPurchase, upsertEntitlement } from "../entitlements-utils";
import { supabase } from "../supabase";

export type PaymentProvider = 'stripe' | 'paypal' | 'jvzoo' | 'zaxaa';

export interface PaymentMetadata {
  userId?: string;
  email?: string;
  productTier?: ProductTier;
  productType?: ProductType;
  planName?: string;
  planAmount?: string;
  currency?: string;
  paymentProvider: PaymentProvider;
  transactionId?: string;
  customerId?: string;
  subscriptionId?: string;
}

export const PRODUCT_TIER_MAP: Record<string, ProductTier> = {
  'super_admin': 'super_admin',
  'whitelabel': 'whitelabel',
  'smartcrm': 'smartcrm',
  'sales_maximizer': 'sales_maximizer',
  'ai_boost_unlimited': 'ai_boost_unlimited',
  'ai_communication': 'ai_communication',
  'smartcrm_bundle': 'smartcrm_bundle',
};

export function detectProductTierFromName(productName: string): ProductTier {
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

export function determineRoleFromTier(productTier: ProductTier): 'super_admin' | 'wl_user' | 'regular_user' {
  if (productTier === 'super_admin') return 'super_admin';
  if (productTier === 'whitelabel' || productTier === 'smartcrm_bundle') return 'wl_user';
  return 'regular_user';
}

export function determineProductTypeFromInterval(interval?: string): ProductType {
  if (!interval) return 'lifetime';
  if (interval === 'month') return 'monthly';
  if (interval === 'year') return 'yearly';
  return 'lifetime';
}

export async function findUserByEmail(email: string): Promise<string | null> {
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

export async function updateUserProductTier(
  userId: string, 
  email: string, 
  productTier: ProductTier, 
  role: string,
  paymentProvider: PaymentProvider
): Promise<boolean> {
  if (!supabase) {
    console.error('Supabase not configured');
    return false;
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
      return false;
    }

    await supabase.auth.admin.updateUserById(userId, {
      user_metadata: {
        product_tier: productTier,
        role: role,
        product_tier_updated_at: new Date().toISOString(),
        payment_provider: paymentProvider
      }
    });

    console.log(`✅ Updated user product tier via ${paymentProvider}:`, { userId, productTier, role });
    return true;
  } catch (error) {
    console.error('Error updating user product tier:', error);
    return false;
  }
}

export async function revokeUserAccess(
  userId: string, 
  email: string, 
  reason: string,
  paymentProvider: PaymentProvider
): Promise<boolean> {
  if (!supabase) {
    console.error('Supabase not configured');
    return false;
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
        [`${paymentProvider}_${reason}_at`]: new Date().toISOString()
      }
    });

    console.log(`✅ Revoked ${paymentProvider} access for user ${email} due to ${reason}`);
    return true;
  } catch (error) {
    console.error('Error revoking user access:', error);
    return false;
  }
}

export async function processPayment(metadata: PaymentMetadata): Promise<boolean> {
  let userId = metadata.userId;
  
  if (!userId && metadata.email) {
    userId = await findUserByEmail(metadata.email) || undefined;
  }

  if (!userId) {
    console.warn(`⚠️ Could not identify user for ${metadata.paymentProvider} payment:`, metadata);
    return false;
  }

  const productTier = metadata.productTier || 'smartcrm';
  const productType = metadata.productType || 'lifetime';
  const role = determineRoleFromTier(productTier);

  await updateUserProductTier(userId, metadata.email || '', productTier, role, metadata.paymentProvider);

  await handleSuccessfulPurchase(
    userId,
    productType,
    {
      stripeCustomerId: metadata.paymentProvider === 'stripe' ? metadata.customerId : undefined,
      stripeSubscriptionId: metadata.paymentProvider === 'stripe' ? metadata.subscriptionId : undefined,
      zaxaaSubscriptionId: metadata.paymentProvider === 'zaxaa' ? metadata.subscriptionId : undefined,
      planName: metadata.planName || productTier,
      planAmount: metadata.planAmount,
      currency: metadata.currency || 'USD',
    }
  );

  console.log(`✅ ${metadata.paymentProvider} payment processed: user=${userId}, tier=${productTier}, type=${productType}`);
  return true;
}

export async function processRefund(
  userId: string,
  email: string,
  productType: ProductType,
  paymentProvider: PaymentProvider
): Promise<boolean> {
  await revokeUserAccess(userId, email, 'refunded', paymentProvider);
  
  const now = new Date().toISOString();
  await upsertEntitlement({
    userId,
    status: 'refunded',
    productType,
    revokeAt: now,
  });

  console.log(`💸 ${paymentProvider} refund processed: user=${userId}`);
  return true;
}

export async function processCancellation(
  userId: string,
  email: string,
  productType: ProductType,
  paymentProvider: PaymentProvider
): Promise<boolean> {
  await revokeUserAccess(userId, email, 'cancelled', paymentProvider);
  
  const now = new Date().toISOString();
  await upsertEntitlement({
    userId,
    status: 'canceled',
    productType,
    revokeAt: now,
  });

  console.log(`✅ ${paymentProvider} cancellation processed: user=${userId}`);
  return true;
}
