import { create } from 'zustand';
import { Task } from '../types/task';

interface TaskStore {
  tasks: Record<string, Task>;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchTasks: () => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: {},
  isLoading: false,
  error: null,

  fetchTasks: async () => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Implement API call
      set({ isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch tasks', isLoading: false });
    }
  },

  addTask: (taskData) => {
    const newTask: Task = {
      ...taskData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    set(state => ({
      tasks: { ...state.tasks, [newTask.id]: newTask }
    }));

    return newTask;
  },

  updateTask: (id, updates) => {
    set(state => ({
      tasks: {
        ...state.tasks,
        [id]: {
          ...state.tasks[id],
          ...updates,
          updatedAt: new Date()
        }
      }
    }));
  },

  deleteTask: (id) => {
    set(state => {
      const { [id]: deleted, ...rest } = state.tasks;
      return { tasks: rest };
    });
  }
}));