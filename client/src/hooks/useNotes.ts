import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';

export type Note = {
  id: number;
  profileId: string;
  content: string;
  contactId?: number | null;
  dealId?: number | null;
  createdAt: string; // ISO date string from API
  updatedAt?: string | null; // ISO date string from API
};

type CreateNoteData = Omit<Note, 'id' | 'profileId' | 'createdAt' | 'updatedAt'>;
type UpdateNoteData = Partial<Omit<Note, 'id' | 'profileId' | 'createdAt' | 'updatedAt'>>;

export function useNotes() {
  return useQuery<Note[]>({
    queryKey: ['/api/notes'],
  });
}

export function useNotesByContact(contactId: number) {
  return useQuery<Note[]>({
    queryKey: [`/api/notes/contact/${contactId}`],
    enabled: !!contactId,
  });
}

export function useNotesByDeal(dealId: number) {
  return useQuery<Note[]>({
    queryKey: [`/api/notes/deal/${dealId}`],
    enabled: !!dealId,
  });
}

export function useCreateNote() {
  return useMutation({
    mutationFn: async (data: CreateNoteData) => {
      return apiRequest<Note>('/api/notes', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (newNote) => {
      // Invalidate all note queries including filtered views
      queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
      if (newNote.contactId) {
        queryClient.invalidateQueries({ queryKey: [`/api/notes/contact/${newNote.contactId}`] });
      }
      if (newNote.dealId) {
        queryClient.invalidateQueries({ queryKey: [`/api/notes/deal/${newNote.dealId}`] });
      }
    },
  });
}

export function useUpdateNote() {
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateNoteData }) => {
      return apiRequest<Note>(`/api/notes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (updatedNote) => {
      // Invalidate all note queries including filtered views
      queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
      if (updatedNote.contactId) {
        queryClient.invalidateQueries({ queryKey: [`/api/notes/contact/${updatedNote.contactId}`] });
      }
      if (updatedNote.dealId) {
        queryClient.invalidateQueries({ queryKey: [`/api/notes/deal/${updatedNote.dealId}`] });
      }
    },
  });
}

export function useDeleteNote() {
  return useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/notes/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      // Invalidate all note-related queries
      queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
      // Invalidate all contact and deal note queries since we don't know which one was deleted
      queryClient.invalidateQueries({ predicate: (query) => 
        query.queryKey[0] && 
        typeof query.queryKey[0] === 'string' && 
        (query.queryKey[0].startsWith('/api/notes/contact/') || 
         query.queryKey[0].startsWith('/api/notes/deal/'))
      });
    },
  });
}
