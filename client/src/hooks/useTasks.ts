import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';

export type Task = {
  id: number;
  profileId: string;
  title: string;
  description?: string | null;
  dueDate?: string | null; // ISO date string from API
  priority?: 'low' | 'medium' | 'high' | null;
  status?: string | null;
  completed: boolean;
  category?: string | null;
  contactId?: number | null;
  dealId?: number | null;
  completedAt?: string | null; // ISO date string from API
  createdAt: string; // ISO date string from API
  updatedAt?: string | null; // ISO date string from API
};

type CreateTaskData = Omit<Task, 'id' | 'profileId' | 'createdAt' | 'updatedAt' | 'completedAt'>;
type UpdateTaskData = Partial<Omit<Task, 'id' | 'profileId' | 'createdAt' | 'updatedAt'>>;

export function useTasks() {
  return useQuery<Task[]>({
    queryKey: ['/api/tasks'],
  });
}

export function useTask(id: number) {
  return useQuery<Task>({
    queryKey: [`/api/tasks/${id}`],
    enabled: !!id,
  });
}

export function useCreateTask() {
  return useMutation({
    mutationFn: async (data: CreateTaskData) => {
      return apiRequest<Task>('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
    },
  });
}

export function useUpdateTask() {
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateTaskData }) => {
      return apiRequest<Task>(`/api/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${variables.id}`] });
    },
  });
}

export function useDeleteTask() {
  return useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/tasks/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
    },
  });
}
