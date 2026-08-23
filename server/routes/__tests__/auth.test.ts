import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createClient } from '@supabase/supabase-js';
import authRouter from '../auth';

const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(),
      })),
    })),
    rpc: vi.fn(() => ({
      single: vi.fn(),
    })),
  })),
  auth: {
    admin: {
      inviteUserByEmail: vi.fn(),
      listUsers: vi.fn(),
      deleteUser: vi.fn(),
      updateUserById: vi.fn(),
    },
  },
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

describe('Auth Routes', () => {
  beforeEach(() => {
    process.env.SUPABASE_URL = 'http://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
    process.env.NODE_ENV = 'test';
    vi.clearAllMocks();
    mockSupabaseClient.from.mockImplementation(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      rpc: vi.fn(() => ({
        single: vi.fn(),
      })),
    }));
    mockSupabaseClient.auth.admin.inviteUserByEmail.mockClear();
    mockSupabaseClient.auth.admin.listUsers.mockClear();
    mockSupabaseClient.auth.admin.deleteUser.mockClear();
    mockSupabaseClient.auth.admin.updateUserById.mockClear();
  });

  describe('requireAuth middleware', () => {
    it('allows authenticated requests with session userId', async () => {
      const { requireAuth } = await import('../auth');
      const app = express();
      app.use(express.json());
      app.use((req: any, res, next) => {
        req.session = { userId: 'user-123' };
        next();
      });
      app.get('/protected', requireAuth(), (req, res) => {
        res.json({ userId: (req as any).userId });
      });

      const response = await request(app).get('/protected');
      expect(response.status).toBe(200);
      expect(response.body.userId).toBe('user-123');
    });

    it('allows authenticated requests with session userId and userEmail', async () => {
      const { requireAuth } = await import('../auth');
      const app = express();
      app.use(express.json());
      app.use((req: any, res, next) => {
        req.session = { userId: 'user-123', userEmail: 'user@test.com' };
        next();
      });
      app.get('/protected', requireAuth(), (req, res) => {
        res.json({ userId: (req as any).userId, userEmail: (req as any).userEmail });
      });

      const response = await request(app).get('/protected');
      expect(response.status).toBe(200);
      expect(response.body.userId).toBe('user-123');
      expect(response.body.userEmail).toBe('user@test.com');
    });

    it('rejects unauthenticated requests with 401', async () => {
      const { requireAuth } = await import('../auth');
      const app = express();
      app.use(express.json());
      app.use(requireAuth(), (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app).get('/');
      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Unauthorized');
    });

    it('allows dev-bypass token in development on dev host', async () => {
      process.env.NODE_ENV = 'development';
      const { requireAuth } = await import('../auth');
      const app = express();
      app.use(express.json());
      app.use(requireAuth(), (req, res) => {
        res.json({ userId: (req as any).userId, userEmail: (req as any).userEmail });
      });

      const response = await request(app)
        .get('/')
        .set('Authorization', 'Bearer dev-bypass-token-123')
        .set('Host', 'localhost:5000');

      expect(response.status).toBe(200);
      expect(response.body.userId).toBe('dev-user-12345');
      expect(response.body.userEmail).toBe('dev@smartcrm.local');
    });

    it('blocks dev-bypass token in production', async () => {
      process.env.NODE_ENV = 'production';
      const { requireAuth } = await import('../auth');
      const app = express();
      app.use(express.json());
      app.use(requireAuth(), (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .get('/')
        .set('Authorization', 'Bearer dev-bypass-token-123')
        .set('Host', 'localhost:5000');

      expect(response.status).toBe(401);
    });

    it('blocks dev-bypass token on non-dev host', async () => {
      process.env.NODE_ENV = 'development';
      const { requireAuth } = await import('../auth');
      const app = express();
      app.use(express.json());
      app.use(requireAuth(), (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .get('/')
        .set('Authorization', 'Bearer dev-bypass-token-123')
        .set('Host', 'example.com');

      expect(response.status).toBe(401);
    });

    it('blocks users with no_access entitlement package', async () => {
      mockSupabaseClient.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: { package: 'no_access' }, error: null }),
          })),
        })),
      });

      const { requireAuth } = await import('../auth');
      const app = express();
      app.use(express.json());
      app.use((req: any, res, next) => {
        req.session = { userId: 'user-123' };
        next();
      });
      app.get('/protected', requireAuth(), (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app).get('/protected');
      expect(response.status).toBe(403);
      expect(response.body.error).toContain('No subscription');
    });

    it('allows users with regular entitlement package', async () => {
      mockSupabaseClient.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: { package: 'regular' }, error: null }),
          })),
        })),
      });

      const { requireAuth } = await import('../auth');
      const app = express();
      app.use(express.json());
      app.use((req: any, res, next) => {
        req.session = { userId: 'user-123' };
        next();
      });
      app.get('/protected', requireAuth(), (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app).get('/protected');
      expect(response.status).toBe(200);
    });

    it('skips entitlement check when checkEntitlement is false', async () => {
      const { requireAuth } = await import('../auth');
      const app = express();
      app.use(express.json());
      app.use((req: any, res, next) => {
        req.session = { userId: 'user-123' };
        next();
      });
      app.get('/protected', requireAuth({ checkEntitlement: false }), (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app).get('/protected');
      expect(response.status).toBe(200);
    });

    it('handles entitlement check server errors gracefully', async () => {
      mockSupabaseClient.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockRejectedValue(new Error('DB error')),
          })),
        })),
      });

      const { requireAuth } = await import('../auth');
      const app = express();
      app.use(express.json());
      app.use((req: any, res, next) => {
        req.session = { userId: 'user-123' };
        next();
      });
      app.get('/protected', requireAuth(), (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app).get('/protected');
      expect(response.status).toBe(500);
      expect(response.body.error).toContain('Internal server error');
    });
  });

  describe('requireAdmin middleware', () => {
    it('allows super_admin with valid admin entitlement', async () => {
      mockSupabaseClient.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: { role: 'super_admin', product_tier: 'super_admin' }, error: null }),
          })),
        })),
      });
      mockSupabaseClient.rpc.mockReturnValueOnce({
        single: vi.fn().mockResolvedValue({ data: true, error: null }),
      });

      const { requireAdmin } = await import('../auth');
      const app = express();
      app.use(express.json());
      app.use((req: any, res, next) => {
        req.session = { userId: 'admin-123', userEmail: 'admin@test.com' };
        next();
      });
      app.get('/admin', requireAdmin, (req, res) => {
        res.json({ admin: true });
      });

      const response = await request(app).get('/admin');
      expect(response.status).toBe(200);
      expect(response.body.admin).toBe(true);
    });

    it('rejects non-admin users with 403', async () => {
      mockSupabaseClient.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: { role: 'user', product_tier: 'regular' }, error: null }),
          })),
        })),
      });
      mockSupabaseClient.rpc.mockReturnValueOnce({
        single: vi.fn().mockResolvedValue({ data: true, error: null }),
      });

      const { requireAdmin } = await import('../auth');
      const app = express();
      app.use(express.json());
      app.use((req: any, res, next) => {
        req.session = { userId: 'user-123', userEmail: 'user@test.com' };
        next();
      });
      app.get('/admin', requireAdmin, (req, res) => {
        res.json({ admin: true });
      });

      const response = await request(app).get('/admin');
      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Admin access required');
    });

    it('rejects when user profile is not found', async () => {
      mockSupabaseClient.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
          })),
        })),
      });

      const { requireAdmin } = await import('../auth');
      const app = express();
      app.use(express.json());
      app.use((req: any, res, next) => {
        req.session = { userId: 'user-123', userEmail: 'user@test.com' };
        next();
      });
      app.get('/admin', requireAdmin, (req, res) => {
        res.json({ admin: true });
      });

      const response = await request(app).get('/admin');
      expect(response.status).toBe(403);
      expect(response.body.error).toContain('User not found');
    });

    it('rejects when admin entitlement check fails', async () => {
      mockSupabaseClient.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: { role: 'super_admin', product_tier: 'super_admin' }, error: null }),
          })),
        })),
      });
      mockSupabaseClient.rpc.mockReturnValueOnce({
        single: vi.fn().mockResolvedValue({ data: false, error: null }),
      });

      const { requireAdmin } = await import('../auth');
      const app = express();
      app.use(express.json());
      app.use((req: any, res, next) => {
        req.session = { userId: 'admin-123', userEmail: 'admin@test.com' };
        next();
      });
      app.get('/admin', requireAdmin, (req, res) => {
        res.json({ admin: true });
      });

      const response = await request(app).get('/admin');
      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Admin entitlement not found');
    });

    it('returns 401 when no user in session', async () => {
      const { requireAdmin } = await import('../auth');
      const app = express();
      app.use(express.json());
      app.use(requireAdmin, (req, res) => {
        res.json({ admin: true });
      });

      const response = await request(app).get('/admin');
      expect(response.status).toBe(401);
    });

    it('returns 500 when Supabase is not configured', async () => {
      process.env.SUPABASE_URL = '';
      process.env.SUPABASE_SERVICE_ROLE_KEY = '';

      const { requireAdmin } = await import('../auth');
      const app = express();
      app.use(express.json());
      app.use((req: any, res, next) => {
        req.session = { userId: 'admin-123' };
        next();
      });
      app.get('/admin', requireAdmin, (req, res) => {
        res.json({ admin: true });
      });

      const response = await request(app).get('/admin');
      expect(response.status).toBe(500);
      expect(response.body.error).toContain('Supabase not configured');
    });
  });

  describe('Auth router routes', () => {
    it('POST /api/auth/invite sends invitation email', async () => {
      mockSupabaseClient.auth.admin.inviteUserByEmail.mockResolvedValue({
        user: { id: 'new-user', email: 'invited@test.com' },
      });

      const app = express();
      app.use(express.json());
      app.use('/api/auth', authRouter);

      const response = await request(app)
        .post('/api/auth/invite')
        .send({ email: 'invited@test.com' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('invited@test.com');
    });

    it('POST /api/auth/invite rejects invalid email', async () => {
      const app = express();
      app.use(express.json());
      app.use('/api/auth', authRouter);

      const response = await request(app)
        .post('/api/auth/invite')
        .send({ email: 'not-an-email' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Valid email is required');
    });

    it('POST /api/auth/invite returns 500 when service role key missing', async () => {
      process.env.SUPABASE_SERVICE_ROLE_KEY = '';

      const app = express();
      app.use(express.json());
      app.use('/api/auth', authRouter);

      const response = await request(app)
        .post('/api/auth/invite')
        .send({ email: 'invited@test.com' });

      expect(response.status).toBe(500);
      expect(response.body.error).toContain('Service role key not configured');
    });

    it('GET /api/auth/users returns paginated users list', async () => {
      mockSupabaseClient.auth.admin.listUsers.mockResolvedValue({
        users: [{ id: '1', email: 'user@test.com' }],
        total_metadata: { total_count: 1 },
      });

      const app = express();
      app.use(express.json());
      app.use('/api/auth', authRouter);

      const response = await request(app).get('/api/auth/users');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toHaveLength(1);
      expect(response.body.data.total).toBe(1);
    });

    it('DELETE /api/auth/users/:id deletes user', async () => {
      mockSupabaseClient.auth.admin.deleteUser.mockResolvedValue({ error: null });

      const app = express();
      app.use(express.json());
      app.use('/api/auth', authRouter);

      const response = await request(app).delete('/api/auth/users/user-123');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('user-123');
    });

    it('PATCH /api/auth/users/:id updates user metadata', async () => {
      mockSupabaseClient.auth.admin.updateUserById.mockResolvedValue({
        user: { id: 'user-123', email: 'updated@test.com' },
      });

      const app = express();
      app.use(express.json());
      app.use('/api/auth', authRouter);

      const response = await request(app)
        .patch('/api/auth/users/user-123')
        .send({ email: 'updated@test.com' });

      expect(response.status).toBe(200);
      expect(response.body.data.user.email).toBe('updated@test.com');
    });
  });
});
