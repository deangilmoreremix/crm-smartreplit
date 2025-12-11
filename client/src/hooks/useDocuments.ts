import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';

export type Document = {
  id: number;
  profileId: string;
  name: string;
  type?: string | null;
  url: string;
  size?: number | null;
  contactId?: number | null;
  dealId?: number | null;
  createdAt: string; // ISO date string from API
};

type CreateDocumentData = Omit<Document, 'id' | 'profileId' | 'createdAt'>;

export function useDocuments() {
  return useQuery<Document[]>({
    queryKey: ['/api/documents'],
  });
}

export function useCreateDocument() {
  return useMutation({
    mutationFn: async (data: CreateDocumentData) => {
      return apiRequest<Document>('/api/documents', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
    },
  });
}

export function useDeleteDocument() {
  return useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/documents/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
    },
  });
}
