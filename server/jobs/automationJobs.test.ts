import { describe, it, expect, vi } from 'vitest';

vi.mock('../supabase', () => ({ supabase: null }));

import { computeNextRun, runSchedulerTick } from './workflowScheduler';
import { signPayload, backoffMs, attemptDelivery, nextState, runDeliveryTick, MAX_ATTEMPTS } from './webhookDelivery';
import { createHmac } from 'node:crypto';

/** Chainable thenable fake: results[table] is a queue consumed per awaited query. */
function fakeDb(results: Record<string, any[]>) {
  const calls: Array<{ table: string; ops: Array<[string, unknown[]]> }> = [];
  const db: any = {
    from: (table: string) => {
      const entry = { table, ops: [] as Array<[string, unknown[]]> };
      calls.push(entry);
      const b: any = new Proxy(
        {},
        {
          get: (_t, op: string) => {
            if (op === 'then') {
              const q = results[table] || [];
              const next = q.length > 1 ? q.shift() : q[0];
              const val = next ?? { data: [], error: null };
              return (res: any, rej: any) => Promise.resolve(val).then(res, rej);
            }
            return (...args: unknown[]) => {
              entry.ops.push([op, args]);
              return b;
            };
          },
        }
      );
      return b;
    },
  };
  return { db, calls };
}
const ok = (data: any) => ({ data, error: null });

describe('workflow scheduler', () => {
  const now = new Date('2026-11-10T10:00:30Z');

  it('computeNextRun handles invalid cron', () => {
    expect(computeNextRun('*/5 * * * *', now)).toBe('2026-11-10T10:05:00.000Z');
    expect(computeNextRun('nonsense', now)).toBeNull();
  });

  it('runs due workflows once, advancing next_run_at, and skips unclaimed rows', async () => {
    const { db, calls } = fakeDb({
      workflows: [
        ok([]), // init query
        ok([
          { id: 'w1', user_id: 'u1', schedule_cron: '*/5 * * * *', next_run_at: '2026-11-10T10:00:00Z' },
          { id: 'w2', user_id: 'u2', schedule_cron: '*/5 * * * *', next_run_at: '2026-11-10T10:00:00Z' },
        ]),
        ok([{ id: 'w1' }]), // claim w1 ok
        ok([]), // claim w2 lost the race
      ],
      workflow_event_queue: [ok([])],
    });
    const run = vi.fn().mockResolvedValue({});
    const stats = await runSchedulerTick({
      db,
      now: () => now,
      runWorkflow: run as any,
      resumeDueWaits: vi.fn().mockResolvedValue(2) as any,
    });
    expect(run).toHaveBeenCalledTimes(1);
    expect(run.mock.calls[0][0]).toMatchObject({ workflowId: 'w1', userId: 'u1', triggerType: 'SCHEDULED' });
    expect(stats).toMatchObject({ scheduledRuns: 1, resumedWaits: 2 });
    const claim = calls.find((c) => c.ops.some(([op, a]) => op === 'update' && (a[0] as any).next_run_at === '2026-11-10T10:05:00.000Z'));
    expect(claim).toBeTruthy();
  });

  it('initialises next_run_at for fresh schedules without running them', async () => {
    const { db } = fakeDb({
      workflows: [ok([{ id: 'w1', schedule_cron: '0 9 * * *' }]), ok(null), ok([])],
      workflow_event_queue: [ok([])],
    });
    const run = vi.fn();
    const stats = await runSchedulerTick({ db, now: () => now, runWorkflow: run as any, resumeDueWaits: vi.fn().mockResolvedValue(0) as any });
    expect(stats.initialized).toBe(1);
    expect(run).not.toHaveBeenCalled();
  });

  it('drains queued events through triggerWorkflowsForEvent and records failures', async () => {
    const { db } = fakeDb({
      workflows: [ok([]), ok([])],
      workflow_event_queue: [
        ok([
          { id: 'e1', user_id: 'u1', event_type: 'RECORD_CREATED', object_type: 'contacts', record_id: '5', data: { id: 5 } },
          { id: 'e2', user_id: 'u1', event_type: 'RECORD_UPDATED', object_type: 'deals', record_id: '6', data: {} },
        ]),
        ok([{ id: 'e1' }]),
        ok(null),
        ok([{ id: 'e2' }]),
        ok(null),
      ],
    });
    const trigger = vi.fn().mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('boom'));
    const stats = await runSchedulerTick({
      db, now: () => now, triggerWorkflowsForEvent: trigger as any, resumeDueWaits: vi.fn().mockResolvedValue(0) as any,
    });
    expect(trigger.mock.calls[0][0]).toMatchObject({ type: 'RECORD_CREATED', userId: 'u1', objectType: 'contacts', recordId: '5' });
    expect(stats.drainedEvents).toBe(1);
    expect(stats.errors.join()).toContain('boom');
  });
});

describe('webhook delivery', () => {
  it('signs timestamp.body with HMAC-SHA256', () => {
    const sig = signPayload('whsec_x', 1700000000, '{"a":1}');
    expect(sig).toBe('sha256=' + createHmac('sha256', 'whsec_x').update('1700000000.{"a":1}').digest('hex'));
    expect(signPayload('other', 1700000000, '{"a":1}')).not.toBe(sig);
    expect(signPayload('whsec_x', 1700000001, '{"a":1}')).not.toBe(sig);
  });

  it('backs off exponentially with a cap', () => {
    expect([1, 2, 3, 4, 5].map(backoffMs)).toEqual([30_000, 60_000, 120_000, 240_000, 480_000]);
    expect(backoffMs(30)).toBe(6 * 3600_000);
  });

  it('retries until MAX_ATTEMPTS then fails', () => {
    const now = new Date('2026-11-10T00:00:00Z');
    const retry = nextState({ ok: false, status: 500, error: 'HTTP 500' }, 2, now) as any;
    expect(retry.status).toBe('pending');
    expect(retry.next_attempt_at).toBe(new Date(now.getTime() + 60_000).toISOString());
    expect((nextState({ ok: false, error: 'x' }, MAX_ATTEMPTS, now) as any).status).toBe('failed');
    expect((nextState({ ok: true, status: 200, body: 'ok' }, 1, now) as any).status).toBe('success');
  });

  const publicLookup = async () => [{ address: '93.184.216.34' }];
  const delivery = { id: 'd1', event: 'contact.created', payload: { id: 'x', data: { a: 1 } } };

  it('POSTs a signed body without following redirects', async () => {
    const f = vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => 'fine' });
    const out = await attemptDelivery(delivery, { url: 'https://hooks.example.com/in', secret: 's3' }, {
      fetch: f as any, lookup: publicLookup, now: () => new Date(1700000000_000),
    });
    expect(out).toMatchObject({ ok: true, status: 200 });
    const [, init] = f.mock.calls[0];
    expect(init.redirect).toBe('error');
    expect(init.headers['X-SmartCRM-Signature']).toBe(signPayload('s3', 1700000000, init.body));
    expect(init.headers['X-SmartCRM-Event']).toBe('contact.created');
  });

  it('blocks SSRF targets before any request is made', async () => {
    const f = vi.fn();
    for (const url of ['http://example.com', 'https://127.0.0.1/x', 'https://169.254.169.254/', 'https://localhost/x']) {
      const out = await attemptDelivery(delivery, { url, secret: 's' }, { fetch: f as any, lookup: publicLookup });
      expect(out.ok, url).toBe(false);
    }
    const rebinding = await attemptDelivery(delivery, { url: 'https://evil.example/x', secret: 's' }, {
      fetch: f as any, lookup: async () => [{ address: '10.0.0.7' }],
    });
    expect(rebinding.error).toContain('private');
    expect(f).not.toHaveBeenCalled();
  });

  it('reports non-2xx and network errors as failures', async () => {
    const f500 = vi.fn().mockResolvedValue({ ok: false, status: 500, text: async () => 'bad' });
    expect(await attemptDelivery(delivery, { url: 'https://h.example/x', secret: 's' }, { fetch: f500 as any, lookup: publicLookup })).toMatchObject({ ok: false, status: 500 });
    const fErr = vi.fn().mockRejectedValue(new Error('ECONNRESET'));
    expect((await attemptDelivery(delivery, { url: 'https://h.example/x', secret: 's' }, { fetch: fErr as any, lookup: publicLookup })).error).toContain('ECONNRESET');
  });

  it('tick claims, delivers and updates the row', async () => {
    const { db, calls } = fakeDb({
      webhook_deliveries: [
        ok([{ id: 'd1', webhook_id: 'h1', event: 'deal.created', payload: {}, attempts: 0, next_attempt_at: '2026-11-10T00:00:00Z' }]),
        ok([{ id: 'd1' }]),
        ok(null),
      ],
      webhooks: [ok({ id: 'h1', url: 'https://h.example/x', secret: 's', active: true })],
    });
    const f = vi.fn().mockResolvedValue({ ok: true, status: 204, text: async () => '' });
    const stats = await runDeliveryTick(db, { fetch: f as any, lookup: publicLookup });
    expect(stats.delivered).toBe(1);
    const final = calls.filter((c) => c.table === 'webhook_deliveries').pop()!;
    expect(final.ops.find(([op]) => op === 'update')![1][0]).toMatchObject({ status: 'success', attempts: 1 });
  });
});
