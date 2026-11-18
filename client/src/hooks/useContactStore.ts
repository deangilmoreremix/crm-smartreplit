import { create } from 'zustand';
import { Contact } from '../types/contact';
import { logger } from '../services/logger.service';
import Fuse from 'fuse.js';

interface ContactStore {
  contacts: Record<string, Contact>;
  isLoading: boolean;
  error: string | null;
  searchTerm: string;
  statusFilter: string;
  interestFilter: 'all' | 'hot' | 'medium' | 'low' | 'cold';
  selectedContacts: string[];

  // Search and filter state
  fuse: Fuse<Contact> | null;

  // Actions
  fetchContacts: () => Promise<void>;
  addContact: (contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => Contact;
  updateContact: (id: string, updates: Partial<Contact>) => void;
  deleteContact: (id: string) => void;

  // Enhanced actions
  searchContacts: (term: string) => Contact[];
  setSearchTerm: (term: string) => void;
  setStatusFilter: (filter: string) => void;
  setInterestFilter: (filter: 'all' | 'hot' | 'medium' | 'low' | 'cold') => void;
  toggleContactSelection: (id: string) => void;
  selectAllContacts: (contacts: Contact[]) => void;
  clearSelection: () => void;

  // AI features
  analyzeContact: (id: string) => Promise<void>;
  enrichContact: (id: string) => Promise<void>;
  scoreContact: (id: string) => Promise<number>;
}

export const useContactStore = create<ContactStore>((set, get) => ({
  // Contacts are loaded from the server (GET /api/contacts); no sample records are seeded
  contacts: {},
  isLoading: false, // Start as false so dashboard renders immediately
  error: null,
  searchTerm: '',
  statusFilter: 'all',
  interestFilter: 'all',
  selectedContacts: [],
  fuse: null,

  fetchContacts: async () => {
    set({ isLoading: true, error: null });
    try {
      // Try to fetch from API first
      const response = await fetch('/api/contacts', {
        credentials: 'include',
      });

      if (response.ok) {
        const apiContacts = await response.json();

        // Convert array to record format
        const contactsRecord: Record<string, Contact> = {};
        apiContacts.forEach((contact: any) => {
          const formattedContact: Contact = {
            id: contact.id?.toString() || crypto.randomUUID(),
            firstName: contact.firstName || contact.first_name || '',
            lastName: contact.lastName || contact.last_name || '',
            name: `${contact.firstName || contact.first_name || ''} ${contact.lastName || contact.last_name || ''}`.trim(),
            email: contact.email || '',
            phone: contact.phone || '',
            company: contact.company || '',
            position: contact.position || '',
            title: contact.position || contact.title || '',
            industry: contact.industry || '',
            status: contact.status || 'lead',
            tags: contact.tags || [],
            notes: contact.notes || '',
            source: contact.source || 'Website',
            sources: contact.sources || [contact.source || 'Website'],
            // The API stores the lead score as 0-1 (null until scored); the UI uses 0-100
            aiScore: contact.score != null && contact.score !== '' ? Math.round(Number(contact.score) * 100) : undefined,
            createdAt: contact.createdAt ? new Date(contact.createdAt) : new Date(),
            updatedAt: contact.updatedAt ? new Date(contact.updatedAt) : new Date(),
          };
          contactsRecord[formattedContact.id] = formattedContact;
        });

        // Initialize Fuse.js for search
        const fuse = new Fuse(Object.values(contactsRecord), {
          keys: ['name', 'email', 'company', 'position', 'title', 'industry', 'tags', 'notes'],
          threshold: 0.3,
          includeScore: true,
        });

        set({ contacts: contactsRecord, isLoading: false, fuse });
        logger.info('Contacts fetched from API', `${apiContacts.length} contacts loaded`);
        return;
      }

      // Fallback to local state if API fails (user not authenticated)
      const contacts = Object.values(get().contacts);
      const fuse = new Fuse(contacts, {
        keys: ['name', 'email', 'company', 'position', 'title', 'industry', 'tags', 'notes'],
        threshold: 0.3,
        includeScore: true,
      });

      set({ isLoading: false, fuse, error: `Could not load contacts (${response.status})` });
      logger.warn('Contacts API returned an error', `status ${response.status}`);
    } catch (error) {
      // Fallback to local state on error
      const contacts = Object.values(get().contacts);
      const fuse = new Fuse(contacts, {
        keys: ['name', 'email', 'company', 'position', 'title', 'industry', 'tags', 'notes'],
        threshold: 0.3,
        includeScore: true,
      });

      set({ isLoading: false, fuse, error: 'Could not load contacts' });
      logger.warn('Contacts API unavailable', error as Error);
    }
  },

  addContact: (contactData) => {
    const tempId = Date.now().toString();
    const derivedName = `${contactData.firstName || ''} ${contactData.lastName || ''}`.trim();
    const newContact: Contact = {
      ...contactData,
      id: tempId,
      name: derivedName || contactData.name || '',
      tags: contactData.tags || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Optimistic update - add to local state immediately
    set((state) => {
      const newContacts = { ...state.contacts, [newContact.id]: newContact };
      const fuse = new Fuse(Object.values(newContacts), {
        keys: ['name', 'email', 'company', 'position', 'title', 'industry', 'tags', 'notes'],
        threshold: 0.3,
        includeScore: true,
      });
      return { contacts: newContacts, fuse };
    });

    // Persist to API in background
    fetch('/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        firstName: contactData.firstName,
        lastName: contactData.lastName,
        email: contactData.email,
        phone: contactData.phone,
        company: contactData.company,
        position: contactData.position || contactData.title,
        industry: contactData.industry,
        source: contactData.source,
        tags: contactData.tags,
        notes: contactData.notes,
        status: contactData.status || 'lead',
      }),
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        throw new Error(`Failed to save contact: ${response.status}`);
      })
      .then((savedContact) => {
        if (savedContact) {
          // Replace optimistic record with full server response
          set((state) => {
            const { [tempId]: _, ...rest } = state.contacts;
            const serverContact: Contact = {
              id: savedContact.id?.toString() || tempId,
              firstName: savedContact.firstName || savedContact.first_name || contactData.firstName,
              lastName: savedContact.lastName || savedContact.last_name || contactData.lastName,
              name: `${savedContact.firstName || savedContact.first_name || ''} ${savedContact.lastName || savedContact.last_name || ''}`.trim(),
              email: savedContact.email || contactData.email,
              phone: savedContact.phone || contactData.phone,
              company: savedContact.company || contactData.company,
              position: savedContact.position || contactData.position,
              title: savedContact.position || contactData.title,
              industry: savedContact.industry || contactData.industry,
              status: savedContact.status || contactData.status || 'lead',
              tags: savedContact.tags || contactData.tags || [],
              notes: savedContact.notes || contactData.notes,
              source: savedContact.source || contactData.source,
              sources: savedContact.sources || [
                savedContact.source || contactData.source || 'Website',
              ],
              createdAt: savedContact.createdAt ? new Date(savedContact.createdAt) : new Date(),
              updatedAt: savedContact.updatedAt ? new Date(savedContact.updatedAt) : new Date(),
            };
            const newContacts = { ...rest, [serverContact.id]: serverContact };
            const fuse = new Fuse(Object.values(newContacts), {
              keys: ['name', 'email', 'company', 'position', 'title', 'industry', 'tags', 'notes'],
              threshold: 0.3,
              includeScore: true,
            });
            return { contacts: newContacts, fuse };
          });
        }
      })
      .catch((error) => {
        logger.error('Failed to persist contact to API', error as Error);
        set({ error: error instanceof Error ? error.message : 'Failed to save contact' });
      });

    logger.info('Contact added successfully', { contactId: newContact.id });
    return newContact;
  },

  updateContact: (id, updates) => {
    const originalContact = get().contacts[id];

    // Update name if first/last name changed
    let updatedName = updates.name;
    if (updates.firstName !== undefined || updates.lastName !== undefined) {
      const firstName = updates.firstName ?? originalContact?.firstName ?? '';
      const lastName = updates.lastName ?? originalContact?.lastName ?? '';
      updatedName = `${firstName} ${lastName}`.trim();
    }

    // Optimistic update
    set((state) => {
      const updatedContacts = {
        ...state.contacts,
        [id]: {
          ...state.contacts[id],
          ...updates,
          name: updatedName || state.contacts[id]?.name,
          updatedAt: new Date(),
        },
      };
      const fuse = new Fuse(Object.values(updatedContacts), {
        keys: ['name', 'email', 'company', 'position', 'title', 'industry', 'tags', 'notes'],
        threshold: 0.3,
        includeScore: true,
      });
      return { contacts: updatedContacts, fuse };
    });

    // Persist to API
    fetch(`/api/contacts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(updates),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to update contact: ${response.status}`);
        }
        return response.json();
      })
      .catch((error) => {
        logger.error('Failed to persist contact update to API', error as Error);
        set({ error: error instanceof Error ? error.message : 'Failed to update contact' });
        // Rollback optimistic update on failure
        if (originalContact) {
          set((state) => {
            const contacts = { ...state.contacts, [id]: originalContact };
            const fuse = new Fuse(Object.values(contacts), {
              keys: ['name', 'email', 'company', 'position', 'title', 'industry', 'tags', 'notes'],
              threshold: 0.3,
              includeScore: true,
            });
            return { contacts, fuse };
          });
        }
      });

    logger.info('Contact updated successfully', { contactId: id });
  },

  deleteContact: (id) => {
    const deletedContact = get().contacts[id];

    // Optimistic update
    set((state) => {
      const { [id]: deleted, ...rest } = state.contacts;
      const fuse = new Fuse(Object.values(rest), {
        keys: ['name', 'email', 'company', 'position', 'title', 'industry', 'tags', 'notes'],
        threshold: 0.3,
        includeScore: true,
      });
      return { contacts: rest, fuse };
    });

    // Persist to API
    fetch(`/api/contacts/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to delete contact: ${response.status}`);
        }
      })
      .catch((error) => {
        logger.error('Failed to persist contact deletion to API', error as Error);
        set({ error: error instanceof Error ? error.message : 'Failed to delete contact' });
        // Rollback on failure
        if (deletedContact) {
          set((state) => {
            const contacts = { ...state.contacts, [id]: deletedContact };
            const fuse = new Fuse(Object.values(contacts), {
              keys: ['name', 'email', 'company', 'position', 'title', 'industry', 'tags', 'notes'],
              threshold: 0.3,
              includeScore: true,
            });
            return { contacts, fuse };
          });
        }
      });

    logger.info('Contact deleted successfully', { contactId: id });
  },

  // Enhanced search and filter actions
  searchContacts: (term: string) => {
    const { fuse, contacts } = get();
    if (!term.trim()) {
      return Object.values(contacts);
    }

    if (!fuse) {
      return Object.values(contacts).filter(
        (contact) =>
          contact.name.toLowerCase().includes(term.toLowerCase()) ||
          contact.email.toLowerCase().includes(term.toLowerCase()) ||
          contact.company?.toLowerCase().includes(term.toLowerCase())
      );
    }

    const results = fuse.search(term);
    return results.map((result) => result.item);
  },

  setSearchTerm: (term: string) => {
    set({ searchTerm: term });
  },

  setStatusFilter: (filter: string) => {
    set({ statusFilter: filter });
  },

  setInterestFilter: (filter: 'all' | 'hot' | 'medium' | 'low' | 'cold') => {
    set({ interestFilter: filter });
  },

  toggleContactSelection: (id: string) => {
    set((state) => ({
      selectedContacts: state.selectedContacts.includes(id)
        ? state.selectedContacts.filter((contactId) => contactId !== id)
        : [...state.selectedContacts, id],
    }));
  },

  selectAllContacts: (contacts: Contact[]) => {
    set({ selectedContacts: contacts.map((c) => c.id) });
  },

  clearSelection: () => {
    set({ selectedContacts: [] });
  },

  // AI features - call real API endpoints (no fabricated fallback values)
  analyzeContact: async (id: string) => {
    try {
      const score = await get().scoreContact(id);
      logger.info('Contact analyzed successfully', { contactId: id, score });
    } catch (error) {
      logger.error('Failed to analyze contact', error as Error);
      throw error;
    }
  },

  enrichContact: async (id: string) => {
    try {
      const response = await fetch(`/api/contacts/${id}/enrich`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.data) {
        throw new Error(result.message || result.error || `Enrichment failed (${response.status})`);
      }

      set((state) => ({
        contacts: {
          ...state.contacts,
          [id]: {
            ...state.contacts[id],
            ...result.data,
            updatedAt: new Date(),
          },
        },
      }));

      logger.info('Contact enriched successfully', { contactId: id });
    } catch (error) {
      logger.error('Failed to enrich contact', error as Error);
      throw error;
    }
  },

  scoreContact: async (id: string) => {
    try {
      const response = await fetch(`/api/contacts/${id}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || typeof result.score !== 'number') {
        throw new Error(result.message || result.error || `Scoring failed (${response.status})`);
      }
      // The server returns the AI score on a 0-100 scale
      const score = Math.round(result.score);

      set((state) => ({
        contacts: {
          ...state.contacts,
          [id]: {
            ...state.contacts[id],
            aiScore: score,
            score: score,
            updatedAt: new Date(),
          },
        },
      }));

      return score;
    } catch (error) {
      logger.error('Failed to score contact', error as Error);
      throw error;
    }
  },
}));
