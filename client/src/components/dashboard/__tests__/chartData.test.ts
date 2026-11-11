import { describe, it, expect } from 'vitest';
import {
  performanceSeries,
  pipelineByStage,
  valueByStage,
  salesKpis,
  stageConversions,
  bucketDays,
  type ApiDeal,
} from '../chartData';

const NOW = Date.parse('2026-11-11T12:00:00Z');
const daysAgo = (n: number) => new Date(NOW - n * 86_400_000).toISOString();

const deals: ApiDeal[] = [
  { id: 1, value: '1000.00', stage: 'closed-won', createdAt: daysAgo(20), actualCloseDate: daysAgo(1) },
  { id: 2, value: 3000, stage: 'closed-won', createdAt: daysAgo(40), actualCloseDate: daysAgo(10) },
  { id: 3, value: '500', stage: 'closed-lost', createdAt: daysAgo(30), updatedAt: daysAgo(2) },
  { id: 4, value: '200', stage: 'proposal', createdAt: daysAgo(3) },
  { id: 5, value: null, stage: 'lead', createdAt: daysAgo(100), updatedAt: daysAgo(100) },
];

describe('chartData', () => {
  it('returns empty/null results without deals (no fabricated numbers)', () => {
    expect(pipelineByStage([], 30, NOW)).toEqual([]);
    expect(valueByStage([], 30, NOW)).toEqual([]);
    expect(performanceSeries([], 30, NOW).every((p) => p.revenue === 0 && p.deals === 0)).toBe(true);
    expect(salesKpis([], 30, NOW)).toEqual({
      conversionRate: null,
      avgDealSize: null,
      salesCycleDays: null,
      winRate: null,
    });
  });

  it('buckets won revenue over the range', () => {
    expect(bucketDays(7)).toBe(1);
    const week = performanceSeries(deals, 7, NOW);
    expect(week).toHaveLength(7);
    expect(week.reduce((s, p) => s + p.revenue, 0)).toBe(1000);
    const month = performanceSeries(deals, 30, NOW);
    expect(month).toHaveLength(6);
    expect(month.reduce((s, p) => s + p.revenue, 0)).toBe(4000);
    expect(month.reduce((s, p) => s + p.deals, 0)).toBe(2);
    const quarter = performanceSeries(deals, 90, NOW);
    expect(quarter).toHaveLength(6);
  });

  it('counts deals per stage in funnel order within range', () => {
    const p = pipelineByStage(deals, 30, NOW);
    expect(p.map((x) => x.stage)).toEqual(['proposal', 'closed-won', 'closed-lost']);
    expect(p.map((x) => x.value)).toEqual([1, 2, 1]);
    expect(pipelineByStage(deals, 90, NOW).map((x) => x.stage)).toContain('closed-won');
    expect(pipelineByStage(deals, 7, NOW).map((x) => x.stage)).toEqual(['proposal', 'closed-won', 'closed-lost']);
    expect(pipelineByStage(deals, 90, NOW).some((x) => x.stage === 'lead')).toBe(false);
  });

  it('sums value per stage and drops zero-value stages', () => {
    const v = valueByStage(deals, 30, NOW);
    expect(v).toEqual([
      { stage: 'proposal', name: 'Proposal', value: 200 },
      { stage: 'closed-won', name: 'Closed Won', value: 4000 },
      { stage: 'closed-lost', name: 'Closed Lost', value: 500 },
    ]);
  });

  it('computes KPIs from real rows', () => {
    const k = salesKpis(deals, 30, NOW);
    expect(k.avgDealSize).toBe(2000);
    expect(k.winRate).toBeCloseTo(66.67, 1);
    expect(k.salesCycleDays).toBeCloseTo((19 + 30) / 2, 5);
    expect(k.conversionRate).toBeCloseTo((2 / 4) * 100, 5);
    expect(salesKpis(deals, 7, NOW).avgDealSize).toBe(1000);
  });

  it('computes funnel conversions', () => {
    const c = stageConversions(deals);
    expect(c.map((x) => x.label)).toEqual(['Lead to Opportunity', 'Opportunity to Proposal', 'Proposal to Win']);
    expect(c[0].rate).toBeCloseTo((3 / 5) * 100, 5);
    expect(c[1].rate).toBeCloseTo(100, 5);
    expect(c[2].rate).toBeCloseTo((2 / 3) * 100, 5);
    expect(stageConversions([]).every((x) => x.rate === null)).toBe(true);
  });
});
