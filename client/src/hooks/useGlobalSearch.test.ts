import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const rpc = vi.fn();
vi.mock('../lib/supabase', () => ({ supabase: { rpc: (...a: unknown[]) => rpc(...a) } }));
import { groupSearchResults, recordPath, useGlobalSearch } from './useGlobalSearch';

const r = (object_type: string, record_id: string, rank: number) => ({ object_type, record_id, title: record_id, subtitle: null, rank });

describe('groupSearchResults', () => {
  it('groups in stable order and sorts by rank', () => {
    const g = groupSearchResults([r('task', 't', 1), r('deal', 'd1', 0.2), r('contact', 'c', 0.5), r('deal', 'd2', 0.9)]);
    expect(g.map((x) => x.label)).toEqual(['Contacts', 'Deals', 'Tasks']);
    expect(g[1].results.map((x) => x.record_id)).toEqual(['d2', 'd1']);
  });
  it('builds record paths', () => {
    expect(recordPath('contact', '5')).toBe('/contacts/5');
    expect(recordPath('company', 'abc-1')).toBe('/companies/abc-1');
    expect(recordPath('deal', '9')).toBe('/deals/9');
    expect(recordPath('task', '3')).toBe('/tasks');
    expect(recordPath('weird', '3')).toBe('/');
  });
});

describe('useGlobalSearch debounce', () => {
  beforeEach(() => { rpc.mockReset(); rpc.mockResolvedValue({ data: [r('contact', '1', 1)], error: null }); });
  it('calls rpc once after the debounce delay', async () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ q }) => useGlobalSearch(q, { delay: 200 }), { initialProps: { q: '' } });
    rerender({ q: 'jo' });
    rerender({ q: 'joh' });
    expect(rpc).not.toHaveBeenCalled();
    await act(async () => { await vi.advanceTimersByTimeAsync(250); });
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith('global_search', { q: 'joh', lim: 20 });
    expect(result.current.groups[0].objectType).toBe('contact');
    vi.useRealTimers();
  });
  it('skips queries shorter than 2 chars', async () => {
    vi.useFakeTimers();
    renderHook(() => useGlobalSearch('a', { delay: 10 }));
    await act(async () => { await vi.advanceTimersByTimeAsync(50); });
    expect(rpc).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});
