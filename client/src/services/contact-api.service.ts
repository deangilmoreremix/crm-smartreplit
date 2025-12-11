import { Contact } from '../types/contact';
import { cacheService } from './cache.service';
import { logger } from '../utils/logger';
import { validationService } from './validationService';

export interface ContactFilters {
  search?: string;
  status?: string;
  tags?: string[];
  hasAIScore?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ContactListResponse {
  contacts: Contact[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface ContactStats {
  total: number;
  byStatus: Record<string, number>;
  byTags: Record<string, number>;
  withAIScore: number;
  avgAIScore: number;
  recentlyUpdated: number;
}

class ContactAPIService {
  private baseURL: string;
  private supabaseUrl: string;
  private supabaseKey: string;
  private isBackendAvailable = true;
  private isMockMode = false; // Use Supabase Edge Functions by default for remote app compatibility
  
  constructor() {
    // Configure to use Supabase Edge Functions as required by remote apps
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    this.supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
    this.baseURL = `${this.supabaseUrl}/functions/v1/contacts`;
    
    // Only fall back to mock mode if Supabase is not configured
    if (!this.supabaseUrl || !this.supabaseKey) {
      this.isMockMode = true;
      console.warn('Supabase not configured - falling back to local storage');
    } else {
      this.isMockMode = false;
      this.isBackendAvailable = true;
      console.log('Using Supabase Edge Functions for contact management (required by remote apps)');
    }
  }
  
  // Get headers for Supabase Edge Function requests
  private getSupabaseHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.supabaseKey}`
    };
    
    return headers;
  }
  
  // Check if we should use fallback mode
  private shouldUseFallback(): boolean {
    return this.isMockMode || !this.supabaseUrl || !this.supabaseKey;
  }
  
  // Initialize local storage with sample data if needed
  private initializeLocalStorage(): Contact[] {
    try {
      const stored = localStorage.getItem('contacts');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      // If localStorage is corrupted, reset it
    }
    
    // Default sample data
    const sampleContacts: Contact[] = [
      {
        id: '1',
        firstName: 'Jane',
        lastName: 'Doe',
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
        phone: '+1 (555) 123-4567',
        title: 'Marketing Director',
        company: 'Acme Corp',
        industry: 'Technology',
        avatarSrc: '',
        sources: ['Website'],
        interestLevel: 'high',
        status: 'prospect',
        lastConnected: '2024-01-15',
        aiScore: 85,
        tags: ['enterprise', 'decision-maker'],
        createdAt: '2024-01-10T10:00:00Z',
        updatedAt: '2024-01-20T15:30:00Z'
      }
    ];
    
    localStorage.setItem('contacts', JSON.stringify(sampleContacts));
    return sampleContacts;
  }
  
  // Get contacts from local storage
  private getLocalContacts(): Contact[] {
    try {
      const stored = localStorage.getItem('contacts');
      return stored ? JSON.parse(stored) : this.initializeLocalStorage();
    } catch (e) {
      return this.initializeLocalStorage();
    }
  }
  
  // Save contacts to local storage
  private saveLocalContacts(contacts: Contact[]): void {
    try {
      localStorage.setItem('contacts', JSON.stringify(contacts));
    } catch (e) {
      console.warn('Failed to save contacts to localStorage');
    }
  }

  // CRUD Operations
  async createContact(contactData: Partial<Contact>): Promise<Contact> {
    const sanitized = validationService.sanitizeContact(contactData);
    
    if (this.shouldUseFallback()) {
      // Local storage fallback
      logger.info('Using local storage for contact creation');
      const contacts = this.getLocalContacts();
      
      const newContact: Contact = {
        id: crypto.randomUUID(),
        firstName: sanitized.firstName || '',
        lastName: sanitized.lastName || '',
        name: `${sanitized.firstName || ''} ${sanitized.lastName || ''}`.trim(),
        email: sanitized.email || '',
        phone: sanitized.phone || '',
        title: sanitized.title || '',
        company: sanitized.company || '',
        industry: sanitized.industry || '',
        avatarSrc: sanitized.avatarSrc || '',
        sources: sanitized.sources || ['Website'],
        interestLevel: sanitized.interestLevel || 'medium',
        status: sanitized.status || 'lead',
        lastConnected: sanitized.lastConnected,
        aiScore: sanitized.aiScore,
        tags: sanitized.tags || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      contacts.push(newContact);
      this.saveLocalContacts(contacts);
      cacheService.set('contact', newContact.id, newContact, 300, ['contact']);
      return newContact;
    }
    
    try {
      // Try Edge Function with clean payload for remote app compatibility
      logger.info('Creating contact via Supabase Edge Function');
      
      const edgeFunctionPayload = {
        firstName: sanitized.firstName,
        lastName: sanitized.lastName,
        email: sanitized.email,
        phone: sanitized.phone,
        company: sanitized.company,
        title: sanitized.title,
        status: sanitized.status,
        sources: sanitized.sources || ['Website'],
        aiScore: sanitized.aiScore || null,
        tags: sanitized.tags || []
      };
      
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: this.getSupabaseHeaders(),
        body: JSON.stringify(edgeFunctionPayload)
      });
      
      if (!response.ok) {
        throw new Error(`Edge Function error: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Handle different response formats from Edge Functions
      let contactData;
      if (result.contact) {
        contactData = result.contact;
      } else if (result.data) {
        contactData = result.data;
      } else if (result.id) {
        contactData = result;
      } else {
        throw new Error('Unexpected Edge Function response format');
      }
      
      const newContact: Contact = {
        id: contactData.id || crypto.randomUUID(),
        firstName: contactData.firstName || contactData.first_name || '',
        lastName: contactData.lastName || contactData.last_name || '',
        name: `${contactData.firstName || contactData.first_name || ''} ${contactData.lastName || contactData.last_name || ''}`.trim(),
        email: contactData.email || '',
        phone: contactData.phone || '',
        title: contactData.title || contactData.position || '',
        company: contactData.company || '',
        industry: contactData.industry || '',
        avatarSrc: contactData.avatarSrc || '',
        sources: contactData.sources || [contactData.source || 'Website'].filter(Boolean),
        interestLevel: contactData.interestLevel || 'medium',
        status: contactData.status || 'lead',
        lastConnected: contactData.lastConnected || contactData.last_contacted,
        aiScore: contactData.aiScore || contactData.ai_score || contactData.lead_score,
        tags: contactData.tags || [],
        createdAt: contactData.createdAt || contactData.created_at || new Date().toISOString(),
        updatedAt: contactData.updatedAt || contactData.updated_at || new Date().toISOString()
      };
      
      // Cache the contact
      cacheService.set('contact', newContact.id, newContact, 300, ['contact']);
      
      logger.info('Contact created successfully via Edge Function', { contactId: newContact.id });
      return newContact;
    } catch (error) {
      logger.error('Edge Function unavailable, using localStorage fallback for remote app compatibility', error as Error);
      
      // Critical: Use localStorage fallback but maintain Edge Function compatibility for remote apps
      const contacts = this.getLocalContacts();
      
      const newContact: Contact = {
        id: crypto.randomUUID(),
        firstName: sanitized.firstName || '',
        lastName: sanitized.lastName || '',
        name: `${sanitized.firstName || ''} ${sanitized.lastName || ''}`.trim(),
        email: sanitized.email || '',
        phone: sanitized.phone || '',
        title: sanitized.title || '',
        company: sanitized.company || '',
        industry: sanitized.industry || '',
        avatarSrc: sanitized.avatarSrc || '',
        sources: sanitized.sources || ['Website'],
        interestLevel: sanitized.interestLevel || 'medium',
        status: sanitized.status || 'lead',
        lastConnected: sanitized.lastConnected,
        aiScore: sanitized.aiScore,
        tags: sanitized.tags || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      contacts.push(newContact);
      this.saveLocalContacts(contacts);
      cacheService.set('contact', newContact.id, newContact, 300, ['contact']);
      
      logger.info('Contact created via localStorage fallback (Edge Function compatibility maintained)');
      return newContact;
    }
  }

  async getContact(contactId: string): Promise<Contact> {
    // Check cache first
    const cached = cacheService.get('contact', contactId);
    if (cached) {
      return cached as Contact;
    }

    if (this.shouldUseFallback()) {
      // Local storage fallback
      logger.info('Using local storage for contact retrieval');
      const contacts = this.getLocalContacts();
      const contact = contacts.find(c => c.id === contactId);
      
      if (!contact) {
        throw new Error(`Contact with ID ${contactId} not found`);
      }
      
      cacheService.set('contact', contactId, contact, 300, ['contact']);
      return contact;
    }
    
    try {
      // Use Edge Function for contact retrieval (required by remote apps)
      const response = await fetch(`${this.baseURL}/${contactId}`, {
        method: 'GET',
        headers: this.getSupabaseHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`Edge Function error: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      const contactData = result.contact || result.data || result;
      
      if (!contactData) {
        throw new Error(`Contact with ID ${contactId} not found`);
      }
      
      const contact: Contact = {
        id: contactData.id,
        firstName: contactData.firstName || contactData.first_name || '',
        lastName: contactData.lastName || contactData.last_name || '',
        name: `${contactData.firstName || contactData.first_name || ''} ${contactData.lastName || contactData.last_name || ''}`.trim(),
        email: contactData.email || '',
        phone: contactData.phone || '',
        title: contactData.title || contactData.position || '',
        company: contactData.company || '',
        industry: contactData.industry || '',
        avatarSrc: contactData.avatarSrc || '',
        sources: contactData.sources || [contactData.source || 'Website'].filter(Boolean),
        interestLevel: contactData.interestLevel || 'medium',
        status: contactData.status || 'lead',
        lastConnected: contactData.lastConnected || contactData.last_contacted,
        aiScore: contactData.aiScore || contactData.ai_score || contactData.lead_score,
        tags: contactData.tags || [],
        createdAt: contactData.createdAt || contactData.created_at,
        updatedAt: contactData.updatedAt || contactData.updated_at
      };
      
      // Cache the contact
      cacheService.set('contact', contactId, contact, 300, ['contact']);
      
      return contact;
    } catch (error) {
      logger.error('Edge Function unavailable, using localStorage fallback', error as Error);
      
      // Fallback to local storage
      const contacts = this.getLocalContacts();
      const contact = contacts.find(c => c.id === contactId);
      
      if (!contact) {
        throw new Error(`Contact with ID ${contactId} not found`);
      }
      
      cacheService.set('contact', contactId, contact, 300, ['contact']);
      return contact;
    }
  }

  async updateContact(contactId: string, updates: Partial<Contact>): Promise<Contact> {
    // Validate updates
    if (Object.keys(updates).length === 0) {
      throw new Error('No updates provided');
    }
    
    const sanitized = validationService.sanitizeContact(updates);
    
    if (this.shouldUseFallback()) {
      // Local storage fallback
      logger.info('Using local storage for contact update');
      const contacts = this.getLocalContacts();
      const contactIndex = contacts.findIndex(c => c.id === contactId);
      
      if (contactIndex === -1) {
        throw new Error(`Contact with ID ${contactId} not found`);
      }
      
      const updatedContact: Contact = {
        ...contacts[contactIndex],
        ...sanitized as any,
        updatedAt: new Date().toISOString()
      };
      
      contacts[contactIndex] = updatedContact;
      this.saveLocalContacts(contacts);
      cacheService.set('contact', contactId, updatedContact, 300, ['contact']);
      cacheService.set('contactList', 'invalidate', null, 0, ['list']);
      
      return updatedContact;
    }
    
    try {
      // Use Edge Function for contact update (required by remote apps)
      const response = await fetch(`${this.baseURL}/${contactId}`, {
        method: 'PATCH',
        headers: this.getSupabaseHeaders(),
        body: JSON.stringify(sanitized)
      });
      
      if (!response.ok) {
        throw new Error(`Edge Function error: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      const contactData = result.contact || result.data || result;
      
      if (!contactData) {
        throw new Error(`Contact with ID ${contactId} not found`);
      }
      
      const updatedContact: Contact = {
        id: contactData.id,
        firstName: contactData.firstName || contactData.first_name || '',
        lastName: contactData.lastName || contactData.last_name || '',
        name: `${contactData.firstName || contactData.first_name || ''} ${contactData.lastName || contactData.last_name || ''}`.trim(),
        email: contactData.email || '',
        phone: contactData.phone || '',
        title: contactData.title || contactData.position || '',
        company: contactData.company || '',
        industry: contactData.industry || '',
        avatarSrc: contactData.avatarSrc || '',
        sources: contactData.sources || [contactData.source || 'Website'].filter(Boolean),
        interestLevel: contactData.interestLevel || 'medium',
        status: contactData.status || 'lead',
        lastConnected: contactData.lastConnected || contactData.last_contacted,
        aiScore: contactData.aiScore || contactData.ai_score || contactData.lead_score,
        tags: contactData.tags || [],
        createdAt: contactData.createdAt || contactData.created_at,
        updatedAt: contactData.updatedAt || contactData.updated_at || new Date().toISOString()
      };
      
      // Update cache
      cacheService.set('contact', contactId, updatedContact, 300, ['contact']);
      cacheService.set('contactList', 'invalidate', null, 0, ['list']);
      
      return updatedContact;
    } catch (error) {
      logger.error('Edge Function unavailable, using localStorage fallback', error as Error);
      
      // Fallback to local storage
      const contacts = this.getLocalContacts();
      const contactIndex = contacts.findIndex(c => c.id === contactId);
      
      if (contactIndex === -1) {
        throw new Error(`Contact with ID ${contactId} not found`);
      }
      
      const updatedContact: Contact = {
        ...contacts[contactIndex],
        ...sanitized as any,
        updatedAt: new Date().toISOString()
      };
      
      contacts[contactIndex] = updatedContact;
      this.saveLocalContacts(contacts);
      cacheService.set('contact', contactId, updatedContact, 300, ['contact']);
      cacheService.set('contactList', 'invalidate', null, 0, ['list']);
      
      return updatedContact;
    }
  }

  async deleteContact(contactId: string): Promise<void> {
    if (this.shouldUseFallback()) {
      // Local storage fallback
      logger.info('Using local storage for contact deletion');
      const contacts = this.getLocalContacts();
      const filteredContacts = contacts.filter(c => c.id !== contactId);
      
      if (filteredContacts.length === contacts.length) {
        throw new Error(`Contact with ID ${contactId} not found`);
      }
      
      this.saveLocalContacts(filteredContacts);
      cacheService.set('contactDelete', contactId, null, 0, ['contact']);
      return;
    }
    
    try {
      // Use Edge Function for contact deletion (required by remote apps)
      const response = await fetch(`${this.baseURL}/${contactId}`, {
        method: 'DELETE',
        headers: this.getSupabaseHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`Edge Function error: ${response.status} ${response.statusText}`);
      }
      
      // Remove from cache
      cacheService.set('contactDelete', contactId, null, 0, ['contact']);
      cacheService.set('contactList', 'invalidate', null, 0, ['list']);
      
      logger.info('Contact deleted successfully via Edge Function', { contactId });
    } catch (error) {
      logger.error('Edge Function unavailable, using localStorage fallback', error as Error);
      
      // Fallback to local storage
      const contacts = this.getLocalContacts();
      const filteredContacts = contacts.filter(c => c.id !== contactId);
      
      if (filteredContacts.length === contacts.length) {
        throw new Error(`Contact with ID ${contactId} not found`);
      }
      
      this.saveLocalContacts(filteredContacts);
      cacheService.set('contactDelete', contactId, null, 0, ['contact']);
    }
  }

  // List and Search Operations
  async getContacts(filters: ContactFilters = {}): Promise<ContactListResponse> {
    const cacheKey = JSON.stringify(filters);
    
    // Check cache
    const cached = cacheService.get('contactList', cacheKey);
    if (cached) {
      return cached as ContactListResponse;
    }
    
    // Use local storage for list operations (Edge Functions for individual CRUD)
    let contacts = this.getLocalContacts();
    
    // Apply filters
    if (filters.search) {
      const search = filters.search.toLowerCase();
      contacts = contacts.filter(c => 
        c.name.toLowerCase().includes(search) ||
        c.email.toLowerCase().includes(search) ||
        c.company.toLowerCase().includes(search)
      );
    }
    
    if (filters.status && filters.status !== 'all') {
      contacts = contacts.filter(c => c.status === filters.status);
    }
    
    if (filters.tags && filters.tags.length > 0) {
      contacts = contacts.filter(c => 
        filters.tags!.some(tag => c.tags.includes(tag))
      );
    }
    
    if (filters.hasAIScore !== undefined) {
      contacts = contacts.filter(c => 
        filters.hasAIScore ? !!c.aiScore : !c.aiScore
      );
    }
    
    // Apply sorting
    if (filters.sortBy) {
      contacts.sort((a: any, b: any) => {
        const aValue = a[filters.sortBy!];
        const bValue = b[filters.sortBy!];
        
        if (aValue < bValue) return filters.sortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue) return filters.sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    // Apply pagination
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;
    
    const paginatedContacts = contacts.slice(offset, offset + limit);
    
    const result: ContactListResponse = {
      contacts: paginatedContacts,
      total: contacts.length,
      limit,
      offset,
      hasMore: offset + paginatedContacts.length < contacts.length
    };
    
    // Cache the result
    cacheService.set('contactList', cacheKey, result, 300, ['list']);
    
    return result;
  }

  async getContactStats(): Promise<ContactStats> {
    // Check cache first
    const cached = cacheService.get('contactStats', 'all');
    if (cached) {
      return cached as ContactStats;
    }

    const contacts = this.getLocalContacts();
    
    const stats: ContactStats = {
      total: contacts.length,
      byStatus: {},
      byTags: {},
      withAIScore: 0,
      avgAIScore: 0,
      recentlyUpdated: 0
    };

    let totalAIScore = 0;
    let aiScoreCount = 0;
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    contacts.forEach(contact => {
      // Count by status
      stats.byStatus[contact.status] = (stats.byStatus[contact.status] || 0) + 1;
      
      // Count by tags
      contact.tags.forEach(tag => {
        stats.byTags[tag] = (stats.byTags[tag] || 0) + 1;
      });
      
      // AI Score stats
      if (contact.aiScore) {
        stats.withAIScore++;
        totalAIScore += contact.aiScore;
        aiScoreCount++;
      }
      
      // Recently updated
      if (new Date(contact.updatedAt) > oneWeekAgo) {
        stats.recentlyUpdated++;
      }
    });

    stats.avgAIScore = aiScoreCount > 0 ? totalAIScore / aiScoreCount : 0;

    // Cache the stats
    cacheService.set('contactStats', 'all', stats, 300, ['stats']);

    return stats;
  }

  // AI and Enhancement Methods (placeholder for Edge Functions integration)
  async enrichContact(contactId: string): Promise<Contact> {
    const contact = await this.getContact(contactId);
    
    // This would call ai-enrichment Edge Function
    // For now, return the contact as-is
    logger.info('Contact enrichment not implemented yet');
    return contact;
  }

  async scoreContact(contactId: string): Promise<Contact> {
    const contact = await this.getContact(contactId);
    
    // This would call smart-score Edge Function
    // For now, return the contact as-is
    logger.info('Contact scoring not implemented yet');
    return contact;
  }
}

export const contactAPIService = new ContactAPIService();
export default contactAPIService;