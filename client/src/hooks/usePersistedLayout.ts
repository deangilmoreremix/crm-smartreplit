import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

const TABLE = 'user_ui_preferences';
const DEBOUNCE_MS = 600;

const cacheKey = (kind: string, key: string) => `ui-pref:${kind}:${key}`;

function readCache<T>(kind: string, key: string): T | undefined {
  try {
    const raw = localStorage.getItem(cacheKey(kind, key));
    return raw === null ? undefined : (JSON.parse(raw) as T);
  } catch {
    return undefined;
  }
}

function writeCache(kind: string, key: string, value: unknown) {
  try {
    localStorage.setItem(cacheKey(kind, key), JSON.stringify(value));
  } catch {
    /* storage unavailable: the server copy still persists */
  }
}

/**
 * Per-user UI state (record layouts, dashboard layouts, ...) stored as JSON in
 * `user_ui_preferences (user_id, kind, key, value)`.
 * localStorage is an offline cache (read synchronously for the first render); writes are
 * debounced upserts. Signed-out users keep the cached value only.
 */
export function usePersistedLayout<T>(kind: string, key: string, defaultValue: T) {
  const [value, setValueState] = useState<T>(() => readCache<T>(kind, key) ?? defaultValue);
  const [loading, setLoading] = useState(true);
  const latest = useRef<T>(value);
  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (!dirty.current) return;
    dirty.current = false;
    try {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      await supabase
        .from(TABLE)
        .upsert(
          { user_id: data.user.id, kind, key, value: latest.current, updated_at: new Date().toISOString() },
          { onConflict: 'user_id,kind,key' }
        );
    } catch {
      dirty.current = true; // retry on the next change/unmount
    }
  }, [kind, key]);

  // Load the server copy (it wins over the cache unless the user already edited locally).
  useEffect(() => {
    let cancelled = false;
    latest.current = readCache<T>(kind, key) ?? defaultValue;
    setValueState(latest.current);
    setLoading(true);
    (async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        if (!auth.user) return;
        const { data } = await supabase
          .from(TABLE)
          .select('value')
          .eq('kind', kind)
          .eq('key', key)
          .maybeSingle();
        if (!cancelled && data && !dirty.current) {
          latest.current = data.value as T;
          setValueState(latest.current);
          writeCache(kind, key, latest.current);
        }
      } catch {
        /* offline: keep the cached value */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // defaultValue is intentionally not a dependency: it is only the initial fallback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, key]);

  useEffect(() => () => void flush(), [flush]);

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      const resolved = typeof next === 'function' ? (next as (p: T) => T)(latest.current) : next;
      latest.current = resolved;
      dirty.current = true;
      setValueState(resolved);
      writeCache(kind, key, resolved);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), DEBOUNCE_MS);
    },
    [kind, key, flush]
  );

  return { value, setValue, loading };
}
