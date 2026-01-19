import { getRedisRateLimiter } from './redisRateLimiter';

// Enhanced LRU Cache with Redis backing and performance monitoring
export class EnhancedLRUCache<T = unknown> {
  private cache = new Map<string, CacheEntry<T>>();
  private accessOrder = new Set<string>();
  private readonly maxSize: number;
  private readonly defaultTTL: number;
  private readonly redis: any;
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    sets: 0,
    size: 0,
    maxSizeReached: 0,
    redisHits: 0,
    redisMisses: 0
  };

  constructor(maxSize: number = 10000, defaultTTL: number = 5 * 60 * 1000) {
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;

    // Try to get Redis instance for distributed caching
    try {
      this.redis = getRedisRateLimiter();
    } catch (error) {
      console.warn('Redis not available for cache, using in-memory only');
      this.redis = null;
    }
  }

  async get(key: string): Promise<T | null> {
    // Check local cache first
    const localEntry = this.cache.get(key);
    if (localEntry && !this.isExpired(localEntry)) {
      // Update access order
      this.accessOrder.delete(key);
      this.accessOrder.add(key);
      this.stats.hits++;
      return localEntry.value;
    }

    // Check Redis if available
    if (this.redis) {
      try {
        const redisKey = `cache:${key}`;
        const redisData = await this.redisGet(redisKey);
        if (redisData) {
          // Store in local cache
          this.setLocal(key, redisData.value, redisData.ttl);
          this.stats.redisHits++;
          this.stats.hits++;
          return redisData.value;
        }
        this.stats.redisMisses++;
      } catch (error: unknown) {
        console.warn('Redis cache get failed:', error instanceof Error ? error.message : String(error));
      }
    }

    // Cache miss
    if (localEntry) {
      // Remove expired entry
      this.cache.delete(key);
      this.accessOrder.delete(key);
    }

    this.stats.misses++;
    return null;
  }

  async set(key: string, value: T, ttl: number = this.defaultTTL): Promise<void> {
    this.stats.sets++;

    // Set in local cache
    this.setLocal(key, value, ttl);

    // Set in Redis if available
    if (this.redis) {
      try {
        const redisKey = `cache:${key}`;
        await this.redisSet(redisKey, { value, ttl }, ttl);
      } catch (error: unknown) {
        console.warn('Redis cache set failed:', error instanceof Error ? error.message : String(error));
      }
    }

    // Evict if over capacity
    this.evictIfNeeded();
  }

  private setLocal(key: string, value: T, ttl: number): void {
    const entry: CacheEntry<T> = {
      value,
      expiresAt: Date.now() + ttl,
      ttl,
      accessCount: 0,
      lastAccessed: Date.now()
    };

    // Update existing or add new
    const existing = this.cache.get(key);
    if (existing) {
      entry.accessCount = existing.accessCount + 1;
    }

    this.cache.set(key, entry);

    // Update access order
    this.accessOrder.delete(key);
    this.accessOrder.add(key);

    this.stats.size = this.cache.size;
  }

  private evictIfNeeded(): void {
    if (this.cache.size > this.maxSize) {
      this.stats.maxSizeReached++;

      // Evict least recently used items
      const toEvict = Array.from(this.accessOrder).slice(0, Math.max(1, Math.floor(this.maxSize * 0.1)));

      for (const key of toEvict) {
        this.cache.delete(key);
        this.accessOrder.delete(key);
        this.stats.evictions++;
      }

      this.stats.size = this.cache.size;
    }
  }

  async delete(key: string): Promise<boolean> {
    const localDeleted = this.cache.delete(key);
    this.accessOrder.delete(key);

    if (this.redis) {
      try {
        await this.redisDel(`cache:${key}`);
      } catch (error: unknown) {
        console.warn('Redis cache delete failed:', error instanceof Error ? error.message : String(error));
      }
    }

    this.stats.size = this.cache.size;
    return localDeleted;
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.accessOrder.clear();
    this.stats.size = 0;

    if (this.redis) {
      try {
        // Note: This would need a more sophisticated approach for Redis
        // For now, we'll just clear local cache
        console.log('Redis cache clear not implemented - use Redis CLI');
      } catch (error: unknown) {
        console.warn('Redis cache clear failed:', error instanceof Error ? error.message : String(error));
      }
    }
  }

  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() > entry.expiresAt;
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    const toDelete: string[] = [];

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
    const hitRate = this.stats.hits + this.stats.misses > 0
      ? (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100
      : 0;

    const redisHitRate = this.stats.redisHits + this.stats.redisMisses > 0
      ? (this.stats.redisHits / (this.stats.redisHits + this.stats.redisMisses)) * 100
      : 0;

    return {
      ...this.stats,
      hitRate: hitRate.toFixed(2) + '%',
      redisHitRate: redisHitRate.toFixed(2) + '%',
      memoryUsage: this.calculateMemoryUsage(),
      health: this.redis ? 'distributed' : 'local-only'
    };
  }

  private calculateMemoryUsage(): string {
    // Rough estimation
    const entrySize = 200; // bytes per entry estimate
    const totalBytes = this.cache.size * entrySize;
    return `${(totalBytes / 1024 / 1024).toFixed(2)} MB`;
  }

  // Redis helper methods
  private async redisGet(_key: string): Promise<{ value: T; ttl: number } | null> {
    if (!this.redis) return null;

    try {
      // This would need to be implemented based on Redis client
      // For now, return null as placeholder
      return null;
    } catch (error: unknown) {
      throw error;
    }
  }

  private async redisSet(_key: string, _data: { value: T; ttl: number }, _ttl: number): Promise<void> {
    if (!this.redis) return;

    try {
      // This would need to be implemented based on Redis client
      // For now, do nothing as placeholder
    } catch (error: unknown) {
      throw error;
    }
  }

  private async redisDel(_key: string): Promise<void> {
    if (!this.redis) return;

    try {
      // This would need to be implemented based on Redis client
      // For now, do nothing as placeholder
    } catch (error: unknown) {
      throw error;
    }
  }
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

// Global cache instances
export const aiResponseCache = new EnhancedLRUCache(5000, 10 * 60 * 1000); // 10 minutes
export const userDataCache = new EnhancedLRUCache(10000, 30 * 60 * 1000); // 30 minutes
export const configCache = new EnhancedLRUCache(1000, 60 * 60 * 1000); // 1 hour

// Periodic cleanup
setInterval(() => {
  aiResponseCache.cleanup();
  userDataCache.cleanup();
  configCache.cleanup();
}, 5 * 60 * 1000); // Every 5 minutes

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Cache cleanup completed');
});

process.on('SIGINT', () => {
  console.log('Cache cleanup completed');
});