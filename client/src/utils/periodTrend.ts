// Period-over-period helpers computed from real timestamps only.
// A change is returned only when the previous period has data; otherwise null (hide the badge).

const DAY_MS = 24 * 60 * 60 * 1000;

type DateLike = Date | string | number | undefined | null;

const toMs = (d: DateLike): number | null => {
  if (d === undefined || d === null) return null;
  const ms = new Date(d).getTime();
  return Number.isNaN(ms) ? null : ms;
};

/** Split items into the last `days` days and the `days` before that, by `getDate`. */
export function splitPeriods<T>(
  items: T[],
  getDate: (item: T) => DateLike,
  days = 30,
  now = Date.now()
): { current: T[]; previous: T[] } {
  const current: T[] = [];
  const previous: T[] = [];
  const span = days * DAY_MS;
  for (const item of items) {
    const ms = toMs(getDate(item));
    if (ms === null) continue;
    const age = now - ms;
    if (age >= 0 && age < span) current.push(item);
    else if (age >= span && age < 2 * span) previous.push(item);
  }
  return { current, previous };
}

/** Rounded percent change, or null when there is no prior data (previous is null/0). */
export function percentChange(current: number, previous: number | null): number | null {
  if (previous === null || previous === 0 || !Number.isFinite(previous)) return null;
  return Math.round(((current - previous) / Math.abs(previous)) * 100);
}

export function formatChange(change: number | null): { text: string; trend: 'up' | 'down' } | null {
  if (change === null) return null;
  return { text: `${change > 0 ? '+' : ''}${change}%`, trend: change >= 0 ? 'up' : 'down' };
}

export interface DealLike {
  value: number;
  stage: unknown;
  createdAt?: DateLike;
  updatedAt?: DateLike;
  closedAt?: DateLike;
  actualCloseDate?: DateLike;
}

export const isWon = (d: DealLike) => String(d.stage) === 'closed-won';

/** Date a won deal was closed: real close date when present, else last update. */
export const wonDate = (d: DealLike): DateLike => d.actualCloseDate ?? d.closedAt ?? d.updatedAt;

const sum = (ds: DealLike[]) => ds.reduce((s, d) => s + d.value, 0);

/** Percent change of an aggregate between periods; null unless both periods have deals. */
const aggChange = (cur: DealLike[], prev: DealLike[], agg: (ds: DealLike[]) => number) =>
  cur.length && prev.length ? percentChange(agg(cur), agg(prev)) : null;

/**
 * Last 30 days vs the 30 days before, per KPI. "new*" use deals by createdAt,
 * "won*" use won deals by close date. null = no prior data (hide the badge).
 */
export function dealPeriodChanges(deals: DealLike[], now = Date.now()) {
  const created = splitPeriods(deals, (d) => d.createdAt, 30, now);
  const won = splitPeriods(deals.filter(isWon), wonDate, 30, now);
  const mean = (ds: DealLike[]) => sum(ds) / ds.length;
  const winRate = (ds: DealLike[]) => ds.filter(isWon).length / ds.length;
  return {
    newDeals: percentChange(created.current.length, created.previous.length),
    newPipelineValue: aggChange(created.current, created.previous, sum),
    avgNewDealSize: aggChange(created.current, created.previous, mean),
    winRateOfNew: aggChange(created.current, created.previous, winRate),
    wonDeals: percentChange(won.current.length, won.previous.length),
    wonRevenue: aggChange(won.current, won.previous, sum),
    avgWonDealSize: aggChange(won.current, won.previous, mean),
  };
}
