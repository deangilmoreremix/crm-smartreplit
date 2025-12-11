// src/store/contactStore.ts
// Compatibility shim so old imports keep working after moving to hooks/
import { create } from 'zustand';
import { databaseService, Contact as DBContact } from '../services/databaseService';
import { useAuthStore } from './authStore';

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  avatar?: string;
  avatarSrc?: string;
  lastContact: string;
  status: 'hot' | 'warm' | 'cold';
  dealValue: string;
  tags: string[];
  notes?: string;
  score?: number;
  assignedTo?: string;
  priority?: 'high' | 'medium' | 'low';
  source?: string;
  industry?: string;
}

interface ContactStore {
  contacts: Record<string, Contact>;
  searchTerm: string;
  selectedTag: string;
  currentContact: Contact | null;
  loading: boolean;
  setSearchTerm: (term: string) => void;
  setSelectedTag: (tag: string) => void;
  setCurrentContact: (contact: Contact | null) => void;
  addContact: (contact: Omit<Contact, 'id'>) => Promise<void>;
  updateContact: (id: string, contact: Partial<Contact>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  getFilteredContacts: () => Contact[];
  loadContacts: () => Promise<void>;
}

// Convert DB contact to store contact format
const convertDbToStoreContact = (dbContact: DBContact): Contact => ({
  id: dbContact.id,
  name: dbContact.name,
  email: dbContact.email || '',
  phone: dbContact.phone || '',
  company: dbContact.company || '',
  position: dbContact.position || '',
  avatar: dbContact.avatar,
  avatarSrc: dbContact.avatar,
  lastContact: new Date(dbContact.updated_at).toLocaleDateString(),
  status: (dbContact.status as 'hot' | 'warm' | 'cold') || 'cold',
  dealValue: '$0',
  tags: dbContact.tags || [],
  notes: dbContact.notes,
  score: dbContact.score || 0,
  assignedTo: '',
  priority: 'medium',
  source: '',
  industry: '',
});

// Convert store contact to DB contact format
const convertStoreToDbContact = (contact: Omit<Contact, 'id'>, userId: string): Omit<DBContact, 'id' | 'created_at' | 'updated_at'> => ({
  user_id: userId,
  name: contact.name,
  email: contact.email,
  phone: contact.phone,
  company: contact.company,
  position: contact.position,
  avatar: contact.avatar || contact.avatarSrc,
  status: contact.status,
  tags: contact.tags,
  notes: contact.notes,
  score: contact.score || 0,
});

export const useContactStore = create<ContactStore>((set, get) => ({
  contacts: {},
  searchTerm: '',
  selectedTag: 'all',
  currentContact: null,
  loading: false,

  setSearchTerm: (term) => set({ searchTerm: term }),
  setSelectedTag: (tag) => set({ selectedTag: tag }),
  setCurrentContact: (contact) => set({ currentContact: contact }),

  addContact: async (contact) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    set({ loading: true });
    try {
      const dbContact = convertStoreToDbContact(contact, user.id);
      const newContact = await databaseService.createContact(dbContact);

      if (newContact) {
        const storeContact = convertDbToStoreContact(newContact);
        set((state) => ({
          contacts: { ...state.contacts, [storeContact.id]: storeContact },
        }));
      }
    } catch (error) {
      console.error('Error adding contact:', error);
    } finally {
      set({ loading: false });
    }
  },

  updateContact: async (id, updates) => {
    set({ loading: true });
    try {
      const updatedContact = await databaseService.updateContact(id, updates);

      if (updatedContact) {
        const storeContact = convertDbToStoreContact(updatedContact);
        set((state) => ({
          contacts: {
            ...state.contacts,
            [id]: { ...state.contacts[id], ...storeContact },
          },
        }));
      }
    } catch (error) {
      console.error('Error updating contact:', error);
    } finally {
      set({ loading: false });
    }
  },

  deleteContact: async (id) => {
    set({ loading: true });
    try {
      const success = await databaseService.deleteContact(id);

      if (success) {
        set((state) => {
          const newContacts = { ...state.contacts };
          delete newContacts[id];
          return { contacts: newContacts };
        });
      }
    } catch (error) {
      console.error('Error deleting contact:', error);
    } finally {
      set({ loading: false });
    }
  },

  loadContacts: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    set({ loading: true });
    try {
      const dbContacts = await databaseService.getContacts(user.id);
      const contactsMap = dbContacts.reduce((acc, contact) => {
        const storeContact = convertDbToStoreContact(contact);
        acc[storeContact.id] = storeContact;
        return acc;
      }, {} as Record<string, Contact>);

      set({ contacts: contactsMap });
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      set({ loading: false });
    }
  },

  getFilteredContacts: () => {
    const { contacts, searchTerm, selectedTag } = get();
    const contactList = Object.values(contacts);

    return contactList.filter((contact) => {
      const matchesSearch =
        !searchTerm ||
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesTag =
        selectedTag === 'all' ||
        contact.tags.includes(selectedTag) ||
        contact.status === selectedTag;

      return matchesSearch && matchesTag;
    });
  },
}));