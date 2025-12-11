import { create } from 'zustand';

interface Goal {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  type: 'revenue' | 'contacts' | 'deals' | 'tasks';
  deadline: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface GoalStore {
  goals: Record<string, Goal>;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchGoals: () => Promise<void>;
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => Goal;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
}

export const useGoalStore = create<GoalStore>((set, get) => ({
  goals: {},
  isLoading: false,
  error: null,

  fetchGoals: async () => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Implement API call
      set({ isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch goals', isLoading: false });
    }
  },

  addGoal: (goalData) => {
    const newGoal: Goal = {
      ...goalData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    set(state => ({
      goals: { ...state.goals, [newGoal.id]: newGoal }
    }));

    return newGoal;
  },

  updateGoal: (id, updates) => {
    set(state => ({
      goals: {
        ...state.goals,
        [id]: {
          ...state.goals[id],
          ...updates,
          updatedAt: new Date()
        }
      }
    }));
  },

  deleteGoal: (id) => {
    set(state => {
      const { [id]: deleted, ...rest } = state.goals;
      return { goals: rest };
    });
  }
}));