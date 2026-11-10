// server/services/openaiClient.ts
import OpenAI from "openai";

// shared/aiModels.ts
var MODEL_TIERS = {
  fast: "gpt-6-luna",
  default: "gpt-6.1-terra",
  deep: "gpt-6.1-sol",
  max: "gpt-6-astra"
};
var DEFAULT_MODEL = MODEL_TIERS.default;
var ENV_NAMES = {
  fast: "OPENAI_MODEL_FAST",
  default: "OPENAI_MODEL_DEFAULT",
  deep: "OPENAI_MODEL_DEEP",
  max: "OPENAI_MODEL_MAX"
};
var defaultEnv = () => typeof process !== "undefined" && process.env ? process.env : {};
function tierModel(tier = "default", env = defaultEnv()) {
  return env[ENV_NAMES[tier]]?.trim() || MODEL_TIERS[tier];
}
function resolveModel(tierOrModel, env = defaultEnv()) {
  if (!tierOrModel) return tierModel("default", env);
  if (tierOrModel in MODEL_TIERS) return tierModel(tierOrModel, env);
  return tierOrModel;
}
function modelSupportsNoReasoning(model) {
  return !/^gpt-6(\.1)?-(astra|sol)/.test(model) || model === "gpt-6-sol";
}
function normalizeEffort(model, effort) {
  if (!effort) return void 0;
  if (effort === "minimal") return "low";
  if (effort === "none" && !modelSupportsNoReasoning(model)) return "low";
  return effort;
}

// server/services/openaiClient.ts
var REASONING_HEADROOM = 1024;
var MIN_OUTPUT_TOKENS = 16;
var cachedClient = null;
function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_FALLBACK;
  if (!apiKey) return null;
  if (!cachedClient) cachedClient = new OpenAI({ apiKey });
  return cachedClient;
}
function requireClient(opts) {
  const client = opts.client ?? getOpenAIClient();
  if (!client) throw new Error("OpenAI not configured");
  return client;
}
function toResponsesTool(tool) {
  if (tool?.type === "function" && tool.function) {
    const { name, description, parameters, strict } = tool.function;
    return {
      type: "function",
      name,
      description,
      parameters,
      ...strict !== void 0 ? { strict } : {}
    };
  }
  return tool;
}
function toResponsesToolChoice(choice) {
  if (choice && typeof choice === "object" && choice.type === "function" && choice.function?.name) {
    return { type: "function", name: choice.function.name };
  }
  return choice;
}
function buildRequest(opts) {
  const model = opts.model ? resolveModel(opts.model) : tierModel(opts.tier ?? "default");
  const effort = normalizeEffort(model, opts.effort);
  const body = { model, input: opts.input };
  if (opts.instructions) body.instructions = opts.instructions;
  if (effort) body.reasoning = { effort };
  if (opts.maxOutputTokens) {
    const requested = effort && effort !== "none" ? opts.maxOutputTokens + REASONING_HEADROOM : opts.maxOutputTokens;
    body.max_output_tokens = Math.max(MIN_OUTPUT_TOKENS, requested);
  }
  if (effort === "none") {
    if (opts.temperature !== void 0) body.temperature = opts.temperature;
    if (opts.topP !== void 0) body.top_p = opts.topP;
  }
  if (opts.json === true) {
    body.text = { format: { type: "json_object" } };
  } else if (opts.json) {
    body.text = {
      format: {
        type: "json_schema",
        name: opts.json.name,
        schema: opts.json.schema,
        strict: opts.json.strict ?? true
      }
    };
  }
  if (opts.tools?.length) {
    body.tools = opts.tools.map(toResponsesTool);
    if (opts.toolChoice !== void 0) body.tool_choice = toResponsesToolChoice(opts.toolChoice);
  }
  if (opts.previousResponseId) body.previous_response_id = opts.previousResponseId;
  body.store = opts.store ?? !!opts.previousResponseId;
  return body;
}
function outputText(response) {
  if (typeof response?.output_text === "string") return response.output_text;
  const parts = [];
  for (const item of response?.output ?? []) {
    if (item?.type !== "message") continue;
    for (const c of item.content ?? []) {
      if (c?.type === "output_text" && typeof c.text === "string") parts.push(c.text);
    }
  }
  return parts.join("");
}
function usageOf(response) {
  const u = response?.usage ?? {};
  const inputTokens = u.input_tokens ?? 0;
  const outputTokens = u.output_tokens ?? 0;
  return { inputTokens, outputTokens, totalTokens: u.total_tokens ?? inputTokens + outputTokens };
}
function functionCalls(response) {
  return (response?.output ?? []).filter((i) => i?.type === "function_call");
}
async function respond(opts) {
  const client = requireClient(opts);
  return client.responses.create(buildRequest(opts));
}
async function respondText(opts) {
  const response = await respond(opts);
  return { text: outputText(response), usage: usageOf(response), model: response.model ?? String(buildRequest(opts).model) };
}
async function respondJson(opts) {
  const { text, usage, model } = await respondText({ ...opts, json: opts.json ?? true });
  return { data: JSON.parse(text || "{}"), usage, model };
}
async function respondWithTools(opts) {
  const { handlers, maxTurns = 5, ...base } = opts;
  const client = requireClient(base);
  let context = typeof base.input === "string" ? [{ role: "user", content: base.input }] : [...base.input];
  const total = { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
  let response;
  const toolCalls = [];
  for (let turn = 0; turn < maxTurns; turn++) {
    const request = buildRequest({ ...base, input: context });
    if (request.store === false) request.include = ["reasoning.encrypted_content"];
    response = await client.responses.create(request);
    const u = usageOf(response);
    total.inputTokens += u.inputTokens;
    total.outputTokens += u.outputTokens;
    total.totalTokens += u.totalTokens;
    const calls = functionCalls(response);
    if (!calls.length) break;
    context = [...context, ...response.output];
    for (const call of calls) {
      toolCalls.push({ name: call.name, arguments: call.arguments });
      let output;
      try {
        const handler2 = handlers[call.name];
        if (!handler2) throw new Error(`No handler for tool "${call.name}"`);
        output = await handler2(JSON.parse(call.arguments || "{}"));
      } catch (error) {
        output = { error: error?.message ?? "Tool failed" };
      }
      context.push({
        type: "function_call_output",
        call_id: call.call_id,
        output: typeof output === "string" ? output : JSON.stringify(output)
      });
    }
  }
  return { text: outputText(response), usage: total, response, toolCalls };
}

// server/services/enhancedCache.ts
var LRUCache = class {
  cache = /* @__PURE__ */ new Map();
  accessOrder = /* @__PURE__ */ new Set();
  maxSize;
  defaultTTL;
  stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    sets: 0,
    size: 0,
    maxSizeReached: 0
  };
  constructor(maxSize = 1e4, defaultTTL = 5 * 60 * 1e3) {
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
    if (typeof setInterval !== "undefined") {
      setInterval(() => this.cleanup(), 5 * 60 * 1e3);
    }
  }
  async get(key) {
    const entry = this.cache.get(key);
    if (entry && !this.isExpired(entry)) {
      this.accessOrder.delete(key);
      this.accessOrder.add(key);
      this.stats.hits++;
      return entry.value;
    }
    if (entry) {
      this.cache.delete(key);
      this.accessOrder.delete(key);
    }
    this.stats.misses++;
    return null;
  }
  async set(key, value, ttl) {
    this.stats.sets++;
    const ttlMs = ttl ?? this.defaultTTL;
    const entry = {
      value,
      expiresAt: Date.now() + ttlMs,
      ttl: ttlMs,
      accessCount: 0,
      lastAccessed: Date.now()
    };
    const existing = this.cache.get(key);
    if (existing) {
      entry.accessCount = existing.accessCount + 1;
    }
    this.cache.set(key, entry);
    this.accessOrder.delete(key);
    this.accessOrder.add(key);
    this.stats.size = this.cache.size;
    this.evictIfNeeded();
  }
  async delete(key) {
    const deleted = this.cache.delete(key);
    this.accessOrder.delete(key);
    this.stats.size = this.cache.size;
    return deleted;
  }
  async clear() {
    this.cache.clear();
    this.accessOrder.clear();
    this.stats.size = 0;
  }
  isExpired(entry) {
    return Date.now() > entry.expiresAt;
  }
  evictIfNeeded() {
    if (this.cache.size > this.maxSize) {
      this.stats.maxSizeReached++;
      const toEvict = Array.from(this.accessOrder).slice(
        0,
        Math.max(1, Math.floor(this.maxSize * 0.1))
      );
      for (const key of toEvict) {
        this.cache.delete(key);
        this.accessOrder.delete(key);
        this.stats.evictions++;
      }
      this.stats.size = this.cache.size;
    }
  }
  cleanup() {
    const now = Date.now();
    const toDelete = [];
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        toDelete.push(key);
      }
    }
    for (const key of toDelete) {
      this.cache.delete(key);
      this.accessOrder.delete(key);
    }
    this.stats.size = this.cache.size;
  }
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? this.stats.hits / total * 100 : 0;
    return {
      ...this.stats,
      hitRate: hitRate.toFixed(2) + "%",
      memoryUsage: `${(this.cache.size * 0.2).toFixed(2)} KB`
      // Rough estimate
    };
  }
};
var aiResponseCache = new LRUCache(5e3, 10 * 60 * 1e3);
var userDataCache = new LRUCache(1e4, 30 * 60 * 1e3);
var configCache = new LRUCache(1e3, 60 * 60 * 1e3);

// server/services/redisRateLimiter.ts
import Redis from "ioredis";
var RedisRateLimiter = class {
  redis;
  keyPrefix = "rate_limit:";
  constructor(redisUrl) {
    this.redis = new Redis(redisUrl || process.env.REDIS_URL || "redis://localhost:6379", {
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      reconnectOnError: (err) => {
        console.warn("Redis connection error:", err.message);
        return err.message.includes("READONLY");
      }
    });
    this.redis.on("error", (err) => {
      console.error("Redis connection error:", err);
    });
    this.redis.on("connect", () => {
      console.log("\u2705 Redis connected for rate limiting");
    });
  }
  async checkLimit(key, maxRequests, windowMs, identifier) {
    const redisKey = `${this.keyPrefix}${key}`;
    const now = Date.now();
    const windowStart = now - windowMs;
    try {
      const pipeline = this.redis.pipeline();
      pipeline.zremrangebyscore(redisKey, 0, windowStart);
      pipeline.zcard(redisKey);
      pipeline.zadd(redisKey, now, `${now}:${identifier || "req"}`);
      pipeline.pexpire(redisKey, windowMs + 6e4);
      const results = await pipeline.exec();
      if (!results) {
        throw new Error("Redis pipeline execution failed");
      }
      const requestCount = results[1][1];
      const allowed = requestCount <= maxRequests;
      const remaining = Math.max(0, maxRequests - requestCount + 1);
      const resetTime = now + windowMs;
      return {
        allowed,
        remaining,
        resetTime,
        totalRequests: requestCount
      };
    } catch (error) {
      console.error("Redis rate limit check failed:", error);
      return this.fallbackCheckLimit(key, maxRequests, windowMs);
    }
  }
  async getUsageStats(key, windowMs) {
    const redisKey = `${this.keyPrefix}${key}`;
    const now = Date.now();
    const windowStart = now - windowMs;
    try {
      const pipeline = this.redis.pipeline();
      pipeline.zremrangebyscore(redisKey, 0, windowStart);
      pipeline.zcard(redisKey);
      pipeline.zrange(redisKey, 0, -1, "WITHSCORES");
      const results = await pipeline.exec();
      if (!results)
        return { currentRequests: 0, remainingRequests: 0, resetTime: now + windowMs, windowStart };
      const currentRequests = results[1][1];
      const resetTime = now + windowMs;
      return {
        currentRequests,
        remainingRequests: Math.max(0, 100 - currentRequests),
        // Assuming 100 max for stats
        resetTime,
        windowStart
      };
    } catch (error) {
      console.error("Redis usage stats failed:", error);
      return { currentRequests: 0, remainingRequests: 100, resetTime: now + windowMs, windowStart };
    }
  }
  async resetLimit(key) {
    try {
      const redisKey = `${this.keyPrefix}${key}`;
      await this.redis.del(redisKey);
      return true;
    } catch (error) {
      console.error("Redis reset limit failed:", error);
      return false;
    }
  }
  async cleanup() {
    try {
      await this.redis.quit();
    } catch (error) {
      console.error("Redis cleanup error:", error);
    }
  }
  // Fallback in-memory implementation
  fallbackCheckLimit(key, maxRequests, windowMs) {
    if (!global.fallbackRateLimitStore) {
      global.fallbackRateLimitStore = /* @__PURE__ */ new Map();
    }
    const store = global.fallbackRateLimitStore;
    const now = Date.now();
    const current = store.get(key) || { count: 0, resetTime: now + windowMs };
    if (now > current.resetTime) {
      current.count = 1;
      current.resetTime = now + windowMs;
    } else if (current.count >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: current.resetTime,
        totalRequests: current.count
      };
    } else {
      current.count++;
    }
    store.set(key, current);
    return {
      allowed: true,
      remaining: maxRequests - current.count,
      resetTime: current.resetTime,
      totalRequests: current.count
    };
  }
  // Health check
  async healthCheck() {
    try {
      await this.redis.ping();
      return true;
    } catch (error) {
      console.warn(
        "Redis health check failed:",
        error instanceof Error ? error.message : String(error)
      );
      return false;
    }
  }
};
var redisRateLimiter;
function getRedisRateLimiter() {
  if (!redisRateLimiter) {
    redisRateLimiter = new RedisRateLimiter();
  }
  return redisRateLimiter;
}
process.on("SIGTERM", async () => {
  if (redisRateLimiter) {
    await redisRateLimiter.cleanup();
  }
});
process.on("SIGINT", async () => {
  if (redisRateLimiter) {
    await redisRateLimiter.cleanup();
  }
});

// server/memory.ts
var MemoryService = class {
  async recordObservation(_userId, _type, _content, _metadata) {
  }
  async recordSystemEvent(_eventType, _content, _metadata) {
  }
};
var memoryService = new MemoryService();

// server/openai/index.ts
var openai = getOpenAIClient();
var AICircuitBreaker = class {
  failures = 0;
  lastFailureTime = 0;
  failureThreshold = 5;
  timeoutMs = 6e4;
  // 1 minute
  halfOpenMaxRequests = 3;
  halfOpenRequests = 0;
  get state() {
    if (this.failures >= this.failureThreshold) {
      if (Date.now() - this.lastFailureTime < this.timeoutMs) {
        return "open";
      } else {
        return "half-open";
      }
    }
    return "closed";
  }
  async execute(operation) {
    if (this.state === "open") {
      throw new Error("AI service temporarily unavailable due to repeated failures");
    }
    if (this.state === "half-open") {
      if (this.halfOpenRequests >= this.halfOpenMaxRequests) {
        throw new Error("AI service temporarily unavailable - testing recovery");
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
  onSuccess() {
    this.failures = 0;
    this.halfOpenRequests = 0;
  }
  onFailure() {
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
};
var aiCircuitBreaker = new AICircuitBreaker();
var AIUsageTracker = class {
  usageRecords = [];
  maxRecords = 1e4;
  // Keep last 10k records in memory
  trackUsage(record) {
    this.usageRecords.push(record);
    if (this.usageRecords.length > this.maxRecords) {
      this.usageRecords = this.usageRecords.slice(-this.maxRecords);
    }
    if (record.cost > 0.1) {
      console.warn(`High-cost AI request: $${record.cost.toFixed(4)} for ${record.endpoint}`);
    }
  }
  getUserUsage(userId, timeWindowMs = 60 * 60 * 1e3) {
    const cutoff = Date.now() - timeWindowMs;
    return this.usageRecords.filter(
      (record) => record.userId === userId && record.timestamp > cutoff
    );
  }
  getTotalCost(userId) {
    const records = userId ? this.usageRecords.filter((r) => r.userId === userId) : this.usageRecords;
    return records.reduce((sum, record) => sum + record.cost, 0);
  }
  getUsageStats() {
    const now = Date.now();
    const lastHour = this.usageRecords.filter((r) => r.timestamp > now - 60 * 60 * 1e3);
    const lastDay = this.usageRecords.filter((r) => r.timestamp > now - 24 * 60 * 60 * 1e3);
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
};
var aiUsageTracker = new AIUsageTracker();
async function callGoogleAI(prompt, model = "gemini-1.5-flash") {
  const googleAIKey = process.env.GOOGLE_AI_API_KEY;
  if (!googleAIKey) {
    throw new Error("Google AI API key not configured");
  }
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${googleAIKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ]
      })
    }
  );
  if (!response.ok) {
    throw new Error(`Google AI API error: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}
var handler = async (event, _context) => {
  const { httpMethod, path, body } = event;
  const pathParts = path.split("/").filter(Boolean);
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
  };
  if (httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }
  if (pathParts.length >= 2 && pathParts[0] === "openai" && httpMethod === "POST") {
    const clientIP = event.headers["x-forwarded-for"] || event.headers["x-real-ip"] || "unknown";
    const userId = event.headers["x-user-id"] || clientIP;
    const windowMs = 60 * 1e3;
    const maxRequests = 10;
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
          error: "Too many requests",
          message: "AI request limit exceeded. Please wait before making another request.",
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1e3),
          remaining: rateLimitResult.remaining,
          resetTime: rateLimitResult.resetTime
        })
      };
    }
  }
  try {
    if (pathParts.length >= 2 && pathParts[0] === "openai" && pathParts[1] === "status" && httpMethod === "GET") {
      const hasApiKey = !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.length > 10;
      if (!hasApiKey) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            configured: false,
            model: "none",
            status: "needs_configuration",
            error: "No API key configured"
          })
        };
      }
      let gpt5Available = false;
      try {
        if (!openai) {
          throw new Error("OpenAI client not initialized");
        }
        await respond({ tier: "fast", input: "test", maxOutputTokens: 16, effort: "none" });
        gpt5Available = true;
      } catch (_error) {
        gpt5Available = false;
      }
      if (pathParts.length >= 2 && pathParts[0] === "openai" && pathParts[1] === "smart-greeting" && httpMethod === "POST") {
        const { userMetrics, timeOfDay, recentActivity } = JSON.parse(body);
        const userId = event.headers["x-user-id"] || event.headers["x-forwarded-for"] || "anonymous";
        const sessionId = event.headers["x-session-id"] || `session-${Date.now()}`;
        if (userId) {
          const dailyUsage = aiUsageTracker.getUserUsage(userId, 24 * 60 * 60 * 1e3);
          const dailyCost = dailyUsage.reduce((sum, record) => sum + record.cost, 0);
          const budgetLimit = 5;
          if (dailyCost >= budgetLimit) {
            memoryService.recordObservation(
              userId,
              "system_event",
              `AI budget exceeded for smart-greeting. Daily usage: $${dailyCost.toFixed(2)}`,
              { endpoint: "smart-greeting", budgetLimit, dailyCost, sessionId }
            ).catch(() => {
            });
            return {
              statusCode: 402,
              headers,
              body: JSON.stringify({
                error: "AI budget exceeded",
                message: `Daily AI budget of $${budgetLimit} exceeded. Current usage: $${dailyCost.toFixed(2)}`,
                greeting: `Good ${timeOfDay}! Your pipeline looks strong.`,
                insight: "AI insights temporarily unavailable due to budget limits.",
                source: "budget_limit_fallback",
                model: "fallback"
              })
            };
          }
        }
        if (!openai) {
          memoryService.recordObservation(
            userId,
            "system_event",
            "OpenAI not configured - serving fallback greeting",
            { endpoint: "smart-greeting", sessionId }
          ).catch(() => {
          });
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              greeting: `Good ${timeOfDay}! You have ${userMetrics?.totalDeals || 0} deals worth $${(userMetrics?.totalValue || 0).toLocaleString()}.`,
              insight: userMetrics?.totalValue > 5e4 ? "Your pipeline shows strong momentum. Focus on your highest-value opportunities to maximize Q4 performance." : "Your pipeline is growing steadily. Consider expanding your outreach to increase deal flow.",
              source: "intelligent_fallback",
              model: "fallback"
            })
          };
        }
        try {
          const cacheKey = `greeting_${timeOfDay}_${userMetrics?.totalDeals || 0}_${userMetrics?.totalValue || 0}`;
          const cachedResult = await aiResponseCache.get(cacheKey);
          if (cachedResult) {
            aiUsageTracker.trackUsage({
              userId: event.headers["x-user-id"] || "anonymous",
              endpoint: "smart-greeting",
              tokensUsed: 0,
              cost: 0,
              timestamp: Date.now(),
              model: "cache",
              success: true
            });
            memoryService.recordChatInteraction(
              userId,
              sessionId,
              `Smart greeting request (cached) - time: ${timeOfDay}, deals: ${userMetrics?.totalDeals || 0}`,
              `Cached greeting: ${cachedResult.greeting?.slice(0, 100) || "N/A"}`,
              { endpoint: "smart-greeting", cached: true, userMetrics, recentActivity }
            ).catch(() => {
            });
            return cachedResult;
          }
          const result = await aiCircuitBreaker.execute(async () => {
            const response = await respondJson({
              tier: "fast",
              effort: "none",
              temperature: 0.7,
              maxOutputTokens: 200,
              instructions: "You are an expert business strategist. Generate personalized greetings and strategic insights.",
              input: `Generate a personalized, strategic greeting for ${timeOfDay}. User has ${userMetrics?.totalDeals || 0} deals worth $${userMetrics?.totalValue || 0}. Recent activity: ${JSON.stringify(recentActivity)}. Provide both greeting and strategic insight in JSON format with 'greeting' and 'insight' fields.`
            });
            const parsedResult = response.data;
            await aiResponseCache.set(cacheKey, parsedResult);
            const tokensUsed = response.usage.totalTokens || 200;
            const estimatedCost = tokensUsed / 1e3 * 0.15;
            aiUsageTracker.trackUsage({
              userId: event.headers["x-user-id"] || "anonymous",
              endpoint: "smart-greeting",
              tokensUsed,
              cost: estimatedCost,
              timestamp: Date.now(),
              model: tierModel("fast"),
              success: true
            });
            memoryService.recordChatInteraction(
              userId,
              sessionId,
              `Smart greeting request - time: ${timeOfDay}, deals: ${userMetrics?.totalDeals || 0}, value: ${userMetrics?.totalValue || 0}`,
              `Generated: ${parsedResult.greeting?.slice(0, 100) || "N/A"}, Insight: ${parsedResult.insight?.slice(0, 100) || "N/A"}`,
              { endpoint: "smart-greeting", tokensUsed, estimatedCost, userMetrics, recentActivity }
            ).catch(() => {
            });
            return parsedResult;
          });
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              ...result,
              source: tierModel("fast"),
              model: tierModel("fast")
            })
          };
        } catch (error) {
          console.error(
            "Smart greeting circuit breaker error:",
            error instanceof Error ? error.message : String(error)
          );
          aiUsageTracker.trackUsage({
            userId: event.headers["x-user-id"] || "anonymous",
            endpoint: "smart-greeting",
            tokensUsed: 0,
            cost: 0,
            timestamp: Date.now(),
            model: tierModel("fast"),
            success: false
          });
          memoryService.recordObservation(
            userId,
            "error",
            `Smart greeting failed: ${error instanceof Error ? error.message : String(error)}`,
            { endpoint: "smart-greeting", sessionId }
          ).catch(() => {
          });
          return {
            statusCode: 503,
            headers,
            body: JSON.stringify({
              greeting: `Good ${timeOfDay}! Your pipeline is looking strong.`,
              insight: "AI service temporarily unavailable. Using intelligent defaults.",
              source: "circuit_breaker_fallback",
              model: "fallback",
              error: error instanceof Error ? error.message : String(error)
            })
          };
        }
      }
      if (pathParts.length >= 2 && pathParts[0] === "openai" && pathParts[1] === "kpi-analysis" && httpMethod === "POST") {
        const userId = event.headers["x-user-id"] || event.headers["x-forwarded-for"] || "anonymous";
        const sessionId = event.headers["x-session-id"] || `session-${Date.now()}`;
        if (!openai) {
          memoryService.recordObservation(
            userId,
            "system_event",
            "OpenAI not configured - KPI analysis fallback",
            { endpoint: "kpi-analysis", sessionId }
          ).catch(() => {
          });
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
              error: "OpenAI API key not configured",
              summary: "Your KPI trends show steady performance. Configure OpenAI API key for detailed analysis.",
              recommendations: ["Set up API credentials", "Enable advanced analytics"]
            })
          };
        }
        const { historicalData, currentMetrics } = JSON.parse(body);
        try {
          const response = await respondText({
            tier: "fast",
            effort: "none",
            temperature: 0.3,
            maxOutputTokens: 800,
            json: true,
            instructions: "You are an expert business analyst with advanced mathematical reasoning capabilities. Analyze KPI trends and provide strategic insights with confidence intervals and actionable recommendations.",
            input: `Analyze these KPI trends: Historical: ${JSON.stringify(historicalData)}, Current: ${JSON.stringify(currentMetrics)}. Provide summary, trends, predictions, and recommendations in JSON format.`
          });
          let result;
          try {
            result = JSON.parse(response.text || "{}");
          } catch (_parseError) {
            result = {
              error: "Failed to parse AI response",
              summary: "Analysis completed but response parsing failed",
              recommendations: ["Review data format", "Check API response"],
              parsed_content: response.text
            };
          }
          const tokensUsed = response.usage.totalTokens || 0;
          memoryService.recordChatInteraction(
            userId,
            sessionId,
            `KPI analysis request - historical: ${JSON.stringify(historicalData).slice(0, 200)}...`,
            `Summary: ${result.summary?.slice(0, 100) || "N/A"}, Trends: ${result.trends?.length || 0} items, Predictions: ${result.predictions?.length || 0} items`,
            { endpoint: "kpi-analysis", tokensUsed, historicalData, currentMetrics }
          ).catch(() => {
          });
          return { statusCode: 200, headers, body: JSON.stringify(result) };
        } catch (error) {
          console.error("KPI analysis error:", error);
          memoryService.recordObservation(
            userId,
            "error",
            `KPI analysis failed: ${error instanceof Error ? error.message : String(error)}`,
            { endpoint: "kpi-analysis", sessionId }
          ).catch(() => {
          });
          return {
            statusCode: 503,
            headers,
            body: JSON.stringify({
              error: "Analysis failed",
              summary: "KPI analysis temporarily unavailable.",
              recommendations: ["Try again later", "Contact support if issue persists"]
            })
          };
        }
      }
      if (pathParts.length >= 2 && pathParts[0] === "openai" && pathParts[1] === "business-intelligence" && httpMethod === "POST") {
        const userId = event.headers["x-user-id"] || event.headers["x-forwarded-for"] || "anonymous";
        const sessionId = event.headers["x-session-id"] || `session-${Date.now()}`;
        if (!openai) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
              error: "OpenAI API key not configured",
              summary: "Configure OpenAI API key for business intelligence analysis.",
              recommendations: ["Set up API credentials", "Enable advanced analytics"]
            })
          };
        }
        const { data, focus } = JSON.parse(body || "{}");
        try {
          const response = await respondText({
            tier: "default",
            effort: "none",
            maxOutputTokens: 1200,
            json: true,
            instructions: "You are an expert business intelligence analyst. Turn CRM and business data into concise, actionable insights.",
            input: `Create a business intelligence summary${focus ? ` focused on: ${focus}` : ""}. Data: ${JSON.stringify(data ?? {})}. Respond in JSON with keys: summary, key_metrics, trends, risks, opportunities, and recommendations.`
          });
          let result;
          try {
            result = JSON.parse(response.text || "{}");
          } catch (_parseError) {
            result = {
              error: "Failed to parse AI response",
              summary: "Analysis completed but response parsing failed",
              parsed_content: response.text
            };
          }
          memoryService.recordChatInteraction(
            userId,
            sessionId,
            `Business intelligence request - focus: ${String(focus ?? "").slice(0, 100)}`,
            `Summary: ${result.summary?.slice(0, 100) || "N/A"}`,
            { endpoint: "business-intelligence", tokensUsed: response.usage.totalTokens }
          ).catch(() => {
          });
          return { statusCode: 200, headers, body: JSON.stringify(result) };
        } catch (error) {
          console.error("Business intelligence error:", error);
          return {
            statusCode: 503,
            headers,
            body: JSON.stringify({
              error: "Analysis failed",
              summary: "Business intelligence temporarily unavailable."
            })
          };
        }
      }
      if (pathParts.length >= 2 && pathParts[0] === "googleai" && pathParts[1] === "test" && httpMethod === "POST") {
        const userId = event.headers["x-user-id"] || event.headers["x-forwarded-for"] || "anonymous";
        const sessionId = event.headers["x-session-id"] || `session-${Date.now()}`;
        const { prompt } = JSON.parse(body);
        try {
          const response = await callGoogleAI(prompt || "Generate a business insight in one sentence.");
          memoryService.recordChatInteraction(
            userId,
            sessionId,
            `Google AI test request - prompt: ${prompt?.slice(0, 100)}`,
            `Response: ${response?.slice(0, 100)}`,
            { endpoint: "googleai/test", provider: "gemini" }
          ).catch(() => {
          });
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              model: "gemini-1.5-flash",
              output: response,
              message: "Google AI working perfectly!"
            })
          };
        } catch (error) {
          memoryService.recordObservation(
            userId,
            "error",
            `Google AI test failed: ${error instanceof Error ? error.message : String(error)}`,
            { endpoint: "googleai/test", sessionId }
          ).catch(() => {
          });
          return {
            statusCode: 503,
            headers,
            body: JSON.stringify({
              error: "Google AI test failed",
              message: error instanceof Error ? error.message : "Service unavailable"
            })
          };
        }
      }
      if (pathParts.length >= 3 && pathParts[0] === "openai" && pathParts[1] === "test-gpt5-direct" && httpMethod === "POST") {
        const userId = event.headers["x-user-id"] || event.headers["x-forwarded-for"] || "anonymous";
        const sessionId = event.headers["x-session-id"] || `session-${Date.now()}`;
        if (!openai) {
          memoryService.recordObservation(
            userId,
            "system_event",
            "OpenAI not configured - test-gpt5-direct endpoint called",
            { sessionId }
          ).catch(() => {
          });
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
              error: "OpenAI API key not configured",
              message: "Please configure OpenAI API key for testing"
            })
          };
        }
        try {
          const response = await respondText({
            tier: "fast",
            effort: "none",
            maxOutputTokens: 50,
            input: "Generate a business insight about CRM efficiency in exactly 1 sentence."
          });
          const output = response.text;
          memoryService.recordChatInteraction(
            userId,
            sessionId,
            "Direct GPT test request",
            `Test response: ${output?.slice(0, 100) || "N/A"}`,
            { endpoint: "test-gpt5-direct", model: tierModel("fast"), tokensUsed: response.usage.totalTokens }
          ).catch(() => {
          });
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              model: tierModel("fast"),
              output,
              message: "AI working perfectly!"
            })
          };
        } catch (error) {
          console.error("Test GPT5 direct error:", error);
          memoryService.recordObservation(
            userId,
            "error",
            `Test GPT5 direct failed: ${error instanceof Error ? error.message : String(error)}`,
            { endpoint: "test-gpt5-direct", sessionId }
          ).catch(() => {
          });
          return {
            statusCode: 503,
            headers,
            body: JSON.stringify({
              error: "Test failed",
              message: "AI service temporarily unavailable"
            })
          };
        }
      }
      if (pathParts.length === 1 && pathParts[0] === "respond" && httpMethod === "POST") {
        const userId = event.headers["x-user-id"] || event.headers["x-forwarded-for"] || "anonymous";
        const sessionId = event.headers["x-session-id"] || `session-${Date.now()}`;
        const {
          prompt,
          imageUrl,
          schema,
          useThinking,
          temperature = 0.4,
          max_output_tokens = 2048,
          forceToolName
        } = JSON.parse(body);
        if (!openai) {
          memoryService.recordObservation(
            userId,
            "system_event",
            "OpenAI not configured - respond endpoint called",
            { sessionId, prompt: prompt?.slice(0, 200) }
          ).catch(() => {
          });
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
              error: "OpenAI API key not configured",
              message: "Please configure OpenAI API key for AI features"
            })
          };
        }
        memoryService.recordObservation(
          userId,
          "user_prompt",
          imageUrl ? `${prompt}
[Image: ${imageUrl}]` : prompt,
          { sessionId, endpoint: "respond", hasImage: !!imageUrl, schema: !!schema }
        ).catch(() => {
        });
        const input = imageUrl ? [
          {
            role: "user",
            content: [
              { type: "input_text", text: prompt },
              { type: "input_image", image_url: imageUrl }
            ]
          }
        ] : prompt;
        const wlTools = [
          {
            type: "function",
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
          },
          {
            type: "function",
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
        ];
        const runTool = (name) => async (args) => {
          const output = await executeWLTool({ function: { name, arguments: JSON.stringify(args ?? {}) } });
          memoryService.recordObservation(
            userId,
            "tool_use",
            `Tool result: ${output?.slice(0, 200) || "empty"}`,
            { sessionId, endpoint: "respond", tool: name }
          ).catch(() => {
          });
          return output;
        };
        const result = await respondWithTools({
          tier: useThinking ? "deep" : "fast",
          effort: "none",
          temperature,
          maxOutputTokens: max_output_tokens,
          json: schema ? true : void 0,
          instructions: "You are a helpful sales + ops assistant for white-label CRM applications.",
          input,
          tools: wlTools,
          toolChoice: forceToolName ? { type: "function", name: forceToolName } : "auto",
          handlers: {
            analyzeBusinessData: runTool("analyzeBusinessData"),
            generateRecommendations: runTool("generateRecommendations")
          }
        });
        const hadToolCalls = result.toolCalls.length > 0;
        if (hadToolCalls) {
          memoryService.recordObservation(
            userId,
            "tool_use",
            `Tools invoked: ${result.toolCalls.map((tc) => tc.name).join(", ")}`,
            { sessionId, endpoint: "respond", toolCalls: result.toolCalls.map((tc) => tc.name) }
          ).catch(() => {
          });
        }
        memoryService.recordChatInteraction(
          userId,
          sessionId,
          `AI respond (${hadToolCalls ? "with tools" : "direct"}) - prompt: ${prompt?.slice(0, 150)}...`,
          `Response: ${result.text?.slice(0, 200) || "N/A"}`,
          {
            endpoint: "respond",
            hadToolCalls,
            toolCount: result.toolCalls.length,
            tokensUsed: result.usage.totalTokens,
            model: result.response?.model
          }
        ).catch(() => {
        });
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            output_text: result.text,
            output: [{ content: [{ type: "output_text", text: result.text }] }],
            model: result.response?.model,
            usage: result.response?.usage,
            ...hadToolCalls ? { tool_calls: result.toolCalls, continued: true } : {}
          })
        };
      }
    }
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: "OpenAI endpoint not found" })
    };
  } catch (error) {
    console.error("OpenAI function error:", error);
    memoryService.recordObservation(
      "system",
      "error",
      `OpenAI handler error: ${error instanceof Error ? error.message : String(error)}`,
      {
        path: event.path,
        httpMethod,
        headers: { "x-user-id": event.headers["x-user-id"], "x-session-id": event.headers["x-session-id"] }
      }
    ).catch(() => {
    });
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : String(error)
      })
    };
  }
};
async function executeWLTool(tc) {
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
        recommendations: goals?.map(
          (goal, i) => `For ${goal}: Action ${i + 1} considering ${constraints?.[i] || "no constraints"}`
        ) || [],
        context
      });
    }
    return JSON.stringify({ ok: false, error: `Unknown tool: ${name}` });
  } catch (e) {
    return JSON.stringify({ ok: false, error: e instanceof Error ? e.message : "Tool error" });
  }
}
export {
  handler
};
