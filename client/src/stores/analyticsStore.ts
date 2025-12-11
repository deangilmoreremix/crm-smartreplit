import { create } from 'zustand';

interface AnalyticsData {
  id: string;
  type: string;
  data: any;
  timestamp: Date;
}

interface AnalyticsStore {
  analytics: Record<string, AnalyticsData>;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchAnalytics: (type?: string) => Promise<void>;
  addAnalytics: (analytics: Omit<AnalyticsData, 'id' | 'timestamp'>) => AnalyticsData;
  updateAnalytics: (id: string, updates: Partial<AnalyticsData>) => void;
  deleteAnalytics: (id: string) => void;
}

export const useAnalyticsStore = create<AnalyticsStore>((set, get) => ({
  analytics: {},
  isLoading: false,
  error: null,

  fetchAnalytics: async (type) => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Implement API call
      set({ isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch analytics', isLoading: false });
    }
  },

  addAnalytics: (analyticsData) => {
    const newAnalytics: AnalyticsData = {
      ...analyticsData,
      id: Date.now().toString(),
      timestamp: new Date()
    };

    set(state => ({
      analytics: { ...state.analytics, [newAnalytics.id]: newAnalytics }
    }));

    return newAnalytics;
  },

  updateAnalytics: (id, updates) => {
    set(state => ({
      analytics: {
        ...state.analytics,
        [id]: {
          ...state.analytics[id],
          ...updates
        }
      }
    }));
  },

  deleteAnalytics: (id) => {
    set(state => {
      const { [id]: deleted, ...rest } = state.analytics;
      return { analytics: rest };
    });
  }
}));