import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';

export type Communication = {
  id: number;
  profileId: string;
  type: 'email' | 'call' | 'sms' | 'meeting';
  subject?: string | null;
  content?: string | null;
  direction?: 'inbound' | 'outbound' | null;
  status?: string | null;
  contactId?: number | null;
  createdAt: string; // ISO date string from API
};

type CreateCommunicationData = Omit<Communication, 'id' | 'profileId' | 'createdAt'>;

export function useCommunications() {
  return useQuery<Communication[]>({
    queryKey: ['/api/communications'],
  });
}

export function useCreateCommunication() {
  return useMutation({
    mutationFn: async (data: CreateCommunicationData) => {
      return apiRequest<Communication>('/api/communications', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/communications'] });
    },
  });
}
