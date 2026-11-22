import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createClient } from '@supabase/supabase-js';

// The module reads SUPABASE_* when it is first imported, so set them before that happens
vi.hoisted(() => {
  process.env.SUPABASE_URL = 'http://test.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
});
import '../auth';

const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      })),
    })),
    rpc: vi.fn(() => ({
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  })),
  auth: {
    // an unrecognised bearer token is rejected
    getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: { message: 'invalid token' } }),
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
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
      })),
      rpc: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
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
    // The admin and entitlement cases are covered, against the real middleware, in auth-admin-routes.test.ts

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
      vi.resetModules(); // the module reads these once, when it is imported

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

  // The /api/auth user-management routes (invite, list, update, delete) need a super admin. Their behaviour,
  // including rejecting anonymous callers, is covered in auth-admin-routes.test.ts.
});
