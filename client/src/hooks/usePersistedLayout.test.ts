import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const upsert = vi.fn().mockResolvedValue({ error: null });
const maybeSingle = vi.fn();
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
    from: () => ({
      upsert,
      select: () => ({ eq: () => ({ eq: () => ({ maybeSingle }) }) }),
    }),
  },
}));

import { usePersistedLayout } from './usePersistedLayout';

describe('usePersistedLayout', () => {
  beforeEach(() => {
    localStorage.clear();
    upsert.mockClear();
    maybeSingle.mockReset();
    maybeSingle.mockResolvedValue({ data: null });
  });
  afterEach(() => vi.useRealTimers());

  it('starts from the default, then adopts the server value and caches it', async () => {
    maybeSingle.mockResolvedValue({ data: { value: { order: ['b', 'a'] } } });
    const { result } = renderHook(() => usePersistedLayout('record', 'contact', { order: ['a', 'b'] }));
    expect(result.current.value).toEqual({ order: ['a', 'b'] });
    await act(async () => {});
    expect(result.current.value).toEqual({ order: ['b', 'a'] });
    expect(result.current.loading).toBe(false);
    expect(JSON.parse(localStorage.getItem('ui-pref:record:contact')!)).toEqual({ order: ['b', 'a'] });
  });

  it('reads the offline cache synchronously', () => {
    localStorage.setItem('ui-pref:record:contact', JSON.stringify({ order: ['z'] }));
    const { result } = renderHook(() => usePersistedLayout('record', 'contact', { order: [] as string[] }));
    expect(result.current.value).toEqual({ order: ['z'] });
  });

  it('debounces upserts into a single write with the latest value', async () => {
    const { result } = renderHook(() => usePersistedLayout('dash', 'main', 0));
    await act(async () => {});
    vi.useFakeTimers();
    act(() => {
      result.current.setValue(1);
      result.current.setValue((p) => p + 1);
    });
    expect(upsert).not.toHaveBeenCalled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(700);
    });
    expect(upsert).toHaveBeenCalledTimes(1);
    expect(upsert.mock.calls[0][0]).toMatchObject({ user_id: 'u1', kind: 'dash', key: 'main', value: 2 });
    expect(upsert.mock.calls[0][1]).toEqual({ onConflict: 'user_id,kind,key' });
  });
});
