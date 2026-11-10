/**
 * AI Integration Service
 * Enhanced with proper Gemma and Gemini 2.5 Flash model support
 */

import { httpClient } from './http-client.service';
import { validationService } from './validation.service';
import { cacheService } from './cache.service';
import { logger } from './logger.service';
import { rateLimiter } from './rate-limiter.service';
import { Contact } from '../types';
import { ContactEnrichmentData } from './aiEnrichmentService';
import apiConfig, { getDefaultModel, getBestModelForTask } from '../config/api.config';

export interface AIAnalysisRequest {
  contactId: string;
  contact: Contact;
  analysisTypes: ('scoring' | 'enrichment' | 'categorization' | 'tagging' | 'relationships')[];
  options?: {
    forceRefresh?: boolean;
    provider?: 'openai' | 'gemini' | 'anthropic';
    model?: string;
    includeConfidence?: boolean;
  };
}

export interface AIAnalysisResponse {
  contactId: string;
  score?: number;
  confidence: number;
  insights: string[];
  recommendations: string[];
  categories: string[];
  tags: string[];
  enrichmentData?: ContactEnrichmentData;
  relationships?: ContactRelationship[];
  provider: string;
  model: string;
  timestamp: string;
  processingTime: number;
}

export interface ContactRelationship {
  type: 'colleague' | 'competitor' | 'client' | 'vendor' | 'partner';
  contactId: string;
  contactName: string;
  company: string;
  strength: number; // 0-1
  reason: string;
}

export interface BulkAnalysisRequest {
  contactIds: string[];
  analysisTypes: AIAnalysisRequest['analysisTypes'];
  options?: AIAnalysisRequest['options'];
}

export interface BulkAnalysisResponse {
  results: AIAnalysisResponse[];
  failed: Array<{ contactId: string; error: string }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
    averageScore: number;
    processingTime: number;
  };
}

class AIIntegrationService {
  private apiUrl = apiConfig.dataProcessing.enrichment.baseURL;

  async analyzeContact(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    const startTime = Date.now();

    // Validate request
    if (!request.contactId || !request.contact) {
      throw new Error('Contact ID and contact data are required');
    }

    if (!request.analysisTypes || request.analysisTypes.length === 0) {
      throw new Error('At least one analysis type is required');
    }

    // Check cache first (unless force refresh)
    const cacheKey = `${request.contactId}_${request.analysisTypes.join('_')}_${request.options?.model || 'default'}`;
    if (!request.options?.forceRefresh) {
      const cached = cacheService.getAIAnalysis(cacheKey);
      if (cached) {
        logger.debug('AI analysis cache hit', { contactId: request.contactId });
        return cached;
      }
    }

    try {
      logger.info(`Starting AI analysis for contact ${request.contactId}`, {
        analysisTypes: request.analysisTypes,
        provider: request.options?.provider,
        model: request.options?.model,
      });

      const response = await httpClient.post<AIAnalysisResponse>(
        `${this.apiUrl}/analyze`,
        request,
        {
          timeout: 60000, // 1 minute for analysis
          retries: 2,
        }
      );

      const result = response.data;

      // Cache the result
      cacheService.setAIAnalysis(cacheKey, result, 3600000); // Cache for 1 hour

      logger.info('AI analysis completed successfully', {
        contactId: request.contactId,
        provider: result.provider,
        model: result.model,
        processingTime: Date.now() - startTime,
        score: result.score,
      });

      return result;
    } catch (error) {
      logger.error('AI analysis failed', error as Error, {
        contactId: request.contactId,
        analysisTypes: request.analysisTypes,
        processingTime: Date.now() - startTime,
      });

      throw error;
    }
  }

  async analyzeBulk(request: BulkAnalysisRequest): Promise<BulkAnalysisResponse> {
    const startTime = Date.now();

    if (!request.contactIds || request.contactIds.length === 0) {
      throw new Error('Contact IDs are required');
    }

    if (request.contactIds.length > 50) {
      throw new Error('Bulk analysis is limited to 50 contacts at a time');
    }

    logger.info('Starting bulk AI analysis', {
      contactCount: request.contactIds.length,
      analysisTypes: request.analysisTypes,
    });

    try {
      const response = await httpClient.post<BulkAnalysisResponse>(
        `${this.apiUrl}/analyze/bulk`,
        request,
        {
          timeout: 300000, // 5 minutes for bulk operations
          retries: 1,
        }
      );

      const result = response.data;

      logger.info('Bulk AI analysis completed successfully', {
        total: result.summary.total,
        successful: result.summary.successful,
        failed: result.summary.failed,
        averageScore: result.summary.averageScore,
        processingTime: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      logger.error('Bulk AI analysis failed', error as Error, {
        contactCount: request.contactIds.length,
        processingTime: Date.now() - startTime,
      });

      throw error;
    }
  }

  async enrichContact(
    contactId: string,
    enrichmentRequest: Partial<ContactEnrichmentData>
  ): Promise<ContactEnrichmentData> {
    const validation = validationService.validateEnrichmentRequest(enrichmentRequest);
    if (!validation.isValid) {
      throw new Error(
        `Enrichment request validation failed: ${Object.values(validation.errors).flat().join(', ')}`
      );
    }

    // Check cache first
    const cacheKey = `enrichment_${JSON.stringify(enrichmentRequest)}`;
    const cached = cacheService.get<ContactEnrichmentData>('enrichment', cacheKey);
    if (cached) {
      return cached;
    }

    try {
      logger.info(`Starting contact enrichment for ${contactId}`);

      const response = await httpClient.post<ContactEnrichmentData>(
        `${this.apiUrl}/enrich`,
        {
          contactId,
          enrichmentRequest,
        },
        {
          timeout: 45000,
          retries: 2,
        }
      );

      const result = response.data;

      // Cache the result
      cacheService.set('enrichment', cacheKey, result, 86400000); // Cache for 24 hours

      logger.info('Contact enrichment completed successfully', {
        contactId,
        confidence: result.confidence,
      });

      return result;
    } catch (error) {
      logger.error('Contact enrichment failed', error as Error, {
        contactId,
        enrichmentRequest,
      });

      throw error;
    }
  }

  // Utility methods
  async getProviderStatus(): Promise<
    Array<{ name: string; status: 'available' | 'rate_limited' | 'error'; remaining?: number }>
  > {
    try {
      const response = await httpClient.get<any>(`${this.apiUrl}/providers/status`, undefined, {
        timeout: 10000,
        retries: 1,
        cache: {
          key: 'ai_provider_status',
          ttl: 60000, // Cache for 1 minute
          tags: ['ai', 'status'],
        },
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to get AI provider status', error as Error);

      // Development fallback
      if (import.meta.env.DEV || import.meta.env.VITE_ENV === 'development') {
        // Check server-side availability in development
        try {
          const response = await fetch('/api/openai/status');
          const openaiAvailable = response.ok && (await response.json()).configured === true;
          return [
            {
              name: 'openai',
              status: openaiAvailable ? 'available' : 'error',
              remaining: 45,
            },
            {
              name: 'gemini',
              status: openaiAvailable ? 'available' : 'error', // Assume Gemini follows OpenAI status
              remaining: 50,
            },
          ];
        } catch (error) {
          return [
            { name: 'openai', status: 'error', remaining: 0 },
            { name: 'gemini', status: 'error', remaining: 0 },
          ];
        }
      }

      throw error;
    }
  }

  async clearCache(contactId?: string): Promise<void> {
    if (contactId) {
      cacheService.deleteByTag('ai');
      cacheService.delete('ai_analysis', contactId);
    } else {
      cacheService.deleteByTag('ai');
      cacheService.deleteByTag('enrichment');
    }

    logger.info('AI cache cleared', { contactId });
  }
}

export const aiIntegration = new AIIntegrationService();
