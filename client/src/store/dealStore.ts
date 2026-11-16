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


// Server rows (shared/schema.ts `deals`) <-> store Deal
const stageFor = (value: string | null | undefined): DealStage =>
  defaultStages.find((s) => s.id === value || s.name.toLowerCase() === String(value || '').toLowerCase()) ||
  defaultStages[0];

const fromServerDeal = (row: any): Deal => ({
  id: String(row.id),
  title: row.title,
  description: row.description || undefined,
  value: Number(row.value) || 0,
  stage: stageFor(row.stage),
  probability: row.probability ?? 0,
  contactId: row.contactId != null ? String(row.contactId) : '',
  priority: 'medium',
  daysInStage: row.daysInStage ?? 0,
  source: 'other',
  tags: [],
  customFields: row.customFields || {},
  activities: [],
  attachments: [],
  createdAt: new Date(row.createdAt),
  updatedAt: new Date(row.updatedAt),
  expectedCloseDate: row.expectedCloseDate ? new Date(row.expectedCloseDate) : undefined,
  actualCloseDate: row.actualCloseDate ? new Date(row.actualCloseDate) : undefined,
  currency: 'USD',
});

const toServerDeal = (deal: Partial<Deal>): Record<string, any> => {
  const body: Record<string, any> = {};
  if (deal.title !== undefined) body.title = deal.title;
  if (deal.description !== undefined) body.description = deal.description;
  if (deal.value !== undefined) body.value = String(deal.value);
  if (deal.stage !== undefined) body.stage = deal.stage.id;
  if (deal.probability !== undefined) body.probability = deal.probability;
  if (deal.daysInStage !== undefined) body.daysInStage = deal.daysInStage;
  if (deal.customFields !== undefined) body.customFields = deal.customFields;
  if (deal.expectedCloseDate !== undefined) body.expectedCloseDate = deal.expectedCloseDate;
  if (deal.actualCloseDate !== undefined) body.actualCloseDate = deal.actualCloseDate;
  if (deal.contactId && /^\d+$/.test(deal.contactId)) body.contactId = Number(deal.contactId);
  return body;
};

const apiRequest = async (url: string, init?: RequestInit) => {
  const response = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || body.message || `Request failed (${response.status})`);
  return body;
};

export const useDealStore = create<DealStore>((set, get) => ({
  // Initial state: deals are loaded from the server (GET /api/deals), not seeded with samples
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
      const rows = await apiRequest('/api/deals');
      set({ deals: (Array.isArray(rows) ? rows : []).map(fromServerDeal), isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch deals', isLoading: false });
    }
  },

  addDeal: async (dealData) => {
    const saved = await apiRequest('/api/deals', {
      method: 'POST',
      body: JSON.stringify(toServerDeal(dealData as Partial<Deal>)),
    });
    const id = String(saved.id);
    const newDeal: Deal = {
      ...dealData,
      id,
      createdAt: new Date(saved.createdAt || Date.now()),
      updatedAt: new Date(saved.updatedAt || Date.now()),
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
    await apiRequest(`/api/deals/${id}`, { method: 'PUT', body: JSON.stringify(toServerDeal(updates)) });
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
    await apiRequest(`/api/deals/${id}`, { method: 'DELETE' });
    set((state) => ({
      deals: state.deals.filter((deal) => deal.id !== id),
    }));
  },

  moveDeal: async (dealId, newStageId) => {
    const { pipelines, activePipelineId } = get();
    const pipeline = pipelines[activePipelineId];
    const newStage = pipeline?.stages.find((s) => s.id === newStageId);

    if (newStage) {
      await get().updateDeal(dealId, {
        stage: newStage,
        probability: newStage.probability,
      });
    }
  },

  bulkUpdateDeals: async (dealIds, updates) => {
    const promises = dealIds.map((id) => get().updateDeal(id, updates));
    await Promise.all(promises);
  },

  // Pipeline management
  fetchPipelines: async () => {
    // Pipelines are defined locally (no pipelines API); nothing to fetch
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
