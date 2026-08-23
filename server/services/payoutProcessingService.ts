import { eq, desc, sql, and } from 'drizzle-orm';
import { db } from '../db';
import {
  payouts,
  commissions,
  partners,
  type Payout,
  type Commission,
} from '../../shared/schema';

export class PayoutProcessingService {
  static async processPayout(partnerId: string, amount: number): Promise<Payout> {
    const partner = await db.select().from(partners).where(eq(partners.id, partnerId)).limit(1);
    if (!partner.length) {
      throw new Error(`Partner ${partnerId} not found`);
    }

    const [record] = await db
      .insert(payouts)
      .values({
        partnerId,
        amount: amount.toString(),
        status: 'pending',
        metadata: {},
      })
      .returning();

    if (!record) {
      throw new Error('Failed to create payout record');
    }

    return record;
  }

  static async getPendingPayouts(partnerId: string): Promise<Payout[]> {
    return await db
      .select()
      .from(payouts)
      .where(and(eq(payouts.partnerId, partnerId), eq(payouts.status, 'pending')))
      .orderBy(desc(payouts.createdAt));
  }

  static async markPayoutPaid(
    payoutId: string,
    paymentMethod: string,
    transactionId: string
  ): Promise<Payout> {
    const [payout] = await db
      .update(payouts)
      .set({
        status: 'paid',
        paidAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          paymentMethod,
          transactionId,
        },
      })
      .where(eq(payouts.id, payoutId))
      .returning();

    if (!payout) {
      throw new Error(`Payout ${payoutId} not found`);
    }

    await db
      .update(commissions)
      .set({ status: 'paid', payoutId: payout.id, updatedAt: new Date() })
      .where(and(eq(commissions.partnerId, payout.partnerId), eq(commissions.status, 'approved')));

    return payout;
  }

  static async getPayoutHistory(partnerId: string): Promise<Payout[]> {
    return await db
      .select()
      .from(payouts)
      .where(eq(payouts.partnerId, partnerId))
      .orderBy(desc(payouts.createdAt));
  }
}
