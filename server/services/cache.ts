/**
 * Redis Caching Layer
 * Provides high-performance caching for production workloads
 */

import { createClient, RedisClientType } from 'redis';
import { errorLogger } from './errorLogger';

export interface CacheConfig {
  url: string;
  ttl: number; // Default TTL in seconds
  maxRetries: number;
  retryDelay: number;
  keyPrefix: string;
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
  hitRate: number;
}

class CacheManager {
  private static instance: CacheManager;
  private client: RedisClientType;
  private config: CacheConfig;
  private isConnected: boolean = false;

  // Statistics
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    errors: 0
  };

  constructor() {
    this.config = {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      ttl: parseInt(process.env.CACHE_TTL || '300'), // 5 minutes default
      maxRetries: parseInt(process.env.CACHE_MAX_RETRIES || '3'),
      retryDelay: parseInt(process.env.CACHE_RETRY_DELAY || '1000'),
      keyPrefix: process.env.CACHE_KEY_PREFIX || 'smartcrm:'
    };

    this.client = createClient({
      url: this.config.url,
      socket: {
        connectTimeout: 5000,
        lazyConnect: true
      },
      retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          console.error('Redis connection refused');
          return new Error('Redis server connection refused');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
          console.error('Redis retry time exhausted');
          return new Error('Retry time exhausted');
        }
        if (options.attempt > this.config.maxRetries) {
          return undefined; // Stop retrying
        }
        return Math.min(options.attempt * this.config.retryDelay, 3000);
      }
    });

    this.setupEventHandlers();
    this.connect();
  }

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  private setupEventHandlers(): void {
    this.client.on('connect', () => {
      console.log('Redis cache connected');
      this.isConnected = true;
    });

    this.client.on('ready', () => {
      console.log('Redis cache ready');
    });

    this.client.on('error', (err) => {
      console.error('Redis cache error:', err);
      this.isConnected = false;
      errorLogger.logError('Redis cache error', err);
    });

    this.client.on('end', () => {
      console.log('Redis cache connection ended');
      this.isConnected = false;
    });
  }

  private async connect(): Promise<void> {
    try {
      await this.client.connect();
    } catch (error: any) {
      console.error('Failed to connect to Redis:', error.message);
      this.isConnected = false;
      // Don't throw - cache should be optional
    }
  }

  /**
   * Generate cache key with prefix
   */
  private getKey(key: string): string {
    return `${this.config.keyPrefix}${key}`;
  }

  /**
   * Get value from cache
   */
  async get<T = any>(key: string): Promise<T | null> {
    if (!this.isConnected) {
      return null;
    }

    try {
      const value = await this.client.get(this.getKey(key));
      if (value) {
        this.stats.hits++;
        return JSON.parse(value);
      } else {
        this.stats.misses++;
        return null;
      }
    } catch (error: any) {
      this.stats.errors++;
      console.error('Cache get error:', error.message);
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set<T = any>(
    key: string,
    value: T,
    ttl: number = this.config.ttl
  ): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    try {
      const serialized = JSON.stringify(value);
      await this.client.setEx(this.getKey(key), ttl, serialized);
      this.stats.sets++;
      return true;
    } catch (error: any) {
      this.stats.errors++;
      console.error('Cache set error:', error.message);
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    try {
      await this.client.del(this.getKey(key));
      this.stats.deletes++;
      return true;
    } catch (error: any) {
      this.stats.errors++;
      console.error('Cache delete error:', error.message);
      return false;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    try {
      const result = await this.client.exists(this.getKey(key));
      return result === 1;
    } catch (error: any) {
      this.stats.errors++;
      console.error('Cache exists error:', error.message);
      return false;
    }
  }

  /**
   * Set multiple values
   */
  async mset(data: Record<string, any>, ttl: number = this.config.ttl): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    try {
      const pipeline = this.client.multi();
      for (const [key, value] of Object.entries(data)) {
        pipeline.setEx(this.getKey(key), ttl, JSON.stringify(value));
      }
      await pipeline.exec();
      this.stats.sets += Object.keys(data).length;
      return true;
    } catch (error: any) {
      this.stats.errors++;
      console.error('Cache mset error:', error.message);
      return false;
    }
  }

  /**
   * Get multiple values
   */
  async mget<T = any>(keys: string[]): Promise<(T | null)[]> {
    if (!this.isConnected) {
      return new Array(keys.length).fill(null);
    }

    try {
      const redisKeys = keys.map(key => this.getKey(key));
      const values = await this.client.mget(redisKeys);

      return values.map((value, index) => {
        if (value) {
          this.stats.hits++;
          try {
            return JSON.parse(value);
          } catch {
            return null;
          }
        } else {
          this.stats.misses++;
          return null;
        }
      });
    } catch (error: any) {
      this.stats.errors++;
      console.error('Cache mget error:', error.message);
      return new Array(keys.length).fill(null);
    }
  }

  /**
   * Set value only if key doesn't exist (atomic)
   */
  async setnx<T = any>(
    key: string,
    value: T,
    ttl: number = this.config.ttl
  ): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    try {
      const result = await this.client.set(this.getKey(key), JSON.stringify(value), {
        NX: true,
        EX: ttl
      });
      if (result) {
        this.stats.sets++;
      }
      return result === 'OK';
    } catch (error: any) {
      this.stats.errors++;
      console.error('Cache setnx error:', error.message);
      return false;
    }
  }

  /**
   * Increment counter
   */
  async incr(key: string, ttl: number = this.config.ttl): Promise<number | null> {
    if (!this.isConnected) {
      return null;
    }

    try {
      const result = await this.client.incr(this.getKey(key));
      // Set TTL if it's a new key
      if (result === 1) {
        await this.client.expire(this.getKey(key), ttl);
      }
      return result;
    } catch (error: any) {
      this.stats.errors++;
      console.error('Cache incr error:', error.message);
      return null;
    }
  }

  /**
   * Get TTL for key
   */
  async ttl(key: string): Promise<number> {
    if (!this.isConnected) {
      return -2; // Key doesn't exist
    }

    try {
      return await this.client.ttl(this.getKey(key));
    } catch (error: any) {
      this.stats.errors++;
      console.error('Cache ttl error:', error.message);
      return -2;
    }
  }

  /**
   * Clear all keys with pattern
   */
  async clearPattern(pattern: string): Promise<number> {
    if (!this.isConnected) {
      return 0;
    }

    try {
      const keys = await this.client.keys(`${this.config.keyPrefix}${pattern}`);
      if (keys.length > 0) {
        await this.client.del(keys);
        this.stats.deletes += keys.length;
      }
      return keys.length;
    } catch (error: any) {
      this.stats.errors++;
      console.error('Cache clear pattern error:', error.message);
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;

    return {
      ...this.stats,
      hitRate
    };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    isHealthy: boolean;
    isConnected: boolean;
    stats: CacheStats;
    info?: any;
  }> {
    const stats = this.getStats();

    if (!this.isConnected) {
      return {
        isHealthy: false,
        isConnected: false,
        stats
      };
    }

    try {
      const info = await this.client.info();
      const ping = await this.client.ping();

      return {
        isHealthy: ping === 'PONG',
        isConnected: this.isConnected,
        stats,
        info: this.parseRedisInfo(info)
      };
    } catch (error: any) {
      return {
        isHealthy: false,
        isConnected: this.isConnected,
        stats
      };
    }
  }

  /**
   * Parse Redis INFO command
   */
  private parseRedisInfo(info: string): Record<string, any> {
    const lines = info.split('\n');
    const result: Record<string, any> = {};

    for (const line of lines) {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        result[key] = value;
      }
    }

    return result;
  }

  /**
   * Graceful shutdown
   */
  async close(): Promise<void> {
    if (this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
      console.log('Cache connection closed');
    }
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0
    };
  }
}

// Export singleton instance
export const cache = CacheManager.getInstance();

// Cache key generators for common patterns
export class CacheKeys {
  static tenant(tenantId: string): string {
    return `tenant:${tenantId}`;
  }

  static theme(tenantId: string): string {
    return `theme:${tenantId}`;
  }

  static domain(domain: string): string {
    return `domain:${domain}`;
  }

  static assets(tenantId: string, category?: string): string {
    return category ? `assets:${tenantId}:${category}` : `assets:${tenantId}`;
  }

  static analytics(tenantId: string, type: string): string {
    return `analytics:${tenantId}:${type}`;
  }

  static user(userId: string): string {
    return `user:${userId}`;
  }

  static session(sessionId: string): string {
    return `session:${sessionId}`;
  }

  static rateLimit(key: string): string {
    return `ratelimit:${key}`;
  }

  static circuitBreaker(name: string): string {
    return `circuit:${name}`;
  }
}

// Cache TTL constants
export const CACHE_TTL = {
  SHORT: 60,      // 1 minute
  MEDIUM: 300,    // 5 minutes
  LONG: 3600,     // 1 hour
  DAY: 86400,     // 1 day
  WEEK: 604800    // 1 week
} as const;

// Cache wrapper for functions
export async function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttl: number = CACHE_TTL.MEDIUM
): Promise<T> {
  // Try to get from cache first
  const cached = await cache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Execute function and cache result
  const result = await fn();
  await cache.set(key, result, ttl);
  return result;
}

// Cache invalidation helpers
export async function invalidateTenantCache(tenantId: string): Promise<void> {
  const patterns = [
    `tenant:${tenantId}`,
    `theme:${tenantId}`,
    `assets:${tenantId}*`,
    `analytics:${tenantId}*`
  ];

  for (const pattern of patterns) {
    await cache.clearPattern(pattern);
  }
}

export async function invalidateUserCache(userId: string): Promise<void> {
  await cache.clearPattern(`user:${userId}`);
  await cache.clearPattern(`session:*`); // Invalidate all sessions (simplified)
}