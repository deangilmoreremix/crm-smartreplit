// GPT-5 Enhanced Service for Dashboard Components
// Calls the server-side OpenAI routes (server/routes/ai.ts). It never fabricates results:
// every failure surfaces as a typed AIServiceError so the UI can render an explicit state.

export type AIErrorKind =
  | 'needs_api_key'
  | 'forbidden'
  | 'rate_limited'
  | 'server'
  | 'network'
  | 'invalid';

export class AIServiceError extends Error {
  kind: AIErrorKind;
  status: number;

  constructor(kind: AIErrorKind, status: number, message: string) {
    super(message);
    this.name = 'AIServiceError';
    this.kind = kind;
    this.status = status;
  }
}

export const isAIServiceError = (e: unknown): e is AIServiceError => e instanceof AIServiceError;

export const isNeedsApiKey = (e: unknown): boolean =>
  isAIServiceError(e) && e.kind === 'needs_api_key';

/** Short, user-facing description of an error thrown by this service. */
export const describeAIError = (e: unknown): string => {
  if (!isAIServiceError(e)) return 'AI analysis failed unexpectedly.';
  switch (e.kind) {
    case 'needs_api_key':
      return 'Add your OpenAI API key in Settings > API Keys to enable AI insights.';
    case 'forbidden':
      return 'Your plan or session does not allow AI tools.';
    case 'rate_limited':
      return 'AI rate limit reached. Try again in a minute.';
    case 'network':
      return 'Network error. Check your connection and retry.';
    case 'server':
      return 'The AI service could not produce a result. Try again shortly.';
    default:
      return 'The AI service returned an unexpected response.';
  }
};

type Json = Record<string, any>;

interface CacheEntry {
  expires: number;
  promise: Promise<Json>;
  settled: boolean;
}

export interface GPT5ServiceOptions {
  ttlMs?: number;
  maxConcurrent?: number;
}

const isStringArrayEqual = (v: unknown, expected: string[]) =>
  Array.isArray(v) && v.length === expected.length && v.every((x, i) => x === expected[i]);

/**
 * The server answers HTTP 200 with a canned payload when the key is missing or the AI call
 * failed. Detect those payloads so they are never shown as AI output.
 */
const detectServerFallback = (endpoint: string, data: Json): AIServiceError | null => {
  if (data.needsApiKey === true) {
    return new AIServiceError(
      'needs_api_key',
      200,
      'No OpenAI API key configured. Add your key in Settings > API Keys.'
    );
  }
  const canned =
    data.source === 'fallback' ||
    (endpoint.endsWith('/kpi-analysis') && data.summary === 'Analysis unavailable') ||
    (endpoint.endsWith('/deal-intelligence') &&
      isStringArrayEqual(data.recommendations, ['Retry']) &&
      !data.key_factors) ||
    (endpoint.endsWith('/business-intelligence') &&
      isStringArrayEqual(data.market_insights, ['Retry analysis']));
  if (canned) {
    return new AIServiceError('server', 200, 'The AI service could not produce a result.');
  }
  return null;
};

export class GPT5Service {
  private cache = new Map<string, CacheEntry>();
  private active = 0;
  private queue: Array<() => void> = [];
  private ttlMs: number;
  private maxConcurrent: number;

  constructor(options: GPT5ServiceOptions = {}) {
    this.ttlMs = options.ttlMs ?? 60_000;
    this.maxConcurrent = options.maxConcurrent ?? 3;
  }

  clearCache() {
    this.cache.clear();
  }

  private acquire(): Promise<void> {
    if (this.active < this.maxConcurrent) {
      this.active++;
      return Promise.resolve();
    }
    return new Promise((resolve) => this.queue.push(resolve));
  }

  private release() {
    const next = this.queue.shift();
    if (next) {
      next(); // hand the slot straight to the next queued request
    } else {
      this.active--;
    }
  }

  private async doFetch(endpoint: string, body: unknown): Promise<Json> {
    let res: Response;
    try {
      res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch (err) {
      throw new AIServiceError('network', 0, (err as Error)?.message || 'Network error');
    }

    let data: Json | null = null;
    let parseFailed = false;
    try {
      const text = await res.text();
      data = text ? JSON.parse(text) : null;
    } catch {
      parseFailed = true;
    }

    if (!res.ok) {
      const message =
        (data && (data.message || data.error)) || `Request failed with HTTP ${res.status}`;
      if (data?.needsApiKey === true) throw new AIServiceError('needs_api_key', res.status, message);
      if (res.status === 401 || res.status === 403)
        throw new AIServiceError('forbidden', res.status, message);
      if (res.status === 429) throw new AIServiceError('rate_limited', res.status, message);
      if (res.status >= 500) throw new AIServiceError('server', res.status, message);
      throw new AIServiceError('invalid', res.status, message);
    }

    if (parseFailed || !data || typeof data !== 'object' || Array.isArray(data)) {
      throw new AIServiceError('invalid', res.status, 'Response was not a JSON object');
    }

    const fallback = detectServerFallback(endpoint, data);
    if (fallback) throw fallback;
    return data;
  }

  /** POST with 60s cache, in-flight de-duplication and bounded concurrency. */
  private post(endpoint: string, body: unknown): Promise<any> {
    const key = `${endpoint}|${JSON.stringify(body)}`;
    const now = Date.now();
    const hit = this.cache.get(key);
    if (hit && (!hit.settled || hit.expires > now)) return hit.promise;

    const promise = (async () => {
      await this.acquire();
      try {
        return await this.doFetch(endpoint, body);
      } finally {
        this.release();
      }
    })();

    const entry: CacheEntry = { expires: now + this.ttlMs, promise, settled: false };
    this.cache.set(key, entry);
    promise.then(
      () => {
        entry.settled = true;
        entry.expires = Date.now() + this.ttlMs;
      },
      () => {
        // never cache failures
        if (this.cache.get(key) === entry) this.cache.delete(key);
      }
    );
    return promise;
  }

  /** Smart greeting. Throws AIServiceError; resolves only with a real AI greeting. */
  async generateSmartGreeting(userMetrics: any, timeOfDay: string, recentActivity: any) {
    const data = await this.post('/api/openai/smart-greeting', {
      userMetrics,
      timeOfDay,
      recentActivity,
    });
    if (typeof data.greeting !== 'string' || !data.greeting.trim()) {
      throw new AIServiceError('invalid', 200, 'AI response did not include a greeting');
    }
    return data;
  }

  async analyzeKPITrends(
    historicalData: any,
    currentMetrics: any,
    chartImages: string[] = [],
    videoData: string[] = []
  ) {
    return this.post('/api/openai/kpi-analysis', {
      historicalData,
      currentMetrics,
      chartImages,
      videoData,
    });
  }

  async analyzeDealIntelligence(dealData: any, contactHistory: any, marketContext: any) {
    return this.post('/api/openai/deal-intelligence', {
      dealData,
      contactHistory,
      marketContext,
    });
  }

  async generateBusinessIntelligence(businessData: any, marketContext: any, objectives: any) {
    return this.post('/api/openai/business-intelligence', {
      businessData,
      marketContext,
      objectives,
    });
  }

  async optimizePerformance(systemMetrics: any, userBehavior: any, businessGoals: any) {
    return this.post('/api/openai/performance-optimization', {
      systemMetrics,
      userBehavior,
      businessGoals,
    });
  }

  async generateAdvancedContent(
    contentType: string,
    parameters: any,
    reasoning_effort: 'minimal' | 'low' | 'medium' | 'high' = 'medium'
  ) {
    return this.post('/api/openai/advanced-content', {
      contentType,
      parameters,
      reasoning_effort,
    });
  }

  async analyzeMultimodal(
    textData: any,
    images: string[] = [],
    charts: string[] = [],
    documents: string[] = []
  ) {
    return this.post('/api/openai/multimodal-analysis', { textData, images, charts, documents });
  }

  async generatePredictiveAnalytics(
    historicalData: any,
    forecastPeriod: number = 3,
    analysisType: string = 'sales'
  ) {
    return this.post('/api/openai/predictive-analytics', {
      historicalData,
      forecastPeriod,
      analysisType,
    });
  }

  async generateStrategicPlan(
    businessContext: any,
    goals: any,
    constraints: any,
    timeframe: string = '12 months'
  ) {
    return this.post('/api/openai/strategic-planning', {
      businessContext,
      goals,
      constraints,
      timeframe,
    });
  }
}

// Export singleton instance
export const gpt5Service = new GPT5Service();
