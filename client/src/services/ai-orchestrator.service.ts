/**
 * AI Orchestrator Service
 * Single entry point for all AI operations with intelligent routing and caching
 */

import { logger } from './logger.service';
import { cacheService } from './cache.service';
import { rateLimiter } from './rate-limiter.service';
import { generateAI, sendConversationMessage } from './aiGenerate';
import { Contact } from '../types/contact';

const ORCHESTRATOR_SYSTEM =
  'You are the AI engine of a CRM. Base every answer on the input data; do not invent facts. Respond with valid JSON only.';

/** JSON fields the callers read for each request type (contact-ai, communication-ai, TaskCard). */
const RESULT_FIELDS: Record<string, string> = {
  contact_scoring:
    'score (0-100), breakdown {fitScore, engagementScore, conversionProbability, urgencyScore}, reasoning (string[]), recommendations (string[]), nextBestActions (string[])',
  contact_enrichment: 'the enriched contact fields you can support from the input, plus confidence (0-100)',
  insights_generation:
    'insights: [{type: opportunity|risk|recommendation|prediction|pattern, title, description, confidence (0-100), impact: low|medium|high, category, actionable (boolean), suggestedActions (string[])}]',
  relationship_mapping: 'relationships (array), networkInsights (string[]), influenceMap (object)',
  predictive_analytics:
    'predictions (array of {type, probability, timeframe, description}), trendAnalysis {direction, confidence, factors}, optimalActions (string[])',
  email_generation:
    'subject, body, tone, personalization {score, elements}, optimization {score, suggestions}, metadata {wordCount, readingTime}',
  email_analysis:
    'scores {sentiment, clarity, engagement, professionalism}, toneAnalysis {primary, secondary}, suggestions (array), predictions {responseRate, engagement}, alternatives {subject, body}',
  communication_analysis:
    'the fields this analysis needs, using these names where they apply: optimalChannels, timing, messaging, contentRecommendations, stages, objectionHandling, closingStrategies, fallbackPlans',
  automation_suggestions: 'suggestions: [{title, description, trigger, actions (string[]), impact: low|medium|high}]',
  task_completion_analysis: 'summary, outcome, followUps: [{title, description, dueInDays}]',
};

function buildOrchestratorPrompt(request: AIRequest): string {
  const fields = RESULT_FIELDS[request.type] || 'the fields this task needs';
  return [
    `Task: ${request.type.replace(/_/g, ' ')}`,
    request.context?.businessContext ? `Business context: ${request.context.businessContext}` : '',
    `Input data:\n${JSON.stringify(request.data, null, 2).slice(0, 12000)}`,
    `Return a JSON object with: ${fields}.`,
  ]
    .filter(Boolean)
    .join('\n\n');
}

/** Parse a JSON reply, tolerating ```json fences or text around the object. */
function parseJSONText(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return undefined;
    try {
      return JSON.parse(match[0]);
    } catch {
      return undefined;
    }
  }
}

export interface AIRequest {
  id: string;
  type:
    | 'contact_scoring'
    | 'contact_enrichment'
    | 'email_generation'
    | 'email_analysis'
    | 'insights_generation'
    | 'communication_analysis'
    | 'automation_suggestions'
    | 'predictive_analytics'
    | 'relationship_mapping'
    | 'task_completion_analysis';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  data: any;
  context?: {
    contactId?: string;
    userId?: string;
    sessionId?: string;
    businessContext?: string;
    assistantThreadId?: string;
    entityId?: string;
  };
  options?: {
    useCache?: boolean;
    provider?: 'openai' | 'gemini' | 'auto';
    model?: string;
    timeout?: number;
    usePersistentThread?: boolean;
  };
}

export interface AIResponse {
  id: string;
  type: string;
  result: any;
  metadata: {
    provider: string;
    model: string;
    processingTime: number;
    confidence: number;
    cached: boolean;
    timestamp: string;
    cost?: number;
  };
  error?: string;
}

export interface AIProvider {
  name: 'openai' | 'gemini';
  available: boolean;
  rateLimit: {
    remaining: number;
    resetTime: number;
  };
  performance: {
    avgResponseTime: number;
    successRate: number;
    costPer1kTokens: number;
  };
}

class AIOrchestrator {
  private requestQueue: AIRequest[] = [];
  private processing = false;
  private providers: Map<string, AIProvider> = new Map();
  private requestHistory: AIResponse[] = [];

  constructor() {
    this.initializeProviders().catch((error) => {
      console.warn('Failed to initialize AI providers:', error);
    });
    this.startQueueProcessor();
  }

  private async initializeProviders(): Promise<void> {
    // Check server-side availability instead of client-side keys
    try {
      const response = await fetch('/api/openai/status');
      const openaiAvailable = response.ok && (await response.json()).configured === true;
    } catch (error) {
      console.warn('Failed to check OpenAI availability:', error);
    }

    // Initialize provider status - availability will be checked server-side
    this.providers.set('openai', {
      name: 'openai',
      available: true, // Server-side check will determine actual availability
      rateLimit: { remaining: 50, resetTime: Date.now() + 60000 },
      performance: { avgResponseTime: 2000, successRate: 0.95, costPer1kTokens: 0.002 },
    });

    this.providers.set('gemini', {
      name: 'gemini',
      available: true, // Server-side check will determine actual availability
      rateLimit: { remaining: 60, resetTime: Date.now() + 60000 },
      performance: { avgResponseTime: 1500, successRate: 0.92, costPer1kTokens: 0.0005 },
    });
  }

  private startQueueProcessor(): void {
    setInterval(() => {
      if (!this.processing && this.requestQueue.length > 0) {
        this.processNextRequest();
      }
    }, 100);
  }

  private async processNextRequest(): Promise<void> {
    if (this.requestQueue.length === 0) return;

    this.processing = true;
    const request = this.requestQueue.shift()!;

    try {
      const response = await this.executeRequest(request);
      logger.info('AI request completed successfully', {
        requestId: request.id,
        type: request.type,
        processingTime: response.metadata.processingTime,
      });
    } catch (error) {
      // Enhanced error handling to prevent uncaught exceptions
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('AI request failed', error as Error, {
        requestId: request.id,
        type: request.type,
      });

      // Silently handle "No AI providers available" to prevent runtime errors
      if (errorMsg.includes('No AI providers available')) {
        console.warn('⚠️ Skipping AI request due to no providers:', request.type);
      }
    } finally {
      this.processing = false;
    }
  }

  private async executeRequest(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    const cacheKey = this.getCacheKey(request);

    // Check cache first
    if (request.options?.useCache !== false) {
      const cached = cacheService.get<AIResponse>('ai_responses', cacheKey);
      if (cached) {
        logger.debug('AI response served from cache', { requestId: request.id });
        return {
          ...cached,
          metadata: { ...cached.metadata, cached: true },
        };
      }
    }

    // Select optimal provider
    const provider = await this.selectProvider(request);

    // Execute request
    let result: any;
    let metadata: AIResponse['metadata'];

    try {
      const response = await this.callProvider(provider, request);
      result = response.result;
      metadata = {
        provider: provider.name,
        model: response.model || 'default',
        processingTime: Date.now() - startTime,
        confidence: response.confidence ?? 0, // 0 = not reported (was a default of 85)
        cached: false,
        timestamp: new Date().toISOString(),
        cost: response.cost,
      };
    } catch (error) {
      throw new Error(`AI provider ${provider.name} failed: ${error}`);
    }

    const aiResponse: AIResponse = {
      id: request.id,
      type: request.type,
      result,
      metadata,
    };

    // Cache successful responses
    if (request.options?.useCache !== false) {
      const ttl = this.getCacheTTL(request.type);
      cacheService.set('ai_responses', cacheKey, aiResponse, ttl, ['ai', request.type]);
    }

    // Update provider performance
    this.updateProviderPerformance(provider.name, metadata);

    // Store in history
    this.requestHistory.push(aiResponse);
    if (this.requestHistory.length > 1000) {
      this.requestHistory = this.requestHistory.slice(-1000);
    }

    return aiResponse;
  }

  private async selectProvider(request: AIRequest): Promise<AIProvider> {
    const availableProviders = Array.from(this.providers.values()).filter(
      (p) => p.available && p.rateLimit.remaining > 0
    );

    if (availableProviders.length === 0) {
      // Silently skip requests when no providers are available instead of throwing
      console.warn('⚠️ No AI providers available, skipping request:', request.type);
      throw new Error('No AI providers available');
    }

    // Auto-select based on request type and urgency
    if (request.options?.provider === 'auto' || !request.options?.provider) {
      return this.selectOptimalProvider(request, availableProviders);
    }

    // Use specified provider if available
    const requestedProvider = availableProviders.find((p) => p.name === request.options?.provider);
    if (requestedProvider) {
      return requestedProvider;
    }

    // Fallback to optimal selection
    return this.selectOptimalProvider(request, availableProviders);
  }

  private selectOptimalProvider(request: AIRequest, providers: AIProvider[]): AIProvider {
    // Score providers based on request characteristics
    const scoredProviders = providers.map((provider) => {
      let score = 0;

      // Performance factors
      score += provider.performance.successRate * 40;
      score += (3000 - provider.performance.avgResponseTime) / 100; // Prefer faster responses

      // Cost factors (lower cost = higher score)
      if (request.priority === 'low') {
        score += (0.01 - provider.performance.costPer1kTokens) * 1000;
      }

      // Task-specific preferences
      switch (request.type) {
        case 'contact_scoring':
        case 'insights_generation':
          // Prefer accuracy for scoring and insights
          if (provider.name === 'openai') score += 10;
          break;
        case 'email_generation':
        case 'communication_analysis':
          // Both providers are good for communication tasks
          break;
        case 'contact_enrichment':
        case 'predictive_analytics':
          // Prefer higher accuracy models
          if (provider.name === 'openai') score += 5;
          break;
        case 'automation_suggestions':
          // Gemini is good for simple automation logic
          if (provider.name === 'gemini') score += 5;
          break;
      }

      // Urgency factors
      if (request.priority === 'urgent') {
        score += (3000 - provider.performance.avgResponseTime) / 50; // Heavily prefer speed
      }

      return { provider, score };
    });

    // Return highest scoring provider
    return scoredProviders.sort((a, b) => b.score - a.score)[0].provider;
  }

  private async callProvider(provider: AIProvider, request: AIRequest): Promise<any> {
    // Check if this request should use a persistent assistant thread
    if (request.context?.assistantThreadId || request.options?.usePersistentThread) {
      return this.callAssistantThread(provider, request);
    }

    // Check if request type should use persistent assistant
    const persistentTypes = [
      'contact_scoring',
      'contact_enrichment',
      'insights_generation',
      'predictive_analytics',
    ];
    if (persistentTypes.includes(request.type) && request.context?.entityId) {
      return this.callPersistentAssistant(request);
    }

    // These request types used to call Supabase edge functions that don't exist (smart-score,
    // email-composer, ...). They now use the app's AI endpoint (/api/ai/generate, the user's OpenAI key).
    const { data, model } = await generateAI({
      json: true,
      system: ORCHESTRATOR_SYSTEM,
      prompt: buildOrchestratorPrompt(request),
    });
    if (!data) throw new Error('AI returned an unreadable response');
    return { result: data, model, confidence: 0 };
  }

  private async callPersistentAssistant(request: AIRequest): Promise<any> {
    const { persistentAssistantService } = await import('./persistentAssistantService');

    await persistentAssistantService.initialize();

    const assistantTypeMap: Record<string, 'contact' | 'deal' | 'task' | 'pipeline'> = {
      contact_scoring: 'contact',
      contact_enrichment: 'contact',
      insights_generation: 'deal',
      predictive_analytics: 'pipeline',
    };

    const assistantType = assistantTypeMap[request.type] || 'contact';
    const entityId = request.context?.entityId || 'default';

    try {
      const result = await persistentAssistantService.chatWithPersistentAssistant(
        assistantType,
        entityId,
        JSON.stringify(request.data),
        request.context
      );

      return {
        result: result.response,
        model: 'gpt-6.2-astra',
        confidence: 0, // not reported by the model (was a hardcoded 95)
        cost: undefined, // not measured (was a hardcoded 0.003)
        threadId: result.threadId,
        assistantId: result.assistantId,
        persistentMemory: result.persistentMemory,
      };
    } catch (error) {
      console.error('Persistent assistant call failed:', error);
      throw error;
    }
  }

  private async callAssistantThread(_provider: AIProvider, request: AIRequest): Promise<any> {
    // The thread is a Responses API conversation (see assistantThreadManager); the missing
    // 'assistant-thread' edge function is replaced by /api/ai/conversations/:id/messages.
    const threadId = request.context?.assistantThreadId;
    if (!threadId) {
      const { data, model } = await generateAI({
        json: true,
        system: ORCHESTRATOR_SYSTEM,
        prompt: buildOrchestratorPrompt(request),
      });
      if (!data) throw new Error('AI returned an unreadable response');
      return { result: data, model, confidence: 0 };
    }
    const { content, model } = await sendConversationMessage(threadId, buildOrchestratorPrompt(request), {
      system: ORCHESTRATOR_SYSTEM,
    });
    const data = parseJSONText(content);
    if (!data) throw new Error('AI returned an unreadable response');
    return { result: data, model, confidence: 0, threadId };
  }

  private updateProviderPerformance(providerName: string, metadata: AIResponse['metadata']): void {
    const provider = this.providers.get(providerName);
    if (!provider) return;

    // Update running averages
    const alpha = 0.1; // Smoothing factor
    provider.performance.avgResponseTime =
      provider.performance.avgResponseTime * (1 - alpha) + metadata.processingTime * alpha;

    // Update rate limit info (simplified)
    provider.rateLimit.remaining = Math.max(0, provider.rateLimit.remaining - 1);
    if (Date.now() > provider.rateLimit.resetTime) {
      provider.rateLimit.remaining = provider.name === 'openai' ? 50 : 60;
      provider.rateLimit.resetTime = Date.now() + 60000;
    }
  }

  private getCacheKey(request: AIRequest): string {
    return `${request.type}_${JSON.stringify(request.data)}_${request.options?.provider || 'auto'}`;
  }

  private getCacheTTL(requestType: string): number {
    const ttlMap: Record<string, number> = {
      contact_scoring: 3600000, // 1 hour
      contact_enrichment: 86400000, // 24 hours
      email_generation: 1800000, // 30 minutes
      email_analysis: 1800000, // 30 minutes
      insights_generation: 3600000, // 1 hour
      communication_analysis: 1800000, // 30 minutes
      automation_suggestions: 7200000, // 2 hours
      predictive_analytics: 3600000, // 1 hour
      relationship_mapping: 86400000, // 24 hours
    };

    return ttlMap[requestType] || 1800000; // Default 30 minutes
  }

  // Public API methods
  async submitRequest(request: Omit<AIRequest, 'id'>): Promise<string> {
    const fullRequest: AIRequest = {
      ...request,
      id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      options: {
        useCache: true,
        provider: 'auto',
        timeout: 30000,
        ...request.options,
      },
    };

    this.requestQueue.push(fullRequest);

    // Sort queue by priority
    this.requestQueue.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    logger.info('AI request queued', {
      requestId: fullRequest.id,
      type: fullRequest.type,
      priority: fullRequest.priority,
    });

    return fullRequest.id;
  }

  async executeImmediate(request: Omit<AIRequest, 'id'>): Promise<AIResponse> {
    const fullRequest: AIRequest = {
      ...request,
      id: `ai_immediate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      options: {
        useCache: true,
        provider: 'auto',
        timeout: 30000,
        ...request.options,
      },
    };

    return this.executeRequest(fullRequest);
  }

  getProviderStatus(): AIProvider[] {
    return Array.from(this.providers.values());
  }

  getRequestHistory(limit = 50): AIResponse[] {
    return this.requestHistory.slice(-limit);
  }

  getPerformanceMetrics(): any {
    const recent = this.requestHistory.slice(-100);

    return {
      totalRequests: this.requestHistory.length,
      successRate: recent.filter((r) => !r.error).length / recent.length,
      avgResponseTime:
        recent.reduce((sum, r) => sum + r.metadata.processingTime, 0) / recent.length,
      cacheHitRate: recent.filter((r) => r.metadata.cached).length / recent.length,
      providerBreakdown: this.getProviderBreakdown(recent),
    };
  }

  private getProviderBreakdown(responses: AIResponse[]): Record<string, number> {
    const breakdown: Record<string, number> = {};
    responses.forEach((r) => {
      breakdown[r.metadata.provider] = (breakdown[r.metadata.provider] || 0) + 1;
    });
    return breakdown;
  }

  clearCache(): void {
    // For now, just log that cache would be cleared
    // The cache is handled externally by the cache service
    logger.info('AI cache clear requested');
  }
}

export const aiOrchestrator = new AIOrchestrator();
