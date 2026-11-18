import { describe, it, expect, vi } from 'vitest';

vi.mock('../../db', () => ({ db: null }));

import {
  blendScores,
  canAutoQualify,
  contactMatchesAudience,
  parseCampaign,
  parseSettings,
  priorityFor,
  ruleBasedScore,
  stepDueAt,
} from '../leadAutomation';

const NOW = new Date('2026-11-17T12:00:00Z');
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000);

describe('ruleBasedScore', () => {
  it('scores an empty, stale contact as 0 and explains why', () => {
    const r = ruleBasedScore({ updatedAt: daysAgo(400) }, 0, NOW);
    expect(r.score).toBe(0);
    expect(r.priority).toBe('cold');
    expect(r.rationale).toMatch(/no scoring signals/);
  });

  it('adds up completeness, recency and deals, capped at 100', () => {
    const contact = { email: 'a@b.co', phone: '1', company: 'Acme', industry: 'SaaS', tags: ['vip'], updatedAt: daysAgo(2) };
    const r = ruleBasedScore(contact, 5, NOW);
    expect(r.score).toBe(100); // 20+10+15+5+10+20+20 = 100
    expect(r.priority).toBe('hot');
    expect(r.rationale).toContain('5 deal(s)');
  });

  it('gives partial recency credit for 14-60 days', () => {
    expect(ruleBasedScore({ updatedAt: daysAgo(30) }, 0, NOW).score).toBe(10);
  });
});

describe('scoring helpers', () => {
  it('maps scores to priorities', () => {
    expect([priorityFor(90), priorityFor(50), priorityFor(10)]).toEqual(['hot', 'warm', 'cold']);
  });
  it('averages rule-based and AI scores', () => {
    const r = blendScores({ score: 40, priority: 'warm', rationale: '' }, { score: 80, priority: 'hot', rationale: 'Strong fit.' });
    expect(r.score).toBe(60);
    expect(r.rationale).toContain('Strong fit.');
  });
  it('does not re-qualify finished or lost contacts', () => {
    expect(canAutoQualify('lead')).toBe(true);
    expect(canAutoQualify('active')).toBe(true);
    for (const s of ['qualified', 'converted', 'customer', 'lost']) expect(canAutoQualify(s)).toBe(false);
  });
});

describe('parseSettings', () => {
  it('uses defaults and accepts valid values', () => {
    expect(parseSettings({})).toEqual({ value: { scoringModel: 'ai-powered', qualificationThreshold: 70, createFollowupTasks: true } });
    expect(parseSettings({ scoringModel: 'hybrid', qualificationThreshold: '80', createFollowupTasks: false })).toEqual({
      value: { scoringModel: 'hybrid', qualificationThreshold: 80, createFollowupTasks: false },
    });
  });
  it('rejects bad values', () => {
    expect(parseSettings({ scoringModel: 'magic' })).toHaveProperty('error');
    expect(parseSettings({ qualificationThreshold: 101 })).toHaveProperty('error');
    expect(parseSettings({ qualificationThreshold: 'abc' })).toHaveProperty('error');
    expect(parseSettings({ createFollowupTasks: 'yes' })).toHaveProperty('error');
  });
});

describe('parseCampaign', () => {
  const step = { day: 3, channel: 'email', title: 'Follow up', message: 'Hi there' };
  it('accepts a valid campaign and sorts steps by day', () => {
    const r = parseCampaign({ name: ' Welcome ', steps: [step, { ...step, day: 0, title: 'Intro' }], audience: { statuses: ['new'] } });
    expect('value' in r && r.value.name).toBe('Welcome');
    expect('value' in r && r.value.steps.map((s) => s.day)).toEqual([0, 3]);
  });
  it('rejects missing name, empty steps, and bad steps', () => {
    expect(parseCampaign({ steps: [step] })).toHaveProperty('error');
    expect(parseCampaign({ name: 'x', steps: [] })).toHaveProperty('error');
    expect(parseCampaign({ name: 'x', steps: [{ ...step, channel: 'pigeon' }] })).toHaveProperty('error');
    expect(parseCampaign({ name: 'x', steps: [{ ...step, day: -1 }] })).toHaveProperty('error');
    expect(parseCampaign({ name: 'x', steps: [{ ...step, title: '' }] })).toHaveProperty('error');
  });
});

describe('audience and scheduling', () => {
  it('empty audience matches everyone; filters are case-insensitive', () => {
    const c = { status: 'New', source: 'LinkedIn', tags: ['VIP', 'saas'] };
    expect(contactMatchesAudience(c, {})).toBe(true);
    expect(contactMatchesAudience(c, { statuses: ['new'], sources: ['linkedin'], tags: ['vip'] })).toBe(true);
    expect(contactMatchesAudience(c, { statuses: ['qualified'] })).toBe(false);
    expect(contactMatchesAudience(c, { tags: ['other'] })).toBe(false);
    expect(contactMatchesAudience({ status: 'new' }, { tags: ['vip'] })).toBe(false);
  });
  it('schedules each step relative to enrolment and ends after the last', () => {
    const steps = [
      { day: 0, channel: 'email', title: 'a', message: '' },
      { day: 3, channel: 'call', title: 'b', message: '' },
    ] as any;
    expect(stepDueAt(NOW, steps, 0)).toEqual(NOW);
    expect(stepDueAt(NOW, steps, 1)).toEqual(new Date('2026-11-20T12:00:00Z'));
    expect(stepDueAt(NOW, steps, 2)).toBeNull();
  });
});
