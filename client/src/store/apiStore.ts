import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ApiStore {
  apiKeys: {
    openai: string;
    google: string;
  };
  setApiKey: (service: 'openai' | 'google', key: string) => void;
}

export const useApiStore = create<ApiStore>()(
  persist(
    (set) => ({
      apiKeys: {
        openai: '',
        google: ''
      },
      setApiKey: (service, key) =>
        set((state) => ({
          apiKeys: {
            ...state.apiKeys,
            [service]: key
          }
        })),
    }),
    {
      name: 'ai-tools-api-keys',
    }
  )
);