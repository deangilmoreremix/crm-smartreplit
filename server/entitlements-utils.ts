import { DateTime } from "luxon";
import { Entitlement, InsertEntitlement } from "../shared/schema";
import { db } from "./db";
import { entitlements } from "../shared/schema";
import { eq } from "drizzle-orm";

// Compute revocation boundaries in America/New_York, then convert to UTC
const ZONE = "America/New_York";

export function startOfNextMonthUTC(nowISO: string): string {
  const dt = DateTime.fromISO(nowISO, { zone: ZONE }).startOf('month').plus({ months: 1 });
  return dt.toUTC().toISO()!;
}

export function startOfNextYearUTC(nowISO: string): string {
  const dt = DateTime.fromISO(nowISO, { zone: ZONE }).startOf('year').plus({ years: 1 });
  return dt.toUTC().toISO()!;
}

export type ProductType = 'lifetime' | 'monthly' | 'yearly' | 'payment_plan';

export interface UpsertEntitlementParams {
  userId: string;
  status: string;
  productType: ProductType;
  revokeAt?: string | null;
  lastInvoiceStatus?: string;
  delinquencyCount?: number;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  zaxaaSubscriptionId?: string;
  planName?: string;
  planAmount?: string;
  currency?: string;
}

export async function upsertEntitlement(params: UpsertEntitlementParams): Promise<Entitlement> {
  const now = new Date().toISOString();
  
  // Check if entitlement exists
  const existing = await db
    .select()
    .from(entitlements)
    .where(eq(entitlements.userId, params.userId))
    .limit(1);

  if (existing.length > 0) {
    // Update existing entitlement
    const [updated] = await db
      .update(entitlements)
      .set({
        status: params.status,
        productType: params.productType,
        revokeAt: params.revokeAt ? new Date(params.revokeAt) : null,
        lastInvoiceStatus: params.lastInvoiceStatus,
        delinquencyCount: params.delinquencyCount ?? existing[0].delinquencyCount,
        stripeSubscriptionId: params.stripeSubscriptionId ?? existing[0].stripeSubscriptionId,
        stripeCustomerId: params.stripeCustomerId ?? existing[0].stripeCustomerId,
        zaxaaSubscriptionId: params.zaxaaSubscriptionId ?? existing[0].zaxaaSubscriptionId,
        planName: params.planName ?? existing[0].planName,
        planAmount: params.planAmount ?? existing[0].planAmount,
        currency: params.currency ?? existing[0].currency,
        updatedAt: new Date(now),
      })
      .where(eq(entitlements.userId, params.userId))
      .returning();
    
    return updated;
  } else {
    // Create new entitlement
    const [created] = await db
      .insert(entitlements)
      .values({
        userId: params.userId,
        status: params.status,
        productType: params.productType,
        revokeAt: params.revokeAt ? new Date(params.revokeAt) : null,
        lastInvoiceStatus: params.lastInvoiceStatus,
        delinquencyCount: params.delinquencyCount ?? 0,
        stripeSubscriptionId: params.stripeSubscriptionId,
        stripeCustomerId: params.stripeCustomerId,
        zaxaaSubscriptionId: params.zaxaaSubscriptionId,
        planName: params.planName,
        planAmount: params.planAmount,
        currency: params.currency ?? 'USD',
      })
      .returning();
    
    return created;
  }
}

export function calculateRevokeDate(productType: ProductType, nowISO: string): string | null {
  switch (productType) {
    case 'lifetime':
      return null; // never revoke
    case 'monthly':
      return startOfNextMonthUTC(nowISO); // revoke at 12:00am ET next month
    case 'yearly':
      return startOfNextYearUTC(nowISO); // revoke at 12:00am ET next year
    case 'payment_plan':
      return startOfNextMonthUTC(nowISO); // default rolling window; only enforced on miss
    default:
      return null;
  }
}

export async function handleSuccessfulPurchase(
  userId: string,
  productType: ProductType,
  metadata: {
    stripeSubscriptionId?: string;
    stripeCustomerId?: string;
    zaxaaSubscriptionId?: string;
    planName?: string;
    planAmount?: string;
    currency?: string;
  } = {}
) {
  const now = new Date().toISOString();
  const revokeAt = calculateRevokeDate(productType, now);

  return await upsertEntitlement({
    userId,
    status: 'active',
    productType,
    revokeAt,
    lastInvoiceStatus: 'paid',
    delinquencyCount: 0,
    ...metadata,
  });
}

export async function handleInvoicePaid(
  userId: string,
  productType: ProductType
) {
  const now = new Date().toISOString();
  let revokeAt: string | null = null;

  // Monthly/Yearly: refresh revoke_at to the next boundary again
  if (productType === 'monthly' || productType === 'yearly') {
    revokeAt = calculateRevokeDate(productType, now);
  }

  // Payment plan: set last_invoice_status='paid', keep delinquency_count at 0
  return await upsertEntitlement({
    userId,
    status: 'active',
    productType,
    revokeAt,
    lastInvoiceStatus: 'paid',
    delinquencyCount: 0,
  });
}

export async function handlePaymentFailure(
  userId: string,
  productType: ProductType
) {
  const now = new Date().toISOString();
  
  // Get existing entitlement
  const existing = await db
    .select()
    .from(entitlements)
    .where(eq(entitlements.userId, userId))
    .limit(1);

  if (productType === 'payment_plan') {
    // Payment plan: first failed installment should revoke immediately
    return await upsertEntitlement({
      userId,
      status: 'past_due',
      productType,
      revokeAt: now, // immediate lock
      delinquencyCount: (existing[0]?.delinquencyCount ?? 0) + 1,
    });
  } else {
    // Monthly/Yearly: keep status='past_due', don't change revoke_at
    return await upsertEntitlement({
      userId,
      status: 'past_due',
      productType,
      // Keep existing revoke_at
      revokeAt: existing[0]?.revokeAt?.toISOString() || null,
      lastInvoiceStatus: 'failed',
    });
  }
}

export async function handleCancellation(
  userId: string,
  productType: ProductType
) {
  const existing = await db
    .select()
    .from(entitlements)
    .where(eq(entitlements.userId, userId))
    .limit(1);

  if (productType === 'payment_plan') {
    // Payment plan: if canceled early → revoke now
    const now = new Date().toISOString();
    return await upsertEntitlement({
      userId,
      status: 'canceled',
      productType,
      revokeAt: now,
    });
  } else {
    // Monthly/Yearly: leave access until the next boundary (don't change revoke_at)
    return await upsertEntitlement({
      userId,
      status: 'canceled',
      productType,
      revokeAt: existing[0]?.revokeAt?.toISOString() || null,
    });
  }
}

export async function handleRefund(
  userId: string,
  productType: ProductType
) {
  // One-time (lifetime) should not revoke at all
  if (productType === 'lifetime') {
    return; // ignore refunds for lifetime
  }

  // For others, revoke now (follow your policy)
  const now = new Date().toISOString();
  return await upsertEntitlement({
    userId,
    status: 'refunded',
    productType,
    revokeAt: now,
  });
}

export async function getUserEntitlement(userId: string): Promise<Entitlement | null> {
  const result = await db
    .select()
    .from(entitlements)
    .where(eq(entitlements.userId, userId))
    .limit(1);

  return result[0] || null;
}

export function isUserActive(entitlement: Entitlement | null): boolean {
  if (!entitlement) return false;
  
  const now = Date.now();
  const isActive = entitlement.status === 'active' && 
    (!entitlement.revokeAt || new Date(entitlement.revokeAt).getTime() > now);
  
  return isActive;
}