import axios, { AxiosInstance } from 'axios';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  OpenClawConfig,
  OpenClawContact,
  OpenClawDeal,
  OpenClawChatRequest,
  OpenClawChatResponse,
  OpenClawEnrichmentRequest,
  OpenClawEnrichmentResponse,
} from '../types';

export class OpenClawService {
  private axiosInstance: AxiosInstance;
  private supabase: SupabaseClient;
  private config: OpenClawConfig;

  constructor(config: OpenClawConfig) {
    this.config = config;

    // Initialize axios for OpenClaw API calls
    this.axiosInstance = axios.create({
      baseURL: config.baseUrl,
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 second timeout
    });

    // Initialize Supabase for caching and local data
    this.supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
  }

  // Contact enrichment using OpenClaw APIs
  async enrichContact(request: OpenClawEnrichmentRequest): Promise<OpenClawEnrichmentResponse> {
    try {
      const response = await this.axiosInstance.post('/api/v1/contacts/enrich', request);

      // Cache enriched data in Supabase
      await this.cacheEnrichedData(request.contactId, response.data);

      return response.data;
    } catch (error) {
      console.error('OpenClaw contact enrichment failed:', error);
      throw new Error('Failed to enrich contact data');
    }
  }

  // AI chat for CRM insights
  async chat(request: OpenClawChatRequest): Promise<OpenClawChatResponse> {
    try {
      const response = await this.axiosInstance.post('/api/v1/chat/completions', request);
      return response.data;
    } catch (error) {
      console.error('OpenClaw chat failed:', error);
      // Return fallback response
      return {
        response: 'AI service temporarily unavailable. Please try again later.',
        suggestions: ['Retry the request', 'Contact support'],
      };
    }
  }

  // Get deal insights and predictions
  async getDealInsights(dealId: string): Promise<OpenClawDeal['aiInsights']> {
    try {
      const response = await this.axiosInstance.get(`/api/v1/deals/${dealId}/insights`);
      return response.data;
    } catch (error) {
      console.error('OpenClaw deal insights failed:', error);
      return {};
    }
  }

  // Search CRM data with AI
  async search(query: string, filters?: any): Promise<any[]> {
    try {
      const response = await this.axiosInstance.post('/api/v1/search', {
        query,
        filters,
      });
      return response.data.results;
    } catch (error) {
      console.error('OpenClaw search failed:', error);
      return [];
    }
  }

  // Cache enriched data locally
  private async cacheEnrichedData(contactId: string, data: any): Promise<void> {
    try {
      await this.supabase.from('contact_enrichments').upsert({
        contact_id: contactId,
        enriched_data: data,
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.warn('Failed to cache enriched data:', error);
    }
  }

  // Get cached enrichment data
  async getCachedEnrichment(contactId: string): Promise<any | null> {
    try {
      const { data, error } = await this.supabase
        .from('contact_enrichments')
        .select('enriched_data')
        .eq('contact_id', contactId)
        .single();

      if (error) return null;
      return data.enriched_data;
    } catch (error) {
      return null;
    }
  }

  // Authenticate with OpenClaw using Supabase user token
  async authenticate(supabaseToken?: string): Promise<boolean> {
    try {
      if (supabaseToken) {
        this.axiosInstance.defaults.headers.Authorization = `Bearer ${supabaseToken}`;
      }
      const response = await this.axiosInstance.post('/api/v1/auth/verify');
      return response.data.authenticated === true;
    } catch (error) {
      console.warn('OpenClaw authentication failed:', error);
      return false;
    }
  }

  // Health check for OpenClaw service
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.axiosInstance.get('/api/v1/health');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}

// Factory function to create service instance
export function createOpenClawService(config: OpenClawConfig): OpenClawService {
  return new OpenClawService(config);
}

// Default export
export default OpenClawService;
