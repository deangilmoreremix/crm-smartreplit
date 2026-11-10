/**
 * AI Integration Service
 * OpenAI-only (server-side key). Wired to real routes:
 *  - scoring    -> POST /api/ai/lead-score        (aiSalesTools.leadScore)
 *  - enrichment -> POST /api/contacts/:id/enrich
 *  - bulk       -> the two above, 3 contacts at a time
 * Other analysis types have no server route and throw.
 */

import { validationService } from './validation.service';
import { cacheService } from './cache.service';
import { logger } from './logger.service';
import { rateLimiter } from './rate-limiter.service';
import { Contact } from '../types';
import { ContactEnrichmentData } from './aiEnrichmentService';
import { aiSalesTools } from './aiToolsApiService';
import { contactAPIService } from './contact-api.service';

export interface AIAnalysisRequest {
  contactId: string;
  contact: Contact;
  analysisTypes: ('scoring' | 'enrichment' | 'categorization' | 'tagging' | 'relationships')[];
  options?: {
    forceRefresh?: boolean;
    provider?: 'openai';
    model?: string;
    includeConfidence?: boolean;
  };
}

export interface AIAnalysisResponse {
  contactId: string;
  score?: number;
  /** Only set when the server returns one; never synthesised. */
  confidence?: number;
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

const BULK_CONCURRENCY = 3;
const SUPPORTED_TYPES: ReadonlyArray<AIAnalysisRequest['analysisTypes'][number]> = ['scoring', 'enrichment'];

async function postEnrich(contactId: string): Promise<{ enriched: boolean; data: ContactEnrichmentData }> {
  const response = await fetch(`/api/contacts/${encodeURIComponent(contactId)}/enrich`, { method: 'POST' });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || err.message || `Enrichment failed (${response.status})`);
  }
  return response.json();
}

class AIIntegrationService {
  async analyzeContact(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    const startTime = Date.now();

    if (!request.contactId || !request.contact) {
      throw new Error('Contact ID and contact data are required');
    }
    if (!request.analysisTypes || request.analysisTypes.length === 0) {
      throw new Error('At least one analysis type is required');
    }
    const unsupported = request.analysisTypes.filter((t) => !SUPPORTED_TYPES.includes(t));
    if (unsupported.length) {
      throw new Error(`Analysis type(s) not supported by the server: ${unsupported.join(', ')}`);
    }

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
      });

      const result: AIAnalysisResponse = {
        contactId: request.contactId,
        insights: [],
        recommendations: [],
        categories: [],
        tags: [],
        provider: 'openai',
        model: 'server-managed',
        timestamp: new Date().toISOString(),
        processingTime: 0,
      };

      if (request.analysisTypes.includes('scoring')) {
        const res = await aiSalesTools.leadScore(request.contact);
        if (!res?.success || !res.scoring) throw new Error(res?.error || 'Lead scoring failed');
        const scoring = res.scoring;
        if (typeof scoring.score === 'number') result.score = scoring.score;
        if (scoring.rationale) result.insights.push(String(scoring.rationale));
        if (Array.isArray(scoring.buyingSignals)) result.insights.push(...scoring.buyingSignals.map(String));
        if (Array.isArray(scoring.recommendedActions)) {
          result.recommendations.push(...scoring.recommendedActions.map(String));
        }
        if (scoring.priority) result.tags.push(String(scoring.priority));
      }

      if (request.analysisTypes.includes('enrichment')) {
        const enriched = await postEnrich(request.contactId);
        result.enrichmentData = enriched.data;
      }

      result.processingTime = Date.now() - startTime;
      cacheService.setAIAnalysis(cacheKey, result, 3600000); // Cache for 1 hour

      logger.info('AI analysis completed successfully', {
        contactId: request.contactId,
        processingTime: result.processingTime,
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

    const results: AIAnalysisResponse[] = [];
    const failed: BulkAnalysisResponse['failed'] = [];
    let next = 0;
    const worker = async () => {
      while (next < request.contactIds.length) {
        const contactId = request.contactIds[next++];
        try {
          const contact = await contactAPIService.getContact(contactId);
          results.push(
            await this.analyzeContact({
              contactId,
              contact,
              analysisTypes: request.analysisTypes,
              options: request.options,
            })
          );
        } catch (error) {
          failed.push({ contactId, error: error instanceof Error ? error.message : String(error) });
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(BULK_CONCURRENCY, request.contactIds.length) }, worker));

    if (results.length === 0) {
      throw new Error(`Bulk analysis failed for all contacts: ${failed[0]?.error ?? 'unknown error'}`);
    }

    const scores = results.map((r) => r.score).filter((n): n is number => typeof n === 'number');
    const summary = {
      total: request.contactIds.length,
      successful: results.length,
      failed: failed.length,
      averageScore: scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
      processingTime: Date.now() - startTime,
    };
    logger.info('Bulk AI analysis completed', summary);
    return { results, failed, summary };
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

    const cacheKey = `enrichment_${contactId}_${JSON.stringify(enrichmentRequest)}`;
    const cached = cacheService.get<ContactEnrichmentData>('enrichment', cacheKey);
    if (cached) return cached;

    try {
      logger.info(`Starting contact enrichment for ${contactId}`);
      // The server enriches from the stored contact; enrichmentRequest is only validated here.
      const { data } = await postEnrich(contactId);
      cacheService.set('enrichment', cacheKey, data, 86400000); // Cache for 24 hours
      return data;
    } catch (error) {
      logger.error('Contact enrichment failed', error as Error, { contactId, enrichmentRequest });
      throw error;
    }
  }

  /** Real server status (GET /api/openai/status). No usage quota is reported, so none is invented. */
  async getProviderStatus(): Promise<
    Array<{ name: string; status: 'available' | 'rate_limited' | 'error'; remaining?: number }>
  > {
    const response = await fetch('/api/openai/status');
    if (!response.ok) throw new Error(`Provider status failed (${response.status})`);
    const body = await response.json();
    return [{ name: 'openai', status: body.configured === true ? 'available' : 'error' }];
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
