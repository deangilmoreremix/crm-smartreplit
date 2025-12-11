import { create } from 'zustand';

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
  fetchCommunications: (contactId?: string) => Promise<void>;
  addCommunication: (comm: Omit<Communication, 'id' | 'createdAt' | 'updatedAt'>) => Communication;
  updateCommunication: (id: string, updates: Partial<Communication>) => void;
  deleteCommunication: (id: string) => void;
}

export const useCommunicationStore = create<CommunicationStore>((set, get) => ({
  communications: {},
  isLoading: false,
  error: null,

  fetchCommunications: async (contactId) => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Implement API call
      set({ isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch communications', isLoading: false });
    }
  },

  addCommunication: (commData) => {
    const newComm: Communication = {
      ...commData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    set(state => ({
      communications: { ...state.communications, [newComm.id]: newComm }
    }));

    return newComm;
  },

  updateCommunication: (id, updates) => {
    set(state => ({
      communications: {
        ...state.communications,
        [id]: {
          ...state.communications[id],
          ...updates,
          updatedAt: new Date()
        }
      }
    }));
  },

  deleteCommunication: (id) => {
    set(state => {
      const { [id]: deleted, ...rest } = state.communications;
      return { communications: rest };
    });
  }
}));