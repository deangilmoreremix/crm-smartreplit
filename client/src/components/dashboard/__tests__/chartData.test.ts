import { describe, it, expect } from 'vitest';
import {
  performanceSeries,
  pipelineByStage,
  valueByStage,
  salesKpis,
  stageConversions,
  bucketDays,
  mergePerformance,
  mergePipeline,
  mergeBreakdown,
  mergeConversions,
  sliceForRange,
  alignPerformance,
  mergeKpis,
  sampleKpis,
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

describe('merging sample series with real aggregates', () => {
  it('mergePerformance sums matching buckets once and keeps the rest, without mutating inputs', () => {
    const real = [
      { name: 'Jan', revenue: 100, deals: 1 },
      { name: 'Nov 5', revenue: 50, deals: 2 },
    ];
    const demo = [
      { name: 'Jan', revenue: 12000, deals: 8 },
      { name: 'Feb', revenue: 15000, deals: 10 },
    ];
    const out = mergePerformance(real, demo);
    expect(out).toEqual([
      { name: 'Jan', revenue: 12100, deals: 9 },
      { name: 'Nov 5', revenue: 50, deals: 2 },
      { name: 'Feb', revenue: 15000, deals: 10 },
    ]);
    expect(demo[0]).toEqual({ name: 'Jan', revenue: 12000, deals: 8 });
    expect(real[0]).toEqual({ name: 'Jan', revenue: 100, deals: 1 });
    // not double counted when merged twice from the same inputs
    expect(mergePerformance(real, demo)).toEqual(out);
  });

  it('merge with empty real data returns the sample series; with empty sample returns real', () => {
    const demo = [{ name: 'Lead', value: 120 }];
    expect(mergePipeline([], demo)).toEqual(demo);
    expect(mergePipeline(demo, [])).toEqual(demo);
    expect(mergePerformance([], [])).toEqual([]);
  });

  it('mergePipeline and mergeBreakdown sum by name', () => {
    expect(
      mergePipeline([{ name: 'Qualified', value: 2 }, { name: 'Closed Lost', value: 1 }], [{ name: 'Qualified', value: 85 }])
    ).toEqual([
      { name: 'Qualified', value: 87 },
      { name: 'Closed Lost', value: 1 },
    ]);
    expect(mergeBreakdown([{ name: 'Software', value: 500 }], [{ name: 'Software', value: 45000 }, { name: 'Other', value: 5000 }])).toEqual([
      { name: 'Software', value: 45500 },
      { name: 'Other', value: 5000 },
    ]);
  });

  it('mergeConversions uses sample when real is null, averages when both exist', () => {
    const real = [
      { label: 'Lead to Opportunity', rate: null },
      { label: 'Opportunity to Proposal', rate: 50 },
      { label: 'Proposal to Win', rate: null },
    ];
    const demo = [
      { label: 'Lead to Opportunity', rate: 32, delta: 4.5 },
      { label: 'Opportunity to Proposal', rate: 70, delta: 2.1 },
    ];
    expect(mergeConversions(real, demo)).toEqual([
      { label: 'Lead to Opportunity', rate: 32, delta: 4.5 },
      { label: 'Opportunity to Proposal', rate: 60 },
      { label: 'Proposal to Win', rate: null },
    ]);
  });

  it('sliceForRange keeps the trailing window', () => {
    const xs = [1, 2, 3, 4, 5, 6];
    expect(sliceForRange(xs, 7)).toEqual([5, 6]);
    expect(sliceForRange(xs, 30)).toEqual([4, 5, 6]);
    expect(sliceForRange(xs, 90)).toEqual(xs);
  });
});

describe('sample performance aligned to real buckets', () => {
  const demo = [
    { revenue: 1, deals: 1 },
    { revenue: 2, deals: 2 },
    { revenue: 3, deals: 3 },
  ];

  it('uses the real bucket labels, aligned to the newest bucket', () => {
    const real = performanceSeries(deals, 30, NOW);
    const aligned = alignPerformance(real, demo);
    expect(aligned.map((p) => p.name)).toEqual(real.slice(-3).map((p) => p.name));
    expect(aligned.map((p) => p.revenue)).toEqual([1, 2, 3]);
  });

  it('drops oldest sample values when there are fewer buckets than samples', () => {
    const real = [
      { name: 'a', revenue: 0, deals: 0 },
      { name: 'b', revenue: 0, deals: 0 },
    ];
    expect(alignPerformance(real, demo)).toEqual([
      { name: 'a', revenue: 2, deals: 2 },
      { name: 'b', revenue: 3, deals: 3 },
    ]);
    expect(alignPerformance([], demo)).toEqual([]);
  });

  it('merging aligned samples sums per real bucket without adding stray buckets', () => {
    const real = performanceSeries(deals, 30, NOW);
    const merged = mergePerformance(real, alignPerformance(real, demo));
    expect(merged.map((p) => p.name)).toEqual(real.map((p) => p.name));
    const last = real.length - 1;
    expect(merged[last].revenue).toBe(real[last].revenue + 3);
    expect(merged[0].revenue).toBe(real[0].revenue);
  });

  it('breakdown samples are stage based so they sum into real stage slices', () => {
    const real = valueByStage(deals, 30, NOW);
    const merged = mergeBreakdown<{ name: string; value: number }>(real, [
      { name: 'Proposal', value: 45000 },
      { name: 'Closed Won', value: 120000 },
    ]);
    expect(merged.find((p) => p.name === 'Proposal')?.value).toBe(45200);
  });

  it('mergeKpis keeps real values and fills only unknown ones from the sample', () => {
    const sample = sampleKpis(demo, [{ name: 'Closed Won', value: 50 }, { name: 'Proposal', value: 50 }]);
    expect(sample).toEqual({ conversionRate: 50, avgDealSize: 1, salesCycleDays: null, winRate: null });
    const real = { conversionRate: null, avgDealSize: 99, salesCycleDays: null, winRate: 10 };
    expect(mergeKpis(real, sample)).toEqual({ conversionRate: 50, avgDealSize: 99, salesCycleDays: null, winRate: 10 });
  });
});
