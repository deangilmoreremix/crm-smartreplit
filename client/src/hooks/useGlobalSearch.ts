import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface SearchResult {
  object_type: string;
  record_id: string;
  title: string;
  subtitle: string | null;
  rank: number;
}

export interface SearchGroup {
  objectType: string;
  label: string;
  results: SearchResult[];
}

const LABELS: Record<string, string> = {
  contact: 'Contacts',
  deal: 'Deals',
  task: 'Tasks',
  company: 'Companies',
};
const ORDER = ['contact', 'company', 'deal', 'task'];

export const objectLabel = (type: string) => LABELS[type] ?? `${type.charAt(0).toUpperCase()}${type.slice(1)}s`;

/** Route for a record; used with react-router navigate(). */
export function recordPath(objectType: string, recordId: string): string {
  switch (objectType) {
    case 'contact':
      return `/contacts/${encodeURIComponent(recordId)}`;
    case 'deal':
      return `/deals/${encodeURIComponent(recordId)}`;
    case 'task':
      return `/tasks?id=${encodeURIComponent(recordId)}`;
    case 'company':
      return `/companies/${encodeURIComponent(recordId)}`;
    default:
      return '/';
  }
}

/** Group by object type in a stable order; within a group keep highest rank first. */
export function groupSearchResults(results: SearchResult[]): SearchGroup[] {
  const map = new Map<string, SearchResult[]>();
  for (const r of results) {
    const list = map.get(r.object_type) ?? [];
    list.push(r);
    map.set(r.object_type, list);
  }
  const types = [...map.keys()].sort((a, b) => {
    const ia = ORDER.indexOf(a);
    const ib = ORDER.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.localeCompare(b);
  });
  return types.map((objectType) => ({
    objectType,
    label: objectLabel(objectType),
    results: (map.get(objectType) as SearchResult[]).slice().sort((a, b) => b.rank - a.rank),
  }));
}

export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function useGlobalSearch(query: string, { delay = 200, limit = 20 } = {}) {
  const debounced = useDebouncedValue(query.trim(), delay);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (debounced.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    Promise.resolve(supabase.rpc('global_search', { q: debounced, lim: limit }))
      .then(({ data, error }) => {
        if (cancelled) return;
        setResults(error ? [] : ((data as SearchResult[]) ?? []));
      })
      .catch(() => {
        if (!cancelled) setResults([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debounced, limit]);

  return { results, groups: groupSearchResults(results), loading, debouncedQuery: debounced };
}
