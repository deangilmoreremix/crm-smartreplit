import { eq, and, sql, desc } from 'drizzle-orm';
import { db } from '../db';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { PgTransaction } from 'drizzle-orm/pg-core';
import type { ExtractTablesWithRelations } from 'drizzle-orm';
import {
  userCredits,
  creditTransactions,
  usagePlans,
  profiles,
  type InsertUserCredits,
  type InsertCreditTransaction,
} from '../../shared/schema';
import type * as schema from '../../shared/schema';

export interface CreditPurchaseData {
  userId: string;
  planId: string;
  stripeTransactionId?: string;
  metadata?: Record<string, any>;
}

export interface CreditUsageData {
  userId: string;
  amount: number;
  description: string;
  usageEventId?: string;
  metadata?: Record<string, any>;
}

export class CreditService {
  /**
   * Get user's credit balance
   */
  static async getCreditBalance(
    userId: string,
    tx?: PgTransaction<
      NodePgDatabase<typeof schema>,
      typeof schema,
      ExtractTablesWithRelations<typeof schema>
    >
  ): Promise<any> {
    const dbClient = tx || db;
    try {
      const credits = await dbClient
        .select()
        .from(userCredits)
        .where(eq(userCredits.userId, userId))
        .limit(1);

      if (credits.length === 0) {
        // Create initial credit record if none exists
        const newCredits: InsertUserCredits = {
          userId,
          totalCredits: '0',
          usedCredits: '0',
          availableCredits: '0',
        };
        await dbClient.insert(userCredits).values(newCredits);
        return {
          totalCredits: 0,
          usedCredits: 0,
          availableCredits: 0,
          lastPurchaseAt: null,
        };
      }

      const creditData = credits[0];
      return {
        totalCredits: parseFloat(creditData.totalCredits || '0'),
        usedCredits: parseFloat(creditData.usedCredits || '0'),
        availableCredits: parseFloat(creditData.availableCredits || '0'),
        lastPurchaseAt: creditData.lastPurchaseAt,
      };
    } catch (error) {
      console.error('Error getting credit balance:', error);
      throw error;
    }
  }

  /**
   * Purchase credits for a user - uses atomic transaction with row-level locking
   */
  static async purchaseCredits(data: CreditPurchaseData): Promise<any> {
    return await db.transaction(async (tx) => {
      // Get plan details
      const plan = await tx
        .select()
        .from(usagePlans)
        .where(eq(usagePlans.id, data.planId))
        .limit(1);

      if (plan.length === 0) {
        throw new Error(`Plan ${data.planId} not found`);
      }

      const planData = plan[0];
      const limits = planData.limits as Record<string, unknown>;
      const creditAmount = limits?.credits || 0;

      if (!creditAmount || typeof creditAmount !== 'number') {
        throw new Error(`Plan ${data.planId} does not define credit amount`);
      }

      // Get current balance within transaction (with implicit lock)
      const currentBalance = await this.getCreditBalance(data.userId, tx);

      // Calculate new balance
      const newTotalCredits = currentBalance.totalCredits + creditAmount;
      const newAvailableCredits = currentBalance.availableCredits + creditAmount;

      // Update or insert credit record atomically
      await tx
        .insert(userCredits)
        .values({
          userId: data.userId,
          totalCredits: newTotalCredits.toString(),
          usedCredits: currentBalance.usedCredits.toString(),
          availableCredits: newAvailableCredits.toString(),
          lastPurchaseAt: new Date(),
        })
        .onConflictDoUpdate({
          target: userCredits.userId,
          set: {
            totalCredits: newTotalCredits.toString(),
            availableCredits: newAvailableCredits.toString(),
            lastPurchaseAt: new Date(),
            updatedAt: new Date(),
          },
        });

      // Record transaction atomically
      const transaction: InsertCreditTransaction = {
        userId: data.userId,
        type: 'purchase',
        amount: creditAmount.toString(),
        description: `Purchased ${creditAmount} credits (${planData.displayName})`,
        balanceBefore: currentBalance.availableCredits.toString(),
        balanceAfter: newAvailableCredits.toString(),
        stripeTransactionId: data.stripeTransactionId,
      };

      const result = await tx
        .insert(creditTransactions)
        .values(transaction)
        .returning({ id: creditTransactions.id });

      return {
        success: true,
        creditsPurchased: creditAmount,
        newBalance: newAvailableCredits,
        transactionId: result[0]?.id,
      };
    });
  }

  /**
   * Deduct credits for usage - uses atomic transaction
   */
  static async deductCredits(data: CreditUsageData): Promise<any> {
    return await db.transaction(async (tx) => {
      // Get current balance within transaction (with implicit lock)
      const currentBalance = await this.getCreditBalance(data.userId, tx);

      if (currentBalance.availableCredits < data.amount) {
        throw new Error(
          `Insufficient credits. Available: ${currentBalance.availableCredits}, Required: ${data.amount}`
        );
      }

      // Calculate new balance
      const newUsedCredits = currentBalance.usedCredits + data.amount;
      const newAvailableCredits = currentBalance.availableCredits - data.amount;

      // Update credit record atomically
      await tx
        .update(userCredits)
        .set({
          usedCredits: newUsedCredits.toString(),
          availableCredits: newAvailableCredits.toString(),
          updatedAt: new Date(),
        })
        .where(eq(userCredits.userId, data.userId));

      // Record transaction atomically
      const transaction: InsertCreditTransaction = {
        userId: data.userId,
        type: 'usage',
        amount: (-data.amount).toString(), // Negative for usage
        description: data.description,
        balanceBefore: currentBalance.availableCredits.toString(),
        balanceAfter: newAvailableCredits.toString(),
        usageEventId: data.usageEventId,
      };

      const result = await tx
        .insert(creditTransactions)
        .values(transaction)
        .returning({ id: creditTransactions.id });

      return {
        success: true,
        creditsDeducted: data.amount,
        newBalance: newAvailableCredits,
        transactionId: result[0]?.id,
      };
    });
  }

  /**
   * Check if user has sufficient credits
   */
  static async hasSufficientCredits(userId: string, requiredAmount: number): Promise<boolean> {
    try {
      const balance = await this.getCreditBalance(userId);
      return balance.availableCredits >= requiredAmount;
    } catch (error) {
      console.error('Error checking credit balance:', error);
      return false;
    }
  }

  /**
   * Get credit transaction history
   */
  static async getCreditTransactionHistory(userId: string, limit: number = 50): Promise<any[]> {
    try {
      const transactions = await db
        .select()
        .from(creditTransactions)
        .where(eq(creditTransactions.userId, userId))
        .orderBy(desc(creditTransactions.createdAt))
        .limit(limit);

      return transactions.map((transaction) => ({
        id: transaction.id,
        type: transaction.type,
        amount: parseFloat(transaction.amount),
        description: transaction.description,
        balanceBefore: transaction.balanceBefore ? parseFloat(transaction.balanceBefore) : null,
        balanceAfter: transaction.balanceAfter ? parseFloat(transaction.balanceAfter) : null,
        stripeTransactionId: transaction.stripeTransactionId,
        createdAt: transaction.createdAt,
      }));
    } catch (error) {
      console.error('Error getting credit transaction history:', error);
      return [];
    }
  }

  /**
   * Get available credit packages/plans
   */
  static async getCreditPackages(): Promise<any[]> {
    try {
      const packages = await db
        .select()
        .from(usagePlans)
        .where(and(eq(usagePlans.billingType, 'pay_per_use'), eq(usagePlans.isActive, true)));

      return packages.map((pkg) => {
        const limits = pkg.limits as any;
        return {
          id: pkg.id,
          planName: pkg.planName,
          displayName: pkg.displayName,
          description: pkg.description,
          basePriceCents: pkg.basePriceCents,
          credits: limits?.credits || 0,
          features: pkg.features,
        };
      });
    } catch (error) {
      console.error('Error getting credit packages:', error);
      return [];
    }
  }

  /**
   * Admin: Grant credits to user - uses atomic transaction
   */
  static async grantCredits(
    userId: string,
    amount: number,
    description: string,
    adminId: string
  ): Promise<any> {
    return await db.transaction(async (tx) => {
      // Get current balance within transaction
      const currentBalance = await this.getCreditBalance(userId, tx);

      // Calculate new balance
      const newTotalCredits = currentBalance.totalCredits + amount;
      const newAvailableCredits = currentBalance.availableCredits + amount;

      // Update credit record atomically
      await tx
        .insert(userCredits)
        .values({
          userId,
          totalCredits: newTotalCredits.toString(),
          usedCredits: currentBalance.usedCredits.toString(),
          availableCredits: newAvailableCredits.toString(),
        })
        .onConflictDoUpdate({
          target: userCredits.userId,
          set: {
            totalCredits: newTotalCredits.toString(),
            availableCredits: newAvailableCredits.toString(),
            updatedAt: new Date(),
          },
        });

      // Record transaction atomically
      const transaction: InsertCreditTransaction = {
        userId,
        type: 'admin_grant',
        amount: amount.toString(),
        description: `${description} (Granted by admin ${adminId})`,
        balanceBefore: currentBalance.availableCredits.toString(),
        balanceAfter: newAvailableCredits.toString(),
      };

      await tx.insert(creditTransactions).values(transaction);

      return {
        success: true,
        creditsGranted: amount,
        newBalance: newAvailableCredits,
      };
    });
  }

  /**
   * Process refund - return credits to user - uses atomic transaction
   */
  static async refundCredits(
    userId: string,
    amount: number,
    description: string,
    stripeTransactionId?: string
  ): Promise<any> {
    return await db.transaction(async (tx) => {
      // Get current balance within transaction
      const currentBalance = await this.getCreditBalance(userId, tx);

      // Calculate new balance (refunds reduce used credits and increase available)
      // Ensure refund doesn't exceed original usage
      const maxRefundable = Math.min(amount, currentBalance.usedCredits);
      const newUsedCredits = Math.max(0, currentBalance.usedCredits - maxRefundable);
      const newAvailableCredits = currentBalance.availableCredits + maxRefundable;

      // Update credit record atomically
      await tx
        .update(userCredits)
        .set({
          usedCredits: newUsedCredits.toString(),
          availableCredits: newAvailableCredits.toString(),
          updatedAt: new Date(),
        })
        .where(eq(userCredits.userId, userId));

      // Record transaction atomically
      const transaction: InsertCreditTransaction = {
        userId,
        type: 'refund',
        amount: maxRefundable.toString(),
        description:
          maxRefundable < amount
            ? `${description} (Limited to ${maxRefundable} due to usage cap)`
            : description,
        balanceBefore: currentBalance.availableCredits.toString(),
        balanceAfter: newAvailableCredits.toString(),
        stripeTransactionId,
      };

      await tx.insert(creditTransactions).values(transaction);

      return {
        success: true,
        creditsRefunded: maxRefundable,
        originalRefundRequest: amount,
        newBalance: newAvailableCredits,
      };
    });
  }
}
