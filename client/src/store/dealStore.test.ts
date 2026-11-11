import { describe, it, expect, vi, beforeEach } from 'vitest';

const toastMock = vi.fn();
vi.mock('../hooks/use-toast', () => ({ toast: (...a: unknown[]) => toastMock(...a) }));

import { useDealStore, fromApiDeal } from './dealStore';

const row = { id: 7, title: 'Big deal', value: '1200.50', stage: 'proposal', probability: 40, contactId: 3 };

describe('dealStore server sync', () => {
  beforeEach(() => {
    toastMock.mockReset();
    vi.stubGlobal('fetch', vi.fn());
    const stages = useDealStore.getState().pipelines.default.stages;
    useDealStore.setState({ deals: [fromApiDeal(row, stages)], error: null });
  });

  it('fetchDeals loads rows from /api/deals', async () => {
    (fetch as any).mockResolvedValue({ ok: true, json: async () => [row, { ...row, id: 8, stage: 'lead' }] });
    await useDealStore.getState().fetchDeals();
    const { deals } = useDealStore.getState();
    expect(deals.map((d) => [d.id, d.stage.id, d.value])).toEqual([
      ['7', 'proposal', 1200.5],
      ['8', 'qualification', 1200.5],
    ]);
  });

  it('moveDeal persists only changed fields via PUT', async () => {
    (fetch as any).mockResolvedValue({ ok: true, json: async () => ({}) });
    await useDealStore.getState().moveDeal('7', 'negotiation');
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = (fetch as any).mock.calls[0];
    expect(url).toBe('/api/deals/7');
    expect(init.method).toBe('PUT');
    expect(JSON.parse(init.body)).toEqual({ stage: 'negotiation', probability: 70 });
    expect(useDealStore.getState().deals[0].stage.id).toBe('negotiation');
    expect(toastMock).not.toHaveBeenCalled();
  });

  it('moveDeal uses API stage vocabulary and skips no-op moves', async () => {
    (fetch as any).mockResolvedValue({ ok: true });
    await useDealStore.getState().moveDeal('7', 'proposal');
    expect(fetch).not.toHaveBeenCalled();
    await useDealStore.getState().moveDeal('7', 'qualification');
    expect(JSON.parse((fetch as any).mock.calls[0][1].body).stage).toBe('qualified');
  });

  it('rolls back and toasts when the server rejects', async () => {
    (fetch as any).mockResolvedValue({ ok: false, status: 500 });
    await useDealStore.getState().moveDeal('7', 'closed-won');
    const d = useDealStore.getState().deals[0];
    expect(d.stage.id).toBe('proposal');
    expect(d.probability).toBe(40);
    expect(useDealStore.getState().error).toMatch(/Could not move deal/);
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ variant: 'destructive' }));
  });

  it('rolls back on network failure', async () => {
    (fetch as any).mockRejectedValue(new Error('offline'));
    await useDealStore.getState().moveDeal('7', 'negotiation');
    expect(useDealStore.getState().deals[0].stage.id).toBe('proposal');
    expect(toastMock).toHaveBeenCalled();
  });

  it('does not call the server for locally created deals', async () => {
    const deal = { ...useDealStore.getState().deals[0], id: 'deal_123' };
    useDealStore.setState({ deals: [deal] });
    await useDealStore.getState().moveDeal('deal_123', 'negotiation');
    expect(fetch).not.toHaveBeenCalled();
    expect(useDealStore.getState().deals[0].stage.id).toBe('negotiation');
  });
});
