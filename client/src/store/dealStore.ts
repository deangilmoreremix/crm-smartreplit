import { create } from 'zustand';
import {
  Deal,
  DealStage,
  Pipeline,
  SalesMetrics,
  DealForecast,
  DealFilter,
  DealSortOption,
} from '../types/deal';
import { toast } from '../hooks/use-toast';
import { DEFAULT_DEAL_STAGES, DEMO_DEALS, isDemoId } from '../data/demoData';

const DEMO_STORAGE_KEY = 'smartcrm_show_demo_data';
/** Demo data is on unless the user explicitly cleared it (mirrors DemoDataContext). */
const readDemoEnabled = (): boolean => {
  try {
    return localStorage.getItem(DEMO_STORAGE_KEY) !== 'false';
  } catch {
    return true;
  }
};
type DealLists = { realDeals: Deal[]; demoDeals: Deal[]; demoEnabled: boolean };
/** Real deals plus (only while demo data is enabled) the sample deals. */
const visibleDeals = (s: DealLists): Deal[] =>
  s.demoEnabled ? [...s.realDeals, ...s.demoDeals] : s.realDeals;
/** Keep the public `deals` (visible list) in sync with whatever list fields a partial update changes. */
const withVisible = (state: DealLists, partial: Partial<DealLists>): Partial<DealLists> & { deals: Deal[] } => ({
  ...partial,
  deals: visibleDeals({ ...state, ...partial }),
});
const cloneDemoDeals = (): Deal[] => DEMO_DEALS.map((d) => ({ ...d }));
const isDemoDeal = (d: { id: string; isDemo?: boolean }) => !!d.isDemo || isDemoId(d.id);

// Default pipeline stages (defined next to the demo deals that reference them)
const defaultStages: DealStage[] = DEFAULT_DEAL_STAGES;

/** Store stage ids that differ from the API's stage vocabulary (see DEAL_STAGE_OPTIONS). */
const STAGE_TO_API: Record<string, string> = { qualification: 'qualified' };

/**
 * Store stage id -> API stage name. The `qualification` column covers both API `lead` and
 * `qualified`; a deal remembers which one it came from so moving it away and back restores
 * the original value instead of silently turning `lead` into `qualified`.
 */
export const toApiStage = (stageId: string, qualificationStage?: 'lead' | 'qualified'): string =>
  stageId === 'qualification' ? (qualificationStage ?? STAGE_TO_API.qualification) : (STAGE_TO_API[stageId] ?? stageId);

/** deals.status is 'open' | 'won' | 'lost'; keep it aligned with the closed columns. */
const toStatus = (stageId: string) =>
  stageId === 'closed-won' ? 'won' : stageId === 'closed-lost' ? 'lost' : 'open';

/** Board order within a column: position ascending, then most recently updated first. */
export const compareDealsByPosition = (a: Deal, b: Deal): number =>
  (a.position ?? 0) - (b.position ?? 0) || b.updatedAt.getTime() - a.updatedAt.getTime();

const isServerId = (id: string) => /^\d+$/.test(id);

/** Map store-side changes onto the fields /api/deals accepts; fields the API has no column for are skipped. */
const toApiUpdate = (updates: Partial<Deal>, current: Deal): Record<string, unknown> => {
  const body: Record<string, unknown> = {};
  if (updates.title !== undefined) body.title = updates.title;
  if (updates.description !== undefined) body.description = updates.description;
  if (updates.value !== undefined) body.value = String(updates.value);
  if (updates.probability !== undefined) body.probability = updates.probability;
  if (updates.position !== undefined) body.position = updates.position;
  if (updates.contactId !== undefined) {
    body.contactId = isServerId(updates.contactId) ? Number(updates.contactId) : null;
  }
  if (updates.expectedCloseDate !== undefined) body.expectedCloseDate = updates.expectedCloseDate?.toISOString() ?? null;
  if (updates.actualCloseDate !== undefined) body.actualCloseDate = updates.actualCloseDate?.toISOString() ?? null;
  if (updates.stage !== undefined) {
    body.stage = toApiStage(updates.stage.id, updates.qualificationStage ?? current.qualificationStage);
    if (toStatus(updates.stage.id) !== toStatus(current.stage.id)) body.status = toStatus(updates.stage.id);
  }
  return body;
};

interface ApiDealRow {
  id: number | string;
  title: string;
  value?: string | number | null;
  stage?: string | null;
  probability?: number | null;
  description?: string | null;
  contactId?: number | string | null;
  daysInStage?: number | null;
  expectedCloseDate?: string | null;
  actualCloseDate?: string | null;
  customFields?: Record<string, any> | null;
  position?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

/** API stage name -> store stage id (`lead` and `qualified` both live in the qualification column). */
export const fromApiStage = (stage?: string | null): string =>
  stage === 'lead' || stage === 'qualified' ? 'qualification' : (stage ?? 'qualification');

/** Map a /api/deals row onto the store's Deal shape (API stage `lead`/`qualified` -> `qualification`). */
export function fromApiDeal(r: ApiDealRow, stages: DealStage[]): Deal {
  const stageId = fromApiStage(r.stage);
  const stage = stages.find((s) => s.id === stageId) ?? stages[0];
  const date = (v?: string | null) => (v ? new Date(v) : undefined);
  return {
    id: String(r.id),
    title: r.title,
    description: r.description ?? undefined,
    value: Number(r.value) || 0,
    stage,
    probability: r.probability ?? stage.probability,
    contactId: r.contactId != null ? String(r.contactId) : '',
    position: r.position ?? 0,
    priority: 'medium',
    daysInStage: r.daysInStage ?? 0,
    source: 'other',
    tags: [],
    customFields: r.customFields ?? {},
    activities: [],
    attachments: [],
    createdAt: date(r.createdAt) ?? new Date(),
    updatedAt: date(r.updatedAt) ?? new Date(),
    expectedCloseDate: date(r.expectedCloseDate),
    actualCloseDate: date(r.actualCloseDate),
    currency: 'USD',
    ...(r.stage === 'lead' || r.stage === 'qualified' ? { qualificationStage: r.stage } : {}),
  };
}

const defaultPipeline: Pipeline = {
  id: 'default',
  name: 'Sales Pipeline',
  description: 'Default sales pipeline',
  stages: defaultStages,
  isDefault: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

interface DealStore {
  // State
  /** Source of truth for real deals (from /api/deals or created locally). Never contains samples. */
  realDeals: Deal[];
  /** Visible list read by most screens: always `demoEnabled ? [...realDeals, ...demoDeals] : realDeals`. Derived; do not set directly. */
  deals: Deal[];
  /** Sample deals (local state only, never sent to the server); counted only while demoEnabled. */
  demoDeals: Deal[];
  demoEnabled: boolean;
  setDemoEnabled: (enabled: boolean) => void;
  /** Replace the real deals (visible list is recomputed). */
  setDeals: (real: Deal[]) => void;
  pipelines: Record<string, Pipeline>;
  activePipelineId: string;
  isLoading: boolean;
  error: string | null;
  filters: DealFilter;
  sortOption: DealSortOption;

  // Actions
  fetchDeals: () => Promise<void>;
  /** Creates the deal on the server (optimistic). Resolves to the server id, or '' when the save failed and was rolled back. */
  addDeal: (deal: Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateDeal: (id: string, updates: Partial<Deal>) => Promise<void>;
  deleteDeal: (id: string) => Promise<void>;
  /** Apply an event that came from an embedded app: LOCAL state only, never sent to the server
   *  (remote ids can collide with this app's numeric ids, and the remote owns its own backend). */
  applyRemoteDeal: (action: 'create' | 'update' | 'delete', data: Record<string, any>) => void;
  moveDeal: (dealId: string, newStageId: string, newIndex?: number) => Promise<void>;
  bulkUpdateDeals: (dealIds: string[], updates: Partial<Deal>) => Promise<void>;

  // Pipeline management
  fetchPipelines: () => Promise<void>;
  addPipeline: (pipeline: Omit<Pipeline, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updatePipeline: (id: string, updates: Partial<Pipeline>) => Promise<void>;
  deletePipeline: (id: string) => Promise<void>;
  setActivePipeline: (pipelineId: string) => void;

  // Stage management
  updateStage: (pipelineId: string, stageId: string, updates: Partial<DealStage>) => Promise<void>;
  reorderStages: (pipelineId: string, stages: DealStage[]) => Promise<void>;

  // Filtering and sorting
  setFilters: (filters: Partial<DealFilter>) => void;
  setSortOption: (sortOption: DealSortOption) => void;
  clearFilters: () => void;

  // Computed getters
  getFilteredDeals: () => Deal[];
  getStageValues: () => Record<string, number>;
  getTotalPipelineValue: () => number;
  getSalesMetrics: () => SalesMetrics;
  calculateForecast: () => DealForecast;
  getConversionRates: () => Record<string, number>;
  getSalesVelocity: () => number;
  getActivePipeline: () => Pipeline | null;
}

export const useDealStore = create<DealStore>((set, get) => ({
  // Initial state
  ...(() => {
    const demoDeals = cloneDemoDeals();
    const demoEnabled = readDemoEnabled();
    return { realDeals: [] as Deal[], demoDeals, demoEnabled, deals: visibleDeals({ realDeals: [], demoDeals, demoEnabled }) };
  })(),
  setDemoEnabled: (enabled) => set((state) => withVisible(state, { demoEnabled: enabled })),
  setDeals: (real) => set((state) => withVisible(state, { realDeals: real })),

  pipelines: {
    default: defaultPipeline,
  },

  activePipelineId: 'default',
  isLoading: false,
  error: null,
  filters: {},
  sortOption: { field: 'updatedAt', direction: 'desc' },

  // Actions
  fetchDeals: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/deals', { credentials: 'include' });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const rows = (await res.json()) as ApiDealRow[];
      const stages = get().pipelines[get().activePipelineId]?.stages ?? defaultStages;
      set((state) => ({ ...withVisible(state, { realDeals: rows.map((r) => fromApiDeal(r, stages)) }), isLoading: false }));
    } catch (error) {
      set({ error: 'Failed to fetch deals', isLoading: false });
    }
  },

  addDeal: async (dealData) => {
    const tempId = `deal_${Date.now()}`;
    const newDeal: Deal = {
      ...dealData,
      id: tempId,
      createdAt: new Date(),
      updatedAt: new Date(),
      activities: [],
      attachments: [],
      customFields: dealData.customFields || {},
      tags: dealData.tags || [],
    };

    // Optimistic insert with a temporary id.
    set((state) => withVisible(state, { realDeals: [...state.realDeals, newDeal] }));

    try {
      const res = await fetch('/api/deals', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newDeal.title,
          value: String(newDeal.value ?? 0),
          stage: toApiStage(newDeal.stage.id, newDeal.qualificationStage),
          probability: newDeal.probability,
          status: toStatus(newDeal.stage.id),
          ...(newDeal.description ? { description: newDeal.description } : {}),
          ...(isServerId(newDeal.contactId) ? { contactId: Number(newDeal.contactId) } : {}),
          ...(newDeal.expectedCloseDate ? { expectedCloseDate: newDeal.expectedCloseDate.toISOString() } : {}),
        }),
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const saved = (await res.json()) as ApiDealRow;
      const serverId = String(saved.id);
      // Swap the temporary id for the server id (keep the locally entered fields).
      set((state) =>
        withVisible(state, {
          realDeals: state.realDeals.map((d) => (d.id === tempId ? { ...d, id: serverId } : d)),
        })
      );
      window.dispatchEvent(new CustomEvent('dealsChanged', { detail: { deals: get().realDeals } }));
      return serverId;
    } catch (e) {
      // Roll back the optimistic insert.
      set((state) => withVisible(state, { realDeals: state.realDeals.filter((d) => d.id !== tempId) }));
      const message = e instanceof Error ? e.message : 'Unknown error';
      set({ error: `Could not create deal: ${message}` });
      toast({
        title: 'Could not create deal',
        description: `"${newDeal.title}" was not saved. ${message}`,
        variant: 'destructive',
      });
      return '';
    }
  },

  updateDeal: async (id, updates) => {
    const before = get().realDeals.find((d) => d.id === id);
    applyLocalUpdate(id, updates);
    // Sample deals and locally created deals (non-numeric ids) have no server row.
    if (!before || isDemoDeal(before) || !isServerId(id)) return;
    const body = toApiUpdate(updates, before);
    if (Object.keys(body).length === 0) return;
    try {
      const res = await fetch(`/api/deals/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
    } catch (e) {
      // Roll back only the fields this call changed.
      const revert = Object.fromEntries(
        (Object.keys(updates) as (keyof Deal)[]).map((k) => [k, before[k]])
      ) as Partial<Deal>;
      applyLocalUpdate(id, { ...revert, updatedAt: before.updatedAt });
      const message = e instanceof Error ? e.message : 'Unknown error';
      set({ error: `Could not update deal: ${message}` });
      toast({
        title: 'Could not update deal',
        description: `Your changes to "${before.title}" were reverted. ${message}`,
        variant: 'destructive',
      });
    }
  },

  applyRemoteDeal: (action, data) => {
    const id = data?.id != null ? String(data.id) : '';
    if (!id || isDemoId(id)) return;
    if (action === 'delete') {
      set((state) => withVisible(state, { realDeals: state.realDeals.filter((d) => d.id !== id) }));
      return;
    }
    if (action === 'update') {
      if (get().realDeals.some((d) => d.id === id)) applyLocalUpdate(id, data as Partial<Deal>);
      return;
    }
    // create: keep remote deals distinguishable from server rows and never duplicate
    const localId = get().realDeals.some((d) => d.id === id) ? id : `remote_${id}`;
    if (get().realDeals.some((d) => d.id === localId)) return;
    const stage =
      get().pipelines[get().activePipelineId]?.stages.find((st) => st.id === data?.stage?.id || st.id === data?.stage) ??
      get().pipelines[get().activePipelineId].stages[0];
    const now = new Date();
    const deal = {
      activities: [],
      attachments: [],
      customFields: {},
      tags: [],
      ...data,
      id: localId,
      stage,
      createdAt: now,
      updatedAt: now,
    } as unknown as Deal;
    set((state) => withVisible(state, { realDeals: [...state.realDeals, deal] }));
  },

  deleteDeal: async (id) => {
    const removed = get().realDeals.find((deal) => deal.id === id);
    // Optimistic local removal (sample deals are local only).
    set((state) =>
      withVisible(state, {
        realDeals: state.realDeals.filter((deal) => deal.id !== id),
        demoDeals: state.demoDeals.filter((deal) => deal.id !== id),
      })
    );

    // Only real, server-backed deals (numeric ids) have a row to delete.
    if (!removed || isDemoDeal(removed) || !/^\d+$/.test(id)) return;
    try {
      const res = await fetch(`/api/deals/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok && res.status !== 404) throw new Error(`Request failed (${res.status})`);
    } catch (e) {
      // Roll back: put the deal back.
      set((state) => withVisible(state, { realDeals: [removed, ...state.realDeals] }));
      const message = e instanceof Error ? e.message : 'Unknown error';
      set({ error: `Could not delete deal: ${message}` });
      toast({
        title: 'Could not delete deal',
        description: `"${removed.title}" was restored. ${message}`,
        variant: 'destructive',
      });
    }
  },

  moveDeal: async (dealId, newStageId, newIndex) => {
    const { pipelines, activePipelineId, realDeals, demoDeals } = get();
    const newStage = pipelines[activePipelineId]?.stages.find((s) => s.id === newStageId);
    const deal = realDeals.find((d) => d.id === dealId) ?? demoDeals.find((d) => d.id === dealId);
    if (!newStage || !deal) return;
    const sameStage = deal.stage.id === newStage.id;
    if (sameStage && newIndex === undefined) return;

    // Where the card lands in the target column (position is an integer; leave gaps between neighbours).
    const column = visibleDeals(get())
      .filter((d) => d.stage.id === newStage.id && d.id !== dealId)
      .sort(compareDealsByPosition);
    const positions = new Map<string, number>(); // deal id -> new position
    if (newIndex !== undefined) {
      const at = Math.max(0, Math.min(newIndex, column.length));
      const prev = column[at - 1]?.position ?? (at > 0 ? 0 : undefined);
      const next = column[at]?.position ?? (at < column.length ? 0 : undefined);
      if (prev === undefined && next === undefined) positions.set(dealId, 1000);
      else if (next === undefined) positions.set(dealId, prev! + 1000);
      else if (prev === undefined) positions.set(dealId, next - 1000);
      else if (next - prev > 1) positions.set(dealId, Math.floor((prev + next) / 2));
      else {
        // No room between the neighbours (or they tie): renumber the column.
        const order = [...column.slice(0, at), deal, ...column.slice(at)];
        order.forEach((d, i) => {
          if (d.id === dealId || (d.position ?? 0) !== (i + 1) * 1000) positions.set(d.id, (i + 1) * 1000);
        });
      }
    }

    const previous = new Map<string, Partial<Deal>>();
    for (const id of positions.keys()) {
      const d = realDeals.find((x) => x.id === id) ?? demoDeals.find((x) => x.id === id)!;
      previous.set(id, { position: d.position, updatedAt: d.updatedAt });
    }
    previous.set(dealId, { ...previous.get(dealId), stage: deal.stage, probability: deal.probability });

    // Optimistic local move.
    const moved: Partial<Deal> = sameStage ? {} : { stage: newStage, probability: newStage.probability };
    positions.forEach((position, id) => applyLocalUpdate(id, id === dealId ? { ...moved, position } : { position }));
    if (positions.size === 0) applyLocalUpdate(dealId, moved);

    // Sample deals and deals created locally (non-numeric ids) have no server row.
    const persist = (id: string) => {
      const d = realDeals.find((x) => x.id === id);
      return !!d && !isDemoDeal(d) && isServerId(id);
    };

    // Send only the fields that changed.
    const requests: Array<{ id: string; body: Record<string, unknown> }> = [];
    if (persist(dealId)) {
      const body: Record<string, unknown> = {};
      if (!sameStage) {
        body.stage = toApiStage(newStage.id, deal.qualificationStage);
        if (newStage.probability !== deal.probability) body.probability = newStage.probability;
        // deals.status is 'open' | 'won' | 'lost'; keep it aligned with the closed columns.
        if (toStatus(newStage.id) !== toStatus(deal.stage.id)) body.status = toStatus(newStage.id);
      }
      if (positions.has(dealId)) body.position = positions.get(dealId);
      requests.push({ id: dealId, body });
    }
    positions.forEach((position, id) => {
      if (id !== dealId && persist(id)) requests.push({ id, body: { position } });
    });

    try {
      await Promise.all(
        requests.map(async ({ id, body }) => {
          const res = await fetch(`/api/deals/${id}`, {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });
          if (!res.ok) throw new Error(`Request failed (${res.status})`);
        })
      );
    } catch (e) {
      previous.forEach((prev, id) => applyLocalUpdate(id, prev));
      const message = e instanceof Error ? e.message : 'Unknown error';
      set({ error: `Could not move deal: ${message}` });
      toast({
        title: 'Could not move deal',
        description: `"${deal.title}" was returned to ${deal.stage.name}. ${message}`,
        variant: 'destructive',
      });
    }
  },

  bulkUpdateDeals: async (dealIds, updates) => {
    const promises = dealIds.map((id) => get().updateDeal(id, updates));
    await Promise.all(promises);
  },

  // Pipeline management
  fetchPipelines: async () => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 200));
  },

  addPipeline: async (pipelineData) => {
    const id = `pipeline_${Date.now()}`;
    const newPipeline: Pipeline = {
      ...pipelineData,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    set((state) => ({
      pipelines: { ...state.pipelines, [id]: newPipeline },
    }));

    return id;
  },

  updatePipeline: async (id, updates) => {
    set((state) => ({
      pipelines: {
        ...state.pipelines,
        [id]: {
          ...state.pipelines[id],
          ...updates,
          updatedAt: new Date(),
        },
      },
    }));
  },

  deletePipeline: async (id) => {
    set((state) => {
      const { [id]: deleted, ...remaining } = state.pipelines;
      return { pipelines: remaining };
    });
  },

  setActivePipeline: (pipelineId) => {
    set({ activePipelineId: pipelineId });
  },

  // Stage management
  updateStage: async (pipelineId, stageId, updates) => {
    set((state) => ({
      pipelines: {
        ...state.pipelines,
        [pipelineId]: {
          ...state.pipelines[pipelineId],
          stages: state.pipelines[pipelineId].stages.map((stage) =>
            stage.id === stageId ? { ...stage, ...updates } : stage
          ),
          updatedAt: new Date(),
        },
      },
    }));
  },

  reorderStages: async (pipelineId, stages) => {
    set((state) => ({
      pipelines: {
        ...state.pipelines,
        [pipelineId]: {
          ...state.pipelines[pipelineId],
          stages: stages.map((stage, index) => ({ ...stage, order: index + 1 })),
          updatedAt: new Date(),
        },
      },
    }));
  },

  // Filtering and sorting
  setFilters: (filters) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
    }));
  },

  setSortOption: (sortOption) => {
    set({ sortOption });
  },

  clearFilters: () => {
    set({ filters: {} });
  },

  // Computed getters
  getFilteredDeals: () => {
    const { filters, sortOption } = get();
    let filteredDeals = [...visibleDeals(get())];

    // Apply filters
    if (filters.stages?.length) {
      filteredDeals = filteredDeals.filter((deal) => filters.stages!.includes(deal.stage.id));
    }

    if (filters.priorities?.length) {
      filteredDeals = filteredDeals.filter((deal) => filters.priorities!.includes(deal.priority));
    }

    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filteredDeals = filteredDeals.filter(
        (deal) =>
          deal.title.toLowerCase().includes(term) || deal.description?.toLowerCase().includes(term)
      );
    }

    if (filters.valueRange) {
      filteredDeals = filteredDeals.filter(
        (deal) => deal.value >= filters.valueRange!.min && deal.value <= filters.valueRange!.max
      );
    }

    // Apply sorting
    filteredDeals.sort((a, b) => {
      const aValue = a[sortOption.field];
      const bValue = b[sortOption.field];

      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return 1;
      if (bValue === undefined) return -1;
      if (aValue < bValue) return sortOption.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOption.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filteredDeals;
  },

  getStageValues: () => {
    const { pipelines, activePipelineId } = get();
    const activePipeline = pipelines[activePipelineId];
    const deals = visibleDeals(get()); // Use all deals, not filtered ones
    const stageValues: Record<string, number> = {};

    // Initialize all stage values to 0, fallback to default stages if no active pipeline
    const stages = activePipeline ? activePipeline.stages : defaultStages;
    stages.forEach((stage) => {
      stageValues[stage.id] = 0;
    });

    // Sum up deal values for each stage
    deals.forEach((deal) => {
      if (deal.stage && deal.stage.id) {
        stageValues[deal.stage.id] = (stageValues[deal.stage.id] || 0) + deal.value;
      }
    });

    return stageValues;
  },

  getTotalPipelineValue: () => {
    const deals = visibleDeals(get()); // Use all deals instead of filtered
    return deals
      .filter((deal) => deal.stage.id !== 'closed-won' && deal.stage.id !== 'closed-lost')
      .reduce((total, deal) => total + deal.value, 0);
  },

  getSalesMetrics: () => {
    const deals = visibleDeals(get());
    const wonDeals = deals.filter((d) => d.stage.id === 'closed-won');
    const lostDeals = deals.filter((d) => d.stage.id === 'closed-lost');
    const totalValue = deals.reduce((sum, d) => sum + d.value, 0);
    const wonValue = wonDeals.reduce((sum, d) => sum + d.value, 0);
    const lostValue = lostDeals.reduce((sum, d) => sum + d.value, 0);
    const pipelineValue = get().getTotalPipelineValue();

    return {
      totalDeals: deals.length,
      totalValue,
      totalPipelineValue: pipelineValue,
      wonDeals: wonDeals.length,
      wonValue,
      lostDeals: lostDeals.length,
      lostValue,
      averageDealSize: deals.length ? totalValue / deals.length : 0,
      averageSalesCycle: 30, // placeholder
      conversionRate: deals.length ? (wonDeals.length / deals.length) * 100 : 0,
      winRate:
        wonDeals.length + lostDeals.length
          ? (wonDeals.length / (wonDeals.length + lostDeals.length)) * 100
          : 0,
      salesVelocity: 1000, // placeholder
      forecastedRevenue: pipelineValue,
    };
  },

  calculateForecast: () => {
    const deals = visibleDeals(get());
    const pipelineDeals = deals.filter(
      (d) => d.stage.id !== 'closed-won' && d.stage.id !== 'closed-lost'
    );

    const totalPipeline = pipelineDeals.reduce((sum, d) => sum + d.value, 0);
    const weightedPipeline = pipelineDeals.reduce(
      (sum, d) => sum + (d.value * d.probability) / 100,
      0
    );

    return {
      month: new Date().toISOString().slice(0, 7),
      forecasted: weightedPipeline,
      committed: weightedPipeline * 0.8,
      pipeline: totalPipeline,
      closed: 0,
      totalPipeline,
      weightedPipeline,
      bestCase: totalPipeline,
      worstCase: weightedPipeline * 0.5,
      committedForecast: weightedPipeline,
      upside: totalPipeline - weightedPipeline,
    };
  },

  getConversionRates: () => {
    const { pipelines, activePipelineId } = get();
    const pipeline = pipelines[activePipelineId];
    const rates: Record<string, number> = {};

    if (pipeline) {
      pipeline.stages.forEach((stage) => {
        rates[stage.id] = stage.probability;
      });
    }

    return rates;
  },

  getSalesVelocity: () => {
    const deals = visibleDeals(get());
    const wonDeals = deals.filter((d) => d.stage.id === 'closed-won');

    if (wonDeals.length === 0) return 0;

    const totalValue = wonDeals.reduce((sum, d) => sum + d.value, 0);
    const avgCycleTime = 30; // placeholder - should calculate from actual data

    return totalValue / avgCycleTime;
  },

  getActivePipeline: () => {
    const { pipelines, activePipelineId } = get();
    return pipelines[activePipelineId] || null;
  },
}));

/** Local-only update (no network). Sample deals stay in `demoDeals`; real-deal updates emit the sync event. */
function applyLocalUpdate(id: string, updates: Partial<Deal>) {
  const { demoDeals, realDeals } = useDealStore.getState();
  const patch = (deal: Deal): Deal =>
    deal.id === id ? { ...deal, updatedAt: new Date(), ...updates } : deal;
  if (isDemoId(id) || demoDeals.some((d) => d.id === id)) {
    useDealStore.setState((state) => withVisible(state, { demoDeals: state.demoDeals.map(patch) }));
    return;
  }
  if (!realDeals.some((d) => d.id === id)) return;
  useDealStore.setState((state) => withVisible(state, { realDeals: state.realDeals.map(patch) }));
  // Emit event for universal sync (real deals only)
  window.dispatchEvent(
    new CustomEvent('dealsChanged', { detail: { deals: useDealStore.getState().realDeals } })
  );
}

// Safety net: if anything writes realDeals/demoDeals/demoEnabled directly via setState,
// re-derive the visible `deals` list. No-op when already in sync.
useDealStore.subscribe((state) => {
  const expected = visibleDeals(state);
  const same = state.deals.length === expected.length && state.deals.every((d, i) => d === expected[i]);
  if (!same) useDealStore.setState({ deals: expected });
});
