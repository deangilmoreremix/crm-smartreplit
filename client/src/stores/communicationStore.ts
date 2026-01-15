import { create } from 'zustand';
import { api } from '../services/unifiedApiClient';

interface Communication {
  id: string;
  type: 'email' | 'call' | 'meeting' | 'note';
  contactId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CommunicationStore {
  communications: Record<string, Communication>;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchCommunications: () => Promise<void>;
  addCommunication: (comm: Omit<Communication, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Communication | null>;
  updateCommunication: (id: string, updates: Partial<Communication>) => Promise<void>;
  deleteCommunication: (id: string) => Promise<void>;
}

export const useCommunicationStore = create<CommunicationStore>((set) => ({
  communications: {},
  isLoading: false,
  error: null,

  fetchCommunications: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<Communication[]>('/api/communications');
      if (response.success && response.data) {
        const commsMap = response.data.reduce((acc, comm) => {
          acc[comm.id.toString()] = {
            ...comm,
            createdAt: new Date(comm.createdAt),
            updatedAt: new Date(comm.updatedAt),
          };
          return acc;
        }, {} as Record<string, Communication>);
        set({ communications: commsMap, isLoading: false });
      } else {
        set({ error: response.error || 'Failed to fetch communications', isLoading: false });
      }
    } catch {
      set({ error: 'Failed to fetch communications', isLoading: false });
    }
  },

  addCommunication: async (commData) => {
    try {
      const response = await api.post<Communication>('/api/communications', commData);
      if (response.success && response.data) {
        const newComm = {
          ...response.data,
          createdAt: new Date(response.data.createdAt),
          updatedAt: new Date(response.data.updatedAt),
        };

        set(state => ({
          communications: { ...state.communications, [newComm.id.toString()]: newComm }
        }));

        return newComm;
      } else {
        set({ error: response.error || 'Failed to create communication' });
        return null;
      }
    } catch {
      set({ error: 'Failed to create communication' });
      return null;
    }
  },

  updateCommunication: async (id, updates) => {
    try {
      const response = await api.put<Communication>(`/api/communications/${id}`, updates);
      if (response.success && response.data) {
        const updatedComm = {
          ...response.data,
          createdAt: new Date(response.data.createdAt),
          updatedAt: new Date(response.data.updatedAt),
        };
        set(state => ({
          communications: { ...state.communications, [id]: updatedComm }
        }));
      } else {
        set({ error: response.error || 'Failed to update communication' });
      }
    } catch {
      set({ error: 'Failed to update communication' });
    }
  },

  deleteCommunication: async (id) => {
    try {
      const response = await api.delete(`/api/communications/${id}`);
      if (response.success) {
        set(state => {
          const newComms = { ...state.communications };
          delete newComms[id];
          return { communications: newComms };
        });
      } else {
        set({ error: response.error || 'Failed to delete communication' });
      }
    } catch {
      set({ error: 'Failed to delete communication' });
    }
  }
}));