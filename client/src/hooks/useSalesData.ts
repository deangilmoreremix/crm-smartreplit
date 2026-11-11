import { useCallback, useEffect, useRef, useState } from 'react';
import type { ApiDeal } from '../components/dashboard/chartData';

export interface ApiContact {
  id: number | string;
  firstName?: string | null;
  lastName?: string | null;
}

export interface SalesData {
  deals: ApiDeal[];
  contacts: ApiContact[];
  loading: boolean;
  error: string | null;
}

interface SalesPayload {
  deals: ApiDeal[];
  contacts: ApiContact[];
}

/** How long a successful load is reused before the next mount refetches. */
export const SALES_DATA_TTL_MS = 30_000;

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json() as Promise<T>;
}

// Module-level cache shared by every consumer (ChartsSection, SalesPipelineDealAnalytics, ...).
let cache: { at: number; data: SalesPayload } | null = null;
let inflight: Promise<SalesPayload> | null = null;
/** Bumped by every forced load; a response that finished under an older generation is not cached. */
let generation = 0;

type Update = { type: 'loading' } | { type: 'data'; data: SalesPayload } | { type: 'error'; message: string };
const subscribers = new Set<(u: Update) => void>();

function startFetch(): Promise<SalesPayload> {
  const gen = generation;
  const promise: Promise<SalesPayload> = Promise.all([
    getJson<ApiDeal[]>('/api/deals'),
    getJson<ApiContact[]>('/api/contacts').catch(() => [] as ApiContact[]),
  ])
    .then(([deals, contacts]) => {
      const data = { deals, contacts };
      if (gen === generation) cache = { at: Date.now(), data };
      return data;
    })
    .finally(() => {
      if (inflight === promise) inflight = null;
    });
  inflight = promise;
  return promise;
}

/** Cached (30s) and de-duplicated load of /api/deals + /api/contacts. `force` bypasses both. */
export function loadSalesData(force = false): Promise<SalesPayload> {
  if (force) {
    generation += 1;
    cache = null;
    return startFetch();
  }
  if (cache && Date.now() - cache.at < SALES_DATA_TTL_MS) return Promise.resolve(cache.data);
  return inflight ?? startFetch();
}

/** Forced reload that every mounted consumer picks up (one request, however many consumers). */
function refreshAll(): Promise<void> {
  subscribers.forEach((s) => s({ type: 'loading' }));
  return loadSalesData(true).then(
    (data) => subscribers.forEach((s) => s({ type: 'data', data })),
    (e) => subscribers.forEach((s) => s({ type: 'error', message: e instanceof Error ? e.message : 'Failed to load' }))
  );
}

const onDealsChanged = () => {
  void refreshAll();
};

function subscribe(fn: (u: Update) => void) {
  if (subscribers.size === 0 && typeof window !== 'undefined') {
    window.addEventListener('dealsChanged', onDealsChanged);
  }
  subscribers.add(fn);
  return () => {
    subscribers.delete(fn);
    if (subscribers.size === 0 && typeof window !== 'undefined') {
      window.removeEventListener('dealsChanged', onDealsChanged);
    }
  };
}

/** Test helper: forget the cache and any in-flight request. */
export function resetSalesDataCache() {
  cache = null;
  inflight = null;
  generation += 1;
}

/** Deals and contacts from the CRM API (no local/sample data), shared across all callers. */
export function useSalesData(): SalesData & { refetch: () => Promise<void> } {
  const [state, setState] = useState<SalesData>({ deals: [], contacts: [], loading: true, error: null });
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const unsubscribe = subscribe((u) => {
      if (!mounted.current) return;
      if (u.type === 'loading') setState((s) => ({ ...s, loading: true, error: null }));
      else if (u.type === 'data') setState({ ...u.data, loading: false, error: null });
      else setState({ deals: [], contacts: [], loading: false, error: u.message });
    });
    loadSalesData().then(
      (data) => mounted.current && setState({ ...data, loading: false, error: null }),
      (e) =>
        mounted.current &&
        setState({ deals: [], contacts: [], loading: false, error: e instanceof Error ? e.message : 'Failed to load' })
    );
    return () => {
      mounted.current = false;
      unsubscribe();
    };
  }, []);

  const refetch = useCallback(() => refreshAll(), []);
  return { ...state, refetch };
}
