import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';

export type Appointment = {
  id: number;
  profileId: string;
  title: string;
  description?: string | null;
  startTime: string; // ISO date string from API
  endTime: string; // ISO date string from API
  location?: string | null;
  type?: string | null;
  status?: string | null;
  contactId?: number | null;
  createdAt: string; // ISO date string from API
  updatedAt?: string | null; // ISO date string from API
};

type CreateAppointmentData = Omit<Appointment, 'id' | 'profileId' | 'createdAt' | 'updatedAt'>;
type UpdateAppointmentData = Partial<Omit<Appointment, 'id' | 'profileId' | 'createdAt' | 'updatedAt'>>;

export function useAppointments() {
  return useQuery<Appointment[]>({
    queryKey: ['/api/appointments'],
  });
}

export function useAppointment(id: number) {
  return useQuery<Appointment>({
    queryKey: [`/api/appointments/${id}`],
    enabled: !!id,
  });
}

export function useCreateAppointment() {
  return useMutation({
    mutationFn: async (data: CreateAppointmentData) => {
      return apiRequest<Appointment>('/api/appointments', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
    },
  });
}

export function useUpdateAppointment() {
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateAppointmentData }) => {
      return apiRequest<Appointment>(`/api/appointments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      queryClient.invalidateQueries({ queryKey: [`/api/appointments/${variables.id}`] });
    },
  });
}

export function useDeleteAppointment() {
  return useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/appointments/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
    },
  });
}
