import { create } from 'zustand';
import { Deal } from '../types/deal';
import { api } from '../services/unifiedApiClient';

interface DealStore {
  deals: Record<string, Deal>;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchDeals: () => Promise<void>;
  addDeal: (deal: Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Deal | null>;
  updateDeal: (id: string, updates: Partial<Deal>) => Promise<void>;
  deleteDeal: (id: string) => Promise<void>;
}

export const useDealStore = create<DealStore>((set) => ({
  deals: {},
  isLoading: false,
  error: null,

  fetchDeals: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<Deal[]>('/api/deals');
      if (response.success && response.data) {
        const dealsMap = response.data.reduce((acc, deal) => {
          acc[deal.id.toString()] = {
            ...deal,
            createdAt: new Date(deal.createdAt),
            updatedAt: new Date(deal.updatedAt),
            dueDate: deal.dueDate ? new Date(deal.dueDate) : undefined,
            closedAt: deal.closedAt ? new Date(deal.closedAt) : undefined,
            nextFollowUp: deal.nextFollowUp ? new Date(deal.nextFollowUp) : undefined,
            expectedCloseDate: deal.expectedCloseDate ? new Date(deal.expectedCloseDate) : undefined,
            actualCloseDate: deal.actualCloseDate ? new Date(deal.actualCloseDate) : undefined,
          };
          return acc;
        }, {} as Record<string, Deal>);
        set({ deals: dealsMap, isLoading: false });
      } else {
        set({ error: response.error || 'Failed to fetch deals', isLoading: false });
      }
    } catch {
      set({ error: 'Failed to fetch deals', isLoading: false });
    }
  },

  addDeal: async (dealData) => {
    try {
      const response = await api.post<Deal>('/api/deals', dealData);
      if (response.success && response.data) {
        const newDeal = {
          ...response.data,
          createdAt: new Date(response.data.createdAt),
          updatedAt: new Date(response.data.updatedAt),
          dueDate: response.data.dueDate ? new Date(response.data.dueDate) : undefined,
          closedAt: response.data.closedAt ? new Date(response.data.closedAt) : undefined,
          nextFollowUp: response.data.nextFollowUp ? new Date(response.data.nextFollowUp) : undefined,
          expectedCloseDate: response.data.expectedCloseDate ? new Date(response.data.expectedCloseDate) : undefined,
          actualCloseDate: response.data.actualCloseDate ? new Date(response.data.actualCloseDate) : undefined,
        };

        set(state => ({
          deals: { ...state.deals, [newDeal.id.toString()]: newDeal }
        }));

        return newDeal;
      } else {
        set({ error: response.error || 'Failed to create deal' });
        return null;
      }
    } catch {
      set({ error: 'Failed to create deal' });
      return null;
    }
  },

  updateDeal: async (id, updates) => {
    try {
      const response = await api.put<Deal>(`/api/deals/${id}`, updates);
      if (response.success && response.data) {
        const updatedDeal = {
          ...response.data,
          createdAt: new Date(response.data.createdAt),
          updatedAt: new Date(response.data.updatedAt),
          dueDate: response.data.dueDate ? new Date(response.data.dueDate) : undefined,
          closedAt: response.data.closedAt ? new Date(response.data.closedAt) : undefined,
          nextFollowUp: response.data.nextFollowUp ? new Date(response.data.nextFollowUp) : undefined,
          expectedCloseDate: response.data.expectedCloseDate ? new Date(response.data.expectedCloseDate) : undefined,
          actualCloseDate: response.data.actualCloseDate ? new Date(response.data.actualCloseDate) : undefined,
        };

        set(state => ({
          deals: {
            ...state.deals,
            [id]: updatedDeal
          }
        }));
      } else {
        set({ error: response.error || 'Failed to update deal' });
      }
    } catch {
      set({ error: 'Failed to update deal' });
    }
  },

  deleteDeal: async (id) => {
    try {
      const response = await api.delete(`/api/deals/${id}`);
      if (response.success) {
        set(state => {
          const { [id]: deleted, ...rest } = state.deals;
          return { deals: rest };
        });
      } else {
        set({ error: response.error || 'Failed to delete deal' });
      }
    } catch (error) {
      set({ error: 'Failed to delete deal' });
    }
  }
}));