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

// Default pipeline stages
const defaultStages: DealStage[] = [
  {
    id: 'qualification',
    name: 'Qualification',
    order: 1,
    color: '#3B82F6',
    probability: 20,
    isActive: true,
  },
  { id: 'proposal', name: 'Proposal', order: 2, color: '#F59E0B', probability: 40, isActive: true },
  {
    id: 'negotiation',
    name: 'Negotiation',
    order: 3,
    color: '#8B5CF6',
    probability: 70,
    isActive: true,
  },
  {
    id: 'closed-won',
    name: 'Closed Won',
    order: 4,
    color: '#10B981',
    probability: 100,
    isActive: true,
  },
  {
    id: 'closed-lost',
    name: 'Closed Lost',
    order: 5,
    color: '#EF4444',
    probability: 0,
    isActive: true,
  },
];

/** Store stage ids that differ from the API's stage vocabulary (see DEAL_STAGE_OPTIONS). */
const STAGE_TO_API: Record<string, string> = { qualification: 'qualified' };

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
  createdAt?: string | null;
  updatedAt?: string | null;
}

/** Map a /api/deals row onto the store's Deal shape (API stage `lead`/`qualified` -> `qualification`). */
export function fromApiDeal(r: ApiDealRow, stages: DealStage[]): Deal {
  const stageId = r.stage === 'lead' || r.stage === 'qualified' ? 'qualification' : (r.stage ?? 'qualification');
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
  deals: Deal[];
  pipelines: Record<string, Pipeline>;
  activePipelineId: string;
  isLoading: boolean;
  error: string | null;
  filters: DealFilter;
  sortOption: DealSortOption;

  // Actions
  fetchDeals: () => Promise<void>;
  addDeal: (deal: Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateDeal: (id: string, updates: Partial<Deal>) => Promise<void>;
  deleteDeal: (id: string) => Promise<void>;
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
  deals: [],

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
      set({ deals: rows.map((r) => fromApiDeal(r, stages)), isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch deals', isLoading: false });
    }
  },

  addDeal: async (dealData) => {
    const id = `deal_${Date.now()}`;
    const newDeal: Deal = {
      ...dealData,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      activities: [],
      attachments: [],
      customFields: dealData.customFields || {},
      tags: dealData.tags || [],
    };

    set((state) => ({
      deals: [...state.deals, newDeal],
    }));
    // Emit event for universal sync
    window.dispatchEvent(
      new CustomEvent('dealsChanged', {
        detail: { deals: get().deals },
      })
    );

    return id;
  },

  updateDeal: async (id, updates) => {
    set((state) => ({
      deals: state.deals.map((deal) =>
        deal.id === id ? { ...deal, ...updates, updatedAt: new Date() } : deal
      ),
    }));
    // Emit event for universal sync
    window.dispatchEvent(
      new CustomEvent('dealsChanged', {
        detail: { deals: get().deals },
      })
    );
  },

  deleteDeal: async (id) => {
    set((state) => ({
      deals: state.deals.filter((deal) => deal.id !== id),
    }));
  },

  moveDeal: async (dealId, newStageId) => {
    const { pipelines, activePipelineId, deals } = get();
    const newStage = pipelines[activePipelineId]?.stages.find((s) => s.id === newStageId);
    const deal = deals.find((d) => d.id === dealId);
    if (!newStage || !deal || deal.stage.id === newStage.id) return;

    const previous = { stage: deal.stage, probability: deal.probability };
    // Optimistic local move.
    await get().updateDeal(dealId, { stage: newStage, probability: newStage.probability });

    // Deals created locally (non-numeric ids) have no server row yet.
    if (!/^\d+$/.test(dealId)) return;

    // Send only the fields that changed.
    const body: Record<string, unknown> = { stage: STAGE_TO_API[newStage.id] ?? newStage.id };
    if (newStage.probability !== previous.probability) body.probability = newStage.probability;

    try {
      const res = await fetch(`/api/deals/${dealId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
    } catch (e) {
      await get().updateDeal(dealId, previous);
      const message = e instanceof Error ? e.message : 'Unknown error';
      set({ error: `Could not move deal: ${message}` });
      toast({
        title: 'Could not move deal',
        description: `"${deal.title}" was returned to ${previous.stage.name}. ${message}`,
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
    const { deals, filters, sortOption } = get();
    let filteredDeals = [...deals];

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
    const deals = get().deals; // Use all deals, not filtered ones
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
    const deals = get().deals; // Use all deals instead of filtered
    return deals
      .filter((deal) => deal.stage.id !== 'closed-won' && deal.stage.id !== 'closed-lost')
      .reduce((total, deal) => total + deal.value, 0);
  },

  getSalesMetrics: () => {
    const deals = get().deals;
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
    const deals = get().deals;
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
    const deals = get().deals;
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
