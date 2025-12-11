import { create } from 'zustand';
import { Deal } from '../types/deal';

interface DealStore {
  deals: Record<string, Deal>;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchDeals: () => Promise<void>;
  addDeal: (deal: Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>) => Deal;
  updateDeal: (id: string, updates: Partial<Deal>) => void;
  deleteDeal: (id: string) => void;
}

export const useDealStore = create<DealStore>((set, get) => ({
  deals: {},
  isLoading: false,
  error: null,

  fetchDeals: async () => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Implement API call
      set({ isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch deals', isLoading: false });
    }
  },

  addDeal: (dealData) => {
    const newDeal: Deal = {
      ...dealData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    set(state => ({
      deals: { ...state.deals, [newDeal.id]: newDeal }
    }));

    return newDeal;
  },

  updateDeal: (id, updates) => {
    set(state => ({
      deals: {
        ...state.deals,
        [id]: {
          ...state.deals[id],
          ...updates,
          updatedAt: new Date()
        }
      }
    }));
  },

  deleteDeal: (id) => {
    set(state => {
      const { [id]: deleted, ...rest } = state.deals;
      return { deals: rest };
    });
  }
}));