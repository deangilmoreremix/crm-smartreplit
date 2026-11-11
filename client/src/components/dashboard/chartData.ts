/**
 * Pure aggregation helpers for the dashboard sales charts. They take rows as returned by
 * GET /api/deals and never invent data: with no rows the results are empty / null.
 */

export interface ApiDeal {
  id: number | string;
  title?: string | null;
  value?: string | number | null;
  stage?: string | null;
  status?: string | null;
  contactId?: number | string | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
  actualCloseDate?: string | Date | null;
}

export interface PerformancePoint {
  name: string;
  revenue: number;
  deals: number;
}
export interface StagePoint {
  name: string;
  stage: string;
  value: number;
}
export interface SalesKpis {
  /** Won deals / deals touched in range (0-100), null without deals. */
  conversionRate: number | null;
  /** Average value of deals won in range, null without wins. */
  avgDealSize: number | null;
  /** Average days from creation to close for deals won in range, null without wins. */
  salesCycleDays: number | null;
  /** Won / (won + lost) closed in range (0-100), null without closed deals. */
  winRate: number | null;
}

const DAY_MS = 86_400_000;
const STAGE_ORDER = ['lead', 'qualified', 'qualification', 'proposal', 'negotiation', 'closed-won', 'closed-lost'];

export const isWon = (d: ApiDeal) => d.stage === 'closed-won' || d.status === 'won';
export const isLost = (d: ApiDeal) => d.stage === 'closed-lost' || d.status === 'lost';

const toTime = (v: string | Date | null | undefined): number | null => {
  if (!v) return null;
  const t = v instanceof Date ? v.getTime() : Date.parse(v);
  return Number.isNaN(t) ? null : t;
};

export const dealValue = (d: ApiDeal): number => {
  const n = typeof d.value === 'number' ? d.value : parseFloat(d.value ?? '');
  return Number.isFinite(n) ? n : 0;
};

/** When a deal was closed (falls back to last update for closed deals without a close date). */
const closeTime = (d: ApiDeal) => toTime(d.actualCloseDate) ?? toTime(d.updatedAt) ?? toTime(d.createdAt);
/** Last time anything happened to the deal. */
const touchTime = (d: ApiDeal) =>
  Math.max(toTime(d.updatedAt) ?? 0, toTime(d.createdAt) ?? 0, toTime(d.actualCloseDate) ?? 0) || null;

const inWindow = (t: number | null, now: number, rangeDays: number) =>
  t !== null && t <= now && t > now - rangeDays * DAY_MS;

/** Bucket size in days for a date range: daily for a week, then 5 and 15 day buckets. */
export const bucketDays = (rangeDays: number) => (rangeDays <= 7 ? 1 : rangeDays <= 30 ? 5 : 15);

const label = (t: number) => new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

/** Revenue and closed-won count per time bucket across the trailing `rangeDays`. */
export function performanceSeries(deals: ApiDeal[], rangeDays: number, now: number = Date.now()): PerformancePoint[] {
  const size = bucketDays(rangeDays) * DAY_MS;
  const count = Math.ceil(rangeDays / bucketDays(rangeDays));
  const start = now - count * size;
  const points: PerformancePoint[] = Array.from({ length: count }, (_, i) => ({
    name: label(start + i * size + size),
    revenue: 0,
    deals: 0,
  }));
  for (const d of deals) {
    if (!isWon(d)) continue;
    const t = closeTime(d);
    if (t === null || t > now || t <= start) continue;
    const idx = Math.min(count - 1, Math.floor((t - start) / size));
    points[idx].revenue += dealValue(d);
    points[idx].deals += 1;
  }
  return points;
}

const stageName = (s: string) => s.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
const stageRank = (s: string) => {
  const i = STAGE_ORDER.indexOf(s);
  return i === -1 ? STAGE_ORDER.length : i;
};

function byStage(deals: ApiDeal[], rangeDays: number, now: number, weigh: (d: ApiDeal) => number): StagePoint[] {
  const totals = new Map<string, number>();
  for (const d of deals) {
    if (!inWindow(touchTime(d), now, rangeDays)) continue;
    const stage = d.stage || 'unknown';
    totals.set(stage, (totals.get(stage) ?? 0) + weigh(d));
  }
  return [...totals.entries()]
    .sort((a, b) => stageRank(a[0]) - stageRank(b[0]) || a[0].localeCompare(b[0]))
    .map(([stage, value]) => ({ stage, name: stageName(stage), value }));
}

/** Number of deals per stage (deals touched in range), in funnel order. */
export const pipelineByStage = (deals: ApiDeal[], rangeDays: number, now: number = Date.now()) =>
  byStage(deals, rangeDays, now, () => 1);

/** Total deal value per stage (deals touched in range), zero-value stages omitted. */
export const valueByStage = (deals: ApiDeal[], rangeDays: number, now: number = Date.now()) =>
  byStage(deals, rangeDays, now, dealValue).filter((p) => p.value > 0);

export function salesKpis(deals: ApiDeal[], rangeDays: number, now: number = Date.now()): SalesKpis {
  const touched = deals.filter((d) => inWindow(touchTime(d), now, rangeDays));
  const won = deals.filter((d) => isWon(d) && inWindow(closeTime(d), now, rangeDays));
  const lost = deals.filter((d) => isLost(d) && inWindow(closeTime(d), now, rangeDays));
  const cycles = won.flatMap((d) => {
    const c = closeTime(d);
    const s = toTime(d.createdAt);
    return c !== null && s !== null && c >= s ? [(c - s) / DAY_MS] : [];
  });
  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
  return {
    conversionRate: touched.length ? (won.length / touched.length) * 100 : null,
    avgDealSize: avg(won.map(dealValue)),
    salesCycleDays: avg(cycles),
    winRate: won.length + lost.length ? (won.length / (won.length + lost.length)) * 100 : null,
  };
}

/**
 * Funnel step conversion over all deals. A deal "reached" a stage when its current stage is at
 * or beyond it; lost deals only count as having reached the first stage (we don't know how far
 * they got).
 */
export function stageConversions(deals: ApiDeal[]): Array<{ label: string; rate: number | null }> {
  const level = (d: ApiDeal) => {
    if (isWon(d)) return 4;
    if (isLost(d)) return 0;
    const s = d.stage ?? '';
    if (s === 'negotiation') return 3;
    if (s === 'proposal') return 2;
    if (s === 'qualified' || s === 'qualification') return 1;
    return 0;
  };
  const reached = (n: number) => deals.filter((d) => level(d) >= n).length;
  const rate = (to: number, from: number) => (reached(from) ? (reached(to) / reached(from)) * 100 : null);
  return [
    { label: 'Lead to Opportunity', rate: rate(1, 0) },
    { label: 'Opportunity to Proposal', rate: rate(2, 1) },
    { label: 'Proposal to Win', rate: rate(4, 2) },
  ];
}

/** Trailing window of the monthly sample series for a date range (7d: 2 points, 30d: 3, 90d: all). */
export function sliceForRange<T>(series: T[], rangeDays: number): T[] {
  const keep = rangeDays <= 7 ? 2 : rangeDays <= 30 ? 3 : series.length;
  return series.slice(-keep);
}

// --- Merging sample (demo) series with real aggregates ---------------------------------------
// All merges are by bucket name: a name present in both is summed once, a name present in only
// one side is kept as is. Inputs are never mutated.

/** Sum real performance buckets into the sample buckets (matching names), keeping unmatched real buckets. */
export function mergePerformance(real: PerformancePoint[], demo: PerformancePoint[]): PerformancePoint[] {
  const out = new Map<string, PerformancePoint>();
  for (const p of [...demo, ...real]) {
    const cur = out.get(p.name);
    out.set(p.name, cur ? { name: p.name, revenue: cur.revenue + p.revenue, deals: cur.deals + p.deals } : { ...p });
  }
  return [...out.values()];
}

/**
 * Lay sample values (oldest first) onto the real bucket labels, aligned to the newest bucket, so
 * the sample series uses exactly the buckets `performanceSeries` produced for the selected range.
 * Extra sample values are dropped; buckets without a sample value get none.
 */
export function alignPerformance(
  real: PerformancePoint[],
  demo: Array<{ revenue: number; deals: number }>
): PerformancePoint[] {
  const n = Math.min(real.length, demo.length);
  const offset = real.length - n;
  const tail = demo.slice(demo.length - n);
  return tail.map((d, i) => ({ name: real[offset + i].name, revenue: d.revenue, deals: d.deals }));
}

/** Fill unknown (null) real KPI values from the sample ones; known real values always win. */
export function mergeKpis(real: SalesKpis, demo: SalesKpis): SalesKpis {
  return {
    conversionRate: real.conversionRate ?? demo.conversionRate,
    avgDealSize: real.avgDealSize ?? demo.avgDealSize,
    salesCycleDays: real.salesCycleDays ?? demo.salesCycleDays,
    winRate: real.winRate ?? demo.winRate,
  };
}

/** KPIs implied by the sample series; values the sample cannot support stay null. */
export function sampleKpis(
  performance: Array<{ revenue: number; deals: number }>,
  breakdown: Array<{ name: string; value: number }>
): SalesKpis {
  const revenue = performance.reduce((s, p) => s + p.revenue, 0);
  const deals = performance.reduce((s, p) => s + p.deals, 0);
  const total = breakdown.reduce((s, p) => s + p.value, 0);
  const won = breakdown.find((p) => p.name === 'Closed Won')?.value ?? 0;
  return {
    conversionRate: total > 0 ? (won / total) * 100 : null,
    avgDealSize: deals > 0 ? revenue / deals : null,
    salesCycleDays: null,
    winRate: null,
  };
}

function mergeNamed<T extends { name: string; value: number }>(real: T[], demo: T[]): T[] {
  const out = new Map<string, T>();
  for (const p of [...demo, ...real]) {
    const cur = out.get(p.name);
    out.set(p.name, cur ? { ...cur, value: cur.value + p.value } : { ...p });
  }
  return [...out.values()];
}

/** Deals per stage: sample counts plus real counts under the same stage name. */
export const mergePipeline = <T extends { name: string; value: number }>(real: T[], demo: T[]): T[] =>
  mergeNamed(real, demo);

/** Value per stage/category: sample values plus real values under the same name. */
export const mergeBreakdown = <T extends { name: string; value: number }>(real: T[], demo: T[]): T[] =>
  mergeNamed(real, demo);

export interface ConversionPoint {
  label: string;
  rate: number | null;
  /** Change vs previous period; only present for sample-derived rates. */
  delta?: number;
}

/**
 * Funnel conversions cannot be summed. With both sides present the rate is the mean of the two
 * (each side counted once); with only one side that side is used as is. Output follows `real`
 * order, then any sample-only labels.
 */
export function mergeConversions(
  real: ConversionPoint[],
  demo: Array<{ label: string; rate: number; delta?: number }>
): ConversionPoint[] {
  const demoBy = new Map(demo.map((d) => [d.label, d]));
  const merged: ConversionPoint[] = real.map((r) => {
    const d = demoBy.get(r.label);
    demoBy.delete(r.label);
    if (!d) return { ...r };
    if (r.rate === null) return { label: r.label, rate: d.rate, delta: d.delta };
    return { label: r.label, rate: (r.rate + d.rate) / 2 };
  });
  for (const d of demoBy.values()) merged.push({ label: d.label, rate: d.rate, delta: d.delta });
  return merged;
}
