
/**
 * Remote Social Research Bridge
 * Provides social media research capabilities to remote contact/pipeline apps
 */

import { gpt5SocialResearchService, SocialResearchResult } from './gpt5SocialResearchService';
import { aiEnrichmentService } from './aiEnrichmentService';
import { logger } from './logger.service';
import { Contact } from '../types';

export interface RemoteSocialRequest {
  contactId: string;
  contact: Contact;
  requestType: 'research' | 'enrich' | 'validate' | 'monitor';
  options?: {
    platforms?: string[];
    depth?: 'basic' | 'comprehensive' | 'deep';
    includePersonalityAnalysis?: boolean;
    includeEngagementMetrics?: boolean;
  };
}

export interface RemoteSocialResponse {
  success: boolean;
  data?: any;
  error?: string;
  requestId: string;
  timestamp: Date;
}

class RemoteSocialResearchBridge {
  private requestQueue: Map<string, RemoteSocialRequest> = new Map();
  private responseCache: Map<string, RemoteSocialResponse> = new Map();
  private cacheExpiry = 30 * 60 * 1000; // 30 minutes

  constructor() {
    // Set up message listeners for remote app communication
    this.setupMessageListeners();
  }

  private setupMessageListeners() {
    window.addEventListener('message', (event) => {
      if (event.data?.type === 'SOCIAL_RESEARCH_REQUEST') {
        this.handleRemoteSocialRequest(event);
      }
    });
  }

  private async handleRemoteSocialRequest(event: MessageEvent) {
    const { requestId, request } = event.data;
    
    try {
      const response = await this.processSocialRequest(request);
      
      // Send response back to remote app
      event.source?.postMessage({
        type: 'SOCIAL_RESEARCH_RESPONSE',
        requestId,
        response
      }, event.origin);
      
    } catch (error) {
      event.source?.postMessage({
        type: 'SOCIAL_RESEARCH_RESPONSE',
        requestId,
        response: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          requestId,
          timestamp: new Date()
        }
      }, event.origin);
    }
  }

  private async processSocialRequest(request: RemoteSocialRequest): Promise<RemoteSocialResponse> {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Check cache first
    const cacheKey = this.generateCacheKey(request);
    const cached = this.responseCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp.getTime() < this.cacheExpiry) {
      return { ...cached, requestId };
    }

    try {
      let data;

      switch (request.requestType) {
        case 'research':
          data = await gpt5SocialResearchService.researchContactSocialMedia(
            request.contact,
            request.options?.platforms,
            request.options?.depth
          );
          break;

        case 'enrich':
          data = await aiEnrichmentService.enrichContactWithSocialResearch(
            request.contact,
            request.options
          );
          break;

        case 'validate':
          if (request.contact.socialProfiles) {
            const validationPromises = Object.entries(request.contact.socialProfiles).map(
              async ([platform, url]) => {
                if (url) {
                  return await gpt5SocialResearchService.validateSocialProfile(
                    { platform, url, username: '', verified: false, confidence: 0 },
                    request.contact
                  );
                }
                return null;
              }
            );
            data = await Promise.all(validationPromises);
          }
          break;

        case 'monitor':
          data = await gpt5SocialResearchService.setupSocialMonitoring(
            request.contactId,
            request.options?.platforms || [],
            ['job_change', 'company_news', 'new_content']
          );
          break;

        default:
          throw new Error(`Unsupported request type: ${request.requestType}`);
      }

      const response: RemoteSocialResponse = {
        success: true,
        data,
        requestId,
        timestamp: new Date()
      };

      // Cache the response
      this.responseCache.set(cacheKey, response);
      
      return response;

    } catch (error) {
      const response: RemoteSocialResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId,
        timestamp: new Date()
      };

      return response;
    }
  }

  private generateCacheKey(request: RemoteSocialRequest): string {
    return `${request.contactId}_${request.requestType}_${JSON.stringify(request.options || {})}`;
  }

  // Public API for remote apps
  async requestSocialResearch(
    contactId: string,
    contact: Contact,
    options?: RemoteSocialRequest['options']
  ): Promise<SocialResearchResult> {
    const request: RemoteSocialRequest = {
      contactId,
      contact,
      requestType: 'research',
      options
    };

    const response = await this.processSocialRequest(request);
    
    if (!response.success) {
      throw new Error(response.error || 'Social research failed');
    }

    return response.data;
  }

  async requestSocialEnrichment(
    contactId: string,
    contact: Contact,
    options?: RemoteSocialRequest['options']
  ): Promise<any> {
    const request: RemoteSocialRequest = {
      contactId,
      contact,
      requestType: 'enrich',
      options
    };

    const response = await this.processSocialRequest(request);
    
    if (!response.success) {
      throw new Error(response.error || 'Social enrichment failed');
    }

    return response.data;
  }

  // Expose bridge to global window for remote app access
  exposeToWindow() {
    (window as any).socialResearchBridge = {
      research: this.requestSocialResearch.bind(this),
      enrich: this.requestSocialEnrichment.bind(this),
      getSupportedPlatforms: () => gpt5SocialResearchService.isPlatformSupported,
      getRecommendedPlatforms: (contact: Contact) => 
        gpt5SocialResearchService.getRecommendedPlatforms(contact)
    };
  }

  // API endpoint compatibility for HTTP requests
  setupHTTPEndpoints() {
    // This would typically be handled by your backend, but for demo purposes:
    console.log('Social Research Bridge HTTP endpoints available:');
    console.log('POST /api/social-research/research');
    console.log('POST /api/social-research/enrich');
    console.log('POST /api/social-research/validate');
    console.log('POST /api/social-research/monitor');
  }

  // Cleanup method
  cleanup() {
    this.responseCache.clear();
    this.requestQueue.clear();
    delete (window as any).socialResearchBridge;
  }
}

export const remoteSocialResearchBridge = new RemoteSocialResearchBridge();

// Auto-expose bridge on initialization
remoteSocialResearchBridge.exposeToWindow();
