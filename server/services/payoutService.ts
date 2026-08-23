import { eq, desc, sql, and } from 'drizzle-orm';
import { db } from '../db';
import {
  payouts,
  commissions,
  partners,
  partnerCustomers,
  type Payout,
  type Commission,
} from '../../shared/schema';

export interface CreatePayoutInput {
  partnerId: string;
  amount: number;
  metadata?: Record<string, any>;
}

export async function createPayout(input: CreatePayoutInput): Promise<Payout> {
  const [record] = await db
    .insert(payouts)
    .values({
      partnerId: input.partnerId,
      amount: input.amount.toString(),
      status: 'pending',
      metadata: input.metadata || {},
    })
    .returning();

  if (!record) {
    throw new Error('Failed to create payout record');
  }

  return record;
}

export async function processPayout(payoutId: string): Promise<Payout | undefined> {
  const [payout] = await db.select().from(payouts).where(eq(payouts.id, payoutId)).limit(1);
  if (!payout) {
    return undefined;
  }

  const [updated] = await db
    .update(payouts)
    .set({ status: 'paid', paidAt: new Date(), updatedAt: new Date() })
    .where(eq(payouts.id, payoutId))
    .returning();

  if (updated) {
    await db
      .update(commissions)
      .set({ status: 'paid', payoutId: updated.id, updatedAt: new Date() })
      .where(eq(commissions.partnerId, updated.partnerId))
      .where(eq(commissions.status, 'pending'));
  }

  return updated || undefined;
}

export async function getPendingPayouts(partnerId?: string): Promise<Payout[]> {
  const conditions = [eq(payouts.status, 'pending')];
  if (partnerId) {
    conditions.push(eq(payouts.partnerId, partnerId));
  }

  return await db.select().from(payouts).where(and(...conditions)).orderBy(desc(payouts.createdAt));
}

export async function getPayoutHistory(partnerId: string, limit: number = 50): Promise<Payout[]> {
  return await db
    .select()
    .from(payouts)
    .where(eq(payouts.partnerId, partnerId))
    .orderBy(desc(payouts.createdAt))
    .limit(limit);
}

export async function calculatePartnerPayout(partnerId: string): Promise<number> {
  const result = await db
    .select({
      total: sql<number>`COALESCE(SUM(${commissions.amount}), 0)`,
    })
    .from(commissions)
    .where(and(eq(commissions.partnerId, partnerId), eq(commissions.status, 'pending')));

  const total = result[0]?.total || 0;
  return Math.round(total * 100) / 100;
}

export async function getPayoutById(id: string): Promise<Payout | undefined> {
  const [payout] = await db.select().from(payouts).where(eq(payouts.id, id)).limit(1);
  return payout || undefined;
}
