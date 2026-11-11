/**
 * Pure metric helpers over store `Deal`s, shared by KPICards, MetricsCards and DealAnalytics.
 * `Deal.stage` is a DealStage object, so every comparison goes through `stageIdOf`. Nothing here
 * invents data: values that cannot be computed come back as `null` so the UI can hide them.
 */
import type { Deal } from '../../types/deal';
import { bucketDays } from './chartData';

const DAY_MS = 86_400_000;

type DateLike = Date | string | number | null | undefined;

export const toTime = (v: DateLike): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const t = v instanceof Date ? v.getTime() : typeof v === 'number' ? v : Date.parse(v);
  return Number.isNaN(t) ? null : t;
};

/** Stage id of a deal (tolerates a legacy plain-string stage). */
export const stageIdOf = (d: Pick<Deal, 'stage'>): string => {
  const s = d.stage as unknown;
  if (typeof s === 'string') return s;
  return (s as { id?: string } | null | undefined)?.id ?? '';
};

export const isWonDeal = (d: Deal) => stageIdOf(d) === 'closed-won';
export const isLostDeal = (d: Deal) => stageIdOf(d) === 'closed-lost';
export const isActiveDeal = (d: Deal) => !isWonDeal(d) && !isLostDeal(d);

const num = (n: unknown) => (typeof n === 'number' && Number.isFinite(n) ? n : 0);
const sum = (deals: Deal[]) => deals.reduce((s, d) => s + num(d.value), 0);
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

/** When a closed deal was closed (falls back to last update, then creation). */
export const closeTimeOf = (d: Deal) =>
  toTime(d.actualCloseDate) ?? toTime(d.closedAt) ?? toTime(d.updatedAt) ?? toTime(d.createdAt);

const touchTimeOf = (d: Deal): number | null =>
  Math.max(toTime(d.updatedAt) ?? 0, toTime(d.createdAt) ?? 0, toTime(d.actualCloseDate) ?? 0) ||
  null;

export interface DealTotals {
  activeCount: number;
  activeValue: number;
  wonCount: number;
  wonValue: number;
  lostCount: number;
  lostValue: number;
  avgActiveDealSize: number;
  avgWonDealSize: number;
}

export function computeDealTotals(deals: Deal[]): DealTotals {
  const active = deals.filter(isActiveDeal);
  const won = deals.filter(isWonDeal);
  const lost = deals.filter(isLostDeal);
  const activeValue = sum(active);
  const wonValue = sum(won);
  return {
    activeCount: active.length,
    activeValue,
    wonCount: won.length,
    wonValue,
    lostCount: lost.length,
    lostValue: sum(lost),
    avgActiveDealSize: active.length ? activeValue / active.length : 0,
    avgWonDealSize: won.length ? wonValue / won.length : 0,
  };
}

/** Percent change from `prev` to `cur`; null when either is unknown or `prev` is 0. */
export function pctChange(cur: number | null, prev: number | null): number | null {
  if (cur === null || prev === null || prev === 0) return null;
  return ((cur - prev) / Math.abs(prev)) * 100;
}

/** Items whose `getTime` falls in (now - (offset+days) days, now - offset days]. */
export function inWindowBy<T>(
  items: T[],
  getTime: (i: T) => number | null,
  now: number,
  days: number,
  offsetDays = 0
): T[] {
  const end = now - offsetDays * DAY_MS;
  const start = end - days * DAY_MS;
  return items.filter((i) => {
    const t = getTime(i);
    return t !== null && t > start && t <= end;
  });
}

/**
 * Period-over-period change of `metric` over deals created in the last `days` days vs the `days`
 * before that. Null when the previous period has nothing to compare against.
 */
export function createdPeriodChange(
  deals: Deal[],
  metric: (cohort: Deal[]) => number | null,
  now: number = Date.now(),
  days = 30
): number | null {
  const createdAt = (d: Deal) => toTime(d.createdAt);
  const cur = inWindowBy(deals, createdAt, now, days, 0);
  const prev = inWindowBy(deals, createdAt, now, days, days);
  return pctChange(metric(cur), metric(prev));
}

/** Deals relevant to the trailing `rangeDays`: touched in range. Sample deals are always kept. */
export function dealsInPeriod(deals: Deal[], rangeDays: number, now: number = Date.now()): Deal[] {
  return deals.filter((d) => {
    if (d.isDemo) return true;
    const t = touchTimeOf(d);
    return t !== null && t <= now && t > now - rangeDays * DAY_MS;
  });
}

export interface TrendPoint {
  month: string;
  revenue: number;
  deals: number;
  pipeline: number;
}

const label = (t: number) =>
  new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

/**
 * Deterministic series across the trailing `rangeDays`: revenue / count of deals won in each
 * bucket (by close date) and value of active deals created in each bucket.
 */
export function trendSeries(
  deals: Deal[],
  rangeDays: number,
  now: number = Date.now()
): TrendPoint[] {
  const size = bucketDays(rangeDays) * DAY_MS;
  const count = Math.ceil(rangeDays / bucketDays(rangeDays));
  const start = now - count * size;
  const points: TrendPoint[] = Array.from({ length: count }, (_, i) => ({
    month: label(start + (i + 1) * size),
    revenue: 0,
    deals: 0,
    pipeline: 0,
  }));
  const idxOf = (t: number | null) =>
    t === null || t > now || t <= start ? -1 : Math.min(count - 1, Math.floor((t - start) / size));
  for (const d of deals) {
    if (isWonDeal(d)) {
      const i = idxOf(closeTimeOf(d));
      if (i >= 0) {
        points[i].revenue += num(d.value);
        points[i].deals += 1;
      }
    } else if (isActiveDeal(d)) {
      const i = idxOf(toTime(d.createdAt));
      if (i >= 0) points[i].pipeline += num(d.value);
    }
  }
  return points;
}

/** Open pipeline value per month of expected close (falls back to due date, then creation). */
export function pipelineByMonth(
  deals: Deal[]
): Array<{ key: string; month: string; value: number }> {
  const totals = new Map<string, number>();
  for (const d of deals) {
    if (!isActiveDeal(d)) continue;
    const t = toTime(d.dueDate) ?? toTime(d.expectedCloseDate) ?? toTime(d.createdAt);
    if (t === null) continue;
    const dt = new Date(t);
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
    totals.set(key, (totals.get(key) ?? 0) + num(d.value));
  }
  return [...totals.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, value]) => {
      const [y, m] = key.split('-').map(Number);
      return {
        key,
        value,
        month: new Date(y, m - 1, 1).toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric',
        }),
      };
    });
}

export interface QuickStats {
  topDealValue: number | null;
  avgDaysToClose: number | null;
  winRate: number | null;
}

export function quickStats(deals: Deal[]): QuickStats {
  const won = deals.filter(isWonDeal);
  const lost = deals.filter(isLostDeal);
  const cycles = won.flatMap((d) => {
    const c = closeTimeOf(d);
    const s = toTime(d.createdAt);
    return c !== null && s !== null && c >= s ? [(c - s) / DAY_MS] : [];
  });
  return {
    topDealValue: deals.length ? Math.max(...deals.map((d) => num(d.value))) : null,
    avgDaysToClose: avg(cycles),
    winRate: won.length + lost.length ? (won.length / (won.length + lost.length)) * 100 : null,
  };
}

/** "+12%" / "-3%" label; null (badge hidden) when the change is not computable. */
export function formatChange(change: number | null): string | null {
  if (change === null || !Number.isFinite(change)) return null;
  const r = Math.round(change * 10) / 10;
  return `${r > 0 ? '+' : ''}${r}%`;
}
