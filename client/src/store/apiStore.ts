import { create } from 'zustand';

interface ApiStore {
  apiKeys: {
    openai: string;
    google: string;
  };
  setApiKey: (service: 'openai' | 'google', key: string) => void;
}

// API keys live on the server (user_api_keys). This store is in-memory only: never persist keys
// to browser storage.
try {
  localStorage.removeItem('ai-tools-api-keys');
} catch {
  // storage unavailable
}

export const useApiStore = create<ApiStore>()((set) => ({
  apiKeys: {
    openai: '',
    google: '',
  },
  setApiKey: (service, key) =>
    set((state) => ({
      apiKeys: {
        ...state.apiKeys,
        [service]: key,
      },
    })),
}));
