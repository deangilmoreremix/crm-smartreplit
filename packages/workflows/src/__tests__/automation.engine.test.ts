import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WorkflowEngine, type WorkflowStep } from '../engine/WorkflowEngine';
import { registerAllActions, validateFormSubmission } from '../actions';
import { assertPublicHttps, assertPublicResolved, isPrivateAddress } from '../security/ssrf';

vi.mock('../supabase', () => ({ supabase: { from: () => ({}) } }));

const ctx = (variables: Record<string, unknown> = {}) => ({
  workflowId: 'wf',
  runId: 'run',
  triggerType: 'MANUAL',
  userId: 'u1',
  timestamp: new Date(),
  variables,
});
const step = (id: string, actionType: string, configuration: any, order: number): WorkflowStep => ({
  id,
  actionType,
  configuration,
  order,
});

describe('engine control flow', () => {
  let engine: WorkflowEngine;
  const calls: any[] = [];
  beforeEach(() => {
    engine = new WorkflowEngine();
    registerAllActions(engine);
    calls.length = 0;
    engine.registerAction('ECHO', async (_c, cfg) => {
      calls.push(cfg);
      return { success: true, output: { value: cfg.value } };
    });
  });

  it('interpolates trigger and previous step outputs into config', async () => {
    const r = await engine.executeWorkflow(
      [
        step('a', 'ECHO', { value: 'hi {{trigger.name}}' }, 1),
        step('b', 'ECHO', { value: '{{steps.a.output.value}}!' }, 2),
      ],
      ctx({ name: 'Ann' })
    );
    expect(r.status).toBe('completed');
    expect(calls.map((c) => c.value)).toEqual(['hi Ann', 'hi Ann!']);
  });

  it('IF_ELSE runs only the matching branch', async () => {
    const wf = [
      step('c', 'IF_ELSE', {
        condition: { field: 'trigger.amount', operator: 'greater_than', value: 100 },
        then: [step('t', 'ECHO', { value: 'big' }, 1)],
        else: [step('e', 'ECHO', { value: 'small' }, 1)],
      }, 1),
    ];
    await engine.executeWorkflow(wf, ctx({ amount: 500 }));
    await engine.executeWorkflow(wf, ctx({ amount: 5 }));
    expect(calls.map((c) => c.value)).toEqual(['big', 'small']);
  });

  it('FILTER halts the run without failing it', async () => {
    const r = await engine.executeWorkflow(
      [
        step('f', 'FILTER', { condition: { field: 'record.status', operator: 'equals', value: 'open' } }, 1),
        step('x', 'ECHO', { value: 'after' }, 2),
      ],
      ctx({ status: 'closed' })
    );
    expect(r.status).toBe('filtered');
    expect(r.success).toBe(true);
    expect(calls).toHaveLength(0);
  });

  it('ITERATOR runs nested steps per item with item/index scope', async () => {
    const r = await engine.executeWorkflow(
      [step('it', 'ITERATOR', { items: '{{trigger.list}}', steps: [step('n', 'ECHO', { value: '{{item.id}}#{{index}}' }, 1)] }, 1)],
      ctx({ list: [{ id: 'a' }, { id: 'b' }] })
    );
    expect(r.status).toBe('completed');
    expect(calls.map((c) => c.value)).toEqual(['a#0', 'b#1']);
    expect((r.results.it.output as any).count).toBe(2);
  });

  it('ITERATOR is bounded to 100 items and requires an array', async () => {
    const big = Array.from({ length: 101 }, (_, i) => i);
    const r = await engine.executeWorkflow([step('it', 'ITERATOR', { items: '{{trigger.l}}', steps: [] }, 1)], ctx({ l: big }));
    expect(r.status).toBe('failed');
    expect(r.results.it.error).toContain('100');
    const r2 = await engine.executeWorkflow([step('it', 'ITERATOR', { items: 'nope', steps: [] }, 1)], ctx());
    expect(r2.results.it.error).toContain('array');
  });

  it('a failing nested step fails the run', async () => {
    const r = await engine.executeWorkflow(
      [step('it', 'ITERATOR', { items: [1], steps: [step('bad', 'NOPE', {}, 1)] }, 1)],
      ctx()
    );
    expect(r.status).toBe('failed');
  });

  it('DELAY <= 20s runs inline; longer pauses with a resume time', async () => {
    const short = await engine.executeWorkflow([step('d', 'DELAY', { duration: 1, unit: 'ms' }, 1)], ctx());
    expect(short.status).toBe('completed');
    const long = await engine.executeWorkflow(
      [step('d', 'DELAY', { duration: 5, unit: 'minutes' }, 1), step('x', 'ECHO', { value: 'later' }, 2)],
      ctx()
    );
    expect(long.status).toBe('waiting');
    expect(long.wait).toMatchObject({ kind: 'delay', stepId: 'd' });
    expect(calls).toHaveLength(0);
  });

  it('resumes after a paused step with prior results and the resume output', async () => {
    const wf = [
      step('a', 'ECHO', { value: 'one' }, 1),
      step('f', 'FORM', { fields: [{ name: 'email', required: true }] }, 2),
      step('b', 'ECHO', { value: '{{steps.f.output.email}}/{{steps.a.output.value}}' }, 3),
    ];
    const first = await engine.executeWorkflow(wf, ctx());
    expect(first.status).toBe('waiting');
    expect(first.wait).toMatchObject({ kind: 'form' });
    expect(calls).toHaveLength(1);
    const second = await engine.executeWorkflow(wf, ctx(), {
      resumeFromStepId: 'f',
      priorResults: first.results,
      resumeOutput: { email: 'z@z.co' },
    });
    expect(second.status).toBe('completed');
    expect(calls[1].value).toBe('z@z.co/one');
  });

  it('WAIT_FOR_EVENT yields an event key (with wildcard object)', async () => {
    const r = await engine.executeWorkflow(
      [step('w', 'WAIT_FOR_EVENT', { event: 'record_created', objectType: 'deals', match: { stage: 'won' }, timeoutMinutes: 60 }, 1)],
      ctx()
    );
    expect(r.wait).toMatchObject({ kind: 'event', eventKey: 'RECORD_CREATED:deals', match: { stage: 'won' } });
    expect((r.wait as any).resumeAt).toBeTruthy();
  });

  it('pausing steps inside nested blocks pause the run with a resume cursor', async () => {
    const r = await engine.executeWorkflow(
      [step('it', 'ITERATOR', { items: [1], steps: [step('d', 'DELAY', { duration: 5, unit: 'minutes' }, 1)] }, 1)],
      ctx()
    );
    expect(r.status).toBe('waiting');
    expect(r.cursor).toMatchObject([{ kind: 'iter', stepId: 'it', index: 0 }]);
  });

  it('validates form submissions', () => {
    const form = { fields: [{ name: 'a', required: true }, { name: 'b' }] };
    expect(validateFormSubmission(form, {}).ok).toBe(false);
    expect(validateFormSubmission(form, { a: 'x', extra: 1 })).toEqual({ ok: true, values: { a: 'x' } });
    expect(validateFormSubmission(form, { a: { o: 1 } }).ok).toBe(false);
  });
});

describe('new actions', () => {
  const fetchMock = vi.fn();
  let engine: WorkflowEngine;
  beforeEach(() => {
    engine = new WorkflowEngine();
    registerAllActions(engine);
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('HTTP_REQUEST templates headers and a JSON string body safely', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, text: async () => 'ok' });
    const r = await engine.executeWorkflow(
      [step('h', 'HTTP_REQUEST', {
        url: 'https://example.com/x',
        headers: { 'X-Name': '{{trigger.name}}', Host: 'evil' },
        body: '{"q":"{{trigger.q}}"}',
      }, 1)],
      ctx({ name: 'Ann', q: 'a"b' })
    );
    expect(r.status).toBe('completed');
    const init = fetchMock.mock.calls[0][1];
    expect(init.headers['X-Name']).toBe('Ann');
    expect(init.headers.Host).toBeUndefined();
    expect(JSON.parse(init.body)).toEqual({ q: 'a"b' });
  });

  it('HTTP_REQUEST keeps the SSRF guard', async () => {
    const r = await engine.executeWorkflow([step('h', 'HTTP_REQUEST', { url: 'https://169.254.169.254/latest' }, 1)], ctx());
    expect(r.status).toBe('failed');
    expect(r.results.h.error).toContain('private');
  });

  it('AI_AGENT rejects tools and calls OpenAI Responses otherwise', async () => {
    process.env.OPENAI_API_KEY = 'sk-test';
    const bad = await engine.executeWorkflow([step('a', 'AI_AGENT', { prompt: 'x', tools: [{ type: 'web_search' }] }, 1)], ctx());
    expect(bad.status).toBe('failed');
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ output_text: '{"a":1}', id: 'r1', model: 'm' }) });
    const ok = await engine.executeWorkflow([step('a', 'AI_AGENT', { prompt: 'Hi {{trigger.n}}', tools: 'none', jsonOutput: true }, 1)], ctx({ n: 'Z' }));
    expect(ok.status).toBe('completed');
    expect((ok.results.a.output as any).json).toEqual({ a: 1 });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).input).toBe('Hi Z');
    delete process.env.OPENAI_API_KEY;
  });

  it('unsupported actions still fail loudly', async () => {
    const r = await engine.executeWorkflow([step('s', 'SEND_SMS', { to: '1', message: 'x' }, 1)], ctx());
    expect(r.status).toBe('failed');
    expect(r.results.s.error).toContain('SMS not configured');
  });
});

describe('ssrf guard', () => {
  it('flags private/special addresses', () => {
    for (const ip of ['127.0.0.1', '10.1.2.3', '172.20.0.1', '192.168.1.1', '169.254.169.254', '100.64.0.1', '0.0.0.0', '::1', 'fe80::1', 'fd00::1', '::ffff:127.0.0.1', '::ffff:7f00:1']) {
      expect(isPrivateAddress(ip), ip).toBe(true);
    }
    for (const ip of ['8.8.8.8', '1.1.1.1', '2606:4700:4700::1111']) expect(isPrivateAddress(ip), ip).toBe(false);
  });
  it('rejects http, localhost and internal names', () => {
    expect(() => assertPublicHttps('http://example.com')).toThrow('https');
    expect(() => assertPublicHttps('https://localhost/x')).toThrow('private');
    expect(() => assertPublicHttps('https://svc.internal/x')).toThrow('private');
    expect(() => assertPublicHttps('https://[::1]/x')).toThrow('private');
    expect(() => assertPublicHttps('https://example.com/x')).not.toThrow();
  });
  it('rejects hosts that resolve to private addresses', async () => {
    await expect(assertPublicResolved('https://evil.example', async () => [{ address: '10.0.0.5' }])).rejects.toThrow('private');
    await expect(assertPublicResolved('https://ok.example', async () => [{ address: '8.8.8.8' }, { address: '10.0.0.5' }])).rejects.toThrow('private');
    await expect(assertPublicResolved('https://ok.example', async () => [{ address: '8.8.8.8' }])).resolves.toBeInstanceOf(URL);
  });
});
