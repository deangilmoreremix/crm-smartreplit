import { Request, Response, NextFunction } from 'express';

// Simple in-memory rate limiter (for production, use Redis or similar)
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export function createRateLimit(windowMs: number = 15 * 60 * 1000, maxRequests: number = 100) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean up old entries
    for (const [k, entry] of rateLimitStore.entries()) {
      if (entry.resetTime < windowStart) {
        rateLimitStore.delete(k);
      }
    }

    const entry = rateLimitStore.get(key);

    if (!entry || entry.resetTime < windowStart) {
      // First request in window or window expired
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      next();
    } else if (entry.count < maxRequests) {
      // Within limit
      entry.count++;
      next();
    } else {
      // Rate limit exceeded
      const resetTime = Math.ceil((entry.resetTime - now) / 1000);
      res.status(429).json({
        error: 'Too many requests',
        message: `Rate limit exceeded. Try again in ${resetTime} seconds.`,
        retryAfter: resetTime
      });
    }
  };
}

// Specific rate limits for different endpoints
export const adminRateLimit = createRateLimit(15 * 60 * 1000, 50); // 50 requests per 15 minutes for admin endpoints
export const apiRateLimit = createRateLimit(15 * 60 * 1000, 200); // 200 requests per 15 minutes for general API
export const authRateLimit = createRateLimit(15 * 60 * 1000, 10); // 10 requests per 15 minutes for auth endpoints