import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

export function useThrottle<T>(value: T, interval: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastUpdated = useRef<number>(Date.now());

  useEffect(() => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdated.current;

    if (timeSinceLastUpdate >= interval) {
      setThrottledValue(value);
      lastUpdated.current = now;
    } else {
      const timer = setTimeout(() => {
        setThrottledValue(value);
        lastUpdated.current = Date.now();
      }, interval - timeSinceLastUpdate);

      return () => clearTimeout(timer);
    }
  }, [value, interval]);

  return throttledValue;
}

export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  interval: number
): (...args: Parameters<T>) => void {
  const lastCalled = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingArgs = useRef<Parameters<T> | null>(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastCall = now - lastCalled.current;

      if (timeSinceLastCall >= interval) {
        lastCalled.current = now;
        callbackRef.current(...args);
      } else {
        pendingArgs.current = args;
        if (!timeoutRef.current) {
          timeoutRef.current = setTimeout(() => {
            if (pendingArgs.current) {
              lastCalled.current = Date.now();
              callbackRef.current(...pendingArgs.current);
              pendingArgs.current = null;
            }
            timeoutRef.current = null;
          }, interval - timeSinceLastCall);
        }
      }
    },
    [interval]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return throttledCallback;
}

export interface MemoizedFilterOptions<T> {
  keyExtractor: (item: T) => string | number;
  comparator?: (a: T, b: T) => boolean;
}

export function memoizedFilter<T>(
  items: T[],
  predicate: (item: T, index: number) => boolean,
  options?: MemoizedFilterOptions<T>
): T[] {
  const cache = useMemo(() => {
    const filtered: T[] = [];
    for (let i = 0; i < items.length; i++) {
      if (predicate(items[i], i)) {
        filtered.push(items[i]);
      }
    }
    return filtered;
  }, [items, predicate]);

  return cache;
}

export function createMemoizedSearch<T>(
  items: T[],
  searchFn: (item: T, searchTerm: string) => boolean
): (searchTerm: string) => T[] {
  const cache = new Map<string, T[]>();

  return (searchTerm: string): T[] => {
    if (!searchTerm.trim()) {
      return items;
    }

    const normalizedTerm = searchTerm.toLowerCase().trim();

    if (cache.has(normalizedTerm)) {
      return cache.get(normalizedTerm)!;
    }

    const results = items.filter((item) => searchFn(item, normalizedTerm));
    cache.set(normalizedTerm, results);

    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      if (firstKey !== undefined) {
        cache.delete(firstKey);
      }
    }

    return results;
  };
}

export function useMemoizedComparison<T>(
  items: T[],
  keySelector: (item: T) => string
): Map<string, T> {
  return useMemo(() => {
    const map = new Map<string, T>();
    for (const item of items) {
      map.set(keySelector(item), item);
    }
    return map;
  }, [items, keySelector]);
}

export function useStableCallback<T extends (...args: any[]) => any>(callback: T): T {
  const callbackRef = useRef(callback);
  const stableCallbackRef = useRef<T | null>(null);

  if (!stableCallbackRef.current) {
    stableCallbackRef.current = (...args: Parameters<T>) => {
      return callbackRef.current(...args);
    };
  }

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return stableCallbackRef.current;
}
