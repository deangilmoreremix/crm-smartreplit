import { describe, it, expect, vi, beforeEach } from 'vitest';

// A fake drizzle `db`: every query is a chain that records its calls; awaiting a select yields the next queued rows.
const state: { db: any; selects: any[][]; ops: any[] } = { db: null, selects: [], ops: [] };

function makeDb() {
  const chain = (kind: string) => {
    const c: any = { kind, args: {} as Record<string, any[]> };
    for (const m of ['from', 'innerJoin', 'where', 'limit', 'orderBy', 'groupBy', 'values', 'set', 'returning', 'onConflictDoNothing', 'onConflictDoUpdate']) {
      c[m] = (...a: any[]) => {
        c.args[m] = a;
        return c;
      };
    }
    c.then = (res: any, rej: any) => Promise.resolve(kind === 'select' ? state.selects.shift() ?? [] : []).then(res, rej);
    state.ops.push(c);
    return c;
  };
  return {
    select: () => chain('select'),
    insert: () => chain('insert'),
    update: () => chain('update'),
    delete: () => chain('delete'),
  };
}

vi.mock('../../db', () => ({
  get db() {
    return state.db;
  },
}));

import { processDueSteps, createCampaign } from '../leadAutomation';

const DAY = 86_400_000;
const enrolledAt = new Date('2026-11-10T09:00:00Z');
const now = new Date('2026-11-17T12:00:00Z');
const steps = [
  { day: 0, channel: 'email', title: 'Intro', message: 'Hello Jane' },
  { day: 3, channel: 'call', title: 'Call', message: 'Ring Jane' },
];
const contact = { id: 7, firstName: 'Jane', lastName: 'Doe', status: 'new', source: 'Website', tags: [] };
const campaign = { id: 'c1', profileId: 'u1', name: 'Welcome', status: 'active', steps };
const dueRow = (nextStep: number) => ({
  enrollment: { id: 'e1', campaignId: 'c1', contactId: 7, nextStep, nextDueAt: new Date(enrolledAt.getTime() + steps[nextStep].day * DAY), enrolledAt, status: 'active' },
  campaign,
  contact,
});
const ofKind = (kind: string) => state.ops.filter((o) => o.kind === kind);

describe('processDueSteps', () => {
  beforeEach(() => {
    state.db = makeDb();
    state.selects = [];
    state.ops = [];
  });

  it('creates the task for a due step and schedules the next one', async () => {
    state.selects = [[dueRow(0)], [] /* no settings row → defaults */, [{ n: 1 }]];
    expect(await processDueSteps('u1', undefined, now)).toBe(1);

    const [task] = ofKind('insert');
    expect(task.args.values[0]).toMatchObject({
      title: '[Welcome] Intro — Jane Doe',
      description: 'Hello Jane',
      contactId: 7,
      profileId: 'u1',
      customFields: { campaignId: 'c1', step: 0, channel: 'email' },
    });
    const [update] = ofKind('update');
    expect(update.args.set[0]).toMatchObject({ nextStep: 1, status: 'active', nextDueAt: new Date(enrolledAt.getTime() + 3 * DAY) });
  });

  it('marks the enrolment done after the last step and completes the campaign', async () => {
    state.selects = [[dueRow(1)], [], [{ n: 0 }]];
    expect(await processDueSteps('u1', undefined, now)).toBe(1);
    const updates = ofKind('update');
    expect(updates[0].args.set[0]).toMatchObject({ nextStep: 2, nextDueAt: null, status: 'done' });
    expect(updates[1].args.set[0]).toMatchObject({ status: 'completed' });
  });

  it('does not complete a campaign that still has active enrolments', async () => {
    state.selects = [[dueRow(1)], [], [{ n: 2 }]];
    await processDueSteps('u1', undefined, now);
    expect(ofKind('update')).toHaveLength(1);
  });

  it('creates no tasks when follow-up tasks are turned off', async () => {
    state.selects = [[dueRow(0)], [{ scoringModel: 'ai-powered', qualificationThreshold: 70, createFollowupTasks: false }]];
    expect(await processDueSteps('u1', undefined, now)).toBe(0);
    expect(ofKind('insert')).toHaveLength(0);
    expect(ofKind('update')).toHaveLength(0);
  });

  it('does nothing when no step is due', async () => {
    state.selects = [[]];
    expect(await processDueSteps('u1', undefined, now)).toBe(0);
    expect(ofKind('insert')).toHaveLength(0);
  });
});

describe('createCampaign', () => {
  beforeEach(() => {
    state.db = makeDb();
    state.selects = [];
    state.ops = [];
  });

  it('enrolls only contacts that match the audience', async () => {
    const contacts = [
      { ...contact, id: 1, status: 'new' },
      { ...contact, id: 2, status: 'customer' },
      { ...contact, id: 3, status: 'new' },
    ];
    // db.insert(campaigns).returning() yields [] in the fake, so feed the campaign through a patched insert
    const real = state.db.insert;
    state.db.insert = () => {
      const c = real();
      if (!state.ops.some((o) => o.kind === 'insert' && o !== c)) c.then = (res: any) => Promise.resolve([{ id: 'c9', profileId: 'u1' }]).then(res);
      return c;
    };
    state.selects = [contacts, [] /* due: none */];
    const result = await createCampaign('u1', { name: 'N', audience: { statuses: ['new'] }, steps: steps as any });

    expect(result.enrolled).toBe(2);
    const enrollInsert = ofKind('insert').find((o) => Array.isArray(o.args.values?.[0]));
    expect(enrollInsert!.args.values[0].map((e: any) => e.contactId)).toEqual([1, 3]);
    expect(enrollInsert!.args.values[0][0]).toMatchObject({ campaignId: 'c9', nextStep: 0 });
  });
});
