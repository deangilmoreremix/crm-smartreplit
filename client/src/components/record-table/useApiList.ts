import { useCallback, useEffect, useState } from 'react';

/** Loads a JSON array from a REST endpoint; `patchRow` merges server-confirmed edits into local state. */
export function useApiList<T extends { id: number | string }>(url: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      setData((await res.json()) as T[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    void load();
  }, [load]);

  const patchRow = useCallback(
    async (row: T, updates: Record<string, unknown>, basePath = url) => {
      const res = await fetch(`${basePath}/${row.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const updated = (await res.json()) as Partial<T>;
      setData((prev) => prev.map((r) => (r.id === row.id ? { ...r, ...updated } : r)));
    },
    [url]
  );

  return { data, loading, error, reload: load, patchRow };
}
