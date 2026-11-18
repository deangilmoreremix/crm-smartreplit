import { describe, it, expect, vi, beforeAll } from 'vitest';
import express from 'express';
import request from 'supertest';

const getUser = vi.fn(async (token: string) =>
  token === 'valid-jwt'
    ? { data: { user: { id: 'user-1', email: 'u@example.com' } }, error: null }
    : { data: { user: null }, error: new Error('invalid JWT') }
);

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ auth: { getUser } })),
}));

describe('requireAuth with Supabase access tokens', () => {
  let app: express.Express;

  beforeAll(async () => {
    process.env.SUPABASE_URL = 'http://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
    vi.resetModules();
    const { requireAuth } = await import('../auth');
    app = express();
    app.get('/api/protected', requireAuth({ checkEntitlement: false }), (req: any, res) =>
      res.json({ userId: req.userId, email: req.userEmail })
    );
  });

  it('accepts a valid Supabase token', async () => {
    const res = await request(app).get('/api/protected').set('Authorization', 'Bearer valid-jwt');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ userId: 'user-1', email: 'u@example.com' });
  });

  it('rejects an invalid token', async () => {
    const res = await request(app).get('/api/protected').set('Authorization', 'Bearer bad');
    expect(res.status).toBe(401);
  });

  it('rejects a request with no token', async () => {
    const res = await request(app).get('/api/protected');
    expect(res.status).toBe(401);
  });
});
