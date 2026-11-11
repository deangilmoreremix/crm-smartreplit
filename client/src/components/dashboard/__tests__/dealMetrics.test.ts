import { describe, it, expect } from 'vitest';
import type { Deal, DealStage } from '../../../types/deal';
import { DEFAULT_DEAL_STAGES } from '../../../data/demoData';
import {
  computeDealTotals,
  createdPeriodChange,
  dealsInPeriod,
  formatChange,
  isActiveDeal,
  pctChange,
  pipelineByMonth,
  quickStats,
  stageIdOf,
  trendSeries,
} from '../dealMetrics';

const NOW = Date.parse('2026-11-11T12:00:00Z');
const daysAgo = (n: number) => new Date(NOW - n * 86_400_000);
const stage = (id: string): DealStage => DEFAULT_DEAL_STAGES.find((s) => s.id === id)!;

let seq = 0;
const deal = (stageId: string, value: number, over: Partial<Deal> = {}): Deal => ({
  id: String(++seq),
  title: `Deal ${seq}`,
  value,
  stage: stage(stageId),
  probability: 50,
  contactId: '1',
  priority: 'medium',
  source: 'other',
  tags: [],
  customFields: {},
  activities: [],
  attachments: [],
  createdAt: daysAgo(5),
  updatedAt: daysAgo(1),
  currency: 'USD',
  ...over,
});

describe('dealMetrics with object stages', () => {
  const deals = [
    deal('qualification', 1000),
    deal('proposal', 2000),
    deal('closed-won', 5000, { actualCloseDate: daysAgo(2) }),
    deal('closed-won', 3000, { actualCloseDate: daysAgo(3) }),
    deal('closed-lost', 700),
  ];

  it('reads the stage id from DealStage objects (String(stage) never matches)', () => {
    expect(String(deals[0].stage)).toBe('[object Object]');
    expect(stageIdOf(deals[2])).toBe('closed-won');
    expect(isActiveDeal(deals[0])).toBe(true);
    expect(isActiveDeal(deals[4])).toBe(false);
  });

  it('counts and sums active / won / lost', () => {
    const t = computeDealTotals(deals);
    expect(t).toMatchObject({ activeCount: 2, activeValue: 3000, wonCount: 2, wonValue: 8000, lostCount: 1, lostValue: 700 });
    expect(t.avgActiveDealSize).toBe(1500);
    expect(t.avgWonDealSize).toBe(4000);
  });

  it('handles no deals without dividing by zero', () => {
    expect(computeDealTotals([])).toMatchObject({ activeCount: 0, avgActiveDealSize: 0, avgWonDealSize: 0 });
  });
});

describe('period-over-period change', () => {
  it('pctChange is null when it cannot be computed', () => {
    expect(pctChange(10, 0)).toBeNull();
    expect(pctChange(null, 5)).toBeNull();
    expect(pctChange(15, 10)).toBe(50);
    expect(pctChange(5, 10)).toBe(-50);
  });

  it('compares deals created in the last 30d with the 30d before', () => {
    const deals = [
      deal('proposal', 100, { createdAt: daysAgo(5) }),
      deal('proposal', 100, { createdAt: daysAgo(10) }),
      deal('proposal', 100, { createdAt: daysAgo(15) }),
      deal('proposal', 100, { createdAt: daysAgo(40) }),
      deal('proposal', 100, { createdAt: daysAgo(50) }),
    ];
    const count = (c: Deal[]) => c.length;
    expect(createdPeriodChange(deals, count, NOW)).toBe(50);
    expect(createdPeriodChange([deals[0]], count, NOW)).toBeNull();
    expect(createdPeriodChange([], count, NOW)).toBeNull();
  });

  it('formatChange hides non-computable values', () => {
    expect(formatChange(null)).toBeNull();
    expect(formatChange(12.34)).toBe('+12.3%');
    expect(formatChange(-3)).toBe('-3%');
  });
});

describe('deterministic series and stats', () => {
  const deals = [
    deal('closed-won', 4000, { createdAt: daysAgo(30), actualCloseDate: daysAgo(2) }),
    deal('closed-won', 1000, { createdAt: daysAgo(20), updatedAt: daysAgo(12), actualCloseDate: daysAgo(12) }),
    deal('closed-lost', 900, { createdAt: daysAgo(20), updatedAt: daysAgo(4) }),
    deal('proposal', 2500, { createdAt: daysAgo(3), updatedAt: daysAgo(3), expectedCloseDate: new Date('2026-12-15T12:00:00') }),
  ];

  it('trendSeries is the same for the same input (no randomness) and sums to the real totals', () => {
    const a = trendSeries(deals, 30, NOW);
    const b = trendSeries(deals, 30, NOW);
    expect(a).toEqual(b);
    expect(a).toHaveLength(6);
    expect(a.reduce((s, p) => s + p.revenue, 0)).toBe(5000);
    expect(a.reduce((s, p) => s + p.deals, 0)).toBe(2);
    expect(a.reduce((s, p) => s + p.pipeline, 0)).toBe(2500);
  });

  it('the period changes the data: a week only sees the last 7 days', () => {
    const week = trendSeries(deals, 7, NOW);
    expect(week).toHaveLength(7);
    expect(week.reduce((s, p) => s + p.revenue, 0)).toBe(4000);
    expect(dealsInPeriod(deals, 7, NOW).map((d) => d.value).sort((a, b) => a - b)).toEqual([900, 2500, 4000]);
    expect(dealsInPeriod(deals, 90, NOW)).toHaveLength(4);
  });

  it('sample deals are kept in every period', () => {
    const sample = deal('closed-won', 10, { isDemo: true, createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-02') });
    expect(dealsInPeriod([sample], 7, NOW)).toHaveLength(1);
  });

  it('quickStats computes top deal, days to close and win rate (null when unknown)', () => {
    const s = quickStats(deals);
    expect(s.topDealValue).toBe(4000);
    expect(s.winRate).toBeCloseTo((2 / 3) * 100);
    expect(s.avgDaysToClose).toBeCloseTo((28 + 8) / 2);
    expect(quickStats([])).toEqual({ topDealValue: null, avgDaysToClose: null, winRate: null });
  });

  it('pipelineByMonth falls back to expectedCloseDate then createdAt when dueDate is missing', () => {
    const open = [
      deal('proposal', 100, { expectedCloseDate: new Date('2026-12-15T12:00:00') }),
      deal('proposal', 50, { dueDate: new Date('2026-12-20T12:00:00') }),
      deal('proposal', 25, { createdAt: new Date('2026-11-05T12:00:00') }),
      deal('closed-won', 999),
    ];
    const out = pipelineByMonth(open);
    expect(out.map((m) => [m.key, m.value])).toEqual([
      ['2026-11', 25],
      ['2026-12', 150],
    ]);
  });
});
