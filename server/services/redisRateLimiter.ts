import Redis from 'ioredis';

// Extend global type for fallback store
declare global {
  var fallbackRateLimitStore: Map<string, { count: number; resetTime: number }> | undefined;
}

// Redis-based Distributed Rate Limiter
export class RedisRateLimiter {
  private redis: Redis;
  private readonly keyPrefix = 'rate_limit:';

  constructor(redisUrl?: string) {
    this.redis = new Redis(redisUrl || process.env.REDIS_URL || 'redis://localhost:6379', {
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      reconnectOnError: (err) => {
        console.warn('Redis connection error:', err.message);
        return err.message.includes('READONLY');
      }
    });

    this.redis.on('error', (err) => {
      console.error('Redis connection error:', err);
    });

    this.redis.on('connect', () => {
      console.log('✅ Redis connected for rate limiting');
    });
  }

  async checkLimit(
    key: string,
    maxRequests: number,
    windowMs: number,
    identifier?: string
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number; totalRequests: number }> {
    const redisKey = `${this.keyPrefix}${key}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    try {
      // Use Redis pipeline for atomic operations
      const pipeline = this.redis.pipeline();

      // Remove old entries outside the window
      pipeline.zremrangebyscore(redisKey, 0, windowStart);

      // Count remaining requests in window
      pipeline.zcard(redisKey);

      // Add current request timestamp
      pipeline.zadd(redisKey, now, `${now}:${identifier || 'req'}`);

      // Set expiry on the key (window + buffer)
      pipeline.pexpire(redisKey, windowMs + 60000); // +1 minute buffer

      const results = await pipeline.exec();

      if (!results) {
        throw new Error('Redis pipeline execution failed');
      }

      const requestCount = results[1][1] as number;

      // Check if limit exceeded (requestCount includes current request)
      const allowed = requestCount <= maxRequests;
      const remaining = Math.max(0, maxRequests - requestCount + 1); // +1 because we already added current request
      const resetTime = now + windowMs;

      return {
        allowed,
        remaining,
        resetTime,
        totalRequests: requestCount
      };

    } catch (error) {
      console.error('Redis rate limit check failed:', error);

      // Fallback to in-memory if Redis fails
      return this.fallbackCheckLimit(key, maxRequests, windowMs);
    }
  }

  async getUsageStats(key: string, windowMs: number): Promise<{
    currentRequests: number;
    remainingRequests: number;
    resetTime: number;
    windowStart: number;
  }> {
    const redisKey = `${this.keyPrefix}${key}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    try {
      const pipeline = this.redis.pipeline();
      pipeline.zremrangebyscore(redisKey, 0, windowStart);
      pipeline.zcard(redisKey);
      pipeline.zrange(redisKey, 0, -1, 'WITHSCORES');

      const results = await pipeline.exec();

      if (!results) return { currentRequests: 0, remainingRequests: 0, resetTime: now + windowMs, windowStart };

      const currentRequests = results[1][1] as number;
      const resetTime = now + windowMs;

      return {
        currentRequests,
        remainingRequests: Math.max(0, 100 - currentRequests), // Assuming 100 max for stats
        resetTime,
        windowStart
      };

    } catch (error) {
      console.error('Redis usage stats failed:', error);
      return { currentRequests: 0, remainingRequests: 100, resetTime: now + windowMs, windowStart };
    }
  }

  async resetLimit(key: string): Promise<boolean> {
    try {
      const redisKey = `${this.keyPrefix}${key}`;
      await this.redis.del(redisKey);
      return true;
    } catch (error) {
      console.error('Redis reset limit failed:', error);
      return false;
    }
  }

  async cleanup(): Promise<void> {
    try {
      await this.redis.quit();
    } catch (error) {
      console.error('Redis cleanup error:', error);
    }
  }

  // Fallback in-memory implementation
  private fallbackCheckLimit(
    key: string,
    maxRequests: number,
    windowMs: number
  ): { allowed: boolean; remaining: number; resetTime: number; totalRequests: number } {
    if (!global.fallbackRateLimitStore) {
      global.fallbackRateLimitStore = new Map();
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
  async healthCheck(): Promise<boolean> {
    try {
      await this.redis.ping();
      return true;
    } catch (error: unknown) {
      console.warn('Redis health check failed:', error instanceof Error ? error.message : String(error));
      return false;
    }
  }
}

// Global instance
let redisRateLimiter: RedisRateLimiter;

export function getRedisRateLimiter(): RedisRateLimiter {
  if (!redisRateLimiter) {
    redisRateLimiter = new RedisRateLimiter();
  }
  return redisRateLimiter;
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  if (redisRateLimiter) {
    await redisRateLimiter.cleanup();
  }
});

process.on('SIGINT', async () => {
  if (redisRateLimiter) {
    await redisRateLimiter.cleanup();
  }
});