#!/usr/bin/env node
/**
 * Live API smoke test against a deployed stack (Netlify preview + Supabase staging branch).
 *
 * Required env:
 *   API_BASE_URL          e.g. https://deploy-preview-12--yoursite.netlify.app   (no trailing slash needed)
 *   SUPABASE_URL          e.g. https://abcd1234.supabase.co
 *   SUPABASE_ANON_KEY     the project's anon (publishable) key
 *   TEST_USER_A_EMAIL / TEST_USER_A_PASSWORD
 * Optional env:
 *   TEST_USER_B_EMAIL / TEST_USER_B_PASSWORD   enables the cross-user denial checks
 *   SMOKE_AI=1             also run assistants (2 turns) and AI jobs (needs OpenAI key saved for user A)
 *   SMOKE_RATE_LIMIT=1     also burst >120 requests/min on a public API key and expect a 429
 *   SMOKE_STRICT=1         exit 2 (instead of 0) when required env is missing
 *
 * Signature helper (no network):
 *   node scripts/smoke-api.mjs --verify-signature <secret> <timestamp> <rawBody> <sha256=...>
 *   Recomputes HMAC-SHA256(secret, `${timestamp}.${rawBody}`) exactly as server/jobs/webhookDelivery.ts signs.
 *
 * Output: PASS/FAIL/SKIP table. Exit 0 = no FAIL, 1 = at least one FAIL, 2 = env missing and SMOKE_STRICT=1.
 * Secrets (passwords, JWTs, API keys, webhook secrets) are never printed.
 * Everything it creates is deleted at the end (best effort); the workflow run creates one task titled
 * "smoke-api task" which is also cleaned up when /api/tasks allows it.
 */
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

// ---------------------------------------------------------------------------------------------
// Signature helpers (mirror server/jobs/webhookDelivery.ts signPayload)
// ---------------------------------------------------------------------------------------------
export function signPayload(secret, timestamp, body) {
  return `sha256=${createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex')}`;
}
export function verifySignature(secret, timestamp, body, header) {
  const expected = Buffer.from(signPayload(secret, timestamp, body));
  const got = Buffer.from(String(header || ''));
  return expected.length === got.length && timingSafeEqual(expected, got);
}

const argv = process.argv.slice(2);
if (argv[0] === '--verify-signature') {
  const [, secret, ts, body, sig] = argv;
  if (!secret || !ts || body === undefined || !sig) {
    console.error('Usage: node scripts/smoke-api.mjs --verify-signature <secret> <timestamp> <rawBody> <sha256=...>');
    process.exit(2);
  }
  const ok = verifySignature(secret, ts, body, sig);
  console.log(ok ? 'signature OK' : 'signature MISMATCH');
  process.exit(ok ? 0 : 1);
}

// ---------------------------------------------------------------------------------------------
// Env
// ---------------------------------------------------------------------------------------------
const env = (k) => (process.env[k] || '').trim();
const API = env('API_BASE_URL').replace(/\/+$/, '');
const SB_URL = env('SUPABASE_URL').replace(/\/+$/, '');
const SB_ANON = env('SUPABASE_ANON_KEY');
const USER_A = { email: env('TEST_USER_A_EMAIL'), password: env('TEST_USER_A_PASSWORD') };
const USER_B = { email: env('TEST_USER_B_EMAIL'), password: env('TEST_USER_B_PASSWORD') };
const AI = env('SMOKE_AI') === '1';
const RATE = env('SMOKE_RATE_LIMIT') === '1';
const HAS_B = Boolean(USER_B.email && USER_B.password);

const missing = [
  ['API_BASE_URL', API],
  ['SUPABASE_URL', SB_URL],
  ['SUPABASE_ANON_KEY', SB_ANON],
  ['TEST_USER_A_EMAIL', USER_A.email],
  ['TEST_USER_A_PASSWORD', USER_A.password],
]
  .filter(([, v]) => !v)
  .map(([k]) => k);

if (missing.length) {
  console.log(`SKIP smoke-api: missing env ${missing.join(', ')}.`);
  console.log('Set API_BASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY, TEST_USER_A_EMAIL/PASSWORD (and optionally TEST_USER_B_*, SMOKE_AI=1). See docs/TESTING.md.');
  process.exit(env('SMOKE_STRICT') === '1' ? 2 : 0);
}

// ---------------------------------------------------------------------------------------------
// Secret redaction + HTTP
// ---------------------------------------------------------------------------------------------
const secretValues = new Set([SB_ANON, USER_A.password, USER_B.password].filter(Boolean));
const remember = (s) => {
  if (s && typeof s === 'string' && s.length >= 8) secretValues.add(s);
  return s;
};
const redact = (text) => {
  let out = String(text ?? '');
  for (const s of secretValues) out = out.split(s).join('***');
  return out.replace(/sk_live_[A-Za-z0-9_-]+/g, 'sk_live_***').replace(/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*/g, '<jwt>');
};

async function http(method, url, { token, body, headers = {} } = {}) {
  const h = { Accept: 'application/json', ...headers };
  if (token) h.Authorization = `Bearer ${token}`;
  let payload;
  if (body !== undefined) {
    h['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  const res = await fetch(url, { method, headers: h, body: payload, signal: AbortSignal.timeout(45_000), redirect: 'manual' });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    /* non-JSON body */
  }
  return { status: res.status, json, text, headers: res.headers };
}
const api = (method, path, opts) => http(method, `${API}${path}`, opts);

async function signIn(user) {
  const res = await http('POST', `${SB_URL}/auth/v1/token?grant_type=password`, {
    headers: { apikey: SB_ANON },
    body: { email: user.email, password: user.password },
  });
  if (res.status !== 200 || !res.json?.access_token) {
    throw new Error(`Supabase sign-in failed (HTTP ${res.status}): ${redact(res.json?.error_description || res.json?.msg || res.text).slice(0, 200)}`);
  }
  remember(res.json.access_token);
  return { token: res.json.access_token, id: res.json.user?.id };
}

// ---------------------------------------------------------------------------------------------
// Tiny test runner
// ---------------------------------------------------------------------------------------------
class Skip extends Error {}
const skip = (why) => {
  throw new Skip(why);
};
const results = [];
const cleanups = [];
const onCleanup = (name, fn) => cleanups.push({ name, fn });

async function check(name, fn) {
  try {
    const detail = await fn();
    results.push({ name, status: 'PASS', detail: detail || '' });
  } catch (e) {
    if (e instanceof Skip) results.push({ name, status: 'SKIP', detail: e.message });
    else results.push({ name, status: 'FAIL', detail: redact(e?.message || e).slice(0, 300) });
  }
}
function expect(cond, msg) {
  if (!cond) throw new Error(msg);
}
function expectStatus(res, allowed, what) {
  const list = Array.isArray(allowed) ? allowed : [allowed];
  if (!list.includes(res.status)) {
    throw new Error(`${what}: expected HTTP ${list.join('/')}, got ${res.status} ${redact(res.text).slice(0, 160)}`);
  }
}

const rnd = () => randomBytes(4).toString('hex');
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ---------------------------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------------------------
let A = null;
let B = null;
const state = {};

async function main() {
  await check('auth: Supabase sign-in user A', async () => {
    A = await signIn(USER_A);
  });
  if (!A) return;
  if (HAS_B) {
    await check('auth: Supabase sign-in user B', async () => {
      B = await signIn(USER_B);
    });
  }
  const needB = () => (B ? undefined : skip('TEST_USER_B_* not set or sign-in failed'));

  // ------------------------------------------------------------ auth gate / status
  await check('no token -> 401 (/api/notes)', async () => {
    expectStatus(await api('GET', '/api/notes'), 401, 'GET /api/notes without token');
  });
  await check('no token -> 401 (/api/crm/companies)', async () => {
    expectStatus(await api('GET', '/api/crm/companies'), 401, 'GET /api/crm/companies without token');
  });
  await check('garbage token -> 401', async () => {
    expectStatus(await api('GET', '/api/notes', { token: 'not-a-jwt' }), 401, 'GET /api/notes bad token');
  });
  await check('JWT -> 200 /api/openai/status', async () => {
    const r = await api('GET', '/api/openai/status', { token: A.token });
    expectStatus(r, 200, '/api/openai/status');
    return `configured=${r.json?.configured ?? r.json?.openai?.available ?? 'n/a'}`;
  });

  // ------------------------------------------------------------ notes
  await check('notes: create with body_json/body_text, read back, delete', async () => {
    const body_json = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'smoke note' }] }] };
    const r = await api('POST', '/api/notes', {
      token: A.token,
      body: { title: `smoke-api ${rnd()}`, content: 'smoke note', body_text: 'smoke note', body_json, type: 'general' },
    });
    expectStatus(r, 201, 'POST /api/notes');
    const note = r.json;
    expect(note?.id, 'created note has no id');
    onCleanup('delete note', () => api('DELETE', `/api/notes/${note.id}`, { token: A.token }));
    expect(note.body_text === 'smoke note', `body_text not persisted (got ${JSON.stringify(note.body_text)})`);
    expect(note.body_json?.type === 'doc', 'body_json not persisted');
    const list = await api('GET', '/api/notes', { token: A.token });
    expectStatus(list, 200, 'GET /api/notes');
    const rows = Array.isArray(list.json) ? list.json : list.json?.notes || [];
    expect(rows.some((n) => n.id === note.id), 'new note not in list');
    state.noteId = note.id;
  });

  // ------------------------------------------------------------ companies
  await check('companies: create/get/update/list/delete', async () => {
    const name = `Smoke Co ${rnd()}`;
    const c = await api('POST', '/api/crm/companies', { token: A.token, body: { name, domain: 'smoke-example.com' } });
    expectStatus(c, 201, 'POST /api/crm/companies');
    const id = c.json?.id;
    expect(UUID.test(id || ''), 'company id is not a uuid');
    state.companyId = id;
    onCleanup('delete company', () => api('DELETE', `/api/crm/companies/${id}`, { token: A.token }));
    const g = await api('GET', `/api/crm/companies/${id}`, { token: A.token });
    expectStatus(g, 200, 'GET company');
    expect(g.json?.name === name, 'name mismatch on GET');
    const u = await api('PUT', `/api/crm/companies/${id}`, { token: A.token, body: { name: `${name} v2`, industry: 'Testing' } });
    expectStatus(u, 200, 'PUT company');
    expect(u.json?.name === `${name} v2`, 'name not updated');
    const l = await api('GET', '/api/crm/companies', { token: A.token });
    expectStatus(l, 200, 'GET companies');
    expect((Array.isArray(l.json) ? l.json : []).some((x) => x.id === id), 'company not in list');
    const d = await api('DELETE', `/api/crm/companies/${id}`, { token: A.token });
    expectStatus(d, [200, 204], 'DELETE company');
    expectStatus(await api('GET', `/api/crm/companies/${id}`, { token: A.token }), 404, 'GET deleted company');
  });
  await check('companies: user B cannot read/update/delete A\'s company', async () => {
    needB();
    const c = await api('POST', '/api/crm/companies', { token: A.token, body: { name: `Smoke Private ${rnd()}` } });
    expectStatus(c, 201, 'POST company (A)');
    const id = c.json.id;
    onCleanup('delete private company', () => api('DELETE', `/api/crm/companies/${id}`, { token: A.token }));
    expectStatus(await api('GET', `/api/crm/companies/${id}`, { token: B.token }), [403, 404], 'B GET A company');
    expectStatus(await api('PUT', `/api/crm/companies/${id}`, { token: B.token, body: { name: 'hijacked' } }), [403, 404], 'B PUT A company');
    await api('DELETE', `/api/crm/companies/${id}`, { token: B.token });
    const still = await api('GET', `/api/crm/companies/${id}`, { token: A.token });
    expect(still.status === 200 && still.json?.name !== 'hijacked', 'A\'s company was modified/deleted by B');
    const listB = await api('GET', '/api/crm/companies', { token: B.token });
    expect(!(Array.isArray(listB.json) ? listB.json : []).some((x) => x.id === id), 'A\'s company appears in B\'s list');
  });

  // ------------------------------------------------------------ data model
  const suffix = rnd();
  const objSingular = `smk${suffix}`;
  const objPlural = `smk${suffix}s`;
  await check('data-model: object + field + record create/list', async () => {
    const o = await api('POST', '/api/data-model/objects', {
      token: A.token,
      body: { name_singular: objSingular, name_plural: objPlural, label_singular: 'Smoke Thing', label_plural: 'Smoke Things' },
    });
    expectStatus(o, 201, 'POST object');
    const obj = o.json.object;
    state.objectId = obj.id;
    onCleanup('delete object', () => api('DELETE', `/api/data-model/objects/${obj.id}`, { token: A.token }));
    const f = await api('POST', '/api/data-model/fields', {
      token: A.token,
      body: { object: obj.id, name: 'title', label: 'Title', field_type: 'text' },
    });
    expectStatus(f, 201, 'POST field');
    const fl = await api('GET', `/api/data-model/fields?object=${obj.id}`, { token: A.token });
    expectStatus(fl, 200, 'GET fields');
    expect((fl.json.fields || []).some((x) => x.name === 'title'), 'field not listed');
    const r = await api('POST', '/api/data-model/records', { token: A.token, body: { object: obj.id, data: { title: 'hello' } } });
    expectStatus(r, 201, 'POST record');
    state.recordId = r.json.record.id;
    const list = await api('GET', `/api/data-model/records?object=${obj.id}`, { token: A.token });
    expectStatus(list, 200, 'GET records');
    expect((list.json.records || []).some((x) => x.id === state.recordId && x.data?.title === 'hello'), 'record not in list');
    const byName = await api('GET', `/api/data-model/records?object=${objPlural}`, { token: A.token });
    expectStatus(byName, 200, 'GET records by plural name');
  });
  await check('data-model: user B denied on A\'s object/records', async () => {
    needB();
    if (!state.recordId) skip('record was not created');
    const rl = await api('GET', `/api/data-model/records?object=${state.objectId}`, { token: B.token });
    expectStatus(rl, [403, 404], 'B list A records');
    const rn = await api('GET', `/api/data-model/records?object=${objPlural}`, { token: B.token });
    expect(rn.status !== 200 || (rn.json?.records || []).length === 0, 'B could list A\'s records by name');
    expectStatus(await api('PUT', `/api/data-model/records/${state.recordId}`, { token: B.token, body: { data: { title: 'pwned' } } }), [403, 404], 'B PUT A record');
    expectStatus(await api('DELETE', `/api/data-model/records/${state.recordId}`, { token: B.token }), [403, 404], 'B DELETE A record');
    expectStatus(await api('DELETE', `/api/data-model/objects/${state.objectId}`, { token: B.token }), [403, 404], 'B DELETE A object');
    const ob = await api('GET', '/api/data-model/objects', { token: B.token });
    expectStatus(ob, 200, 'B list objects');
    expect(!(ob.json.objects || []).some((x) => x.id === state.objectId), 'A\'s object appears in B\'s list');
    const still = await api('GET', `/api/data-model/records?object=${state.objectId}`, { token: A.token });
    expect((still.json.records || []).some((x) => x.id === state.recordId && x.data?.title === 'hello'), 'A\'s record changed after B attempts');
  });
  await check('data-model: record delete (soft) then object delete', async () => {
    if (!state.recordId) skip('record was not created');
    expectStatus(await api('DELETE', `/api/data-model/records/${state.recordId}`, { token: A.token }), 200, 'DELETE record');
    const list = await api('GET', `/api/data-model/records?object=${state.objectId}`, { token: A.token });
    expect(!(list.json.records || []).some((x) => x.id === state.recordId), 'deleted record still listed');
    expectStatus(await api('DELETE', `/api/data-model/objects/${state.objectId}`, { token: A.token }), 200, 'DELETE object');
  });

  // ------------------------------------------------------------ workflows
  await check('workflows: create, manual run, run history', async () => {
    const w = await api('POST', '/api/workflows', {
      token: A.token,
      body: {
        name: `smoke-api manual ${rnd()}`,
        triggerType: 'MANUAL',
        steps: [{ actionType: 'CREATE_TASK', configuration: { title: 'smoke-api task' } }],
      },
    });
    expectStatus(w, 201, 'POST workflow');
    const id = w.json.workflow.id;
    state.workflowId = id;
    onCleanup('delete workflow', () => api('DELETE', `/api/workflows/${id}`, { token: A.token }));
    const run = await api('POST', `/api/workflows/${id}/run`, { token: A.token, body: { triggerData: { source: 'smoke' } } });
    expectStatus(run, 200, 'POST run');
    const status = run.json?.run?.status;
    expect(['completed', 'waiting'].includes(status), `run status "${status}" (error: ${redact(run.json?.run?.errorMessage || '')})`);
    const hist = await api('GET', `/api/workflows/${id}/runs`, { token: A.token });
    expectStatus(hist, 200, 'GET runs');
    expect((hist.json.runs || []).some((r) => r.id === run.json.run.id), 'run missing from history');
    return `run ${status}`;
  });
  await check('workflows: user B cannot see/run A\'s workflow', async () => {
    needB();
    if (!state.workflowId) skip('workflow was not created');
    expectStatus(await api('GET', `/api/workflows/${state.workflowId}`, { token: B.token }), 404, 'B GET workflow');
    expectStatus(await api('POST', `/api/workflows/${state.workflowId}/run`, { token: B.token, body: {} }), [403, 404], 'B run workflow');
  });
  await check('workflows: inbound webhook token -> 202', async () => {
    const w = await api('POST', '/api/workflows', {
      token: A.token,
      body: { name: `smoke-api hook ${rnd()}`, triggerType: 'WEBHOOK', steps: [{ actionType: 'CREATE_TASK', configuration: { title: 'smoke-api task' } }] },
    });
    expectStatus(w, 201, 'POST webhook workflow');
    const id = w.json.workflow.id;
    onCleanup('delete webhook workflow', () => api('DELETE', `/api/workflows/${id}`, { token: A.token }));
    const t = await api('POST', `/api/workflows/${id}/webhook-token`, { token: A.token });
    expectStatus(t, 200, 'POST webhook-token');
    const token = remember(t.json?.webhookToken);
    expect(/^[a-f0-9]{48}$/.test(token || ''), 'webhook token has unexpected shape');
    // public endpoint: no Authorization header
    const hit = await api('POST', `/api/hooks/workflows/${token}`, { body: { hello: 'world' } });
    expectStatus(hit, 202, 'POST inbound hook');
    expect(hit.json?.runId, '202 without runId');
    expectStatus(await api('POST', `/api/hooks/workflows/${'0'.repeat(48)}`, { body: {} }), 404, 'unknown token');
    await api('DELETE', `/api/workflows/${id}/webhook-token`, { token: A.token });
    expectStatus(await api('POST', `/api/hooks/workflows/${token}`, { body: {} }), 404, 'revoked token');
  });

  // ------------------------------------------------------------ public API keys
  const mkKey = async (name, scopes) => {
    const r = await api('POST', '/api/public-api-keys', { token: A.token, body: { name, scopes } });
    if (r.status === 503) skip('API_KEY_PEPPER not configured on the server (503)');
    expectStatus(r, 201, 'POST /api/public-api-keys');
    const secret = remember(r.json?.secret);
    expect(secret && secret.startsWith('sk_live_'), 'secret missing or without sk_live_ prefix');
    const id = r.json?.key?.id;
    onCleanup(`revoke key ${name}`, () => api('DELETE', `/api/public-api-keys/${id}`, { token: A.token }));
    return { id, secret, raw: r.json };
  };
  await check('public API: key lifecycle (secret once, list, scope 403, revoke 401)', async () => {
    const k = await mkKey(`smoke-api read ${rnd()}`, ['read:contacts']);
    expect(!('key_hash' in (k.raw.key || {})), 'create response leaks key_hash');
    const list = await api('GET', '/api/public-api-keys', { token: A.token });
    expectStatus(list, 200, 'GET key list');
    expect(!JSON.stringify(list.json).includes(k.secret), 'secret is visible again in key list');
    expect(!JSON.stringify(list.json).includes('key_hash'), 'key list exposes key_hash');
    const ok = await api('GET', '/api/v1/contacts?limit=1', { headers: { Authorization: `Bearer ${k.secret}` } });
    expectStatus(ok, 200, 'GET /api/v1/contacts');
    expect(Array.isArray(ok.json?.data), 'v1 list has no data[]');
    expect(ok.headers.get('x-ratelimit-limit'), 'missing X-RateLimit-Limit header');
    const wrong = await api('POST', '/api/v1/contacts', {
      headers: { Authorization: `Bearer ${k.secret}` },
      body: { first_name: 'No', last_name: 'Scope' },
    });
    expectStatus(wrong, 403, 'POST with read-only key');
    expect(wrong.json?.error?.code === 'insufficient_scope' || wrong.json?.code === 'insufficient_scope' || wrong.status === 403, 'unexpected 403 body');
    const bad = await api('GET', '/api/v1/contacts', { headers: { Authorization: 'Bearer sk_live_' + 'x'.repeat(43) } });
    expectStatus(bad, 401, 'GET with unknown key');
    expectStatus(await api('GET', '/api/v1/contacts'), 401, 'GET v1 without key');
    expectStatus(await api('DELETE', `/api/public-api-keys/${k.id}`, { token: A.token }), 204, 'revoke key');
    expectStatus(await api('GET', '/api/v1/contacts', { headers: { Authorization: `Bearer ${k.secret}` } }), 401, 'GET with revoked key');
  });
  await check('public API: write key creates and deletes a contact', async () => {
    const k = await mkKey(`smoke-api write ${rnd()}`, ['read:contacts', 'write:contacts']);
    const h = { Authorization: `Bearer ${k.secret}` };
    const c = await api('POST', '/api/v1/contacts', { headers: h, body: { first_name: 'Smoke', last_name: `Api${rnd()}`, email: `smoke-${rnd()}@example.com` } });
    expectStatus(c, 201, 'POST /api/v1/contacts');
    const id = c.json?.data?.id;
    expect(id !== undefined, 'created contact has no id');
    state.v1ContactId = id;
    const g = await api('GET', `/api/v1/contacts/${id}`, { headers: h });
    expectStatus(g, 200, 'GET contact');
    expectStatus(await api('POST', '/api/v1/contacts', { headers: h, body: { bogus_field: 1 } }), 400, 'validation error');
    expectStatus(await api('DELETE', `/api/v1/contacts/${id}`, { headers: h }), 204, 'DELETE contact');
    expectStatus(await api('GET', `/api/v1/contacts/${id}`, { headers: h }), 404, 'GET deleted contact');
  });
  await check('public API: 429 after >120 requests/min (SMOKE_RATE_LIMIT=1)', async () => {
    if (!RATE) skip('set SMOKE_RATE_LIMIT=1 to run (sends ~125 requests)');
    const k = await mkKey(`smoke-api rate ${rnd()}`, ['read:contacts']);
    const h = { Authorization: `Bearer ${k.secret}` };
    let got429 = false;
    let retryAfter = null;
    for (let i = 0; i < 130 && !got429; i += 10) {
      const batch = await Promise.all(Array.from({ length: 10 }, () => api('GET', '/api/v1/contacts?limit=1', { headers: h })));
      const hit = batch.find((r) => r.status === 429);
      if (hit) {
        got429 = true;
        retryAfter = hit.headers.get('retry-after');
      }
    }
    expect(got429, 'no 429 after 130 requests (rate limit not enforced, or window rolled over; retry once)');
    return `Retry-After=${retryAfter}`;
  });

  // ------------------------------------------------------------ outbound webhooks
  await check('webhooks: CRUD, secret shown once, delivery row + signature helper', async () => {
    const url = `https://example.com/smoke-hook-${rnd()}`;
    const c = await api('POST', '/api/outbound-webhooks', { token: A.token, body: { url, events: ['contact.created'] } });
    expectStatus(c, 201, 'POST webhook');
    const id = c.json.webhook.id;
    const secret = remember(c.json.secret);
    expect(secret && secret.length >= 16, 'no signing secret returned on create');
    onCleanup('delete webhook', () => api('DELETE', `/api/outbound-webhooks/${id}`, { token: A.token }));
    const list = await api('GET', '/api/outbound-webhooks', { token: A.token });
    expectStatus(list, 200, 'GET webhooks');
    const row = (list.json.webhooks || []).find((w) => w.id === id);
    expect(row, 'webhook not listed');
    expect(!('secret' in row) && !JSON.stringify(list.json).includes(secret), 'list leaks the signing secret');
    expectStatus(await api('POST', '/api/outbound-webhooks', { token: A.token, body: { url: 'http://example.com/insecure' } }), 400, 'http:// url rejected');
    expectStatus(await api('POST', '/api/outbound-webhooks', { token: A.token, body: { url: 'https://localhost/x' } }), 400, 'localhost url rejected');
    const p = await api('PATCH', `/api/outbound-webhooks/${id}`, { token: A.token, body: { active: true, rotateSecret: true } });
    expectStatus(p, 200, 'PATCH webhook rotate');
    const secret2 = remember(p.json?.secret);
    expect(secret2 && secret2 !== secret, 'rotateSecret did not return a new secret');

    // Trigger a contact.created event through the public API; the DB trigger enqueues a delivery row.
    const k = await mkKey(`smoke-api hook ${rnd()}`, ['write:contacts']);
    const h = { Authorization: `Bearer ${k.secret}` };
    const cc = await api('POST', '/api/v1/contacts', { headers: h, body: { first_name: 'Hook', last_name: `Smoke${rnd()}` } });
    expectStatus(cc, 201, 'POST contact for delivery');
    const contactId = cc.json?.data?.id;
    onCleanup('delete hook contact', () => api('DELETE', `/api/v1/contacts/${contactId}`, { headers: h }));
    let found = null;
    for (let i = 0; i < 5 && !found; i++) {
      const d = await api('GET', `/api/outbound-webhooks/${id}/deliveries`, { token: A.token });
      expectStatus(d, 200, 'GET deliveries');
      found = (d.json.deliveries || []).find((x) => x.event === 'contact.created');
      if (!found) await new Promise((r) => setTimeout(r, 1000));
    }
    expect(found, 'no contact.created delivery row appeared');

    // Signature recomputation helper: the worker signs `${ts}.${body}`; prove sign/verify agree and reject tampering.
    const ts = Math.floor(Date.now() / 1000);
    const body = JSON.stringify({ id: found.id, event: 'contact.created', data: { smoke: true } });
    const sig = signPayload(secret2, ts, body);
    expect(/^sha256=[0-9a-f]{64}$/.test(sig), 'signature has unexpected format');
    expect(verifySignature(secret2, ts, body, sig), 'signature verification failed');
    expect(!verifySignature(secret2, ts, body + ' ', sig), 'tampered body verified');
    expect(!verifySignature(secret, ts, body, sig), 'old (rotated) secret verified');
    expect(!sig.includes(secret2), 'signature contains the secret');

    expectStatus(await api('DELETE', `/api/outbound-webhooks/${id}`, { token: A.token }), 204, 'DELETE webhook');
    return `delivery status=${found.status}`;
  });
  await check('webhooks: user B cannot list/patch/delete A\'s webhook', async () => {
    needB();
    const c = await api('POST', '/api/outbound-webhooks', { token: A.token, body: { url: `https://example.com/smoke-priv-${rnd()}` } });
    expectStatus(c, 201, 'POST webhook (A)');
    const id = c.json.webhook.id;
    onCleanup('delete private webhook', () => api('DELETE', `/api/outbound-webhooks/${id}`, { token: A.token }));
    const lb = await api('GET', '/api/outbound-webhooks', { token: B.token });
    expectStatus(lb, 200, 'B list webhooks');
    expect(!(lb.json.webhooks || []).some((w) => w.id === id), 'A\'s webhook visible to B');
    expectStatus(await api('PATCH', `/api/outbound-webhooks/${id}`, { token: B.token, body: { active: false } }), 404, 'B PATCH');
    expectStatus(await api('GET', `/api/outbound-webhooks/${id}/deliveries`, { token: B.token }), 404, 'B deliveries');
    await api('DELETE', `/api/outbound-webhooks/${id}`, { token: B.token });
    const mine = await api('GET', '/api/outbound-webhooks', { token: A.token });
    expect((mine.json.webhooks || []).some((w) => w.id === id), 'B deleted A\'s webhook');
  });

  // ------------------------------------------------------------ AI (opt-in)
  await check('assistants: two-turn conversation keeps context (SMOKE_AI=1)', async () => {
    if (!AI) skip('set SMOKE_AI=1 (needs an OpenAI key saved for user A)');
    const a = await api('POST', '/api/assistants/create', { token: A.token, body: { name: `smoke-api ${rnd()}`, instructions: 'You are terse. Answer in one short sentence.' } });
    expectStatus(a, 200, 'create assistant');
    const assistantId = a.json.assistant.id;
    onCleanup('delete assistant', () => api('DELETE', `/api/assistants/${assistantId}`, { token: A.token }));
    const t1 = await api('POST', '/api/assistants/chat', { token: A.token, body: { assistantId, message: 'Remember the secret word "kumquat". Reply with OK.' } });
    if (t1.status === 400 && /api key/i.test(t1.json?.error || '')) skip('no OpenAI key configured for user A');
    expectStatus(t1, 200, 'chat turn 1');
    expect(t1.json.threadId && t1.json.message, 'turn 1 returned no thread/message');
    const t2 = await api('POST', '/api/assistants/chat', { token: A.token, body: { threadId: t1.json.threadId, message: 'What was the secret word?' } });
    expectStatus(t2, 200, 'chat turn 2');
    expect(t2.json.threadId === t1.json.threadId, 'turn 2 used a different thread');
    expect(/kumquat/i.test(t2.json.message || ''), `turn 2 forgot the word: "${(t2.json.message || '').slice(0, 80)}"`);
    const msgs = await api('GET', `/api/assistants/threads/${t1.json.threadId}/messages`, { token: A.token });
    expectStatus(msgs, 200, 'GET thread messages');
    expect((msgs.json.messages || []).length === 4, `expected 4 stored messages, got ${(msgs.json.messages || []).length}`);
    if (B) expectStatus(await api('GET', `/api/assistants/threads/${t1.json.threadId}/messages`, { token: B.token }), 404, 'B reads A thread');
  });
  await check('ai jobs: create + poll until done (SMOKE_AI=1)', async () => {
    if (!AI) skip('set SMOKE_AI=1 (needs OpenAI key + AI_JOBS_SECRET + URL on the site)');
    const r = await api('POST', '/api/ai/jobs', { token: A.token, body: { kind: 'batch_respond', input: { prompts: ['Reply with the single word: pong'], maxOutputTokens: 50 } } });
    if (r.status === 503) skip(`AI jobs not configured: ${redact(r.json?.error || '')}`);
    if (r.status === 403) skip('user A lacks the AI_TOOLS entitlement');
    expectStatus(r, 202, 'POST /api/ai/jobs');
    const id = r.json.id;
    expect(UUID.test(id || ''), 'job id is not a uuid');
    if (B) expectStatus(await api('GET', `/api/ai/jobs/${id}`, { token: B.token }), 404, 'B reads A job');
    const deadline = Date.now() + 90_000;
    let job;
    while (Date.now() < deadline) {
      const g = await api('GET', `/api/ai/jobs/${id}`, { token: A.token });
      expectStatus(g, 200, 'GET job');
      job = g.json;
      if (job.status === 'done' || job.status === 'failed') break;
      await new Promise((res) => setTimeout(res, 3000));
    }
    expect(job?.status === 'done', `job ended as "${job?.status}" ${redact(job?.error || '')}`);
    return 'job done';
  });
}

async function runCleanups() {
  // best-effort: smoke workflow task, then registered cleanups in reverse
  try {
    if (A) {
      const t = await api('GET', '/api/tasks', { token: A.token });
      const rows = Array.isArray(t.json) ? t.json : t.json?.tasks || [];
      for (const task of rows.filter((x) => x.title === 'smoke-api task')) {
        await api('DELETE', `/api/tasks/${task.id}`, { token: A.token });
      }
    }
  } catch {
    /* ignore */
  }
  for (const c of cleanups.reverse()) {
    try {
      await c.fn();
    } catch {
      /* ignore */
    }
  }
}

try {
  await main();
} catch (e) {
  results.push({ name: 'runner', status: 'FAIL', detail: redact(e?.message || e) });
} finally {
  await runCleanups();
}

const w = Math.max(...results.map((r) => r.name.length), 10);
console.log(`\nsmoke-api against ${API}\n`);
for (const r of results) {
  console.log(`${r.status.padEnd(4)}  ${r.name.padEnd(w)}${r.detail ? `  ${r.detail}` : ''}`);
}
const count = (s) => results.filter((r) => r.status === s).length;
console.log(`\n${count('PASS')} passed, ${count('FAIL')} failed, ${count('SKIP')} skipped`);
process.exit(count('FAIL') ? 1 : 0);
