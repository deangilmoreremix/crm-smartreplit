import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

const calls: Array<{ table: string; op: string; args: unknown[] }> = [];
const results: Record<string, any[]> = {};
let rpcResult: any = { data: 1, error: null };

function builder(table: string) {
  const next = () => {
    const q = results[table] || [{ data: null, error: null }];
    return q.length > 1 ? q.shift() : q[0];
  };
  const b: any = new Proxy({}, {
    get: (_t, op: string) => {
      if (op === 'then') return (res: any, rej: any) => Promise.resolve(next()).then(res, rej);
      if (op === 'single' || op === 'maybeSingle') return () => Promise.resolve(next());
      return (...args: unknown[]) => { calls.push({ table, op, args }); return b; };
    },
  });
  return b;
}

vi.mock('../../supabase', () => ({
  supabase: { from: (t: string) => builder(t), rpc: () => Promise.resolve(rpcResult) },
}));
vi.mock('../auth', () => ({
  requireAuth: () => (req: any, res: any, next: any) => {
    if (req.headers['x-anon']) return res.status(401).json({ error: 'Unauthorized' });
    req.userId = 'user-123';
    next();
  },
}));
vi.mock('@smartcrm/workflows', () => ({
  assertPublicHttps: (u: string) => new URL(u), isValidCron: () => true, nextCronRun: () => new Date(),
  resumeWait: vi.fn(), resumeWaitersForKeys: vi.fn(), runWorkflow: vi.fn(), validateFormSubmission: vi.fn(),
}));

import {
  registerPublicApiRoutes, hashApiKey, generateApiKey, safeEqualHex, scopeAllows,
  encodeCursor, decodeCursor, validateBody, buildOpenApi, RESOURCES,
} from '../publicApi';

const PEPPER = 'test-pepper';
const { key: KEY } = { key: 'sk_live_' + 'a'.repeat(43) };

function app() {
  const a = express();
  a.use(express.json());
  registerPublicApiRoutes(a as any);
  return a;
}
const keyRow = (scopes: string[]) => ({ data: [{ id: 'k1', user_id: 'owner-1', key_hash: hashApiKey(KEY, PEPPER), scopes, last_used_at: new Date().toISOString() }], error: null });
const owned = (table: string, col = 'profile_id') => calls.some((c) => c.table === table && c.op === 'eq' && c.args[0] === col && c.args[1] === 'owner-1');

beforeEach(() => {
  calls.length = 0;
  for (const k of Object.keys(results)) delete results[k];
  rpcResult = { data: 1, error: null };
  process.env.API_KEY_PEPPER = PEPPER;
});

describe('helpers', () => {
  it('hashes with the pepper and compares in constant time', () => {
    const h = hashApiKey(KEY, PEPPER);
    expect(h).toHaveLength(64);
    expect(hashApiKey(KEY, 'other')).not.toBe(h);
    expect(safeEqualHex(h, h)).toBe(true);
    expect(safeEqualHex(h, hashApiKey('x', PEPPER))).toBe(false);
    expect(safeEqualHex(h, 'short')).toBe(false);
  });
  it('generates sk_live_ keys with a lookup prefix', () => {
    const { key, prefix } = generateApiKey();
    expect(key).toMatch(/^sk_live_[A-Za-z0-9_-]{43}$/);
    expect(prefix).toBe(key.slice(0, 16));
  });
  it('checks scopes', () => {
    expect(scopeAllows(['read:contacts'], 'read', 'contacts')).toBe(true);
    expect(scopeAllows(['read:contacts'], 'write', 'contacts')).toBe(false);
    expect(scopeAllows(['write:contacts'], 'read', 'contacts')).toBe(false);
    expect(scopeAllows(null, 'read', 'deals')).toBe(false);
  });
  it('round-trips cursors and rejects garbage', () => {
    expect(decodeCursor(encodeCursor(42))).toBe('42');
    expect(decodeCursor('%%%')).toBeNull();
    expect(decodeCursor(Buffer.from('{"id":"a;drop"}').toString('base64url'))).toBeNull();
  });
  it('validates bodies against the whitelist', () => {
    expect(validateBody(RESOURCES.contacts, { first_name: 'A', last_name: 'B' }, 'create').ok).toBe(true);
    expect(validateBody(RESOURCES.contacts, { first_name: 'A' }, 'create').ok).toBe(false);
    expect(validateBody(RESOURCES.contacts, { first_name: 'A', last_name: 'B', profile_id: 'x' }, 'create').ok).toBe(false);
    expect(validateBody(RESOURCES.deals, { title: 't', value: 'nope' }, 'create').ok).toBe(false);
    expect(validateBody(RESOURCES.tasks, {}, 'update').ok).toBe(false);
    expect(validateBody(RESOURCES.contacts, { tags: ['a', 1] }, 'update').ok).toBe(false);
  });
  it('builds an OpenAPI 3.1 document covering every resource', () => {
    const doc: any = buildOpenApi();
    expect(doc.openapi).toBe('3.1.0');
    for (const n of Object.keys(RESOURCES)) {
      expect(doc.paths[`/${n}`].get).toBeTruthy();
      expect(doc.paths[`/${n}/{id}`].get).toBeTruthy();
    }
    expect(doc.paths['/companies'].post).toBeUndefined();
    expect(doc.components.securitySchemes.bearerAuth.scheme).toBe('bearer');
  });
});

describe('public API', () => {
  it('serves openapi.json without auth', async () => {
    const res = await request(app()).get('/api/v1/openapi.json');
    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe('3.1.0');
  });

  it('rejects missing, malformed and unknown keys with the JSON error shape', async () => {
    const a = app();
    let res = await request(a).get('/api/v1/contacts');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('invalid_api_key');
    res = await request(a).get('/api/v1/contacts').set('Authorization', 'Bearer not-a-key');
    expect(res.status).toBe(401);
    results.api_keys = [{ data: [], error: null }];
    res = await request(a).get('/api/v1/contacts').set('Authorization', `Bearer ${KEY}`);
    expect(res.status).toBe(401);
  });

  it('rejects a key whose hash does not match (wrong pepper)', async () => {
    results.api_keys = [{ data: [{ id: 'k1', user_id: 'owner-1', key_hash: hashApiKey(KEY, 'different'), scopes: ['read:contacts'] }], error: null }];
    const res = await request(app()).get('/api/v1/contacts').set('Authorization', `Bearer ${KEY}`);
    expect(res.status).toBe(401);
  });

  it('enforces scopes', async () => {
    results.api_keys = [keyRow(['read:contacts'])];
    const res = await request(app()).post('/api/v1/contacts').set('Authorization', `Bearer ${KEY}`).send({ first_name: 'A', last_name: 'B' });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('insufficient_scope');
  });

  it('rate limits at 120/min per key', async () => {
    results.api_keys = [keyRow(['read:contacts'])];
    rpcResult = { data: 121, error: null };
    const res = await request(app()).get('/api/v1/contacts').set('Authorization', `Bearer ${KEY}`);
    expect(res.status).toBe(429);
    expect(res.headers['retry-after']).toBeDefined();
  });

  it('lists with cursor pagination scoped to the key owner and hides owner columns', async () => {
    results.api_keys = [keyRow(['read:contacts'])];
    results.contacts = [{ data: [{ id: 1, first_name: 'A', profile_id: 'owner-1' }, { id: 2, first_name: 'B', profile_id: 'owner-1' }, { id: 3, first_name: 'C', profile_id: 'owner-1' }], error: null }];
    const res = await request(app()).get('/api/v1/contacts?limit=2').set('Authorization', `Bearer ${KEY}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].profile_id).toBeUndefined();
    expect(res.body.has_more).toBe(true);
    expect(decodeCursor(res.body.next_cursor)).toBe('2');
    expect(owned('contacts')).toBe(true);
    expect(res.headers['x-ratelimit-limit']).toBe('120');
  });

  it('validates limit and cursor', async () => {
    results.api_keys = [keyRow(['read:deals'])];
    const a = app();
    expect((await request(a).get('/api/v1/deals?limit=500').set('Authorization', `Bearer ${KEY}`)).status).toBe(400);
    expect((await request(a).get('/api/v1/deals?cursor=@@').set('Authorization', `Bearer ${KEY}`)).status).toBe(400);
  });

  it('creates with the owner forced from the key, ignoring any client-supplied owner', async () => {
    results.api_keys = [keyRow(['write:deals'])];
    results.deals = [{ data: { id: 9, title: 'T', profile_id: 'owner-1' }, error: null }];
    const a = app();
    const bad = await request(a).post('/api/v1/deals').set('Authorization', `Bearer ${KEY}`).send({ title: 'T', profile_id: 'victim' });
    expect(bad.status).toBe(400);
    const ok = await request(a).post('/api/v1/deals').set('Authorization', `Bearer ${KEY}`).send({ title: 'T' });
    expect(ok.status).toBe(201);
    const insert = calls.find((c) => c.table === 'deals' && c.op === 'insert')!;
    expect(insert.args[0]).toMatchObject({ title: 'T', stage: 'lead', profile_id: 'owner-1' });
  });

  it('404s on records of other owners (owner filter applied to get/update/delete)', async () => {
    results.api_keys = [keyRow(['read:tasks', 'write:tasks'])];
    results.tasks = [{ data: null, error: null }];
    const a = app();
    expect((await request(a).get('/api/v1/tasks/5').set('Authorization', `Bearer ${KEY}`)).status).toBe(404);
    expect((await request(a).patch('/api/v1/tasks/5').set('Authorization', `Bearer ${KEY}`).send({ title: 'x' })).status).toBe(404);
    results.tasks = [{ data: [], error: null }];
    expect((await request(a).delete('/api/v1/tasks/5').set('Authorization', `Bearer ${KEY}`)).status).toBe(404);
    expect(calls.filter((c) => c.table === 'tasks' && c.op === 'eq' && c.args[0] === 'profile_id' && c.args[1] === 'owner-1').length).toBeGreaterThanOrEqual(3);
  });

  it('companies cannot be created or deleted', async () => {
    results.api_keys = [keyRow(['write:companies'])];
    const a = app();
    expect((await request(a).post('/api/v1/companies').set('Authorization', `Bearer ${KEY}`).send({ name: 'x' })).status).toBe(405);
    expect((await request(a).delete('/api/v1/companies/1').set('Authorization', `Bearer ${KEY}`)).status).toBe(405);
  });

  it('maps FK violations on delete to 409', async () => {
    results.api_keys = [keyRow(['write:contacts'])];
    results.contacts = [{ data: null, error: { code: '23503', message: 'fk' } }];
    const res = await request(app()).delete('/api/v1/contacts/1').set('Authorization', `Bearer ${KEY}`);
    expect(res.status).toBe(409);
  });
});

describe('API key management', () => {
  it('requires a session', async () => {
    expect((await request(app()).get('/api/public-api-keys').set('x-anon', '1')).status).toBe(401);
  });

  it('creates a key, returns the secret once and stores only the hash', async () => {
    results.api_keys = [{ count: 0, data: null, error: null }, { data: { id: 'k9', name: 'ci', prefix: 'sk_live_abcdefgh', scopes: ['read:contacts'] }, error: null }];
    const res = await request(app()).post('/api/public-api-keys').send({ name: 'ci', scopes: ['read:contacts'] });
    expect(res.status).toBe(201);
    expect(res.body.secret).toMatch(/^sk_live_/);
    expect(res.body.key.key_hash).toBeUndefined();
    const insert = calls.find((c) => c.table === 'api_keys' && c.op === 'insert')!;
    const row: any = insert.args[0];
    expect(row.user_id).toBe('user-123');
    expect(row.key_hash).toBe(hashApiKey(res.body.secret, PEPPER));
    expect(JSON.stringify(row)).not.toContain(res.body.secret);
  });

  it('rejects unknown scopes and missing pepper', async () => {
    const a = app();
    expect((await request(a).post('/api/public-api-keys').send({ name: 'x', scopes: ['admin:*'] })).status).toBe(400);
    delete process.env.API_KEY_PEPPER;
    expect((await request(a).post('/api/public-api-keys').send({ name: 'x', scopes: ['read:contacts'] })).status).toBe(503);
  });

  it('revokes owner-scoped', async () => {
    results.api_keys = [{ data: [{ id: 'k1' }], error: null }];
    const res = await request(app()).delete('/api/public-api-keys/11111111-1111-1111-1111-111111111111');
    expect(res.status).toBe(204);
    expect(calls.some((c) => c.op === 'eq' && c.args[0] === 'user_id' && c.args[1] === 'user-123')).toBe(true);
    expect(calls.find((c) => c.op === 'update')!.args[0]).toHaveProperty('revoked_at');
  });
});
