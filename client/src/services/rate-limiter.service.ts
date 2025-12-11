/**
 * Rate Limiter Service
 * Implements rate limiting for API calls to prevent abuse and respect API limits
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiterService {
  private limiters = new Map<string, Map<string, RateLimitEntry>>();
  
  constructor() {
    // Cleanup expired entries every minute
    setInterval(() => this.cleanup(), 60000);
  }
  
  private getKey(identifier: string, endpoint: string): string {
    return `${identifier}:${endpoint}`;
  }
  
  private getLimiter(limiterId: string): Map<string, RateLimitEntry> {
    if (!this.limiters.has(limiterId)) {
      this.limiters.set(limiterId, new Map());
    }
    return this.limiters.get(limiterId)!;
  }
  
  private cleanup(): void {
    const now = Date.now();
    
    for (const [limiterId, limiter] of this.limiters.entries()) {
      for (const [key, entry] of limiter.entries()) {
        if (now > entry.resetTime) {
          limiter.delete(key);
        }
      }
      
      // Remove empty limiters
      if (limiter.size === 0) {
        this.limiters.delete(limiterId);
      }
    }
  }
  
  async checkLimit(
    limiterId: string,
    identifier: string,
    endpoint: string,
    config: RateLimitConfig
  ): Promise<{ allowed: boolean; resetTime: number; remaining: number }> {
    const limiter = this.getLimiter(limiterId);
    const key = this.getKey(identifier, endpoint);
    const now = Date.now();
    const resetTime = now + config.windowMs;
    
    let entry = limiter.get(key);
    
    // Create new entry if doesn't exist or if window has expired
    if (!entry || now > entry.resetTime) {
      entry = {
        count: 0,
        resetTime,
      };
      limiter.set(key, entry);
    }
    
    const allowed = entry.count < config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - entry.count);
    
    if (allowed) {
      entry.count++;
    }
    
    return {
      allowed,
      resetTime: entry.resetTime,
      remaining,
    };
  }
}

export const rateLimiter = new RateLimiterService();