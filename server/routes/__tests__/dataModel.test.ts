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

  describe('records search with field restrictions', () => {
    const rec = (id: string, data: Record<string, unknown>) => ({
      id, object_id: OBJ, user_id: 'owner-9', data, search_text: Object.values(data).join(' ').toLowerCase(),
      created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z', deleted_at: null,
    });
    const rows = [rec('r1', { title: 'Alpha', salary: 'topsecret99' }), rec('r2', { title: 'Beta', salary: 'zzz' })];
    const asMember = (hideSalary: boolean) => {
      results.team_members = [{ data: [{ owner_id: 'owner-9', role_id: 'r1' }], error: null }];
      results.object_metadata = [{ data: [{ id: OBJ, user_id: 'owner-9' }], error: null }];
      results.role_object_permissions = [{ data: [{ object_type: OBJ, can_read: true, can_create: false, can_update: false, can_delete: false }], error: null }];
      results.role_field_permissions = [{ data: hideSalary ? [{ object_type: OBJ, field: 'salary', can_read: false, can_write: false }] : [], error: null }];
      results.field_metadata = [{ data: [{ name: 'title', field_type: 'text' }, { name: 'salary', field_type: 'text' }], error: null }];
      results.records = [{ data: rows, error: null }];
    };
    const search = (q: string) => request(app).get('/api/data-model/records').query({ object: OBJ, q });

    it('restricted role cannot find a record via a hidden field value', async () => {
      asMember(true);
      const r = await search('topsecret');
      expect(r.status).toBe(200);
      expect(r.body.records).toEqual([]);
    });

    it('restricted role can find a record via a visible field and never sees hidden data or search_text', async () => {
      asMember(true);
      const r = await search('alpha');
      expect(r.status).toBe(200);
      expect(r.body.records.map((x: any) => x.id)).toEqual(['r1']);
      expect(JSON.stringify(r.body)).not.toMatch(/topsecret|search_text|salary/);
      expect(calls.some((c) => c.op === 'ilike')).toBe(false);
    });

    it('restricted role cannot probe a hidden field through filter', async () => {
      asMember(true);
      const r = await request(app).get('/api/data-model/records').query({ object: OBJ, filter: JSON.stringify([{ field: 'salary', op: 'eq', value: 'zzz' }]) });
      expect(r.status).toBe(400);
    });

    it('unrestricted member keeps the fast search_text path and no response carries search_text', async () => {
      asMember(false);
      const r = await search('topsecret');
      expect(r.status).toBe(200);
      expect(calls.some((c) => c.table === 'records' && c.op === 'ilike' && c.args[0] === 'search_text')).toBe(true);
      expect(JSON.stringify(r.body)).not.toContain('search_text');
      expect(r.body.records[0].data.salary).toBe('topsecret99');
    });

    it('create and update responses never contain search_text or hidden fields', async () => {
      asMember(true);
      results.role_object_permissions = [{ data: [{ object_type: OBJ, can_read: true, can_create: true, can_update: true, can_delete: false }], error: null }];
      results.records = [{ data: rows[0], error: null }];
      const c = await request(app).post('/api/data-model/records').send({ object: OBJ, data: { title: 'Alpha' } });
      expect(c.status).toBe(201);
      expect(JSON.stringify(c.body)).not.toMatch(/topsecret|search_text/);
      const u = await request(app).put('/api/data-model/records/123e4567-e89b-12d3-a456-426614174001').send({ data: { title: 'Alpha' } });
      expect(JSON.stringify(u.body)).not.toMatch(/topsecret|search_text/);
    });
  });
});
