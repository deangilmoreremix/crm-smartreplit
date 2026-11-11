import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { SALES_DATA_TTL_MS, resetSalesDataCache, useSalesData } from '../useSalesData';

const deals = [{ id: 1, value: 10, stage: 'proposal' }];
const contacts = [{ id: 1, firstName: 'A' }];

describe('useSalesData', () => {
  const fetchMock = vi.fn();
  const calls = (path: string) => fetchMock.mock.calls.filter(([u]) => u === path).length;

  beforeEach(() => {
    resetSalesDataCache();
    fetchMock.mockReset();
    fetchMock.mockImplementation(async (url: string) => ({
      ok: true,
      status: 200,
      json: async () => (url === '/api/deals' ? deals : contacts),
    }));
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('two consumers issue one /api/deals and one /api/contacts fetch', async () => {
    const a = renderHook(() => useSalesData());
    const b = renderHook(() => useSalesData());
    await waitFor(() => expect(a.result.current.loading).toBe(false));
    await waitFor(() => expect(b.result.current.loading).toBe(false));
    expect(a.result.current.deals).toEqual(deals);
    expect(b.result.current.contacts).toEqual(contacts);
    expect(calls('/api/deals')).toBe(1);
    expect(calls('/api/contacts')).toBe(1);
  });

  it('reuses the cache for 30s, then refetches', async () => {
    const first = renderHook(() => useSalesData());
    await waitFor(() => expect(first.result.current.loading).toBe(false));
    first.unmount();

    const second = renderHook(() => useSalesData());
    await waitFor(() => expect(second.result.current.loading).toBe(false));
    expect(calls('/api/deals')).toBe(1);
    second.unmount();

    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now + SALES_DATA_TTL_MS + 1);
    const third = renderHook(() => useSalesData());
    await waitFor(() => expect(third.result.current.loading).toBe(false));
    expect(calls('/api/deals')).toBe(2);
    vi.restoreAllMocks();
  });

  it('refetch() bypasses the cache and updates every consumer with a single request', async () => {
    const a = renderHook(() => useSalesData());
    const b = renderHook(() => useSalesData());
    await waitFor(() => expect(a.result.current.loading).toBe(false));
    deals.push({ id: 2, value: 20, stage: 'lead' });
    await act(async () => {
      await a.result.current.refetch();
    });
    expect(calls('/api/deals')).toBe(2);
    expect(a.result.current.deals).toHaveLength(2);
    expect(b.result.current.deals).toHaveLength(2);
    deals.pop();
  });

  it("reloads once on the window 'dealsChanged' event", async () => {
    const a = renderHook(() => useSalesData());
    const b = renderHook(() => useSalesData());
    await waitFor(() => expect(a.result.current.loading).toBe(false));
    await act(async () => {
      window.dispatchEvent(new CustomEvent('dealsChanged'));
    });
    await waitFor(() => expect(calls('/api/deals')).toBe(2));
    expect(b.result.current.loading).toBe(false);
  });

  it('reports errors and does not cache them', async () => {
    fetchMock.mockImplementation(async () => ({ ok: false, status: 500, json: async () => ({}) }));
    const a = renderHook(() => useSalesData());
    await waitFor(() => expect(a.result.current.error).toBe('Request failed (500)'));
    a.unmount();

    fetchMock.mockImplementation(async (url: string) => ({
      ok: true,
      status: 200,
      json: async () => (url === '/api/deals' ? deals : contacts),
    }));
    const b = renderHook(() => useSalesData());
    await waitFor(() => expect(b.result.current.loading).toBe(false));
    expect(b.result.current.error).toBeNull();
    expect(b.result.current.deals).toEqual(deals);
  });
});
