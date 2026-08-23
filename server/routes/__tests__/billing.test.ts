import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { billingRoutes } from '../billing';
import { createClient } from '@supabase/supabase-js';

const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(),
      })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(),
      })),
    })),
  })),
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

vi.mock('./auth', () => ({
  requireAuth: () => (req: any, res: any, next: any) => {
    req.session = { userId: 'test-user', userEmail: 'test@test.com' };
    next();
  },
}));

vi.mock('../middleware/entitlements', () => ({
  requireEntitlement: () => (req: any, res: any, next: any) => {
    next();
  },
}));

describe('Billing Routes', () => {
  beforeEach(() => {
    process.env.SUPABASE_URL = 'http://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
    vi.clearAllMocks();
  });

  describe('GET /api/billing/plans', () => {
    it('returns available upgrade plans', async () => {
      const app = express();
      app.use(express.json());
      app.use('/api/billing', billingRoutes);

      const response = await request(app).get('/api/billing/plans');
      expect(response.status).toBe(200);
      expect(response.body.plans).toBeDefined();
      expect(Array.isArray(response.body.plans)).toBe(true);
      expect(response.body.plans.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/billing/upgrade', () => {
    it('returns 401 when no user in session', async () => {
      const unauthApp = express();
      unauthApp.use(express.json());
      unauthApp.use('/api/billing', billingRoutes);

      const response = await request(unauthApp)
        .post('/api/billing/upgrade')
        .send({ tierId: 'smartcrm_bundle' });

      expect(response.status).toBe(401);
    });

    it('returns 400 for invalid tier ID', async () => {
      mockSupabaseClient.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: { productTier: 'regular' }, error: null }),
          })),
        })),
      });

      const app = express();
      app.use(express.json());
      app.use('/api/billing', billingRoutes);

      const response = await request(app)
        .post('/api/billing/upgrade')
        .send({ tierId: 'invalid_tier' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid tier ID');
    });

    it('returns 400 when user already has target tier', async () => {
      mockSupabaseClient.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: { productTier: 'smartcrm_bundle' }, error: null }),
          })),
        })),
      });

      const app = express();
      app.use(express.json());
      app.use('/api/billing', billingRoutes);

      const response = await request(app)
        .post('/api/billing/upgrade')
        .send({ tierId: 'smartcrm_bundle' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('already has this tier');
    });

    it('returns 500 when Stripe is not configured', async () => {
      mockSupabaseClient.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: { productTier: 'regular', email: 'test@test.com' }, error: null }),
          })),
        })),
      });

      process.env.STRIPE_SECRET_KEY = '';
      const app = express();
      app.use(express.json());
      app.use('/api/billing', billingRoutes);

      const response = await request(app)
        .post('/api/billing/upgrade')
        .send({ tierId: 'smartcrm_bundle' });

      expect(response.status).toBe(500);
      expect(response.body.error).toContain('Stripe not configured');
    });
  });

  describe('POST /api/billing/webhook', () => {
    it('returns 500 when Stripe is not configured', async () => {
      process.env.STRIPE_SECRET_KEY = '';
      const app = express();
      app.use(express.json());
      app.use('/api/billing', billingRoutes);

      const response = await request(app)
        .post('/api/billing/webhook')
        .set('stripe-signature', 'test-signature')
        .send({});

      expect(response.status).toBe(500);
    });
  });
});
