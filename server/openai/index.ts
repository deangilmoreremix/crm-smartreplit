import OpenAI from 'openai';
import { aiResponseCache } from '../services/enhancedCache';
import { getRedisRateLimiter } from '../services/redisRateLimiter';
import { memoryService } from '../memory';

const userOpenAIKey = process.env.OPENAI_API_KEY;
const openaiApiKey = userOpenAIKey || process.env.OPENAI_API_KEY_FALLBACK;
const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;

// Circuit Breaker for AI API calls
class AICircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private readonly failureThreshold = 5;
  private readonly timeoutMs = 60000; // 1 minute
  private readonly halfOpenMaxRequests = 3;
  private halfOpenRequests = 0;

  private get state() {
    if (this.failures >= this.failureThreshold) {
      if (Date.now() - this.lastFailureTime < this.timeoutMs) {
        return 'open';
      } else {
        return 'half-open';
      }
    }
    return 'closed';
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      throw new Error('AI service temporarily unavailable due to repeated failures');
    }

    if (this.state === 'half-open') {
      if (this.halfOpenRequests >= this.halfOpenMaxRequests) {
        throw new Error('AI service temporarily unavailable - testing recovery');
      }
      this.halfOpenRequests++;
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.halfOpenRequests = 0;
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
  }

  getStatus() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime,
      nextRetryTime: this.lastFailureTime + this.timeoutMs,
    };
  }
}

// Global circuit breaker instance
const aiCircuitBreaker = new AICircuitBreaker();

// AI Usage Tracking
interface AIUsageRecord {
  userId: string;
  endpoint: string;
  tokensUsed: number;
  cost: number;
  timestamp: number;
  model: string;
  success: boolean;
}

class AIUsageTracker {
  private usageRecords: AIUsageRecord[] = [];
  private readonly maxRecords = 10000; // Keep last 10k records in memory

  trackUsage(record: AIUsageRecord) {
    this.usageRecords.push(record);

    // Keep only recent records
    if (this.usageRecords.length > this.maxRecords) {
      this.usageRecords = this.usageRecords.slice(-this.maxRecords);
    }

    // Log high usage for monitoring
    if (record.cost > 0.1) {
      // Log expensive requests
      console.warn(`High-cost AI request: $${record.cost.toFixed(4)} for ${record.endpoint}`);
    }
  }

  getUserUsage(userId: string, timeWindowMs: number = 60 * 60 * 1000): AIUsageRecord[] {
    const cutoff = Date.now() - timeWindowMs;
    return this.usageRecords.filter(
      (record) => record.userId === userId && record.timestamp > cutoff
    );
  }

  getTotalCost(userId?: string): number {
    const records = userId
      ? this.usageRecords.filter((r) => r.userId === userId)
      : this.usageRecords;
    return records.reduce((sum, record) => sum + record.cost, 0);
  }

  getUsageStats() {
    const now = Date.now();
    const lastHour = this.usageRecords.filter((r) => r.timestamp > now - 60 * 60 * 1000);
    const lastDay = this.usageRecords.filter((r) => r.timestamp > now - 24 * 60 * 60 * 1000);

    return {
      totalRequests: this.usageRecords.length,
      lastHourRequests: lastHour.length,
      lastDayRequests: lastDay.length,
      totalCost: this.getTotalCost(),
      lastHourCost: lastHour.reduce((sum, r) => sum + r.cost, 0),
      lastDayCost: lastDay.reduce((sum, r) => sum + r.cost, 0),
      circuitBreakerStatus: aiCircuitBreaker.getStatus(),
    };
  }
}

// Global usage tracker instance
const aiUsageTracker = new AIUsageTracker();

// Google AI integration
interface GoogleAIResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
    };
  }>;
}

async function callGoogleAI(prompt: string, model: string = 'gemini-1.5-flash'): Promise<string> {
  const googleAIKey = process.env.GOOGLE_AI_API_KEY;
  if (!googleAIKey) {
    throw new Error('Google AI API key not configured');
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${googleAIKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Google AI API error: ${response.status} ${response.statusText}`);
  }

  const data: GoogleAIResponse = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

export const handler = async (
  event: {
    httpMethod: string;
    path: string;
    body: string;
    headers: Record<string, string>;
    queryStringParameters?: Record<string, string>;
  },
  _context: unknown
) => {
  const { httpMethod, path, body } = event;
  const pathParts = path.split('/').filter(Boolean);

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  if (httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Apply AI rate limiting to all AI endpoints
  if (pathParts.length >= 2 && pathParts[0] === 'openai' && httpMethod === 'POST') {
    const clientIP = event.headers['x-forwarded-for'] || event.headers['x-real-ip'] || 'unknown';
    const userId = event.headers['x-user-id'] || clientIP; // Use user ID if available
    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = 10; // 10 requests per minute

    const rateLimiter = getRedisRateLimiter();
    const rateLimitResult = await rateLimiter.checkLimit(
      `ai_requests_${userId}`,
      maxRequests,
      windowMs,
      clientIP
    );

    if (!rateLimitResult.allowed) {
      return {
        statusCode: 429,
        headers,
        body: JSON.stringify({
          error: 'Too many requests',
          message: 'AI request limit exceeded. Please wait before making another request.',
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
          remaining: rateLimitResult.remaining,
          resetTime: rateLimitResult.resetTime,
        }),
      };
    }
  }

  try {
    // GET /api/openai/status - OpenAI status check
    if (
      pathParts.length >= 2 &&
      pathParts[0] === 'openai' &&
      pathParts[1] === 'status' &&
      httpMethod === 'GET'
    ) {
      const hasApiKey = !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.length > 10;

      if (!hasApiKey) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            configured: false,
            model: 'none',
            status: 'needs_configuration',
            error: 'No API key configured',
          }),
        };
      }

      let gpt5Available = false;
      try {
        if (!openai) {
          throw new Error('OpenAI client not initialized');
        }
        await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 1,
        });
        gpt5Available = true;
      } catch (_error: unknown) {
        gpt5Available = false;
}

    // POST /api/openai/smart-greeting - Smart greeting generation
     if (
       pathParts.length >= 2 &&
       pathParts[0] === 'openai' &&
       pathParts[1] === 'smart-greeting' &&
       httpMethod === 'POST'
     ) {
       const { userMetrics, timeOfDay, recentActivity } = JSON.parse(body);
       const userId = event.headers['x-user-id'] || event.headers['x-forwarded-for'] || 'anonymous';
       const sessionId = event.headers['x-session-id'] || `session-${Date.now()}`;

       // Check budget before proceeding
       if (userId) {
         const dailyUsage = aiUsageTracker.getUserUsage(userId, 24 * 60 * 60 * 1000);
         const dailyCost = dailyUsage.reduce((sum, record) => sum + record.cost, 0);
         const budgetLimit = 5.0; // $5 per day

         if (dailyCost >= budgetLimit) {
           // Record budget exceeded event
           memoryService.recordObservation(
             userId,
             'system_event',
             `AI budget exceeded for smart-greeting. Daily usage: $${dailyCost.toFixed(2)}`,
             { endpoint: 'smart-greeting', budgetLimit, dailyCost, sessionId }
           ).catch(() => {});
           return {
             statusCode: 402,
             headers,
             body: JSON.stringify({
               error: 'AI budget exceeded',
               message: `Daily AI budget of $${budgetLimit} exceeded. Current usage: $${dailyCost.toFixed(2)}`,
               greeting: `Good ${timeOfDay}! Your pipeline looks strong.`,
               insight: 'AI insights temporarily unavailable due to budget limits.',
               source: 'budget_limit_fallback',
               model: 'fallback',
             }),
           };
         }
       }

       if (!openai) {
         // Record OpenAI not configured
         memoryService.recordObservation(
           userId,
           'system_event',
           'OpenAI not configured - serving fallback greeting',
           { endpoint: 'smart-greeting', sessionId }
         ).catch(() => {});
         return {
           statusCode: 200,
           headers,
           body: JSON.stringify({
             greeting: `Good ${timeOfDay}! You have ${userMetrics?.totalDeals || 0} deals worth $${(userMetrics?.totalValue || 0).toLocaleString()}.`,
             insight:
               userMetrics?.totalValue > 50000
                 ? 'Your pipeline shows strong momentum. Focus on your highest-value opportunities to maximize Q4 performance.'
                 : 'Your pipeline is growing steadily. Consider expanding your outreach to increase deal flow.',
             source: 'intelligent_fallback',
             model: 'fallback',
           }),
         };
       }

       try {
         // Check cache first
         const cacheKey = `greeting_${timeOfDay}_${userMetrics?.totalDeals || 0}_${userMetrics?.totalValue || 0}`;
         const cachedResult = await aiResponseCache.get(cacheKey);

         if (cachedResult) {
           // Track cache hit (no cost)
           aiUsageTracker.trackUsage({
             userId: event.headers['x-user-id'] || 'anonymous',
             endpoint: 'smart-greeting',
             tokensUsed: 0,
             cost: 0,
             timestamp: Date.now(),
             model: 'cache',
             success: true,
           });

           // Record cached interaction
           memoryService.recordChatInteraction(
             userId,
             sessionId,
             `Smart greeting request (cached) - time: ${timeOfDay}, deals: ${userMetrics?.totalDeals || 0}`,
             `Cached greeting: ${cachedResult.greeting?.slice(0, 100) || 'N/A'}`,
             { endpoint: 'smart-greeting', cached: true, userMetrics, recentActivity }
           ).catch(() => {});

           return cachedResult;
         }

         const result = await aiCircuitBreaker.execute(async () => {
          const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content:
                  'You are an expert business strategist. Generate personalized greetings and strategic insights.',
              },
              {
                role: 'user',
                content: `Generate a personalized, strategic greeting for ${timeOfDay}. User has ${userMetrics?.totalDeals || 0} deals worth $${userMetrics?.totalValue || 0}. Recent activity: ${JSON.stringify(recentActivity)}. Provide both greeting and strategic insight in JSON format with 'greeting' and 'insight' fields.`,
              },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.7,
            max_tokens: 200,
          });

           const parsedResult = JSON.parse(response.choices[0].message.content || '{}');

           // Cache the result
           await aiResponseCache.set(cacheKey, parsedResult);

           // Track usage
           const tokensUsed = response.usage?.total_tokens || 200;
           const estimatedCost = (tokensUsed / 1000) * 0.15; // GPT-4o-mini pricing
           aiUsageTracker.trackUsage({
             userId: event.headers['x-user-id'] || 'anonymous',
             endpoint: 'smart-greeting',
             tokensUsed,
             cost: estimatedCost,
             timestamp: Date.now(),
             model: 'gpt-4o-mini',
             success: true,
           });

           // Record successful AI interaction in memory
           memoryService.recordChatInteraction(
             userId,
             sessionId,
             `Smart greeting request - time: ${timeOfDay}, deals: ${userMetrics?.totalDeals || 0}, value: ${userMetrics?.totalValue || 0}`,
             `Generated: ${parsedResult.greeting?.slice(0, 100) || 'N/A'}, Insight: ${parsedResult.insight?.slice(0, 100) || 'N/A'}`,
             { endpoint: 'smart-greeting', tokensUsed, estimatedCost, userMetrics, recentActivity }
           ).catch(() => {});

           return parsedResult;
         });

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            ...result,
            source: 'gpt-4o-mini',
            model: 'gpt-4o-mini',
          }),
        };
       } catch (error: unknown) {
         console.error(
           'Smart greeting circuit breaker error:',
           error instanceof Error ? error.message : String(error)
         );

         // Track failed usage
         aiUsageTracker.trackUsage({
           userId: event.headers['x-user-id'] || 'anonymous',
           endpoint: 'smart-greeting',
           tokensUsed: 0,
           cost: 0,
           timestamp: Date.now(),
           model: 'gpt-4o-mini',
           success: false,
         });

         // Record error in memory
         memoryService.recordObservation(
           userId,
           'error',
           `Smart greeting failed: ${error instanceof Error ? error.message : String(error)}`,
           { endpoint: 'smart-greeting', sessionId }
         ).catch(() => {});

         return {
           statusCode: 503,
           headers,
           body: JSON.stringify({
             greeting: `Good ${timeOfDay}! Your pipeline is looking strong.`,
             insight: 'AI service temporarily unavailable. Using intelligent defaults.',
             source: 'circuit_breaker_fallback',
             model: 'fallback',
             error: error instanceof Error ? error.message : String(error),
           }),
         };
       }
    }

     // POST /api/openai/kpi-analysis - KPI analysis
     if (
       pathParts.length >= 2 &&
       pathParts[0] === 'openai' &&
       pathParts[1] === 'kpi-analysis' &&
       httpMethod === 'POST'
     ) {
       const userId = event.headers['x-user-id'] || event.headers['x-forwarded-for'] || 'anonymous';
       const sessionId = event.headers['x-session-id'] || `session-${Date.now()}`;

       if (!openai) {
         // Record system event
         memoryService.recordObservation(
           userId,
           'system_event',
           'OpenAI not configured - KPI analysis fallback',
           { endpoint: 'kpi-analysis', sessionId }
         ).catch(() => {});
         return {
           statusCode: 400,
           headers,
           body: JSON.stringify({
             error: 'OpenAI API key not configured',
             summary:
               'Your KPI trends show steady performance. Configure OpenAI API key for detailed analysis.',
             recommendations: ['Set up API credentials', 'Enable advanced analytics'],
           }),
         };
       }

       const { historicalData, currentMetrics } = JSON.parse(body);

       try {
         const response = await openai.chat.completions.create({
           model: 'gpt-4o-mini',
           messages: [
             {
               role: 'system',
               content:
                 'You are an expert business analyst with advanced mathematical reasoning capabilities. Analyze KPI trends and provide strategic insights with confidence intervals and actionable recommendations.',
             },
             {
               role: 'user',
               content: `Analyze these KPI trends: Historical: ${JSON.stringify(historicalData)}, Current: ${JSON.stringify(currentMetrics)}. Provide summary, trends, predictions, and recommendations in JSON format.`,
             },
           ],
           response_format: { type: 'json_object' },
           temperature: 0.3,
           max_tokens: 800,
         });

         let result;
         try {
           const content = response.choices[0].message.content || '{}';
           result = JSON.parse(content);
         } catch (_parseError: unknown) {
           result = {
             error: 'Failed to parse AI response',
             summary: 'Analysis completed but response parsing failed',
             recommendations: ['Review data format', 'Check API response'],
             parsed_content: response.choices[0].message.content,
           };
         }

         // Record successful analysis in memory
         const tokensUsed = response.usage?.total_tokens || 0;
         memoryService.recordChatInteraction(
           userId,
           sessionId,
           `KPI analysis request - historical: ${JSON.stringify(historicalData).slice(0, 200)}...`,
           `Summary: ${result.summary?.slice(0, 100) || 'N/A'}, Trends: ${result.trends?.length || 0} items, Predictions: ${result.predictions?.length || 0} items`,
           { endpoint: 'kpi-analysis', tokensUsed, historicalData, currentMetrics }
         ).catch(() => {});

         return { statusCode: 200, headers, body: JSON.stringify(result) };
       } catch (error: unknown) {
         console.error('KPI analysis error:', error);

         // Record error
         memoryService.recordObservation(
           userId,
           'error',
           `KPI analysis failed: ${error instanceof Error ? error.message : String(error)}`,
           { endpoint: 'kpi-analysis', sessionId }
         ).catch(() => {});

         return {
           statusCode: 503,
           headers,
           body: JSON.stringify({
             error: 'Analysis failed',
             summary: 'KPI analysis temporarily unavailable.',
             recommendations: ['Try again later', 'Contact support if issue persists'],
           }),
         };
       }
     }

     // POST /api/googleai/test - Google AI test
     if (
       pathParts.length >= 2 &&
       pathParts[0] === 'googleai' &&
       pathParts[1] === 'test' &&
       httpMethod === 'POST'
     ) {
       const userId = event.headers['x-user-id'] || event.headers['x-forwarded-for'] || 'anonymous';
       const sessionId = event.headers['x-session-id'] || `session-${Date.now()}`;
       
       const { prompt } = JSON.parse(body);
       
       try {
         const response = await callGoogleAI(prompt || 'Generate a business insight in one sentence.');

         memoryService.recordChatInteraction(
           userId,
           sessionId,
           `Google AI test request - prompt: ${prompt?.slice(0, 100)}`,
           `Response: ${response?.slice(0, 100)}`,
           { endpoint: 'googleai/test', provider: 'gemini' }
         ).catch(() => {});

         return {
           statusCode: 200,
           headers,
           body: JSON.stringify({
             success: true,
             model: 'gemini-1.5-flash',
             output: response,
             message: 'Google AI working perfectly!',
           }),
         };
       } catch (error: unknown) {
         memoryService.recordObservation(
           userId,
           'error',
           `Google AI test failed: ${error instanceof Error ? error.message : String(error)}`,
           { endpoint: 'googleai/test', sessionId }
         ).catch(() => {});

         return {
           statusCode: 503,
           headers,
           body: JSON.stringify({
             error: 'Google AI test failed',
             message: error instanceof Error ? error.message : 'Service unavailable',
           }),
         };
       }
     }

     // POST /api/openai/test-gpt5-direct - Direct GPT test
     if (
       pathParts.length >= 3 &&
       pathParts[0] === 'openai' &&
       pathParts[1] === 'test-gpt5-direct' &&
       httpMethod === 'POST'
     ) {
       const userId = event.headers['x-user-id'] || event.headers['x-forwarded-for'] || 'anonymous';
       const sessionId = event.headers['x-session-id'] || `session-${Date.now()}`;

       if (!openai) {
         memoryService.recordObservation(
           userId,
           'system_event',
           'OpenAI not configured - test-gpt5-direct endpoint called',
           { sessionId }
         ).catch(() => {});

         return {
           statusCode: 400,
           headers,
           body: JSON.stringify({
             error: 'OpenAI API key not configured',
             message: 'Please configure OpenAI API key for testing',
           }),
         };
       }

       try {
         const response = await openai.chat.completions.create({
           model: 'gpt-4o-mini',
           messages: [
             {
               role: 'user',
               content: 'Generate a business insight about CRM efficiency in exactly 1 sentence.',
             },
           ],
           max_tokens: 50,
         });

         const output = response.choices[0].message.content;

         // Record successful test in memory
         memoryService.recordChatInteraction(
           userId,
           sessionId,
           'Direct GPT test request',
           `Test response: ${output?.slice(0, 100) || 'N/A'}`,
           { endpoint: 'test-gpt5-direct', model: 'gpt-4o-mini', tokensUsed: response.usage?.total_tokens }
         ).catch(() => {});

         return {
           statusCode: 200,
           headers,
           body: JSON.stringify({
             success: true,
             model: 'gpt-4o-mini',
             output,
             message: 'AI working perfectly!',
           }),
         };
       } catch (error: unknown) {
         console.error('Test GPT5 direct error:', error);

         memoryService.recordObservation(
           userId,
           'error',
           `Test GPT5 direct failed: ${error instanceof Error ? error.message : String(error)}`,
           { endpoint: 'test-gpt5-direct', sessionId }
         ).catch(() => {});

         return {
           statusCode: 503,
           headers,
           body: JSON.stringify({
             error: 'Test failed',
             message: 'AI service temporarily unavailable',
           }),
         };
       }
     }

     // POST /api/respond - Main AI response endpoint
     if (pathParts.length === 1 && pathParts[0] === 'respond' && httpMethod === 'POST') {
       const userId = event.headers['x-user-id'] || event.headers['x-forwarded-for'] || 'anonymous';
       const sessionId = event.headers['x-session-id'] || `session-${Date.now()}`;
       
       const {
         prompt,
         imageUrl,
         schema,
         useThinking,
         temperature = 0.4,
         max_output_tokens = 2048,
         forceToolName,
       } = JSON.parse(body);

       if (!openai) {
         memoryService.recordObservation(
           userId,
           'system_event',
           'OpenAI not configured - respond endpoint called',
           { sessionId, prompt: prompt?.slice(0, 200) }
         ).catch(() => {});

         return {
           statusCode: 400,
           headers,
           body: JSON.stringify({
             error: 'OpenAI API key not configured',
             message: 'Please configure OpenAI API key for AI features',
           }),
         };
       }

       // Record user prompt
       memoryService.recordObservation(
         userId,
         'user_prompt',
         imageUrl ? `${prompt}\n[Image: ${imageUrl}]` : prompt,
         { sessionId, endpoint: 'respond', hasImage: !!imageUrl, schema: !!schema }
       ).catch(() => {});

       const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
         {
           role: 'system',
           content: 'You are a helpful sales + ops assistant for white-label CRM applications.',
         },
         {
           role: 'user',
           content: imageUrl ? `${prompt}\n\nImage URL: ${imageUrl}` : prompt,
         },
       ];

      const response = await openai.chat.completions.create({
        model: useThinking ? 'gpt-4o' : 'gpt-4o-mini',
        messages,
        temperature,
        max_tokens: max_output_tokens,
        response_format: schema ? { type: 'json_object' } : undefined,
        tools: [
          {
            type: 'function',
            function: {
              name: 'analyzeBusinessData',
              description: 'Analyze business data and provide insights',
              parameters: {
                type: 'object',
                properties: {
                  dataType: { type: 'string' },
                  analysisType: { type: 'string' },
                  timeRange: { type: 'string' },
                },
                required: ['dataType'],
              },
            },
          },
          {
            type: 'function',
            function: {
              name: 'generateRecommendations',
              description: 'Generate business recommendations based on data',
              parameters: {
                type: 'object',
                properties: {
                  context: { type: 'string' },
                  goals: { type: 'array', items: { type: 'string' } },
                  constraints: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        ],
        tool_choice: forceToolName
          ? { type: 'function', function: { name: forceToolName } }
          : 'auto',
      });

       const toolCalls = response.choices[0].message.tool_calls;
       if (toolCalls && toolCalls.length > 0) {
         // Record tool use in memory
         memoryService.recordObservation(
           userId,
           'tool_use',
           `Tools invoked: ${toolCalls.map(tc => tc.function.name).join(', ')}`,
           { sessionId, endpoint: 'respond', toolCalls: toolCalls.map(tc => tc.function.name) }
         ).catch(() => {});

         const toolOutputs = await Promise.all(
           toolCalls.map(async (tc) => ({
             tool_call_id: tc.id,
             output: await executeWLTool(tc),
           }))
         );

         // Record tool results
         for (const tool of toolOutputs) {
           memoryService.recordObservation(
             userId,
             'tool_use',
             `Tool result: ${tool.output?.slice(0, 200) || 'empty'}`,
             { sessionId, endpoint: 'respond', tool_call_id: tool.tool_call_id }
           ).catch(() => {});
         }

         const continuedMessages = [
           ...messages,
           response.choices[0].message,
           ...toolOutputs.map((o) => ({
             role: 'tool' as const,
             content: o.output,
             tool_call_id: o.tool_call_id,
           })),
         ];

         const continuedResponse = await openai.chat.completions.create({
           model: useThinking ? 'gpt-4o' : 'gpt-4o-mini',
           messages: continuedMessages,
           temperature,
           max_tokens: max_output_tokens,
           response_format: schema ? { type: 'json_object' } : undefined,
         });

         const finalOutput = continuedResponse.choices[0].message.content;
         
         // Record final response
         memoryService.recordChatInteraction(
           userId,
           sessionId,
           `AI respond (with tools) - prompt: ${prompt?.slice(0, 150)}...`,
           `Final response: ${finalOutput?.slice(0, 200) || 'N/A'}`,
           { 
             endpoint: 'respond', 
             hadToolCalls: true, 
             toolCount: toolCalls.length,
             tokensUsed: continuedResponse.usage?.total_tokens 
           }
         ).catch(() => {});

         return {
           statusCode: 200,
           headers,
           body: JSON.stringify({
             output_text: finalOutput,
             output: [
               {
                 content: [
                   {
                     type: 'output_text',
                     text: finalOutput,
                   },
                 ],
               },
             ],
             tool_calls: toolCalls,
             continued: true,
           }),
         };
       }

       const outputText = response.choices[0].message.content;

       // Record direct response
       memoryService.recordChatInteraction(
         userId,
         sessionId,
         `AI respond (direct) - prompt: ${prompt?.slice(0, 150)}...`,
         `Response: ${outputText?.slice(0, 200) || 'N/A'}`,
         { 
           endpoint: 'respond', 
           hadToolCalls: false,
           tokensUsed: response.usage?.total_tokens,
           model: response.model
         }
       ).catch(() => {});

       return {
         statusCode: 200,
         headers,
         body: JSON.stringify({
           output_text: outputText,
           output: [
             {
               content: [
                 {
                   type: 'output_text',
                   text: outputText,
                 },
               ],
             },
           ],
           model: response.model,
           usage: response.usage,
         }),
       };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          output_text: response.choices[0].message.content,
          output: [
            {
              content: [
                {
                  type: 'output_text',
                  text: response.choices[0].message.content,
                },
              ],
            },
          ],
          model: response.model,
          usage: response.usage,
        }),
      };
    }

    // Not found
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'OpenAI endpoint not found' }),
    };
   } catch (error: unknown) {
     console.error('OpenAI function error:', error);
     
     // Record error in memory (if we have session context from a known endpoint)
     // We can't reliably get userId/sessionId here as they're endpoint-scoped
     // Each endpoint already records errors individually, so this is a fallback
     memoryService.recordObservation(
       'system',
       'error',
       `OpenAI handler error: ${error instanceof Error ? error.message : String(error)}`,
       { 
         path: event.path,
         httpMethod,
         headers: { 'x-user-id': event.headers['x-user-id'], 'x-session-id': event.headers['x-session-id'] }
       }
     ).catch(() => {});

     return {
       statusCode: 500,
       headers,
       body: JSON.stringify({
         error: 'Internal server error',
         message: error instanceof Error ? error.message : String(error),
       }),
     };
   }
};

// Tool execution function for WL apps
async function executeWLTool(tc: {
  function: { name: string; arguments: string };
}): Promise<string> {
  const { name, arguments: args } = tc.function;
  try {
    const parsedArgs = args ? JSON.parse(args) : {};
    if (name === 'analyzeBusinessData') {
      const { dataType, analysisType, timeRange } = parsedArgs;
      return JSON.stringify({
        ok: true,
        analysis: `Analysis of ${dataType} for ${timeRange}`,
        insights: [`Key insight 1 for ${analysisType}`, `Key insight 2 for ${analysisType}`],
        recommendations: [`Recommendation 1`, `Recommendation 2`],
      });
    }
    if (name === 'generateRecommendations') {
      const { context, goals, constraints } = parsedArgs;
      return JSON.stringify({
        ok: true,
        recommendations:
          goals?.map(
            (goal: string, i: number) =>
              `For ${goal}: Action ${i + 1} considering ${constraints?.[i] || 'no constraints'}`
          ) || [],
        context: context,
      });
    }
    return JSON.stringify({ ok: false, error: `Unknown tool: ${name}` });
  } catch (e: unknown) {
    return JSON.stringify({ ok: false, error: e instanceof Error ? e.message : 'Tool error' });
  }
}
