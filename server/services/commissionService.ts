import { eq, desc, sql, and } from 'drizzle-orm';
import { db } from '../db';
import {
  partners,
  partnerTiers,
  commissions,
  partnerCustomers,
  type Partner,
  type PartnerTier,
  type Commission,
} from '../../shared/schema';

export interface CommissionCalculationInput {
  partnerId: string;
  customerId: string;
  amount: number;
  metadata?: Record<string, any>;
}

export interface CommissionResult {
  partnerId: string;
  customerId: string;
  amount: number;
  commissionRate: number;
  commissionAmount: number;
  tierName: string;
  metadata?: Record<string, any>;
}

export async function calculateCommission(input: CommissionCalculationInput): Promise<CommissionResult> {
  const { partnerId, customerId, amount } = input;

  const partner = await db.select().from(partners).where(eq(partners.id, partnerId)).limit(1);
  if (!partner.length) {
    throw new Error(`Partner ${partnerId} not found`);
  }

  let tier: PartnerTier | undefined;
  if (partner[0].tierId) {
    const tierResult = await db
      .select()
      .from(partnerTiers)
      .where(eq(partnerTiers.id, partner[0].tierId))
      .limit(1);
    if (tierResult.length) {
      tier = tierResult[0];
    }
  }

  if (!tier) {
    const activeTier = await db
      .select()
      .from(partnerTiers)
      .where(eq(partnerTiers.isActive, true))
      .orderBy(partnerTiers.createdAt)
      .limit(1);
    if (activeTier.length) {
      tier = activeTier[0];
    }
  }

  const commissionRate = tier ? parseFloat(tier.commissionRate) / 100 : 0;
  const commissionAmount = Math.round(amount * commissionRate * 100) / 100;

  return {
    partnerId,
    customerId,
    amount,
    commissionRate,
    commissionAmount,
    tierName: tier?.name || 'default',
    metadata: input.metadata,
  };
}

export async function createCommissionRecord(
  partnerId: string,
  customerId: string,
  amount: number,
  status: string = 'pending',
  metadata?: Record<string, any>
): Promise<Commission> {
  const calculation = await calculateCommission({ partnerId, customerId, amount, metadata });

  const [record] = await db
    .insert(commissions)
    .values({
      partnerId,
      customerId,
      amount: calculation.commissionAmount.toString(),
      status,
      metadata: calculation.metadata || {},
    })
    .returning();

  if (!record) {
    throw new Error('Failed to create commission record');
  }

  return record;
}

export async function getPartnerCommissions(partnerId: string, status?: string): Promise<Commission[]> {
  const conditions = [eq(commissions.partnerId, partnerId)];
  if (status) {
    conditions.push(eq(commissions.status, status));
  }

  return await db
    .select()
    .from(commissions)
    .where(and(...conditions))
    .orderBy(desc(commissions.createdAt));
}

export async function getCommissionHistory(partnerId: string, limit: number = 50): Promise<Commission[]> {
  return await db
    .select()
    .from(commissions)
    .where(eq(commissions.partnerId, partnerId))
    .orderBy(desc(commissions.createdAt))
    .limit(limit);
}

export async function getCommissionById(id: string): Promise<Commission | undefined> {
  const [commission] = await db.select().from(commissions).where(eq(commissions.id, id)).limit(1);
  return commission || undefined;
}
