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
vi.mock('../../supabase', () => ({ supabase: { from: (t: string) => builder(t), rpc: () => Promise.resolve(rpcResult) } }));
vi.mock('../auth', () => ({
  requireAuth: () => (req: any, res: any, next: any) => {
    if (req.headers['x-anon']) return res.status(401).json({ error: 'Unauthorized' });
    req.userId = 'user-123';
    next();
  },
}));
const runWorkflow = vi.fn();
const resumeWait = vi.fn();
vi.mock('@smartcrm/workflows', async () => {
  const cron = await import('../../../packages/workflows/src/engine/cron');
  const ssrf = await import('../../../packages/workflows/src/security/ssrf');
  return {
    runWorkflow: (...a: unknown[]) => runWorkflow(...a),
    resumeWait: (...a: unknown[]) => resumeWait(...a),
    resumeWaitersForKeys: vi.fn().mockResolvedValue(1),
    validateFormSubmission: (form: any, data: any) =>
      data?.email ? { ok: true, values: { email: data.email } } : { ok: false, error: 'Field "email" is required' },
    isValidCron: cron.isValidCron,
    nextCronRun: cron.nextCronRun,
    assertPublicHttps: ssrf.assertPublicHttps,
  };
});

import { registerAutomationRoutes, checkHookBody, memoryRateLimit, HOOK_MAX_BODY_BYTES } from '../automation';

const WF = '11111111-1111-1111-1111-111111111111';
const TOKEN = 'a'.repeat(48);
const app = () => {
  const a = express();
  a.use(express.json({ limit: '5mb' }));
  registerAutomationRoutes(a as any);
  return a;
};
beforeEach(() => {
  calls.length = 0;
  for (const k of Object.keys(results)) delete results[k];
  rpcResult = { data: 1, error: null };
  runWorkflow.mockReset();
  resumeWait.mockReset();
});

describe('hook helpers', () => {
  it('limits body size and normalises arrays', () => {
    expect(checkHookBody(String(HOOK_MAX_BODY_BYTES + 1), {}).ok).toBe(false);
    expect(checkHookBody(undefined, { x: 'y'.repeat(HOOK_MAX_BODY_BYTES) }).ok).toBe(false);
    expect(checkHookBody(undefined, [1, 2])).toEqual({ ok: true, data: { items: [1, 2] } });
  });
  it('in-memory limiter counts per window', () => {
    const now = 1_700_000_000_000;
    expect(memoryRateLimit('k', 2, now)).toBe(true);
    expect(memoryRateLimit('k', 2, now)).toBe(true);
    expect(memoryRateLimit('k', 2, now)).toBe(false);
    expect(memoryRateLimit('k', 2, now + 61_000)).toBe(true);
  });
});

describe('inbound webhook trigger', () => {
  it('404s for malformed or unknown tokens and non-WEBHOOK workflows', async () => {
    const a = app();
    expect((await request(a).post('/api/hooks/workflows/short').send({})).status).toBe(404);
    results.workflows = [{ data: null, error: null }];
    expect((await request(a).post(`/api/hooks/workflows/${TOKEN}`).send({})).status).toBe(404);
    results.workflows = [{ data: { id: WF, user_id: 'u', enabled: true, trigger_type: 'MANUAL' }, error: null }];
    expect((await request(a).post(`/api/hooks/workflows/${TOKEN}`).send({})).status).toBe(404);
    expect(runWorkflow).not.toHaveBeenCalled();
  });

  it('runs the workflow as its owner without any session', async () => {
    results.workflows = [{ data: { id: WF, user_id: 'owner-9', enabled: true, trigger_type: 'WEBHOOK' }, error: null }];
    runWorkflow.mockResolvedValue({ id: 'run-1', status: 'completed' });
    const res = await request(app()).post(`/api/hooks/workflows/${TOKEN}`).send({ hello: 'world' });
    expect(res.status).toBe(202);
    expect(res.body).toEqual({ runId: 'run-1', status: 'completed' });
    expect(runWorkflow.mock.calls[0][0]).toMatchObject({ workflowId: WF, userId: 'owner-9', triggerType: 'WEBHOOK', triggerData: { hello: 'world' } });
  });

  it('413 on oversized bodies, 429 when the DB counter is exceeded', async () => {
    const a = app();
    const big = await request(a).post(`/api/hooks/workflows/${TOKEN}`).send({ x: 'y'.repeat(HOOK_MAX_BODY_BYTES + 10) });
    expect(big.status).toBe(413);
    results.workflows = [{ data: { id: '22222222-2222-2222-2222-222222222222', user_id: 'o', enabled: true, trigger_type: 'WEBHOOK' }, error: null }];
    rpcResult = { data: 10_000, error: null };
    const limited = await request(a).post(`/api/hooks/workflows/${TOKEN}`).send({});
    expect(limited.status).toBe(429);
    expect(runWorkflow).not.toHaveBeenCalled();
  });
});

describe('triggers & versions', () => {
  it('validates cron and sets next_run_at', async () => {
    results.workflows = [{ data: { id: WF, user_id: 'user-123' }, error: null }, { data: { schedule_cron: '*/5 * * * *', next_run_at: 'x' }, error: null }];
    const a = app();
    const ok = await request(a).put(`/api/workflows/${WF}/triggers`).send({ scheduleCron: '*/5 * * * *' });
    expect(ok.status).toBe(200);
    const upd = calls.find((c) => c.op === 'update')!.args[0] as any;
    expect(upd.schedule_cron).toBe('*/5 * * * *');
    expect(upd.next_run_at).toBeTruthy();
    results.workflows = [{ data: { id: WF, user_id: 'user-123' }, error: null }];
    expect((await request(a).put(`/api/workflows/${WF}/triggers`).send({ scheduleCron: 'bad cron' })).status).toBe(400);
  });

  it('is owner-scoped: someone elses workflow is a 404', async () => {
    results.workflows = [{ data: null, error: null }];
    const res = await request(app()).get(`/api/workflows/${WF}/versions`);
    expect(res.status).toBe(404);
    expect(calls.some((c) => c.table === 'workflows' && c.op === 'eq' && c.args[0] === 'user_id' && c.args[1] === 'user-123')).toBe(true);
  });

  it('publish snapshots steps, archives the previous active version and sets active_version_id', async () => {
    results.workflows = [{ data: { id: WF, user_id: 'user-123' }, error: null }];
    results.workflow_actions = [{ data: [{ id: 's1', action_type: 'DELAY', config: { duration: 1 }, order_index: 1 }], error: null }];
    results.workflow_versions = [
      { data: [{ version: 2 }], error: null },
      { data: { id: 'v3', version: 3, status: 'draft' }, error: null },
      { data: null, error: null },
    ];
    const res = await request(app()).post(`/api/workflows/${WF}/publish`).send();
    expect(res.status).toBe(201);
    const insert = calls.find((c) => c.table === 'workflow_versions' && c.op === 'insert')!.args[0] as any;
    expect(insert.version).toBe(3);
    expect(insert.graph.steps[0]).toMatchObject({ id: 's1', actionType: 'DELAY' });
    expect(calls.some((c) => c.table === 'workflows' && c.op === 'update' && (c.args[0] as any).active_version_id === 'v3')).toBe(true);
  });

  it('rejects malformed steps for drafts', async () => {
    results.workflows = [{ data: { id: WF, user_id: 'user-123' }, error: null }];
    const res = await request(app()).post(`/api/workflows/${WF}/versions`).send({ steps: [{ nope: 1 }] });
    expect(res.status).toBe(400);
  });
});

describe('resume', () => {
  const RUN = '33333333-3333-3333-3333-333333333333';
  it('resumes a form wait after validation', async () => {
    results.workflow_runs = [{ data: { id: RUN, workflow_id: WF, status: 'waiting' }, error: null }];
    results.workflows = [{ data: { id: WF }, error: null }];
    results.workflow_run_waits = [{ data: { id: 'w1', kind: 'form', payload: { form: { fields: [{ name: 'email', required: true }] } } }, error: null }];
    resumeWait.mockResolvedValue({ id: RUN, status: 'completed' });
    const a = app();
    expect((await request(a).post(`/api/workflows/runs/${RUN}/resume`).send({ data: {} })).status).toBe(400);
    const ok = await request(a).post(`/api/workflows/runs/${RUN}/resume`).send({ data: { email: 'a@b.co' } });
    expect(ok.status).toBe(200);
    expect(resumeWait).toHaveBeenCalledWith('w1', { email: 'a@b.co' });
  });
  it('is owner-scoped', async () => {
    results.workflow_runs = [{ data: { id: RUN, workflow_id: WF, status: 'waiting' }, error: null }];
    results.workflows = [{ data: null, error: null }];
    expect((await request(app()).post(`/api/workflows/runs/${RUN}/resume`).send({ data: { email: 'x' } })).status).toBe(404);
    expect(resumeWait).not.toHaveBeenCalled();
  });
});

describe('outbound webhooks', () => {
  it('requires auth', async () => {
    expect((await request(app()).get('/api/outbound-webhooks').set('x-anon', '1')).status).toBe(401);
  });
  it('rejects http / private urls and unknown events', async () => {
    const a = app();
    expect((await request(a).post('/api/outbound-webhooks').send({ url: 'http://example.com' })).status).toBe(400);
    expect((await request(a).post('/api/outbound-webhooks').send({ url: 'https://127.0.0.1/x' })).status).toBe(400);
    expect((await request(a).post('/api/outbound-webhooks').send({ url: 'https://example.com/x', events: ['user.deleted'] })).status).toBe(400);
  });
  it('creates with a generated secret returned once and never listed', async () => {
    results.webhooks = [{ count: 0, data: null, error: null }, { data: { id: 'h1', url: 'https://example.com/x', events: ['*'], active: true }, error: null }];
    const res = await request(app()).post('/api/outbound-webhooks').send({ url: 'https://example.com/x' });
    expect(res.status).toBe(201);
    expect(res.body.secret).toMatch(/^whsec_[a-f0-9]{48}$/);
    expect(res.body.webhook.secret).toBeUndefined();
    const sel = calls.filter((c) => c.table === 'webhooks' && c.op === 'select').map((c) => String(c.args[0]));
    expect(sel.every((s) => !s.includes('secret'))).toBe(true);
  });
});
