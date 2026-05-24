
import { create } from 'zustand';

interface ContactStore {
  score: number;
}

const useContactStore = create<ContactStore>((set, get) => ({
  score: 1,
  scoreContact: async () => {
    try {
      set((state) => ({
        score: state.score,
      }));
      return 1;
    } catch (error) {
      throw error;
    }
  },
}));
