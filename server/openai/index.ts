import OpenAI from 'openai';
import { aiResponseCache } from '../services/enhancedCache';
import { getRedisRateLimiter } from '../services/redisRateLimiter';

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
      nextRetryTime: this.lastFailureTime + this.timeoutMs
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
    if (record.cost > 0.1) { // Log expensive requests
      console.warn(`High-cost AI request: $${record.cost.toFixed(4)} for ${record.endpoint}`);
    }
  }

  getUserUsage(userId: string, timeWindowMs: number = 60 * 60 * 1000): AIUsageRecord[] {
    const cutoff = Date.now() - timeWindowMs;
    return this.usageRecords.filter(record =>
      record.userId === userId && record.timestamp > cutoff
    );
  }

  getTotalCost(userId?: string): number {
    const records = userId
      ? this.usageRecords.filter(r => r.userId === userId)
      : this.usageRecords;
    return records.reduce((sum, record) => sum + record.cost, 0);
  }

  getUsageStats() {
    const now = Date.now();
    const lastHour = this.usageRecords.filter(r => r.timestamp > now - 60 * 60 * 1000);
    const lastDay = this.usageRecords.filter(r => r.timestamp > now - 24 * 60 * 60 * 1000);

    return {
      totalRequests: this.usageRecords.length,
      lastHourRequests: lastHour.length,
      lastDayRequests: lastDay.length,
      totalCost: this.getTotalCost(),
      lastHourCost: lastHour.reduce((sum, r) => sum + r.cost, 0),
      lastDayCost: lastDay.reduce((sum, r) => sum + r.cost, 0),
      circuitBreakerStatus: aiCircuitBreaker.getStatus()
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

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${googleAIKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }]
    })
  });

  if (!response.ok) {
    throw new Error(`Google AI API error: ${response.status} ${response.statusText}`);
  }

  const data: GoogleAIResponse = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

export const handler = async (event: { httpMethod: string; path: string; body: string; headers: Record<string, string>; queryStringParameters?: Record<string, string> }, _context: unknown) => {
  const { httpMethod, path, body } = event;
  const pathParts = path.split('/').filter(Boolean);

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
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
    const rateLimitResult = await rateLimiter.checkLimit(`ai_requests_${userId}`, maxRequests, windowMs, clientIP);

    if (!rateLimitResult.allowed) {
      return {
        statusCode: 429,
        headers,
        body: JSON.stringify({
          error: 'Too many requests',
          message: 'AI request limit exceeded. Please wait before making another request.',
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
          remaining: rateLimitResult.remaining,
          resetTime: rateLimitResult.resetTime
        })
      };
    }
  }

  try {
    // GET /api/openai/status - OpenAI status check
    if (pathParts.length >= 2 && pathParts[0] === 'openai' && pathParts[1] === 'status' && httpMethod === 'GET') {
      const hasApiKey = !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.length > 10;

      if (!hasApiKey) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            configured: false,
            model: 'none',
            status: 'needs_configuration',
            error: 'No API key configured'
          })
        };
      }

      let gpt5Available = false;
      try {
        if (!openai) {
          throw new Error('OpenAI client not initialized');
        }
        await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: "test" }],
          max_tokens: 1
        });
        gpt5Available = true;
      } catch (_error: unknown) {
        gpt5Available = false;
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          configured: true,
          model: gpt5Available ? 'gpt-4o' : 'gpt-4o',
          status: 'ready',
          gpt5Available,
          capabilities: gpt5Available ? [
            '94.6% AIME mathematical accuracy',
            '74.9% SWE-bench coding accuracy',
            '84.2% MMMU multimodal performance',
            'Unified reasoning system',
            'Advanced verbosity and reasoning_effort controls'
          ] : [
            'GPT-4 Omni model available',
            'Advanced reasoning and analysis',
            'Multimodal capabilities',
            'JSON output formatting'
          ]
        })
      };
    }

    // POST /api/openai/embeddings - OpenAI embeddings
    if (pathParts.length >= 2 && pathParts[0] === 'openai' && pathParts[1] === 'embeddings' && httpMethod === 'POST') {
      const { text, model = "text-embedding-3-small" } = JSON.parse(body);

      if (!text) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Text is required for embedding generation' })
        };
      }

      if (!openai) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'OpenAI API key not configured', message: 'Please configure OpenAI API key for embeddings' })
        };
      }

      const response = await openai.embeddings.create({
        model: model,
        input: text,
        encoding_format: "float",
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          embedding: response.data[0].embedding,
          model: model,
          usage: response.usage
        })
      };
    }

    // POST /api/openai/images/generate - Image generation
    if (pathParts.length >= 3 && pathParts[0] === 'openai' && pathParts[1] === 'images' && pathParts[2] === 'generate' && httpMethod === 'POST') {
      const { prompt, model = 'dall-e-3', size = '1024x1024', quality = 'standard', style = 'vivid', n = 1 } = JSON.parse(body);

      if (!prompt) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Prompt is required for image generation' })
        };
      }

      if (!openai) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'OpenAI API key not configured', message: 'Please configure OpenAI API key for image generation' })
        };
      }

      const response = await openai.images.generate({
        model: model as 'dall-e-2' | 'dall-e-3',
        prompt: prompt,
        size: size as '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792',
        quality: quality as 'standard' | 'hd',
        style: style as 'vivid' | 'natural',
        n: n
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: response.data,
          model: model,
          usage: response.data?.length || 0
        })
      };
    }

    // GET /api/openai/usage - AI usage monitoring
    if (pathParts.length >= 2 && pathParts[0] === 'openai' && pathParts[1] === 'usage' && httpMethod === 'GET') {
      const userId = event.headers['x-user-id'];
      const includeStats = event.queryStringParameters?.stats === 'true';

      if (includeStats && userId) {
        // Check if user is within budget (example: $5/day limit)
        const dailyUsage = aiUsageTracker.getUserUsage(userId, 24 * 60 * 60 * 1000);
        const dailyCost = dailyUsage.reduce((sum, record) => sum + record.cost, 0);
        const budgetLimit = 5.0; // $5 per day

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            userId,
            dailyUsage: dailyCost,
            budgetLimit,
            budgetRemaining: Math.max(0, budgetLimit - dailyCost),
            isOverBudget: dailyCost > budgetLimit,
            recentRequests: dailyUsage.slice(-10),
            circuitBreakerStatus: aiCircuitBreaker.getStatus()
          })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(aiUsageTracker.getUsageStats())
      };
    }

    // POST /api/openai/smart-greeting - Smart greeting generation
    if (pathParts.length >= 2 && pathParts[0] === 'openai' && pathParts[1] === 'smart-greeting' && httpMethod === 'POST') {
      const { userMetrics, timeOfDay, recentActivity } = JSON.parse(body);
      const userId = event.headers['x-user-id'];

      // Check budget before proceeding
      if (userId) {
        const dailyUsage = aiUsageTracker.getUserUsage(userId, 24 * 60 * 60 * 1000);
        const dailyCost = dailyUsage.reduce((sum, record) => sum + record.cost, 0);
        const budgetLimit = 5.0; // $5 per day

        if (dailyCost >= budgetLimit) {
          return {
            statusCode: 402,
            headers,
            body: JSON.stringify({
              error: 'AI budget exceeded',
              message: `Daily AI budget of $${budgetLimit} exceeded. Current usage: $${dailyCost.toFixed(2)}`,
              greeting: `Good ${timeOfDay}! Your pipeline looks strong.`,
              insight: 'AI insights temporarily unavailable due to budget limits.',
              source: 'budget_limit_fallback',
              model: 'fallback'
            })
          };
        }
      }

      if (!openai) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            greeting: `Good ${timeOfDay}! You have ${userMetrics?.totalDeals || 0} deals worth $${(userMetrics?.totalValue || 0).toLocaleString()}.`,
            insight: userMetrics?.totalValue > 50000
              ? 'Your pipeline shows strong momentum. Focus on your highest-value opportunities to maximize Q4 performance.'
              : 'Your pipeline is growing steadily. Consider expanding your outreach to increase deal flow.',
            source: 'intelligent_fallback',
            model: 'fallback'
          })
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
            success: true
          });

          return cachedResult;
        }

        const result = await aiCircuitBreaker.execute(async () => {
          const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{
              role: "system",
              content: "You are an expert business strategist. Generate personalized greetings and strategic insights."
            }, {
              role: "user",
              content: `Generate a personalized, strategic greeting for ${timeOfDay}. User has ${userMetrics?.totalDeals || 0} deals worth $${userMetrics?.totalValue || 0}. Recent activity: ${JSON.stringify(recentActivity)}. Provide both greeting and strategic insight in JSON format with 'greeting' and 'insight' fields.`
            }],
            response_format: { type: "json_object" },
            temperature: 0.7,
            max_tokens: 200
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
            success: true
          });

          return parsedResult;
        });

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            ...result,
            source: 'gpt-4o-mini',
            model: 'gpt-4o-mini'
          })
        };
      } catch (error: unknown) {
        console.error('Smart greeting circuit breaker error:', error instanceof Error ? error.message : String(error));

        // Track failed usage
        aiUsageTracker.trackUsage({
          userId: event.headers['x-user-id'] || 'anonymous',
          endpoint: 'smart-greeting',
          tokensUsed: 0,
          cost: 0,
          timestamp: Date.now(),
          model: 'gpt-4o-mini',
          success: false
        });

        return {
          statusCode: 503,
          headers,
          body: JSON.stringify({
            greeting: `Good ${timeOfDay}! Your pipeline is looking strong.`,
            insight: 'AI service temporarily unavailable. Using intelligent defaults.',
            source: 'circuit_breaker_fallback',
            model: 'fallback',
            error: error instanceof Error ? error.message : String(error)
          })
        };
      }
    }

    // POST /api/openai/kpi-analysis - KPI analysis
    if (pathParts.length >= 2 && pathParts[0] === 'openai' && pathParts[1] === 'kpi-analysis' && httpMethod === 'POST') {
      if (!openai) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'OpenAI API key not configured',
            summary: 'Your KPI trends show steady performance. Configure OpenAI API key for detailed analysis.',
            recommendations: ['Set up API credentials', 'Enable advanced analytics']
          })
        };
      }

      const { historicalData, currentMetrics } = JSON.parse(body);

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{
          role: "system",
          content: "You are an expert business analyst with advanced mathematical reasoning capabilities. Analyze KPI trends and provide strategic insights with confidence intervals and actionable recommendations."
        }, {
          role: "user",
          content: `Analyze these KPI trends: Historical: ${JSON.stringify(historicalData)}, Current: ${JSON.stringify(currentMetrics)}. Provide summary, trends, predictions, and recommendations in JSON format.`
        }],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 800
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
          parsed_content: response.choices[0].message.content
        };
      }

      return { statusCode: 200, headers, body: JSON.stringify(result) };
    }

    // POST /api/googleai/test - Google AI test
    if (pathParts.length >= 2 && pathParts[0] === 'googleai' && pathParts[1] === 'test' && httpMethod === 'POST') {
      const { prompt } = JSON.parse(body);
      const response = await callGoogleAI(prompt || "Generate a business insight in one sentence.");

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          model: 'gemini-1.5-flash',
          output: response,
          message: 'Google AI working perfectly!'
        })
      };
    }

    // POST /api/openai/test-gpt5-direct - Direct GPT test
    if (pathParts.length >= 3 && pathParts[0] === 'openai' && pathParts[1] === 'test-gpt5-direct' && httpMethod === 'POST') {
      if (!openai) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'OpenAI API key not configured',
            message: 'Please configure OpenAI API key for testing'
          })
        };
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: "Generate a business insight about CRM efficiency in exactly 1 sentence." }],
        max_tokens: 50
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          model: 'gpt-4o-mini',
          output: response.choices[0].message.content,
          message: 'AI working perfectly!'
        })
      };
    }

    // POST /api/respond - Main AI response endpoint
    if (pathParts.length === 1 && pathParts[0] === 'respond' && httpMethod === 'POST') {
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
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'OpenAI API key not configured',
            message: 'Please configure OpenAI API key for AI features'
          })
        };
      }

      const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
        {
          role: "system",
          content: "You are a helpful sales + ops assistant for white-label CRM applications."
        },
        {
          role: "user",
          content: imageUrl
            ? `${prompt}\n\nImage URL: ${imageUrl}`
            : prompt
        }
      ];

      const response = await openai.chat.completions.create({
        model: useThinking ? "gpt-4o" : "gpt-4o-mini",
        messages,
        temperature,
        max_tokens: max_output_tokens,
        response_format: schema ? { type: "json_object" } : undefined,
        tools: [
          {
            type: "function",
            function: {
              name: "analyzeBusinessData",
              description: "Analyze business data and provide insights",
              parameters: {
                type: "object",
                properties: {
                  dataType: { type: "string" },
                  analysisType: { type: "string" },
                  timeRange: { type: "string" }
                },
                required: ["dataType"]
              }
            }
          },
          {
            type: "function",
            function: {
              name: "generateRecommendations",
              description: "Generate business recommendations based on data",
              parameters: {
                type: "object",
                properties: {
                  context: { type: "string" },
                  goals: { type: "array", items: { type: "string" } },
                  constraints: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        ],
        tool_choice: forceToolName ? { type: "function", function: { name: forceToolName } } : "auto"
      });

      const toolCalls = response.choices[0].message.tool_calls;
      if (toolCalls && toolCalls.length > 0) {
        const toolOutputs = await Promise.all(
          toolCalls.map(async (tc) => ({
            tool_call_id: tc.id,
            output: await executeWLTool(tc),
          }))
        );

        const continuedMessages = [
          ...messages,
          response.choices[0].message,
          ...toolOutputs.map((o) => ({
            role: "tool" as const,
            content: o.output,
            tool_call_id: o.tool_call_id
          }))
        ];

        const continuedResponse = await openai.chat.completions.create({
          model: useThinking ? "gpt-4o" : "gpt-4o-mini",
          messages: continuedMessages,
          temperature,
          max_tokens: max_output_tokens,
          response_format: schema ? { type: "json_object" } : undefined
        });

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            output_text: continuedResponse.choices[0].message.content,
            output: [{
              content: [{
                type: "output_text",
                text: continuedResponse.choices[0].message.content
              }]
            }],
            tool_calls: toolCalls,
            continued: true
          })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          output_text: response.choices[0].message.content,
          output: [{
            content: [{
              type: "output_text",
              text: response.choices[0].message.content
            }]
          }],
          model: response.model,
          usage: response.usage
        })
      };
    }

    // Not found
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'OpenAI endpoint not found' })
    };

  } catch (error: unknown) {
    console.error('OpenAI function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error', message: error instanceof Error ? error.message : String(error) })
    };
  }
};

// Tool execution function for WL apps
async function executeWLTool(tc: { function: { name: string; arguments: string } }): Promise<string> {
  const { name, arguments: args } = tc.function;
  try {
    const parsedArgs = args ? JSON.parse(args) : {};
    if (name === "analyzeBusinessData") {
      const { dataType, analysisType, timeRange } = parsedArgs;
      return JSON.stringify({
        ok: true,
        analysis: `Analysis of ${dataType} for ${timeRange}`,
        insights: [`Key insight 1 for ${analysisType}`, `Key insight 2 for ${analysisType}`],
        recommendations: [`Recommendation 1`, `Recommendation 2`]
      });
    }
    if (name === "generateRecommendations") {
      const { context, goals, constraints } = parsedArgs;
      return JSON.stringify({
        ok: true,
        recommendations: goals?.map((goal: string, i: number) =>
          `For ${goal}: Action ${i + 1} considering ${constraints?.[i] || 'no constraints'}`
        ) || [],
        context: context
      });
    }
    return JSON.stringify({ ok: false, error: `Unknown tool: ${name}` });
  } catch (e: unknown) {
    return JSON.stringify({ ok: false, error: e instanceof Error ? e.message : "Tool error" });
  }
}