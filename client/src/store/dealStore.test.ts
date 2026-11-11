import { describe, it, expect, vi, beforeEach } from 'vitest';

const toastMock = vi.fn();
vi.mock('../hooks/use-toast', () => ({ toast: (...a: unknown[]) => toastMock(...a) }));

import { useDealStore, fromApiDeal, toApiStage } from './dealStore';
import { DEMO_DEALS } from '../data/demoData';

const row = { id: 7, title: 'Big deal', value: '1200.50', stage: 'proposal', probability: 40, contactId: 3 };

describe('dealStore server sync', () => {
  beforeEach(() => {
    toastMock.mockReset();
    vi.stubGlobal('fetch', vi.fn());
    const stages = useDealStore.getState().pipelines.default.stages;
    useDealStore.setState({ realDeals: [fromApiDeal(row, stages)], demoEnabled: false, error: null });
  });

  it('fetchDeals loads rows from /api/deals', async () => {
    (fetch as any).mockResolvedValue({ ok: true, json: async () => [row, { ...row, id: 8, stage: 'lead' }] });
    await useDealStore.getState().fetchDeals();
    const { realDeals: deals } = useDealStore.getState();
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
    expect(useDealStore.getState().realDeals[0].stage.id).toBe('negotiation');
    expect(toastMock).not.toHaveBeenCalled();
  });

  it('moving to closed-won/lost sends status won/lost, and back out sends open', async () => {
    (fetch as any).mockResolvedValue({ ok: true, json: async () => ({}) });
    await useDealStore.getState().moveDeal('7', 'closed-won');
    expect(JSON.parse((fetch as any).mock.calls[0][1].body)).toMatchObject({ stage: 'closed-won', status: 'won' });
    await useDealStore.getState().moveDeal('7', 'closed-lost');
    expect(JSON.parse((fetch as any).mock.calls[1][1].body).status).toBe('lost');
    await useDealStore.getState().moveDeal('7', 'proposal');
    expect(JSON.parse((fetch as any).mock.calls[2][1].body).status).toBe('open');
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
    const d = useDealStore.getState().realDeals[0];
    expect(d.stage.id).toBe('proposal');
    expect(d.probability).toBe(40);
    expect(useDealStore.getState().error).toMatch(/Could not move deal/);
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ variant: 'destructive' }));
  });

  it('rolls back on network failure', async () => {
    (fetch as any).mockRejectedValue(new Error('offline'));
    await useDealStore.getState().moveDeal('7', 'negotiation');
    expect(useDealStore.getState().realDeals[0].stage.id).toBe('proposal');
    expect(toastMock).toHaveBeenCalled();
  });

  it('deleteDeal removes the deal and sends DELETE for server-backed deals', async () => {
    (fetch as any).mockResolvedValue({ ok: true, json: async () => ({}) });
    await useDealStore.getState().deleteDeal('7');
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = (fetch as any).mock.calls[0];
    expect(url).toBe('/api/deals/7');
    expect(init.method).toBe('DELETE');
    expect(useDealStore.getState().realDeals).toHaveLength(0);
    expect(toastMock).not.toHaveBeenCalled();
  });

  it('deleteDeal restores the deal and toasts when the server rejects', async () => {
    (fetch as any).mockResolvedValue({ ok: false, status: 500 });
    await useDealStore.getState().deleteDeal('7');
    expect(useDealStore.getState().realDeals.map((d) => d.id)).toEqual(['7']);
    expect(useDealStore.getState().deals.map((d) => d.id)).toEqual(['7']);
    expect(toastMock).toHaveBeenCalledTimes(1);
  });

  it('deleteDeal on a sample or local deal makes no network call', async () => {
    useDealStore.setState({ demoEnabled: true });
    await useDealStore.getState().deleteDeal(DEMO_DEALS[0].id);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('does not call the server for locally created deals', async () => {
    const deal = { ...useDealStore.getState().realDeals[0], id: 'deal_123' };
    useDealStore.setState({ realDeals: [deal] });
    await useDealStore.getState().moveDeal('deal_123', 'negotiation');
    expect(fetch).not.toHaveBeenCalled();
    expect(useDealStore.getState().realDeals[0].stage.id).toBe('negotiation');
  });
});

describe('dealStore demo (sample) deals', () => {
  beforeEach(() => {
    toastMock.mockReset();
    vi.stubGlobal('fetch', vi.fn());
    const stages = useDealStore.getState().pipelines.default.stages;
    useDealStore.setState({
      realDeals: [fromApiDeal(row, stages)],
      demoDeals: DEMO_DEALS.map((d) => ({ ...d })),
      demoEnabled: true,
      error: null,
      filters: {},
    });
  });

  it('keeps `realDeals` real-only, `deals` merged, and demo- ids flagged isDemo', () => {
    expect(useDealStore.getState().realDeals.map((d) => d.id)).toEqual(['7']);
    expect(useDealStore.getState().deals.map((d) => d.id)).toEqual(['7', 'demo-1', 'demo-2', 'demo-3', 'demo-4']);
    expect(DEMO_DEALS.map((d) => d.id)).toEqual(['demo-1', 'demo-2', 'demo-3', 'demo-4']);
    expect(DEMO_DEALS.every((d) => d.isDemo)).toBe(true);
  });

  it('includes demo deals in getters when demoEnabled', () => {
    const s = useDealStore.getState();
    expect(s.getFilteredDeals().map((d) => d.id).sort()).toEqual(['7', 'demo-1', 'demo-2', 'demo-3', 'demo-4']);
    expect(s.getSalesMetrics().totalDeals).toBe(5);
    // open pipeline: real 1200.5 + demo 75000 + 45000 + 25000
    expect(s.getTotalPipelineValue()).toBeCloseTo(146200.5);
    expect(s.getStageValues()['closed-won']).toBe(120000);
    expect(s.getSalesMetrics().wonValue).toBe(120000);
    expect((s.calculateForecast() as any).totalPipeline).toBeCloseTo(146200.5);
    expect(s.getSalesVelocity()).toBeCloseTo(4000);
  });

  it('excludes demo deals from every getter when disabled', () => {
    useDealStore.getState().setDemoEnabled(false);
    const s = useDealStore.getState();
    expect(s.getFilteredDeals().map((d) => d.id)).toEqual(['7']);
    expect(s.getSalesMetrics().totalDeals).toBe(1);
    expect(s.getTotalPipelineValue()).toBeCloseTo(1200.5);
    expect(s.getStageValues()['closed-won']).toBe(0);
    expect((s.calculateForecast() as any).totalPipeline).toBeCloseTo(1200.5);
    expect(s.getSalesVelocity()).toBe(0);
  });

  it('demo moves update local state and make NO network call', async () => {
    await useDealStore.getState().moveDeal('demo-3', 'negotiation');
    expect(fetch).not.toHaveBeenCalled();
    const d = useDealStore.getState().demoDeals.find((x) => x.id === 'demo-3')!;
    expect(d.stage.id).toBe('negotiation');
    expect(d.probability).toBe(70);
    expect(useDealStore.getState().getStageValues().negotiation).toBe(100000);
    expect(toastMock).not.toHaveBeenCalled();
  });

  it('demo update/delete/bulk update make no network call', async () => {
    const s = useDealStore.getState();
    await s.updateDeal('demo-1', { title: 'Renamed' });
    await s.bulkUpdateDeals(['demo-1', 'demo-2'], { priority: 'low' });
    await s.deleteDeal('demo-4');
    expect(fetch).not.toHaveBeenCalled();
    const { demoDeals, deals, realDeals } = useDealStore.getState();
    expect(demoDeals.find((d) => d.id === 'demo-1')!.title).toBe('Renamed');
    expect(demoDeals.find((d) => d.id === 'demo-2')!.priority).toBe('low');
    expect(demoDeals.some((d) => d.id === 'demo-4')).toBe(false);
    expect(realDeals.map((d) => d.id)).toEqual(['7']);
    expect(deals.map((d) => d.id)).toEqual(['7', 'demo-1', 'demo-2', 'demo-3']);
  });

  it('toggling demoEnabled updates `deals` immediately; clearing leaves real deals untouched', () => {
    const ids = () => useDealStore.getState().deals.map((d) => d.id);
    expect(ids()).toHaveLength(5);
    useDealStore.getState().setDemoEnabled(false);
    expect(ids()).toEqual(['7']);
    expect(useDealStore.getState().realDeals.map((d) => d.id)).toEqual(['7']);
    useDealStore.getState().setDemoEnabled(true);
    expect(ids()).toEqual(['7', 'demo-1', 'demo-2', 'demo-3', 'demo-4']);
  });

  it('a dashboard-style consumer reading `deals` sees demo deals only while enabled', () => {
    const consumer = () => {
      const { deals } = useDealStore.getState();
      return deals.reduce((n, d) => n + d.value, 0);
    };
    expect(consumer()).toBeCloseTo(1200.5 + 75000 + 45000 + 25000 + 120000);
    useDealStore.getState().setDemoEnabled(false);
    expect(consumer()).toBeCloseTo(1200.5);
  });

  it('direct setState of realDeals/demoDeals re-derives `deals`', () => {
    useDealStore.setState({ realDeals: [] });
    expect(useDealStore.getState().deals.map((d) => d.id)).toEqual(['demo-1', 'demo-2', 'demo-3', 'demo-4']);
  });

  it('dealsChanged events carry real deals only and sample edits emit none', async () => {
    const seen: any[] = [];
    const h = (e: any) => seen.push(e.detail.deals);
    window.addEventListener('dealsChanged', h);
    await useDealStore.getState().updateDeal('demo-1', { title: 'x' });
    expect(seen).toHaveLength(0);
    await useDealStore.getState().updateDeal('7', { title: 'y' });
    window.removeEventListener('dealsChanged', h);
    expect(seen).toHaveLength(1);
    expect(seen[0].map((d: any) => d.id)).toEqual(['7']);
  });

  it('real moves still PUT while demo is enabled', async () => {
    (fetch as any).mockResolvedValue({ ok: true, json: async () => ({}) });
    await useDealStore.getState().moveDeal('7', 'negotiation');
    expect(fetch).toHaveBeenCalledTimes(1);
    expect((fetch as any).mock.calls[0][0]).toBe('/api/deals/7');
  });
});

describe('dealStore stage mapping round trip', () => {
  beforeEach(() => {
    toastMock.mockReset();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }));
  });

  it('maps API lead and qualified to the qualification column and remembers which', () => {
    const stages = useDealStore.getState().pipelines.default.stages;
    const lead = fromApiDeal({ ...row, stage: 'lead' }, stages);
    const qualified = fromApiDeal({ ...row, stage: 'qualified' }, stages);
    expect(lead.stage.id).toBe('qualification');
    expect(qualified.stage.id).toBe('qualification');
    expect(lead.qualificationStage).toBe('lead');
    expect(qualified.qualificationStage).toBe('qualified');
    expect(fromApiDeal({ ...row, stage: 'proposal' }, stages).qualificationStage).toBeUndefined();
  });

  it('toApiStage is the inverse of the mapping', () => {
    expect(toApiStage('qualification')).toBe('qualified');
    expect(toApiStage('qualification', 'lead')).toBe('lead');
    expect(toApiStage('proposal')).toBe('proposal');
    expect(toApiStage('closed-won')).toBe('closed-won');
  });

  it('a lead moved away and back is restored as lead, and an unmoved lead is never written', async () => {
    const stages = useDealStore.getState().pipelines.default.stages;
    useDealStore.setState({ realDeals: [fromApiDeal({ ...row, stage: 'lead', probability: 20 }, stages)], demoEnabled: false });

    await useDealStore.getState().moveDeal('7', 'qualification'); // same column: no-op
    expect(fetch).not.toHaveBeenCalled();

    await useDealStore.getState().moveDeal('7', 'proposal');
    await useDealStore.getState().moveDeal('7', 'qualification');
    const bodies = (fetch as any).mock.calls.map((c: any[]) => JSON.parse(c[1].body).stage);
    expect(bodies).toEqual(['proposal', 'lead']);
  });
});

