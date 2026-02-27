/**
 * Simplified LRU Cache - In-memory caching with TTL support
 * No external dependencies, works standalone
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

export class LRUCache<T = unknown> {
  private cache = new Map<string, CacheEntry<T>>();
  private accessOrder = new Set<string>();
  private readonly maxSize: number;
  private readonly defaultTTL: number;
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    sets: 0,
    size: 0,
    maxSizeReached: 0,
  };

  constructor(maxSize: number = 10000, defaultTTL: number = 5 * 60 * 1000) {
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;

    // Periodic cleanup of expired entries
    if (typeof setInterval !== 'undefined') {
      setInterval(() => this.cleanup(), 5 * 60 * 1000);
    }
  }

  async get(key: string): Promise<T | null> {
    const entry = this.cache.get(key);

    if (entry && !this.isExpired(entry)) {
      // Update access order
      this.accessOrder.delete(key);
      this.accessOrder.add(key);
      this.stats.hits++;
      return entry.value;
    }

    // Remove expired entry
    if (entry) {
      this.cache.delete(key);
      this.accessOrder.delete(key);
    }

    this.stats.misses++;
    return null;
  }

  async set(key: string, value: T, ttl?: number): Promise<void> {
    this.stats.sets++;

    const ttlMs = ttl ?? this.defaultTTL;
    const entry: CacheEntry<T> = {
      value,
      expiresAt: Date.now() + ttlMs,
      ttl: ttlMs,
      accessCount: 0,
      lastAccessed: Date.now(),
    };

    // Update existing or add new
    const existing = this.cache.get(key);
    if (existing) {
      entry.accessCount = existing.accessCount + 1;
    }

    this.cache.set(key, entry);
    this.accessOrder.delete(key);
    this.accessOrder.add(key);
    this.stats.size = this.cache.size;

    // Evict if over capacity
    this.evictIfNeeded();
  }

  async delete(key: string): Promise<boolean> {
    const deleted = this.cache.delete(key);
    this.accessOrder.delete(key);
    this.stats.size = this.cache.size;
    return deleted;
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.accessOrder.clear();
    this.stats.size = 0;
  }

  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() > entry.expiresAt;
  }

  private evictIfNeeded(): void {
    if (this.cache.size > this.maxSize) {
      this.stats.maxSizeReached++;

      // Evict 10% of items (LRU)
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
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;

    return {
      ...this.stats,
      hitRate: hitRate.toFixed(2) + '%',
      memoryUsage: `${(this.cache.size * 0.2).toFixed(2)} KB`, // Rough estimate
    };
  }
}

// Pre-instantiated cache instances for common use cases
export const aiResponseCache = new LRUCache(5000, 10 * 60 * 1000); // 10 min
export const userDataCache = new LRUCache(10000, 30 * 60 * 1000); // 30 min
export const configCache = new LRUCache(1000, 60 * 60 * 1000); // 1 hour
