import { db } from '../db';
import { payouts, partners } from '../../shared/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';

export interface TaxDocument {
  id: string;
  partnerId: string;
  year: number;
  documentType: '1099-NEC' | '1099-MISC' | '1099-K';
  totalCompensation: number;
  totalCommissions: number;
  totalPayouts: number;
  taxesWithheld: number;
  netAmount: number;
  generatedAt: string;
  status: 'draft' | 'generated' | 'sent' | 'accepted';
  downloadUrl?: string;
  metadata?: Record<string, any>;
}

export interface TaxDocumentSummary {
  partnerId: string;
  partnerName: string;
  partnerEmail: string;
  year: number;
  totalCompensation: number;
  taxYearIncome: number;
  withholding: number;
  netEarnings: number;
  documentCount: number;
}

export class TaxDocumentService {
  static async generateTaxDocument(partnerId: string, year: number): Promise<TaxDocument> {
    const partner = await db.select().from(partners).where(eq(partners.id, partnerId)).limit(1);
    if (!partner.length) {
      throw new Error(`Partner ${partnerId} not found`);
    }

    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    const [commissionSum] = await db
      .select({
        total: sql<number>`COALESCE(SUM(${payouts.amount}), 0)`,
      })
      .from(payouts)
      .where(
        and(
          eq(payouts.partnerId, partnerId),
          eq(payouts.status, 'paid'),
          gte(payouts.paidAt || payouts.createdAt, startDate),
          lte(payouts.paidAt || payouts.createdAt, endDate)
        )
      );

    const totalCompensation = parseFloat((commissionSum?.total || 0).toString());
    const taxesWithheld = 0;
    const netAmount = totalCompensation - taxesWithheld;
    const documentType = totalCompensation >= 600 ? '1099-NEC' : '1099-MISC';

    const [record] = await db
      .insert(payouts)
      .values({
        partnerId,
        amount: totalCompensation.toString(),
        status: 'generated',
        metadata: {
          type: 'tax_document',
          year,
          documentType,
          totalCommissions: totalCompensation,
          totalPayouts: totalCompensation,
          taxesWithheld,
          netAmount,
          generatedAt: new Date().toISOString(),
        },
      })
      .returning();

    if (!record) {
      throw new Error('Failed to create tax document record');
    }

    return {
      id: record.id,
      partnerId,
      year,
      documentType,
      totalCompensation,
      totalCommissions: totalCompensation,
      totalPayouts: totalCompensation,
      taxesWithheld,
      netAmount,
      generatedAt: record.createdAt.toISOString(),
      status: 'generated',
      metadata: record.metadata,
    };
  }

  static async getTaxDocuments(partnerId: string): Promise<TaxDocument[]> {
    const results = await db
      .select()
      .from(payouts)
      .where(eq(payouts.partnerId, partnerId))
      .orderBy(desc(payouts.createdAt));

    return results
      .filter((r) => r.metadata && r.metadata.type === 'tax_document')
      .map((r) => ({
        id: r.id,
        partnerId,
        year: r.metadata.year,
        documentType: r.metadata.documentType,
        totalCompensation: r.metadata.totalCommissions,
        totalCommissions: r.metadata.totalCommissions,
        totalPayouts: r.metadata.totalPayouts,
        taxesWithheld: r.metadata.taxesWithheld,
        netAmount: r.metadata.netAmount,
        generatedAt: r.metadata.generatedAt,
        status: r.status,
        metadata: r.metadata,
      }));
  }

  static async getPartnerTaxSummaries(): Promise<TaxDocumentSummary[]> {
    const partnersList = await db.select().from(partners).where(eq(partners.status, 'active'));

    return Promise.all(
      partnersList.map(async (partner) => {
        const [commissionSum] = await db
          .select({
            total: sql<number>`COALESCE(SUM(${payouts.amount}), 0)`,
          })
          .from(payouts)
          .where(
            and(
              eq(payouts.partnerId, partner.id),
              eq(payouts.status, 'paid')
            )
          );

        const currentYear = new Date().getFullYear();
        const docs = await this.getTaxDocuments(partner.id);
        const currentYearDocs = docs.filter((d) => d.year === currentYear);

        return {
          partnerId: partner.id,
          partnerName: partner.name,
          partnerEmail: partner.email,
          year: currentYear,
          totalCompensation: parseFloat((commissionSum?.total || 0).toString()),
          taxYearIncome: parseFloat((commissionSum?.total || 0).toString()),
          withholding: 0,
          netEarnings: parseFloat((commissionSum?.total || 0).toString()),
          documentCount: currentYearDocs.length,
        };
      })
    );
  }

  static async markTaxDocumentSent(documentId: string): Promise<void> {
    await db
      .update(payouts)
      .set({ status: 'sent', updatedAt: new Date() })
      .where(eq(payouts.id, documentId));
  }
}
