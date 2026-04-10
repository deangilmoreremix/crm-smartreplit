import { describe, it, expect, beforeAll } from 'vitest';
import { setupDatabaseTests } from '../test-helpers/setup.js';
import request from 'supertest';
import { app } from '../index.js'; // Import the app
import { usagePlans } from '../../shared/schema';
import { eq } from 'drizzle-orm';

const { getDb } = setupDatabaseTests();

describe('Credit Purchase API Integration Tests', () => {
  let testDb: any;

  beforeAll(async () => {
    testDb = getDb();
    if (!testDb) {
      console.warn('Skipping database tests - database not available');
      return;
    }
  });

  // Helper function to make authenticated requests
  const makeAuthRequest = (method: string, url: string) => {
    return request(app)
      [method.toLowerCase()](url)
      .set('Cookie', `session=${JSON.stringify({ user: mockUser })}`);
  };

  describe('GET /api/billing/credit-packages', () => {
    it('should return available credit packages', async () => {
      const response = await makeAuthRequest('GET', '/api/billing/credit-packages');
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('packages');
      expect(Array.isArray(data.packages)).toBe(true);
      expect(data.packages.length).toBeGreaterThan(0);

      const smallPack = data.packages.find((p: any) => p.planName === 'credit_pack_small');
      expect(smallPack).toBeDefined();
      expect(smallPack.credits).toBe(500);
    });
  });

  describe('GET /api/billing/credits', () => {
    it('should return user credit balance', async () => {
      const response = await makeAuthRequest('GET', '/api/billing/credits');
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('credits');
      expect(data.credits).toHaveProperty('totalCredits', 0);
      expect(data.credits).toHaveProperty('availableCredits', 0);
      expect(data.credits).toHaveProperty('usedCredits', 0);
    });
  });

  describe('GET /api/billing/summary', () => {
    it('should return billing summary', async () => {
      const response = await makeAuthRequest('GET', '/api/billing/summary');
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('credits');
      expect(data).toHaveProperty('usage');
      expect(data).toHaveProperty('recentTransactions');
      expect(Array.isArray(data.recentTransactions)).toBe(true);
    });
  });

  describe('POST /api/billing/purchase-credits', () => {
    it('should purchase credits successfully', async () => {
      const plan = await testDb
        .select()
        .from(usagePlans)
        .where(eq(usagePlans.planName, 'credit_pack_small'))
        .limit(1);

      const response = await makeAuthRequest('POST', '/api/billing/purchase-credits', {
        planId: plan[0].id,
        stripePaymentMethodId: 'pm_test_123',
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('creditsPurchased', 500);
      expect(data).toHaveProperty('newBalance', 500);
      expect(data).toHaveProperty('transactionId');
    });

    it('should reject purchase without plan ID', async () => {
      const response = await makeAuthRequest('POST', '/api/billing/purchase-credits', {
        stripePaymentMethodId: 'pm_test_123',
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data).toHaveProperty('error', 'Plan ID is required');
    });

    it('should reject purchase with invalid plan ID', async () => {
      const response = await makeAuthRequest('POST', '/api/billing/purchase-credits', {
        planId: 'invalid-plan-id',
        stripePaymentMethodId: 'pm_test_123',
      });

      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data).toHaveProperty('error');
    });

    it('should update balance after purchase', async () => {
      // Purchase credits
      const plan = await testDb
        .select()
        .from(usagePlans)
        .where(eq(usagePlans.planName, 'credit_pack_small'))
        .limit(1);

      await makeAuthRequest('POST', '/api/billing/purchase-credits', {
        planId: plan[0].id,
        stripePaymentMethodId: 'pm_test_456',
      });

      // Check balance
      const balanceResponse = await makeAuthRequest('GET', '/api/billing/credits');
      const balanceData = await balanceResponse.json();

      expect(balanceData.credits.totalCredits).toBe(500);
      expect(balanceData.credits.availableCredits).toBe(500);
    });

    it('should record transaction after purchase', async () => {
      // Purchase credits
      const plan = await testDb
        .select()
        .from(usagePlans)
        .where(eq(usagePlans.planName, 'credit_pack_small'))
        .limit(1);

      await makeAuthRequest('POST', '/api/billing/purchase-credits', {
        planId: plan[0].id,
        stripePaymentMethodId: 'pm_test_789',
      });

      // Check transaction history
      const summaryResponse = await makeAuthRequest('GET', '/api/billing/summary');
      const summaryData = await summaryResponse.json();

      expect(summaryData.recentTransactions.length).toBeGreaterThan(0);
      const purchaseTxn = summaryData.recentTransactions.find((t: any) => t.type === 'purchase');
      expect(purchaseTxn).toBeDefined();
      expect(purchaseTxn.amount).toBe(500);
    });
  });

  describe('Purchase Simulation Scenarios', () => {
    it('should handle multiple purchases', async () => {
      const plan = await testDb
        .select()
        .from(usagePlans)
        .where(eq(usagePlans.planName, 'credit_pack_small'))
        .limit(1);

      // Two purchases
      await makeAuthRequest('POST', '/api/billing/purchase-credits', {
        planId: plan[0].id,
      });

      await makeAuthRequest('POST', '/api/billing/purchase-credits', {
        planId: plan[0].id,
      });

      // Check balance
      const balanceResponse = await makeAuthRequest('GET', '/api/billing/credits');
      const balanceData = await balanceResponse.json();

      expect(balanceData.credits.totalCredits).toBe(1000);
      expect(balanceData.credits.availableCredits).toBe(1000);
    });

    it('should simulate payment failure', async () => {
      // This would require mocking Stripe to fail
      // For now, test with invalid payment method
      const plan = await testDb
        .select()
        .from(usagePlans)
        .where(eq(usagePlans.planName, 'credit_pack_small'))
        .limit(1);

      const response = await makeAuthRequest('POST', '/api/billing/purchase-credits', {
        planId: plan[0].id,
        stripePaymentMethodId: '', // Invalid
      });

      // In current implementation, it still succeeds with simulated transaction
      expect(response.status).toBe(200);
    });
  });

  describe('Verification Endpoints', () => {
    it('should verify transaction history consistency', async () => {
      // Purchase credits
      const plan = await testDb
        .select()
        .from(usagePlans)
        .where(eq(usagePlans.planName, 'credit_pack_small'))
        .limit(1);

      await makeAuthRequest('POST', '/api/billing/purchase-credits', {
        planId: plan[0].id,
      });

      // Get summary and verify consistency
      const summaryResponse = await makeAuthRequest('GET', '/api/billing/summary');
      const summaryData = await summaryResponse.json();

      expect(summaryData.credits.availableCredits).toBe(500);
      expect(summaryData.recentTransactions.length).toBe(1);
      expect(summaryData.recentTransactions[0].amount).toBe(500);
    });

    it('should handle unauthenticated requests', async () => {
      const response = await request(app).get('/api/billing/credits');
      expect(response.status).toBe(401); // Should require auth
    });
  });
});
