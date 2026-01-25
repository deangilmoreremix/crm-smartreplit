/**
 * Input Validation Middleware
 * Provides comprehensive input validation using Zod schemas
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { errorLogger } from '../services/errorLogger';

// Common validation schemas
export const schemas = {
  // UUID validation
  uuid: z.string().uuid(),

  // Email validation
  email: z.string().email().max(254),

  // Password validation
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be at most 128 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),

  // Name validation
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be at most 100 characters')
    .regex(/^[a-zA-Z\s\-']+$/, 'Name contains invalid characters'),

  // Domain validation
  domain: z.string()
    .min(1, 'Domain is required')
    .max(253, 'Domain is too long')
    .regex(/^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i, 'Invalid domain format'),

  // Subdomain validation
  subdomain: z.string()
    .regex(/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/, 'Invalid subdomain format')
    .max(63, 'Subdomain is too long'),

  // URL validation
  url: z.string().url().max(2048),

  // File size validation
  fileSize: (maxSize: number) => z.number().max(maxSize, `File size exceeds ${maxSize} bytes`),

  // Color validation (hex)
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),

  // Phone validation
  phone: z.string()
    .regex(/^[\+]?[1-9][\d]{0,15}$/, 'Invalid phone number format')
    .max(20),

  // Tenant plan validation
  tenantPlan: z.enum(['starter', 'professional', 'enterprise']),

  // Tenant type validation
  tenantType: z.enum(['customer', 'partner', 'reseller']),

  // Theme config validation
  themeConfig: z.object({
    colors: z.object({
      primary: z.string().regex(/^#[0-9A-F]{6}$/i),
      secondary: z.string().regex(/^#[0-9A-F]{6}$/i),
      accent: z.string().regex(/^#[0-9A-F]{6}$/i),
      background: z.string().regex(/^#[0-9A-F]{6}$/i),
      surface: z.string().regex(/^#[0-9A-F]{6}$/i),
      text: z.object({
        primary: z.string().regex(/^#[0-9A-F]{6}$/i),
        secondary: z.string().regex(/^#[0-9A-F]{6}$/i),
        disabled: z.string().regex(/^#[0-9A-F]{6}$/i)
      }),
      success: z.string().regex(/^#[0-9A-F]{6}$/i),
      warning: z.string().regex(/^#[0-9A-F]{6}$/i),
      error: z.string().regex(/^#[0-9A-F]{6}$/i),
      info: z.string().regex(/^#[0-9A-F]{6}$/i)
    }),
    typography: z.object({
      fontFamily: z.object({
        primary: z.string().max(100),
        secondary: z.string().max(100),
        monospace: z.string().max(100)
      }),
      fontSize: z.record(z.string().regex(/^\d+(\.\d+)?(rem|px|em)$/)),
      fontWeight: z.record(z.number().min(100).max(900)),
      lineHeight: z.record(z.union([z.number(), z.string()]))
    }),
    spacing: z.record(z.string().regex(/^\d+(\.\d+)?(rem|px|em)$/)),
    borderRadius: z.record(z.string().regex(/^\d+(\.\d+)?(rem|px|em|%)$/)),
    shadows: z.record(z.string()),
    animations: z.object({
      duration: z.record(z.string().regex(/^\d+ms$/)),
      easing: z.record(z.string())
    })
  }),

  // Asset category validation
  assetCategory: z.enum(['logo', 'icon', 'image', 'document', 'video']),

  // Search query validation
  searchQuery: z.string()
    .max(100, 'Search query too long')
    .regex(/^[^<>\"'%;()&+]*$/, 'Search query contains invalid characters'),

  // Pagination validation
  pagination: z.object({
    page: z.number().int().min(1).max(1000).default(1),
    limit: z.number().int().min(1).max(100).default(50)
  }),

  // Date range validation
  dateRange: z.object({
    start: z.string().datetime(),
    end: z.string().datetime()
  }).refine((data) => new Date(data.start) < new Date(data.end), {
    message: 'Start date must be before end date'
  }),

  // Metric type validation
  metricType: z.enum([
    'user_signup', 'user_login', 'contact_created', 'deal_created', 'deal_won',
    'deal_lost', 'task_completed', 'email_sent', 'ai_request', 'file_upload',
    'page_view', 'api_call', 'error_occurred'
  ]),

  // Report config validation
  reportConfig: z.object({
    metrics: z.array(z.string()).min(1).max(20),
    dateRange: z.object({
      start: z.string().datetime(),
      end: z.string().datetime()
    }),
    groupBy: z.enum(['day', 'week', 'month']).optional(),
    filters: z.record(z.any()).optional(),
    charts: z.array(z.object({
      type: z.enum(['line', 'bar', 'pie', 'area']),
      metric: z.string(),
      title: z.string().max(100)
    })).max(10).optional()
  }),

  // Security policy validation
  securityPolicy: z.object({
    policyType: z.enum(['ip_whitelist', 'password_policy', 'session_policy', 'mfa_policy', 'api_access']),
    config: z.record(z.any())
  }),

  // IP whitelist validation
  ipWhitelist: z.object({
    allowedIPs: z.array(z.string().regex(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/)).max(100),
    allowedRanges: z.array(z.string().regex(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}\/(?:[0-9]|[1-2][0-9]|3[0-2])$/)).max(50),
    blockByDefault: z.boolean()
  }),

  // Password policy validation
  passwordPolicy: z.object({
    minLength: z.number().int().min(8).max(128),
    requireUppercase: z.boolean(),
    requireLowercase: z.boolean(),
    requireNumbers: z.boolean(),
    requireSpecialChars: z.boolean(),
    expiryDays: z.number().int().min(30).max(365).optional(),
    preventReuse: z.number().int().min(1).max(10).optional()
  }),

  // Session policy validation
  sessionPolicy: z.object({
    maxDuration: z.number().int().min(5).max(480), // 5 minutes to 8 hours
    idleTimeout: z.number().int().min(5).max(240), // 5 minutes to 4 hours
    requireReauth: z.boolean(),
    singleSessionOnly: z.boolean()
  }),

  // MFA policy validation
  mfaPolicy: z.object({
    required: z.boolean(),
    methods: z.array(z.enum(['totp', 'sms', 'email'])).min(1).max(3),
    gracePeriod: z.number().int().min(1).max(30).optional() // days
  }),

  // API access policy validation
  apiAccessPolicy: z.object({
    enabled: z.boolean(),
    rateLimit: z.number().int().min(1).max(10000),
    allowedIPs: z.array(z.string().regex(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/)).max(100).optional(),
    requireAPIKey: z.boolean()
  })
};

// Validation middleware factory
export const validate = (schema: z.ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      if (req.body && Object.keys(req.body).length > 0) {
        req.body = schema.parse(req.body);
      }

      // Validate query parameters if schema expects them
      if (req.query && Object.keys(req.query).length > 0) {
        // Only validate specific query schemas
        if (schema === schemas.pagination) {
          req.query = schema.parse(req.query);
        }
      }

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        await errorLogger.logError('Validation failed', error, {
          endpoint: req.path,
          method: req.method,
          ip: req.ip,
          errors: error.errors
        });

        return res.status(400).json({
          error: 'Validation failed',
          message: 'Request data does not match expected format',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        });
      }

      // Unknown validation error
      await errorLogger.logError('Unknown validation error', error as Error, {
        endpoint: req.path,
        method: req.method,
        ip: req.ip
      });

      return res.status(400).json({
        error: 'Validation error',
        message: 'Request validation failed'
      });
    }
  };
};

// Specific validation middleware for common use cases
export const validateTenantCreation = validate(z.object({
  name: schemas.name,
  subdomain: schemas.subdomain,
  contactEmail: schemas.email,
  contactName: schemas.name.optional(),
  plan: schemas.tenantPlan,
  type: schemas.tenantType,
  parentPartnerId: schemas.uuid.optional(),
  templateId: schemas.uuid.optional()
}));

export const validateDomainVerification = validate(z.object({
  tenantId: schemas.uuid,
  domain: schemas.domain,
  subdomain: schemas.subdomain.optional(),
  verificationMethod: z.enum(['txt', 'cname', 'http']).default('txt')
}));

export const validateAssetUpload = validate(z.object({
  tenantId: schemas.uuid,
  category: schemas.assetCategory,
  optimize: z.boolean().optional(),
  generateThumbnail: z.boolean().optional(),
  metadata: z.record(z.any()).optional()
}));

export const validateThemeCreation = validate(z.object({
  tenantId: schemas.uuid,
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  config: schemas.themeConfig
}));

export const validateReportCreation = validate(z.object({
  tenantId: schemas.uuid,
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  config: schemas.reportConfig,
  schedule: z.enum(['daily', 'weekly', 'monthly', 'custom', 'manual']),
  recipients: z.array(schemas.email).max(10),
  format: z.enum(['pdf', 'csv', 'excel', 'json'])
}));

export const validateMetricRecording = validate(z.object({
  tenantId: schemas.uuid,
  metricType: schemas.metricType,
  metricValue: z.number().min(0),
  metadata: z.record(z.any()).optional()
}));

export const validateSecurityPolicy = validate(z.object({
  tenantId: schemas.uuid,
  policyType: schemas.securityPolicy.shape.policyType,
  config: z.record(z.any())
}));

export const validateSearchQuery = validate(z.object({
  q: schemas.searchQuery,
  page: z.number().int().min(1).max(1000).optional(),
  limit: z.number().int().min(1).max(100).optional()
}));

// Sanitization middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Sanitize string inputs
  const sanitizeString = (str: string): string => {
    if (typeof str !== 'string') return str;
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  };

  // Recursively sanitize object
  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      return sanitizeString(obj);
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
      }
      return sanitized;
    }
    return obj;
  };

  // Sanitize request body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  next();
};

// File validation middleware
export const validateFileUpload = (options: {
  maxSize?: number;
  allowedTypes?: string[];
  maxFiles?: number;
}) => {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    maxFiles = 10
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const files = (req as any).files;

    if (!files || files.length === 0) {
      return res.status(400).json({
        error: 'No files provided'
      });
    }

    if (files.length > maxFiles) {
      return res.status(400).json({
        error: `Too many files. Maximum ${maxFiles} files allowed.`
      });
    }

    for (const file of files) {
      // Check file size
      if (file.size > maxSize) {
        return res.status(400).json({
          error: `File ${file.originalname} is too large. Maximum size is ${maxSize} bytes.`
        });
      }

      // Check file type
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({
          error: `File type ${file.mimetype} not allowed for ${file.originalname}. Allowed types: ${allowedTypes.join(', ')}`
        });
      }

      // Additional security checks
      if (file.originalname.includes('..') || file.originalname.includes('/')) {
        return res.status(400).json({
          error: `Invalid filename: ${file.originalname}`
        });
      }
    }

    next();
  };
};