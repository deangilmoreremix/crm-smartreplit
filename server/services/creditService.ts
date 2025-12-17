import { eq, and, sql, desc } from 'drizzle-orm';
import { db } from '../db';
import { userCredits, creditTransactions, usagePlans, profiles, type InsertUserCredits, type InsertCreditTransaction } from '../../shared/schema';

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
  static async getCreditBalance(userId: string): Promise<any> {
    try {
      const credits = await db
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
        await db.insert(userCredits).values(newCredits);
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
   * Purchase credits for a user
   */
  static async purchaseCredits(data: CreditPurchaseData): Promise<any> {
    try {
      // Get plan details
      const plan = await db
        .select()
        .from(usagePlans)
        .where(eq(usagePlans.id, data.planId))
        .limit(1);

      if (plan.length === 0) {
        throw new Error(`Plan ${data.planId} not found`);
      }

      const planData = plan[0];
      const limits = planData.limits as any;
      const creditAmount = limits?.credits || 0;

      if (!creditAmount) {
        throw new Error(`Plan ${data.planId} does not define credit amount`);
      }

      // Get current balance
      const currentBalance = await this.getCreditBalance(data.userId);

      // Calculate new balance
      const newTotalCredits = currentBalance.totalCredits + creditAmount;
      const newAvailableCredits = currentBalance.availableCredits + creditAmount;

      // Update or insert credit record
      await db
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

      // Record transaction
      const transaction: InsertCreditTransaction = {
        userId: data.userId,
        type: 'purchase',
        amount: creditAmount.toString(),
        description: `Purchased ${creditAmount} credits (${planData.displayName})`,
        balanceBefore: currentBalance.availableCredits.toString(),
        balanceAfter: newAvailableCredits.toString(),
        stripeTransactionId: data.stripeTransactionId,
      };

      const result = await db.insert(creditTransactions).values(transaction).returning({ id: creditTransactions.id });

      return {
        success: true,
        creditsPurchased: creditAmount,
        newBalance: newAvailableCredits,
        transactionId: result[0].id,
      };
    } catch (error) {
      console.error('Error purchasing credits:', error);
      throw error;
    }
  }

  /**
   * Deduct credits for usage
   */
  static async deductCredits(data: CreditUsageData): Promise<any> {
    try {
      // Get current balance
      const currentBalance = await this.getCreditBalance(data.userId);

      if (currentBalance.availableCredits < data.amount) {
        throw new Error(`Insufficient credits. Available: ${currentBalance.availableCredits}, Required: ${data.amount}`);
      }

      // Calculate new balance
      const newUsedCredits = currentBalance.usedCredits + data.amount;
      const newAvailableCredits = currentBalance.availableCredits - data.amount;

      // Update credit record
      await db
        .update(userCredits)
        .set({
          usedCredits: newUsedCredits.toString(),
          availableCredits: newAvailableCredits.toString(),
          updatedAt: new Date(),
        })
        .where(eq(userCredits.userId, data.userId));

      // Record transaction
      const transaction: InsertCreditTransaction = {
        userId: data.userId,
        type: 'usage',
        amount: (-data.amount).toString(), // Negative for usage
        description: data.description,
        balanceBefore: currentBalance.availableCredits.toString(),
        balanceAfter: newAvailableCredits.toString(),
        usageEventId: data.usageEventId,
      };

      const result = await db.insert(creditTransactions).values(transaction).returning({ id: creditTransactions.id });

      return {
        success: true,
        creditsDeducted: data.amount,
        newBalance: newAvailableCredits,
        transactionId: result[0].id,
      };
    } catch (error) {
      console.error('Error deducting credits:', error);
      throw error;
    }
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

      return transactions.map(transaction => ({
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
        .where(and(
          eq(usagePlans.billingType, 'pay_per_use'),
          eq(usagePlans.isActive, true)
        ));

      return packages.map(pkg => {
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
   * Admin: Grant credits to user
   */
  static async grantCredits(userId: string, amount: number, description: string, adminId: string): Promise<any> {
    try {
      // Get current balance
      const currentBalance = await this.getCreditBalance(userId);

      // Calculate new balance
      const newTotalCredits = currentBalance.totalCredits + amount;
      const newAvailableCredits = currentBalance.availableCredits + amount;

      // Update credit record
      await db
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

      // Record transaction
      const transaction: InsertCreditTransaction = {
        userId,
        type: 'admin_grant',
        amount: amount.toString(),
        description: `${description} (Granted by admin)`,
        balanceBefore: currentBalance.availableCredits.toString(),
        balanceAfter: newAvailableCredits.toString(),
      };

      await db.insert(creditTransactions).values(transaction);

      return {
        success: true,
        creditsGranted: amount,
        newBalance: newAvailableCredits,
      };
    } catch (error) {
      console.error('Error granting credits:', error);
      throw error;
    }
  }

  /**
   * Process refund - return credits to user
   */
  static async refundCredits(userId: string, amount: number, description: string, stripeTransactionId?: string): Promise<any> {
    try {
      // Get current balance
      const currentBalance = await this.getCreditBalance(userId);

      // Calculate new balance (refunds reduce used credits and increase available)
      const newUsedCredits = Math.max(0, currentBalance.usedCredits - amount);
      const newAvailableCredits = currentBalance.availableCredits + amount;

      // Update credit record
      await db
        .update(userCredits)
        .set({
          usedCredits: newUsedCredits.toString(),
          availableCredits: newAvailableCredits.toString(),
          updatedAt: new Date(),
        })
        .where(eq(userCredits.userId, userId));

      // Record transaction
      const transaction: InsertCreditTransaction = {
        userId,
        type: 'refund',
        amount: amount.toString(),
        description,
        balanceBefore: currentBalance.availableCredits.toString(),
        balanceAfter: newAvailableCredits.toString(),
        stripeTransactionId,
      };

      await db.insert(creditTransactions).values(transaction);

      return {
        success: true,
        creditsRefunded: amount,
        newBalance: newAvailableCredits,
      };
    } catch (error) {
      console.error('Error refunding credits:', error);
      throw error;
    }
  }
}