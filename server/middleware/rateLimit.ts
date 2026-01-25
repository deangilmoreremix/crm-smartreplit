/**
 * Rate Limiting Middleware
 * Protects against abuse and ensures fair resource usage
 */

import rateLimit from 'express-rate-limit';
import { errorLogger } from '../services/errorLogger';

// Rate limit configurations for different endpoints
export const rateLimitConfigs = {
  // General API rate limit
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: {
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: 900 // 15 minutes in seconds
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: any, res: any) => {
      errorLogger.logError('Rate limit exceeded', new Error('API rate limit exceeded'), {
        ip: req.ip,
        userAgent: req.get('user-agent'),
        endpoint: req.path,
        method: req.method
      });

      res.status(429).json({
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
      });
    }
  },

  // Authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 auth attempts per window
    message: {
      error: 'Too many authentication attempts',
      message: 'Too many login attempts. Please try again later.',
      retryAfter: 900
    },
    skipSuccessfulRequests: true, // Don't count successful logins
    handler: (req: any, res: any) => {
      errorLogger.logError('Auth rate limit exceeded', new Error('Authentication rate limit exceeded'), {
        ip: req.ip,
        endpoint: req.path
      });

      res.status(429).json({
        error: 'Too many authentication attempts',
        message: 'Too many login attempts. Please try again later.',
        retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
      });
    }
  },

  // AI endpoints (expensive operations)
  ai: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // 50 AI requests per hour
    message: {
      error: 'AI rate limit exceeded',
      message: 'Too many AI requests. Please try again later.',
      retryAfter: 3600
    },
    handler: (req: any, res: any) => {
      errorLogger.logError('AI rate limit exceeded', new Error('AI rate limit exceeded'), {
        ip: req.ip,
        userId: req.session?.userId,
        endpoint: req.path
      });

      res.status(429).json({
        error: 'AI rate limit exceeded',
        message: 'Too many AI requests. Please try again later.',
        retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
      });
    }
  },

  // File upload endpoints
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // 20 uploads per hour
    message: {
      error: 'Upload rate limit exceeded',
      message: 'Too many file uploads. Please try again later.',
      retryAfter: 3600
    },
    handler: (req: any, res: any) => {
      errorLogger.logError('Upload rate limit exceeded', new Error('Upload rate limit exceeded'), {
        ip: req.ip,
        userId: req.session?.userId,
        endpoint: req.path
      });

      res.status(429).json({
        error: 'Upload rate limit exceeded',
        message: 'Too many file uploads. Please try again later.',
        retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
      });
    }
  },

  // Admin endpoints
  admin: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // 200 admin requests per window
    message: {
      error: 'Admin rate limit exceeded',
      message: 'Too many admin requests. Please try again later.',
      retryAfter: 900
    }
  },

  // Webhook endpoints
  webhook: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 1000, // 1000 webhook calls per hour
    message: {
      error: 'Webhook rate limit exceeded',
      message: 'Too many webhook calls.',
      retryAfter: 3600
    }
  }
};

// Create rate limiters
export const apiLimiter = rateLimit(rateLimitConfigs.api);
export const authLimiter = rateLimit(rateLimitConfigs.auth);
export const aiLimiter = rateLimit(rateLimitConfigs.ai);
export const uploadLimiter = rateLimit(rateLimitConfigs.upload);
export const adminLimiter = rateLimit(rateLimitConfigs.admin);
export const webhookLimiter = rateLimit(rateLimitConfigs.webhook);

// Per-tenant rate limiting (more sophisticated)
export class TenantRateLimiter {
  private tenantLimits = new Map<string, { requests: number; resetTime: number }>();

  checkLimit(tenantId: string, maxRequests: number = 100, windowMs: number = 15 * 60 * 1000): boolean {
    const now = Date.now();
    const tenantData = this.tenantLimits.get(tenantId);

    if (!tenantData || now > tenantData.resetTime) {
      // Reset or initialize
      this.tenantLimits.set(tenantId, {
        requests: 1,
        resetTime: now + windowMs
      });
      return true;
    }

    if (tenantData.requests >= maxRequests) {
      return false;
    }

    tenantData.requests++;
    return true;
  }

  getRemainingRequests(tenantId: string, maxRequests: number = 100): number {
    const tenantData = this.tenantLimits.get(tenantId);
    if (!tenantData) return maxRequests;
    return Math.max(0, maxRequests - tenantData.requests);
  }

  getResetTime(tenantId: string): number {
    const tenantData = this.tenantLimits.get(tenantId);
    return tenantData ? tenantData.resetTime : 0;
  }
}

// Export singleton instance
export const tenantRateLimiter = new TenantRateLimiter();

// Middleware for tenant-specific rate limiting
export const createTenantRateLimit = (maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) => {
  return (req: any, res: any, next: any) => {
    // Extract tenant ID from request (could be from subdomain, header, etc.)
    const tenantId = req.tenantId || req.params.tenantId || 'default';

    if (!tenantRateLimiter.checkLimit(tenantId, maxRequests, windowMs)) {
      const resetTime = tenantRateLimiter.getResetTime(tenantId);
      const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);

      errorLogger.logError('Tenant rate limit exceeded', new Error('Tenant rate limit exceeded'), {
        tenantId,
        ip: req.ip,
        endpoint: req.path
      });

      return res.status(429).json({
        error: 'Tenant rate limit exceeded',
        message: 'Too many requests for this tenant. Please try again later.',
        retryAfter
      });
    }

    // Add rate limit headers
    const remaining = tenantRateLimiter.getRemainingRequests(tenantId, maxRequests);
    res.set({
      'X-RateLimit-Limit': maxRequests.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': tenantRateLimiter.getResetTime(tenantId).toString()
    });

    next();
  };
};

// Burst rate limiting for critical operations
export class BurstRateLimiter {
  private requests = new Map<string, number[]>();

  checkBurst(key: string, maxRequests: number = 10, windowMs: number = 1000): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get existing requests for this key
    let requestTimes = this.requests.get(key) || [];

    // Remove old requests outside the window
    requestTimes = requestTimes.filter(time => time > windowStart);

    // Check if under limit
    if (requestTimes.length >= maxRequests) {
      return false;
    }

    // Add current request
    requestTimes.push(now);
    this.requests.set(key, requestTimes);

    return true;
  }
}

// Export burst rate limiter
export const burstRateLimiter = new BurstRateLimiter();

// Middleware for burst rate limiting
export const createBurstRateLimit = (maxRequests: number = 10, windowMs: number = 1000) => {
  return (req: any, res: any, next: any) => {
    const key = req.ip + ':' + req.path;

    if (!burstRateLimiter.checkBurst(key, maxRequests, windowMs)) {
      errorLogger.logError('Burst rate limit exceeded', new Error('Burst rate limit exceeded'), {
        ip: req.ip,
        endpoint: req.path,
        method: req.method
      });

      return res.status(429).json({
        error: 'Burst rate limit exceeded',
        message: 'Too many rapid requests. Please slow down.',
        retryAfter: 1
      });
    }

    next();
  };
};