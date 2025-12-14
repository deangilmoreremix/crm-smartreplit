import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

// Security headers middleware
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https://api.openai.com", "https://*.supabase.co", "wss:", "ws:"],
      frameSrc: ["'self'", "https://js.stripe.com", "https://hooks.stripe.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow embedding for dashboard
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// CORS configuration
export const corsConfig = cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://smartcrm.vip',
      'https://www.smartcrm.vip',
      'https://app.smartcrm.vip',
      'https://*.netlify.app', // Allow Netlify deployments
      'https://*.vercel.app',  // Allow Vercel deployments
    ];

    // Check if origin matches any allowed pattern
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed.includes('*')) {
        const regex = new RegExp(allowed.replace('*', '.*'));
        return regex.test(origin);
      }
      return origin === allowed;
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-Tenant-ID',
    'X-Webhook-Signature'
  ],
  exposedHeaders: ['X-Rate-Limit-Remaining', 'X-Rate-Limit-Reset']
});

// Rate limiting configurations
export const createRateLimit = (options: {
  windowMs: number;
  max: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: {
      error: 'Too many requests',
      message: options.message || 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil(options.windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    skipFailedRequests: options.skipFailedRequests || false,
    // Use IP address for rate limiting
    keyGenerator: (req) => {
      return req.ip || req.connection.remoteAddress || 'unknown';
    },
    // Custom handler for rate limit exceeded
    handler: (req, res) => {
      console.warn(`Rate limit exceeded for IP: ${req.ip}, Path: ${req.path}`);
      res.status(429).json({
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil(options.windowMs / 1000)
      });
    }
  });
};

// API rate limiting - general API endpoints
export const apiLimiter = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  message: 'Too many API requests. Please try again later.'
});

// Strict rate limiting for authentication endpoints
export const authLimiter = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  message: 'Too many authentication attempts. Please try again later.',
  skipFailedRequests: false
});

// AI endpoints rate limiting (more restrictive due to costs)
export const aiLimiter = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 AI requests per minute
  message: 'AI request limit exceeded. Please wait before making another request.',
  skipSuccessfulRequests: false
});

// File upload rate limiting
export const uploadLimiter = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 uploads per minute
  message: 'Upload limit exceeded. Please wait before uploading again.'
});

// Admin endpoints rate limiting (most restrictive)
export const adminLimiter = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 admin requests per minute
  message: 'Admin request limit exceeded.'
});

// Webhook rate limiting (very permissive for reliability)
export const webhookLimiter = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1000, // 1000 webhook calls per minute
  message: 'Webhook rate limit exceeded.',
  skipSuccessfulRequests: true // Don't count successful webhooks
});

// Health check endpoint (no rate limiting)
export const healthLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10000, // Very permissive for health checks
  standardHeaders: false,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  skipFailedRequests: true
});

// Request logging middleware (for security monitoring)
export const requestLogger = (req: any, res: any, next: any) => {
  const start = Date.now();
  const originalSend = res.send;

  // Log request
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - IP: ${req.ip}`);

  // Override res.send to log response
  res.send = function(data: any) {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;

    // Log security-relevant information
    if (statusCode >= 400) {
      console.warn(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${statusCode} - ${duration}ms - IP: ${req.ip}`);
    } else if (req.path.includes('/api/') && !req.path.includes('/health')) {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${statusCode} - ${duration}ms`);
    }

    originalSend.call(this, data);
  };

  next();
};

// Input sanitization middleware
export const sanitizeInput = (req: any, res: any, next: any) => {
  // Recursively sanitize string inputs
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      // Basic XSS prevention - remove script tags and dangerous HTML
      return obj.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
                .replace(/javascript:/gi, '')
                .replace(/on\w+\s*=/gi, '')
                .trim();
    } else if (Array.isArray(obj)) {
      return obj.map(sanitize);
    } else if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitize(value);
      }
      return sanitized;
    }
    return obj;
  };

  // Sanitize request body, query, and params
  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  if (req.params) req.params = sanitize(req.params);

  next();
};

// Request size limiting
export const requestSizeLimit = (req: any, res: any, next: any) => {
  // Check content length header
  const contentLength = parseInt(req.headers['content-length']);
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (contentLength && contentLength > maxSize) {
    return res.status(413).json({
      error: 'Request too large',
      message: 'Request body exceeds maximum allowed size (10MB)'
    });
  }

  next();
};