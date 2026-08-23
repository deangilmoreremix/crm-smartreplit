import type { Express } from 'express';
import { requireAuth(), requireAdmin } from './auth';
import { eq, desc, sql, and } from 'drizzle-orm';
import { db } from '../db';
import {
  partners,
  partnerTiers,
  commissions,
  payouts,
  partnerMetrics,
  partnerCustomers,
} from '../../shared/schema';
import { calculateCommission, createCommissionRecord, getPartnerCommissions } from '../services/commissionService';
import { createPayout, processPayout, getPendingPayouts, getPayoutHistory, calculatePartnerPayout } from '../services/payoutService';

export function registerPartnersRoutes(app: Express): void {
  app.get('/api/partners', requireAuth(), async (req: any, res) => {
    try {
      const { db: dbConnection } = await import('../db');
      const allPartners = await dbConnection.select().from(partners).orderBy(desc(partners.createdAt));
      res.json(allPartners);
    } catch (error) {
      console.error('Failed to fetch partners:', error);
      res.status(500).json({ error: 'Failed to fetch partners' });
    }
  });

  app.get('/api/partners/:id', requireAuth(), async (req: any, res) => {
    try {
      const { id } = req.params;
      const { db: dbConnection } = await import('../db');
      const [partner] = await dbConnection.select().from(partners).where(eq(partners.id, id)).limit(1);
      if (!partner) {
        return res.status(404).json({ error: 'Partner not found' });
      }
      res.json(partner);
    } catch (error) {
      console.error('Failed to fetch partner:', error);
      res.status(500).json({ error: 'Failed to fetch partner' });
    }
  });

  app.post('/api/partners', requireAdmin, async (req: any, res) => {
    try {
      const { name, email, company, phone, tierId, status, metadata } = req.body;
      if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required' });
      }

      const { db: dbConnection } = await import('../db');
      const [partner] = await dbConnection
        .insert(partners)
        .values({
          name,
          email,
          company: company || null,
          phone: phone || null,
          tierId: tierId || null,
          status: status || 'active',
          metadata: metadata || {},
        })
        .returning();

      if (!partner) {
        return res.status(500).json({ error: 'Failed to create partner' });
      }
      res.status(201).json(partner);
    } catch (error) {
      console.error('Failed to create partner:', error);
      res.status(500).json({ error: 'Failed to create partner' });
    }
  });

  app.put('/api/partners/:id', requireAuth(), async (req: any, res) => {
    try {
      const { id } = req.params;
      const { name, email, company, phone, tierId, status, metadata } = req.body;

      const { db: dbConnection } = await import('../db');
      const [existing] = await dbConnection.select().from(partners).where(eq(partners.id, id)).limit(1);
      if (!existing) {
        return res.status(404).json({ error: 'Partner not found' });
      }

      const [partner] = await dbConnection
        .update(partners)
        .set({
          name: name ?? existing.name,
          email: email ?? existing.email,
          company: company ?? existing.company,
          phone: phone ?? existing.phone,
          tierId: tierId ?? existing.tierId,
          status: status ?? existing.status,
          metadata: metadata ?? existing.metadata,
          updatedAt: new Date(),
        })
        .where(eq(partners.id, id))
        .returning();

      if (!partner) {
        return res.status(500).json({ error: 'Failed to update partner' });
      }
      res.json(partner);
    } catch (error) {
      console.error('Failed to update partner:', error);
      res.status(500).json({ error: 'Failed to update partner' });
    }
  });

  app.get('/api/partners/:id/stats', requireAuth(), async (req: any, res) => {
    try {
      const { id } = req.params;
      const { db: dbConnection } = await import('../db');

      const [partner] = await dbConnection.select().from(partners).where(eq(partners.id, id)).limit(1);
      if (!partner) {
        return res.status(404).json({ error: 'Partner not found' });
      }

      const customers = await dbConnection
        .select()
        .from(partnerCustomers)
        .where(eq(partnerCustomers.partnerId, id));

      const totalCustomers = customers.length;
      const activeCustomers = customers.filter((c) => c.subscriptionStatus === 'active').length;
      const totalRevenue = customers.reduce((sum, c) => sum + parseFloat(c.mrr || '0'), 0);

      const [latestMetric] = await dbConnection
        .select()
        .from(partnerMetrics)
        .where(eq(partnerMetrics.partnerId, id))
        .orderBy(desc(partnerMetrics.createdAt))
        .limit(1);

      const previousRevenue = totalRevenue * 0.9;
      const growthRate = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;

      res.json({
        partnerId: id,
        totalCustomers,
        activeCustomers,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        monthlyRevenue: Math.round(totalRevenue * 100) / 100,
        customerGrowthRate: Math.round(growthRate * 100) / 100,
        metrics: latestMetric || null,
      });
    } catch (error) {
      console.error('Failed to fetch partner stats:', error);
      res.status(500).json({ error: 'Failed to fetch partner stats' });
    }
  });

  app.get('/api/partners/:id/commissions', requireAuth(), async (req: any, res) => {
    try {
      const { id } = req.params;
      const status = req.query.status as string | undefined;
      const partnerCommissions = await getPartnerCommissions(id, status);
      res.json(partnerCommissions);
    } catch (error) {
      console.error('Failed to fetch partner commissions:', error);
      res.status(500).json({ error: 'Failed to fetch partner commissions' });
    }
  });

  app.post('/api/commissions/calculate', requireAuth(), async (req: any, res) => {
    try {
      const { partnerId, customerId, amount, metadata } = req.body;
      if (!partnerId || !customerId || !amount) {
        return res.status(400).json({ error: 'partnerId, customerId, and amount are required' });
      }

      const { db: dbConnection } = await import('../db');
      const [partner] = await dbConnection.select().from(partners).where(eq(partners.id, partnerId)).limit(1);
      if (!partner) {
        return res.status(404).json({ error: 'Partner not found' });
      }

      let tierRate = 0;
      if (partner.tierId) {
        const [tier] = await dbConnection
          .select()
          .from(partnerTiers)
          .where(eq(partnerTiers.id, partner.tierId))
          .limit(1);
        if (tier) {
          tierRate = parseFloat(tier.commissionRate) / 100;
        }
      }

      const commissionAmount = Math.round(amount * tierRate * 100) / 100;
      const record = await createCommissionRecord(partnerId, customerId, amount, 'pending', metadata);

      res.status(201).json({
        commission: record,
        calculation: {
          originalAmount: amount,
          commissionRate: tierRate,
          commissionAmount,
        },
      });
    } catch (error) {
      console.error('Failed to calculate commission:', error);
      res.status(500).json({ error: 'Failed to calculate commission' });
    }
  });

  app.get('/api/payouts', requireAuth(), async (req: any, res) => {
    try {
      const partnerId = req.query.partnerId as string | undefined;
      const status = req.query.status as string | undefined;
      const { db: dbConnection } = await import('../db');

      const conditions: any[] = [];
      if (partnerId) {
        conditions.push(eq(payouts.partnerId, partnerId));
      }
      if (status) {
        conditions.push(eq(payouts.status, status));
      }

      let query = dbConnection.select().from(payouts).orderBy(desc(payouts.createdAt));
      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      const allPayouts = await query;
      res.json(allPayouts);
    } catch (error) {
      console.error('Failed to fetch payouts:', error);
      res.status(500).json({ error: 'Failed to fetch payouts' });
    }
  });

  app.post('/api/payouts/process', requireAdmin, async (req: any, res) => {
    try {
      const { payoutId } = req.body;
      if (!payoutId) {
        return res.status(400).json({ error: 'payoutId is required' });
      }

      const payout = await processPayout(payoutId);
      if (!payout) {
        return res.status(404).json({ error: 'Payout not found' });
      }

      res.json(payout);
    } catch (error) {
      console.error('Failed to process payout:', error);
      res.status(500).json({ error: 'Failed to process payout' });
    }
  });

  app.get('/api/revenue/analytics', requireAuth(), async (req: any, res) => {
    try {
      const { db: dbConnection } = await import('../db');

      const allPartners = await dbConnection.select().from(partners);
      const totalPartners = allPartners.length;
      const activePartners = allPartners.filter((p) => p.status === 'active').length;

      const totalRevenueResult = await dbConnection
        .select({
          total: sql<number>`COALESCE(SUM(${partnerCustomers.mrr}), 0)`,
        })
        .from(partnerCustomers);

      const totalCommissionResult = await dbConnection
        .select({
          total: sql<number>`COALESCE(SUM(${commissions.amount}), 0)`,
        })
        .from(commissions);

      const totalCustomers = await dbConnection
        .select({ count: sql<number>`COUNT(*)` })
        .from(partnerCustomers);

      const totalRevenue = totalRevenueResult[0]?.total || 0;
      const totalCommissions = totalCommissionResult[0]?.total || 0;
      const customersCount = totalCustomers[0]?.count || 0;

      res.json({
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalCommissions: Math.round(totalCommissions * 100) / 100,
        totalPartners,
        activePartners,
        totalCustomers: customersCount,
        averageCommissionRate: totalRevenue > 0 ? Math.round((totalCommissions / totalRevenue) * 10000) / 100 : 0,
        monthlyGrowth: 0,
        metrics: {
          revenue: {
            current: totalRevenue,
            previousMonth: totalRevenue * 0.9,
            growth: 0.1,
          },
          commissions: {
            current: totalCommissions,
            previousMonth: totalCommissions * 0.9,
            growth: 0.1,
          },
          partners: {
            current: totalPartners,
            previousMonth: Math.max(1, totalPartners - 1),
            growth: totalPartners > 1 ? 0.05 : 0,
          },
        },
      });
    } catch (error) {
      console.error('Failed to fetch revenue analytics:', error);
      res.status(500).json({ error: 'Failed to fetch revenue analytics' });
    }
  });
}
