import { describe, it, expect, vi } from 'vitest';

vi.mock('../supabase', () => ({ supabase: null }));

import { failStaleRuns, runSchedulerTick, STALE_RUN_ERROR } from './workflowScheduler';
import { pruneWebhookDeliveries } from './webhookDelivery';

/** Chainable thenable fake recording every query; results[table] is consumed per awaited query. */
function fakeDb(results: Record<string, any[]> = {}) {
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
              const val = (q.length > 1 ? q.shift() : q[0]) ?? { data: [], error: null };
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
const op = (c: { ops: Array<[string, unknown[]]> }, name: string) => c.ops.filter(([o]) => o === name).map(([, a]) => a);

describe('webhook delivery retention', () => {
  const now = new Date('2026-11-10T10:00:00Z');

  it('deletes success rows older than 30d and failed rows older than 90d', async () => {
    const { db, calls } = fakeDb({ webhook_deliveries: [ok([{ id: 'a' }, { id: 'b' }]), ok([{ id: 'c' }])] });
    expect(await pruneWebhookDeliveries(db, now)).toEqual({ success: 2, failed: 1 });
    const [s, f] = calls;
    expect(op(s, 'delete')).toHaveLength(1);
    expect(op(s, 'eq')).toEqual([['status', 'success']]);
    expect(op(s, 'lt')).toEqual([['created_at', '2026-10-11T10:00:00.000Z']]);
    expect(op(f, 'eq')).toEqual([['status', 'failed']]);
    expect(op(f, 'lt')).toEqual([['created_at', '2026-08-12T10:00:00.000Z']]);
  });

  it('never touches pending rows and surfaces errors', async () => {
    const { db, calls } = fakeDb({ webhook_deliveries: [{ data: null, error: { message: 'nope' } }] });
    await expect(pruneWebhookDeliveries(db, now)).rejects.toThrow('nope');
    expect(calls.flatMap((c) => op(c, 'eq')).some(([, v]) => v === 'pending')).toBe(false);
  });
});

describe('stale workflow run guard', () => {
  const now = new Date('2026-11-10T10:00:30Z');

  it("fails runs 'running' for more than 10 minutes", async () => {
    const { db, calls } = fakeDb({ workflow_run_waits: [ok([])], workflow_runs: [ok([{ id: 'r1' }, { id: 'r2' }])] });
    expect(await failStaleRuns(db, now)).toBe(2);
    const upd = calls.find((c) => c.table === 'workflow_runs')!;
    expect(op(upd, 'update')[0][0]).toEqual({
      status: 'failed',
      error: 'timed out (function limit)',
      finished_at: now.toISOString(),
    });
    expect(STALE_RUN_ERROR).toBe('timed out (function limit)');
    expect(op(upd, 'eq')).toEqual([['status', 'running']]);
    expect(op(upd, 'lt')).toEqual([['started_at', '2026-11-10T09:50:30.000Z']]);
    expect(op(upd, 'not')).toHaveLength(0);
  });

  it('skips runs that were resumed from a wait within the window', async () => {
    const { db, calls } = fakeDb({
      workflow_run_waits: [ok([{ run_id: 'live' }, { run_id: 'live' }])],
      workflow_runs: [ok([])],
    });
    await failStaleRuns(db, now);
    const upd = calls.find((c) => c.table === 'workflow_runs')!;
    expect(op(upd, 'not')).toEqual([['id', 'in', '(live)']]);
  });

  it('runs every scheduler tick and reports the count without breaking the tick', async () => {
    const { db } = fakeDb({ workflow_run_waits: [ok([])], workflow_runs: [ok([{ id: 'r1' }])] });
    const stats = await runSchedulerTick({ db, now: () => now, resumeDueWaits: vi.fn().mockResolvedValue(0) as any });
    expect(stats.staleRuns).toBe(1);

    const failing = fakeDb({ workflow_runs: [{ data: null, error: { message: 'db down' } }] });
    const s2 = await runSchedulerTick({ db: failing.db, now: () => now, resumeDueWaits: vi.fn().mockResolvedValue(0) as any });
    expect(s2.errors.join()).toContain('db down');
  });
});
