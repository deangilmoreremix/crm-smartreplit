import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

vi.hoisted(() => {
  // the auth module reads these when it is first imported
  process.env.SUPABASE_URL = 'http://test.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
});

// These routes use the Supabase service role key to list, invite, edit and delete users, so they must
// only work for a signed-in super admin. They used to have no authentication at all.
const admin = {
  listUsers: vi.fn(async () => ({ data: { users: [{ id: 'u1' }], total_metadata: { total_count: 1 } }, error: null })),
  inviteUserByEmail: vi.fn(async () => ({ data: { user: { id: 'u2' } }, error: null })),
  deleteUser: vi.fn(async () => ({ error: null })),
  updateUserById: vi.fn(async () => ({ data: { user: { id: 'u1' } }, error: null })),
};
let tokenUser: { id: string; email: string } | null = null;
let role: string | null = 'super_admin';
let hasAdminFeature = true;

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(async () => (tokenUser ? { data: { user: tokenUser }, error: null } : { data: { user: null }, error: { message: 'bad token' } })),
      admin,
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({ eq: vi.fn(() => ({ single: vi.fn(async () => (role ? { data: { role }, error: null } : { data: null, error: { message: 'none' } })) })) })),
    })),
    rpc: vi.fn(async () => ({ data: hasAdminFeature, error: null })),
  })),
}));

import authRouter from '../auth';

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);

const ROUTES: Array<['get' | 'post' | 'delete' | 'patch', string, any]> = [
  ['get', '/api/auth/users', undefined],
  ['post', '/api/auth/invite', { email: 'new@example.com' }],
  ['delete', '/api/auth/users/abc', undefined],
  ['patch', '/api/auth/users/abc', { app_metadata: { role: 'super_admin' } }],
];
const call = (method: string, url: string, body: any, token?: string) => {
  let r = (request(app) as any)[method](url);
  if (token) r = r.set('Authorization', `Bearer ${token}`);
  return body ? r.send(body) : r;
};
const adminCalled = () => Object.values(admin).some((fn) => fn.mock.calls.length > 0);

describe('/api/auth user-management routes', () => {
  beforeEach(() => {
    Object.values(admin).forEach((fn) => fn.mockClear());
    tokenUser = { id: 'admin-1', email: 'admin@example.com' };
    role = 'super_admin';
    hasAdminFeature = true;
  });

  it.each(ROUTES)('%s %s rejects a request with no login and touches no users', async (method, url, body) => {
    const res = await call(method, url, body);
    expect(res.status).toBe(401);
    expect(adminCalled()).toBe(false);
  });

  it.each(ROUTES)('%s %s rejects an invalid token', async (method, url, body) => {
    tokenUser = null;
    const res = await call(method, url, body, 'garbage');
    expect(res.status).toBe(401);
    expect(adminCalled()).toBe(false);
  });

  it.each(ROUTES)('%s %s rejects a signed-in user who is not a super admin', async (method, url, body) => {
    role = 'regular_user';
    const res = await call(method, url, body, 'valid-token');
    expect(res.status).toBe(403);
    expect(adminCalled()).toBe(false);
  });

  it.each(ROUTES)('%s %s rejects a super admin profile without the admin entitlement', async (method, url, body) => {
    hasAdminFeature = false;
    expect((await call(method, url, body, 'valid-token')).status).toBe(403);
    expect(adminCalled()).toBe(false);
  });

  it('still validates input for a super admin (invalid email is a 400, not an invite)', async () => {
    const res = await call('post', '/api/auth/invite', { email: 'not-an-email' }, 'valid-token');
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Valid email is required');
    expect(admin.inviteUserByEmail).not.toHaveBeenCalled();
  });

  it('lets a super admin list, invite, update and delete users', async () => {
    expect((await call('get', '/api/auth/users', undefined, 'valid-token')).status).toBe(200);
    expect(admin.listUsers).toHaveBeenCalled();
    expect((await call('post', '/api/auth/invite', { email: 'new@example.com' }, 'valid-token')).status).toBe(200);
    expect(admin.inviteUserByEmail).toHaveBeenCalledWith('new@example.com');
    expect((await call('patch', '/api/auth/users/abc', { user_metadata: { a: 1 } }, 'valid-token')).status).toBe(200);
    expect(admin.updateUserById).toHaveBeenCalledWith('abc', { user_metadata: { a: 1 } });
    expect((await call('delete', '/api/auth/users/abc', undefined, 'valid-token')).status).toBe(200);
    expect(admin.deleteUser).toHaveBeenCalledWith('abc');
  });
});
