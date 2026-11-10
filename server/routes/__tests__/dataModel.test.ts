import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

const calls: Array<{ table: string; op: string; args: unknown[] }> = [];
const results: Record<string, Array<{ data: any; error: any }>> = {};

function builder(table: string) {
  const next = () => {
    const q = results[table] || [{ data: null, error: null }];
    return q.length > 1 ? q.shift()! : q[0];
  };
  const b: any = {};
  for (const op of ['select', 'eq', 'in', 'is', 'not', 'filter', 'ilike', 'or', 'order', 'limit', 'insert', 'update', 'delete', 'upsert']) {
    b[op] = (...args: unknown[]) => { calls.push({ table, op, args }); return b; };
  }
  b.single = () => Promise.resolve(next());
  b.maybeSingle = () => Promise.resolve(next());
  b.then = (resolve: any, reject: any) => Promise.resolve(next()).then(resolve, reject);
  return b;
}

vi.mock('../../supabase', () => ({ supabase: { from: (t: string) => builder(t), auth: { admin: {} } } }));
vi.mock('../auth', () => ({
  requireAuth: () => (req: any, res: any, next: any) => {
    if (req.headers['x-anon']) return res.status(401).json({ error: 'Unauthorized' });
    req.userId = 'user-123';
    next();
  },
}));

import { registerDataModelRoutes } from '../dataModel';

const OBJ = '123e4567-e89b-12d3-a456-426614174000';

describe('Data model routes', () => {
  let app: express.Application;
  beforeEach(() => {
    calls.length = 0;
    for (const k of Object.keys(results)) delete results[k];
    app = express();
    app.use(express.json());
    registerDataModelRoutes(app);
  });

  it('401 without auth', async () => {
    expect((await request(app).get('/api/data-model/objects').set('x-anon', '1')).status).toBe(401);
  });

  it('rejects invalid object input before touching the db', async () => {
    const r = await request(app).post('/api/data-model/objects').send({ name_singular: 'Bad Name' });
    expect(r.status).toBe(400);
    expect(calls.length).toBe(0);
  });

  it('creates objects owned by the caller, ignoring client user_id', async () => {
    results.object_metadata = [{ data: { id: OBJ }, error: null }];
    const r = await request(app).post('/api/data-model/objects').send({
      name_singular: 'project', name_plural: 'projects', label_singular: 'P', label_plural: 'Ps', user_id: 'attacker',
    });
    expect(r.status).toBe(201);
    const ins: any = calls.find((c) => c.op === 'insert')!.args[0];
    expect(ins.user_id).toBe('user-123');
  });

  it('records: rejects a bad filter with 400 and scopes by owner', async () => {
    results.team_members = [{ data: [], error: null }];
    results.object_metadata = [{ data: [{ id: OBJ, user_id: 'user-123' }], error: null }];
    results.field_metadata = [{ data: [{ name: 'title', field_type: 'text' }], error: null }];
    const bad = await request(app).get('/api/data-model/records').query({ object: OBJ, filter: JSON.stringify([{ field: 'user_id', op: 'eq', value: 'x' }]) });
    expect(bad.status).toBe(400);
    results.records = [{ data: [], error: null }];
    const ok = await request(app).get('/api/data-model/records').query({ object: OBJ, filter: JSON.stringify([{ field: 'title', op: 'eq', value: 'a' }]) });
    expect(ok.status).toBe(200);
    expect(calls.some((c) => c.table === 'records' && c.op === 'eq' && c.args[0] === 'user_id' && c.args[1] === 'user-123')).toBe(true);
  });

  it('records: member without read permission gets 403', async () => {
    results.team_members = [{ data: [{ owner_id: 'owner-9', role_id: 'r1' }], error: null }];
    results.object_metadata = [{ data: [{ id: OBJ, user_id: 'owner-9' }], error: null }];
    results.role_object_permissions = [{ data: [], error: null }];
    results.role_field_permissions = [{ data: [], error: null }];
    const r = await request(app).get('/api/data-model/records').query({ object: OBJ });
    expect(r.status).toBe(403);
  });

  it('roles: rejects permission rows for unknown objects', async () => {
    results.object_metadata = [{ data: [], error: null }];
    const r = await request(app).post('/api/data-model/roles').send({ name: 'Rep', objectPermissions: [{ object_type: 'nope', can_read: true }] });
    expect(r.status).toBe(400);
  });
});
