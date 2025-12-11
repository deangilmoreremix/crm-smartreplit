import { Deal } from '../types/deal';
import { cacheService } from './cacheService';
import { logger } from '../utils/logger';
import { validationService } from './validationService';

export interface DealFilters {
  search?: string;
  stage?: string;
  status?: string;
  assignee?: string;
  priority?: string;
  hasAIScore?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DealListResponse {
  deals: Deal[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface DealStats {
  total: number;
  byStage: Record<string, number>;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  totalValue: number;
  averageValue: number;
  winRate: number;
}

class DealService {
  private baseURL: string;
  private supabaseUrl: string;
  private supabaseKey: string;
  private isBackendAvailable = true;
  private isMockMode = false; // Use Supabase by default
  
  constructor() {
    // Configure to use Supabase REST API for persistent deal management
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    this.supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
    this.baseURL = `${this.supabaseUrl}/rest/v1`;
    
    // Only fall back to mock mode if Supabase is not configured
    if (!this.supabaseUrl || !this.supabaseKey) {
      this.isMockMode = true;
      console.warn('Supabase not configured - falling back to local storage for deals');
    } else {
      this.isMockMode = false;
      this.isBackendAvailable = true;
      console.log('Using Supabase REST API for persistent deal management');
    }
  }
  
  // Get headers for Supabase REST API requests
  private getSupabaseHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'apikey': this.supabaseKey,
      'Authorization': `Bearer ${this.supabaseKey}`,
      'Prefer': 'return=representation'
    };
    
    return headers;
  }
  
  // Check if we should use fallback mode
  private shouldUseFallback(): boolean {
    return this.isMockMode || !this.supabaseUrl || !this.supabaseKey;
  }
  
  // Initialize local storage with sample data if needed
  private initializeLocalStorage(): Deal[] {
    try {
      const stored = localStorage.getItem('deals');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      // If localStorage is corrupted, reset it
    }
    
    // Default sample data
    const sampleDeals: Deal[] = [
      {
        id: '1',
        title: 'Enterprise Software License',
        description: 'Annual software license renewal for Microsoft Office Suite',
        value: 125000,
        stage: 'proposal',
        status: 'active',
        priority: 'high',
        contactId: '1',
        contactName: 'Jane Doe',
        company: 'Microsoft',
        assigneeId: 'user-1',
        assigneeName: 'John Smith',
        expectedCloseDate: '2024-02-15',
        probability: 75,
        aiScore: 85,
        tags: ['enterprise', 'software', 'renewal'],
        activities: [
          {
            id: 'a1',
            type: 'meeting',
            title: 'Initial Discovery Call',
            description: 'Discussed requirements and budget',
            date: '2024-01-15',
            userId: 'user-1',
            userName: 'John Smith'
          }
        ],
        createdAt: '2024-01-10T10:00:00Z',
        updatedAt: '2024-01-20T15:30:00Z'
      }
    ];
    
    localStorage.setItem('deals', JSON.stringify(sampleDeals));
    return sampleDeals;
  }
  
  // Get deals from local storage
  private getLocalDeals(): Deal[] {
    try {
      const stored = localStorage.getItem('deals');
      return stored ? JSON.parse(stored) : this.initializeLocalStorage();
    } catch (e) {
      return this.initializeLocalStorage();
    }
  }
  
  // Save deals to local storage
  private saveLocalDeals(deals: Deal[]): void {
    try {
      localStorage.setItem('deals', JSON.stringify(deals));
    } catch (e) {
      console.warn('Failed to save deals to localStorage');
    }
  }
  
  // Map Supabase deal to our Deal interface
  private mapSupabaseDeal(supabaseDeal: any): Deal {
    return {
      id: supabaseDeal.id,
      title: supabaseDeal.title || '',
      description: supabaseDeal.description || '',
      value: supabaseDeal.value || 0,
      stage: supabaseDeal.stage || 'discovery',
      status: supabaseDeal.status || 'active',
      priority: supabaseDeal.priority || 'medium',
      contactId: supabaseDeal.contact_id || '',
      contactName: supabaseDeal.contact_name || '',
      company: supabaseDeal.company || '',
      assigneeId: supabaseDeal.assignee_id || '',
      assigneeName: supabaseDeal.assignee_name || '',
      expectedCloseDate: supabaseDeal.expected_close_date,
      probability: supabaseDeal.probability || 0,
      aiScore: supabaseDeal.ai_score,
      tags: supabaseDeal.tags || [],
      activities: supabaseDeal.activities || [],
      createdAt: supabaseDeal.created_at,
      updatedAt: supabaseDeal.updated_at
    };
  }
  
  // Map our Deal interface to Supabase format
  private mapToSupabaseFormat(deal: Partial<Deal>): any {
    return {
      title: deal.title,
      description: deal.description,
      value: deal.value,
      stage: deal.stage,
      status: deal.status,
      priority: deal.priority,
      contact_id: deal.contactId,
      contact_name: deal.contactName,
      company: deal.company,
      assignee_id: deal.assigneeId,
      assignee_name: deal.assigneeName,
      expected_close_date: deal.expectedCloseDate,
      probability: deal.probability,
      ai_score: deal.aiScore,
      tags: deal.tags,
      activities: deal.activities,
      updated_at: new Date().toISOString()
    };
  }

  // CRUD Operations
  async createDeal(dealData: Partial<Deal>): Promise<Deal> {
    const sanitized = validationService.sanitizeDeal(dealData);
    
    if (this.shouldUseFallback()) {
      // Local storage fallback
      logger.info('Using local storage for deal creation');
      const deals = this.getLocalDeals();
      
      const newDeal: Deal = {
        id: crypto.randomUUID(),
        ...sanitized as any,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      deals.push(newDeal);
      this.saveLocalDeals(deals);
      cacheService.set('deal', newDeal.id, newDeal, 300, ['deal']);
      return newDeal;
    }
    
    try {
      // Use Supabase REST API for persistent deal creation
      logger.info('Creating deal via Supabase REST API');
      const supabaseData = {
        ...this.mapToSupabaseFormat(sanitized),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const response = await fetch(`${this.baseURL}/deals`, {
        method: 'POST',
        headers: this.getSupabaseHeaders(),
        body: JSON.stringify(supabaseData)
      });
      
      if (!response.ok) {
        throw new Error(`Supabase API error: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      const supabaseDeal = Array.isArray(result) ? result[0] : result;
      
      const newDeal = this.mapSupabaseDeal(supabaseDeal);
      
      // Cache the deal
      cacheService.set('deal', newDeal.id, newDeal, 300, ['deal']);
      
      return newDeal;
    } catch (error) {
      logger.error('Failed to create deal via Supabase, falling back to local storage', error as Error);
      
      // Fallback to local storage
      const deals = this.getLocalDeals();
      
      const newDeal: Deal = {
        id: crypto.randomUUID(),
        ...sanitized as any,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      deals.push(newDeal);
      this.saveLocalDeals(deals);
      cacheService.set('deal', newDeal.id, newDeal, 300, ['deal']);
      return newDeal;
    }
  }

  async getDeal(dealId: string): Promise<Deal> {
    // Check cache first
    const cached = cacheService.get('deal', dealId);
    if (cached) {
      return cached as Deal;
    }

    if (this.shouldUseFallback()) {
      // Local storage fallback
      logger.info('Using local storage for deal retrieval');
      const deals = this.getLocalDeals();
      const deal = deals.find(d => d.id === dealId);
      
      if (!deal) {
        throw new Error(`Deal with ID ${dealId} not found`);
      }
      
      cacheService.set('deal', dealId, deal, 300, ['deal']);
      return deal;
    }
    
    try {
      // Use Supabase REST API for deal retrieval
      const response = await fetch(`${this.baseURL}/deals?id=eq.${dealId}`, {
        method: 'GET',
        headers: this.getSupabaseHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`Supabase API error: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      const supabaseDeal = Array.isArray(result) ? result[0] : result;
      
      if (!supabaseDeal) {
        throw new Error(`Deal with ID ${dealId} not found`);
      }
      
      const deal = this.mapSupabaseDeal(supabaseDeal);
      
      // Cache the deal
      cacheService.set('deal', dealId, deal, 300, ['deal']);
      
      return deal;
    } catch (error) {
      logger.error('Failed to get deal via Supabase, falling back to local storage', error as Error);
      
      // Fallback to local storage
      const deals = this.getLocalDeals();
      const deal = deals.find(d => d.id === dealId);
      
      if (!deal) {
        throw new Error(`Deal with ID ${dealId} not found`);
      }
      
      cacheService.set('deal', dealId, deal, 300, ['deal']);
      return deal;
    }
  }

  async getDealsById(dealIds: string[]): Promise<Deal[]> {
    if (!dealIds.length) {
      return [];
    }

    // Check cache first for any cached deals
    const cachedDeals: Deal[] = [];
    const uncachedIds: string[] = [];
    
    for (const id of dealIds) {
      const cached = cacheService.get('deal', id);
      if (cached) {
        cachedDeals.push(cached);
      } else {
        uncachedIds.push(id);
      }
    }

    if (uncachedIds.length === 0) {
      return cachedDeals;
    }

    if (this.shouldUseFallback()) {
      // Local storage fallback
      logger.info('Using local storage for bulk deal fetch');
      const deals = this.getLocalDeals();
      const foundDeals = deals.filter(d => uncachedIds.includes(d.id));
      
      // Cache found deals
      for (const deal of foundDeals) {
        cacheService.set('deal', deal.id, deal, 300, ['deal']);
      }
      
      return [...cachedDeals, ...foundDeals];
    }

    try {
      // Use Supabase REST API to fetch multiple deals
      logger.info(`Fetching ${uncachedIds.length} deals via Supabase REST API`);
      const idsParam = uncachedIds.join(',');
      const response = await fetch(`${this.baseURL}/deals?id=in.(${idsParam})`, {
        method: 'GET',
        headers: this.getSupabaseHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      const foundDeals = (Array.isArray(result) ? result : [result])
        .map(supabaseDeal => this.mapSupabaseDeal(supabaseDeal));
      
      // Cache the found deals
      for (const deal of foundDeals) {
        cacheService.set('deal', deal.id, deal, 300, ['deal']);
      }
      
      return [...cachedDeals, ...foundDeals];
    } catch (error) {
      logger.error('Failed to get deals via Supabase, falling back to local storage', error as Error);
      
      // Fallback to local storage
      const deals = this.getLocalDeals();
      const foundDeals = deals.filter(d => uncachedIds.includes(d.id));
      
      // Cache found deals
      for (const deal of foundDeals) {
        cacheService.set('deal', deal.id, deal, 300, ['deal']);
      }
      
      return [...cachedDeals, ...foundDeals];
    }
  }

  async updateDeal(dealId: string, updates: Partial<Deal>): Promise<Deal> {
    // Validate updates
    if (Object.keys(updates).length === 0) {
      throw new Error('No updates provided');
    }
    
    const sanitized = validationService.sanitizeDeal(updates);
    
    if (this.shouldUseFallback()) {
      // Local storage fallback
      logger.info('Using local storage for deal update');
      const deals = this.getLocalDeals();
      const dealIndex = deals.findIndex(d => d.id === dealId);
      
      if (dealIndex === -1) {
        throw new Error(`Deal with ID ${dealId} not found`);
      }
      
      const updatedDeal: Deal = {
        ...deals[dealIndex],
        ...sanitized as any,
        updatedAt: new Date().toISOString()
      };
      
      deals[dealIndex] = updatedDeal;
      this.saveLocalDeals(deals);
      cacheService.set('deal', dealId, updatedDeal, 300, ['deal']);
      cacheService.set('dealList', 'invalidate', null, 0, ['list']);
      
      return updatedDeal;
    }
    
    try {
      // Use Supabase REST API for deal update
      logger.info('Updating deal via Supabase REST API');
      const response = await fetch(`${this.baseURL}/deals?id=eq.${dealId}`, {
        method: 'PATCH',
        headers: this.getSupabaseHeaders(),
        body: JSON.stringify({
          ...this.mapToSupabaseFormat(sanitized),
          updated_at: new Date().toISOString()
        })
      });
      
      if (!response.ok) {
        throw new Error(`Supabase API error: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      const updatedSupabaseDeal = Array.isArray(result) ? result[0] : result;
      
      if (!updatedSupabaseDeal) {
        throw new Error(`Deal with ID ${dealId} not found`);
      }
      
      const updatedDeal = this.mapSupabaseDeal(updatedSupabaseDeal);
      
      // Update cache
      cacheService.set('deal', dealId, updatedDeal, 300, ['deal']);
      cacheService.set('dealList', 'invalidate', null, 0, ['list']);
      
      return updatedDeal;
    } catch (error) {
      logger.error('Failed to update deal via Supabase, falling back to local storage', error as Error);
      
      // Fallback to local storage
      const deals = this.getLocalDeals();
      const dealIndex = deals.findIndex(d => d.id === dealId);
      
      if (dealIndex === -1) {
        throw new Error(`Deal with ID ${dealId} not found`);
      }
      
      const updatedDeal: Deal = {
        ...deals[dealIndex],
        ...sanitized as any,
        updatedAt: new Date().toISOString()
      };
      
      deals[dealIndex] = updatedDeal;
      this.saveLocalDeals(deals);
      cacheService.set('deal', dealId, updatedDeal, 300, ['deal']);
      cacheService.set('dealList', 'invalidate', null, 0, ['list']);
      
      return updatedDeal;
    }
  }

  async deleteDeal(dealId: string): Promise<void> {
    if (this.shouldUseFallback()) {
      // Local storage fallback
      logger.info('Using local storage for deal deletion');
      const deals = this.getLocalDeals();
      const filteredDeals = deals.filter(d => d.id !== dealId);
      
      if (filteredDeals.length === deals.length) {
        throw new Error(`Deal with ID ${dealId} not found`);
      }
      
      this.saveLocalDeals(filteredDeals);
      cacheService.set('dealDelete', dealId, null, 0, ['deal']);
      return;
    }
    
    try {
      // Use Supabase REST API for deal deletion
      logger.info('Deleting deal via Supabase REST API');
      const response = await fetch(`${this.baseURL}/deals?id=eq.${dealId}`, {
        method: 'DELETE',
        headers: this.getSupabaseHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`Supabase API error: ${response.status} ${response.statusText}`);
      }
      
      // Remove from cache
      cacheService.set('dealDelete', dealId, null, 0, ['deal']);
      cacheService.set('dealList', 'invalidate', null, 0, ['list']);
      
      logger.info('Deal deleted successfully via Supabase REST API', { dealId });
    } catch (error) {
      logger.error('Failed to delete deal via Supabase, falling back to local storage', error as Error);
      
      // Fallback to local storage
      const deals = this.getLocalDeals();
      const filteredDeals = deals.filter(d => d.id !== dealId);
      
      if (filteredDeals.length === deals.length) {
        throw new Error(`Deal with ID ${dealId} not found`);
      }
      
      this.saveLocalDeals(filteredDeals);
      cacheService.set('dealDelete', dealId, null, 0, ['deal']);
    }
  }

  // List and Search Operations
  async getDeals(filters: DealFilters = {}): Promise<DealListResponse> {
    const cacheKey = JSON.stringify(filters);
    
    // Check cache
    const cached = cacheService.get('dealList', cacheKey);
    if (cached) {
      return cached as DealListResponse;
    }
    
    if (this.shouldUseFallback()) {
      // Local storage fallback
      logger.info('Using local storage for deals list');
      let deals = this.getLocalDeals();
      
      // Apply filters
      if (filters.search) {
        const search = filters.search.toLowerCase();
        deals = deals.filter(d => 
          d.title.toLowerCase().includes(search) ||
          d.description.toLowerCase().includes(search) ||
          d.company.toLowerCase().includes(search)
        );
      }
      
      if (filters.stage && filters.stage !== 'all') {
        deals = deals.filter(d => d.stage === filters.stage);
      }
      
      if (filters.status && filters.status !== 'all') {
        deals = deals.filter(d => d.status === filters.status);
      }
      
      if (filters.priority && filters.priority !== 'all') {
        deals = deals.filter(d => d.priority === filters.priority);
      }
      
      if (filters.hasAIScore !== undefined) {
        deals = deals.filter(d => 
          filters.hasAIScore ? !!d.aiScore : !d.aiScore
        );
      }
      
      // Apply sorting
      if (filters.sortBy) {
        deals.sort((a: any, b: any) => {
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
      
      const paginatedDeals = deals.slice(offset, offset + limit);
      
      const result: DealListResponse = {
        deals: paginatedDeals,
        total: deals.length,
        limit,
        offset,
        hasMore: offset + paginatedDeals.length < deals.length
      };
      
      // Cache the result
      cacheService.set('dealList', cacheKey, result, 300, ['list']);
      
      return result;
    }
    
    // For now, fallback to local storage as we haven't implemented Supabase list endpoint
    // This would be implemented similar to contacts service
    logger.info('Supabase deal list not implemented, using local storage');
    return this.getDeals({ ...filters, limit: filters.limit || 50 });
  }

  async getDealStats(): Promise<DealStats> {
    // Check cache first
    const cached = cacheService.get('dealStats', 'all');
    if (cached) {
      return cached as DealStats;
    }

    const deals = this.shouldUseFallback() ? 
      this.getLocalDeals() : 
      await this.getDeals({ limit: 1000 }).then(r => r.deals);

    const stats: DealStats = {
      total: deals.length,
      byStage: {},
      byStatus: {},
      byPriority: {},
      totalValue: 0,
      averageValue: 0,
      winRate: 0
    };

    let wonDeals = 0;
    let totalValue = 0;

    deals.forEach(deal => {
      // Count by stage
      stats.byStage[deal.stage] = (stats.byStage[deal.stage] || 0) + 1;
      
      // Count by status
      stats.byStatus[deal.status] = (stats.byStatus[deal.status] || 0) + 1;
      
      // Count by priority
      stats.byPriority[deal.priority] = (stats.byPriority[deal.priority] || 0) + 1;
      
      // Calculate values
      totalValue += deal.value;
      
      if (deal.stage === 'won') {
        wonDeals++;
      }
    });

    stats.totalValue = totalValue;
    stats.averageValue = deals.length > 0 ? totalValue / deals.length : 0;
    stats.winRate = deals.length > 0 ? (wonDeals / deals.length) * 100 : 0;

    // Cache the stats
    cacheService.set('dealStats', 'all', stats, 300, ['stats']);

    return stats;
  }

  // AI and Enhancement Methods (placeholder for Edge Functions integration)
  async enrichDeal(dealId: string): Promise<Deal> {
    const deal = await this.getDeal(dealId);
    
    // This would call ai-enrichment Edge Function
    // For now, return the deal as-is
    logger.info('Deal enrichment not implemented yet');
    return deal;
  }

  async scoreDeal(dealId: string): Promise<Deal> {
    const deal = await this.getDeal(dealId);
    
    // This would call smart-score Edge Function
    // For now, return the deal as-is
    logger.info('Deal scoring not implemented yet');
    return deal;
  }
}

export const dealService = new DealService();
export default dealService;