import { eq, desc, sql, and, gte, lte } from 'drizzle-orm';
import { db } from '../db';
import {
  partners,
  partnerTiers,
  commissions,
  partnerCustomers,
  partnerMetrics,
  type Commission,
  type Partner,
  type PartnerTier,
} from '../../shared/schema';

export class CommissionCalculationService {
  static async calculateCommission(
    partnerId: string,
    customerId: string,
    amount: number
  ): Promise<Commission> {
    const partner = await db.select().from(partners).where(eq(partners.id, partnerId)).limit(1);
    if (!partner.length) {
      throw new Error(`Partner ${partnerId} not found`);
    }

    let tier: PartnerTier | undefined;
    const partnerRecord = partner[0];

    if (partnerRecord.tierId) {
      const tierResult = await db
        .select()
        .from(partnerTiers)
        .where(eq(partnerTiers.id, partnerRecord.tierId))
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

    const [record] = await db
      .insert(commissions)
      .values({
        partnerId,
        customerId,
        amount: commissionAmount.toString(),
        status: 'pending',
        metadata: {
          commissionRate,
          originalAmount: amount,
          tierName: tier?.name || 'default',
          tierId: tier?.id || null,
        },
      })
      .returning();

    if (!record) {
      throw new Error('Failed to create commission record');
    }

    return record;
  }

  static async calculatePartnerEarnings(partnerId: string, period: string): Promise<any> {
    const partner = await db.select().from(partners).where(eq(partners.id, partnerId)).limit(1);
    if (!partner.length) {
      throw new Error(`Partner ${partnerId} not found`);
    }

    let startDate: Date;
    let endDate: Date;
    const now = new Date();

    if (period.includes('-')) {
      const [year, month] = period.split('-').map(Number);
      startDate = new Date(year, (month || 1) - 1, 1);
      endDate = new Date(year, (month || 1), 0, 23, 59, 59);
    } else {
      const year = parseInt(period) || now.getFullYear();
      startDate = new Date(year, 0, 1);
      endDate = new Date(year, 11, 31, 23, 59, 59);
    }

    const earnings = await db
      .select({
        total: sql<number>`COALESCE(SUM(${commissions.amount}), 0)`,
        count: sql<number>`COUNT(*)`,
      })
      .from(commissions)
      .where(
        and(
          eq(commissions.partnerId, partnerId),
          eq(commissions.status, 'approved'),
          gte(commissions.createdAt, startDate),
          lte(commissions.createdAt, endDate)
        )
      );

    const totalEarnings = Math.round((earnings[0]?.total || 0) * 100) / 100;
    const commissionCount = earnings[0]?.count || 0;

    const tierResult = await db
      .select()
      .from(partnerTiers)
      .where(eq(partnerTiers.id, partner[0].tierId))
      .limit(1);
    const tier = tierResult[0];

    return {
      partnerId,
      period,
      totalEarnings,
      commissionCount,
      commissionRate: tier ? parseFloat(tier.commissionRate) / 100 : 0,
      tierName: tier?.name || 'default',
      startDate,
      endDate,
    };
  }

  static async approveCommission(commissionId: string): Promise<Commission> {
    const [commission] = await db
      .update(commissions)
      .set({ status: 'approved', updatedAt: new Date() })
      .where(eq(commissions.id, commissionId))
      .returning();

    if (!commission) {
      throw new Error(`Commission ${commissionId} not found`);
    }

    return commission;
  }

  static async getCommissionHistory(partnerId: string): Promise<Commission[]> {
    return await db
      .select()
      .from(commissions)
      .where(eq(commissions.partnerId, partnerId))
      .orderBy(desc(commissions.createdAt));
  }
}
