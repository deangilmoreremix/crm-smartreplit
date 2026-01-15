import { create } from 'zustand';
import { Task } from '../types/task';
import { api } from '../services/unifiedApiClient';

interface TaskStore {
  tasks: Record<string, Task>;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchTasks: () => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Task | null>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
}

export const useTaskStore = create<TaskStore>((set) => ({
  tasks: {},
  isLoading: false,
  error: null,

  fetchTasks: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<Task[]>('/api/tasks');
      if (response.success && response.data) {
        const tasksMap = response.data.reduce((acc, task) => {
          acc[task.id.toString()] = {
            ...task,
            createdAt: new Date(task.createdAt),
            updatedAt: new Date(task.updatedAt),
            dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
            completedDate: task.completedDate ? new Date(task.completedDate) : undefined,
            completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
          };
          return acc;
        }, {} as Record<string, Task>);
        set({ tasks: tasksMap, isLoading: false });
      } else {
        set({ error: response.error || 'Failed to fetch tasks', isLoading: false });
      }
    } catch (_) {
      set({ error: 'Failed to fetch tasks', isLoading: false });
    }
  },

  addTask: async (taskData) => {
    try {
      const response = await api.post<Task>('/api/tasks', taskData);
      if (response.success && response.data) {
        const newTask = {
          ...response.data,
          createdAt: new Date(response.data.createdAt),
          updatedAt: new Date(response.data.updatedAt),
          dueDate: response.data.dueDate ? new Date(response.data.dueDate) : undefined,
          completedDate: response.data.completedDate ? new Date(response.data.completedDate) : undefined,
          completedAt: response.data.completedAt ? new Date(response.data.completedAt) : undefined,
        };

        set(state => ({
          tasks: { ...state.tasks, [newTask.id.toString()]: newTask }
        }));

        return newTask;
      } else {
        set({ error: response.error || 'Failed to create task' });
        return null;
      }
    } catch (error) {
      set({ error: 'Failed to create task' });
      return null;
    }
  },

  updateTask: async (id, updates) => {
    try {
      const response = await api.put<Task>(`/api/tasks/${id}`, updates);
      if (response.success && response.data) {
        const updatedTask = {
          ...response.data,
          createdAt: new Date(response.data.createdAt),
          updatedAt: new Date(response.data.updatedAt),
          dueDate: response.data.dueDate ? new Date(response.data.dueDate) : undefined,
          completedDate: response.data.completedDate ? new Date(response.data.completedDate) : undefined,
          completedAt: response.data.completedAt ? new Date(response.data.completedAt) : undefined,
        };

        set(state => ({
          tasks: {
            ...state.tasks,
            [id]: updatedTask
          }
        }));
      } else {
        set({ error: response.error || 'Failed to update task' });
      }
    } catch (error) {
      set({ error: 'Failed to update task' });
    }
  },

  deleteTask: async (id) => {
    try {
      const response = await api.delete(`/api/tasks/${id}`);
      if (response.success) {
        set(state => {
          const { [id]: deleted, ...rest } = state.tasks;
          return { tasks: rest };
        });
      } else {
        set({ error: response.error || 'Failed to delete task' });
      }
    } catch (error) {
      set({ error: 'Failed to delete task' });
    }
  }
}));