/**
 * Server Authentication Security Middleware
 *
 * This middleware provides a secure server boundary for Netlify Functions.
 * It validates Supabase tokens and ensures proper authorization.
 */

import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// Initialize Supabase client with service role for backend operations
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables for service role');
}

const supabase = createClient(supabaseUrl || '', supabaseServiceKey || '', {
  auth: {
    persistSession: false, // Don't persist session in server context
    autoRefreshToken: false, // Don't auto refresh in server context
  },
});

// CORS configuration for secure cross-origin requests
const ALLOWED_ORIGINS = [
  'https://app.smartcrm.vip',
  'https://smartcrm.vip',
  'http://localhost:3000',
  'http://localhost:5173',
  'https://localhost:3000',
  'https://localhost:5173',
  // Add any other allowed origins
];

// Request validation schema
const authHeaderSchema = z.object({
  authorization: z.string().startsWith('Bearer '),
});

/**
 * Extract and validate the Supabase token from the Authorization header
 */
const extractToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return null;
  }

  // Validate header format
  const parsed = authHeaderSchema.safeParse({ authorization: authHeader });
  if (!parsed.success) {
    return null;
  }

  // Extract token from "Bearer <token>"
  return authHeader.replace('Bearer ', '');
};

/**
 * Verify the Supabase token and return user ID
 */
const verifyToken = async (token: string): Promise<{ userId: string; email: string } | null> => {
  try {
    const { data, error } = await supabase.auth.getUser(token);

    if (error) {
      console.error('Token verification failed:', error);
      return null;
    }

    if (!data.user) {
      return null;
    }

    return {
      userId: data.user.id,
      email: data.user.email || '',
    };
  } catch (err) {
    console.error('Token verification error:', err);
    return null;
  }
};

/**
 * Authentication middleware for protected routes
 * Validates the Supabase JWT token from the Authorization header
 */
export const authenticateRequest = async (req: Request, res: Response, next: NextFunction) => {
  // Check CORS preflight
  const origin = req.headers.origin;
  if (req.method === 'OPTIONS') {
    const allowedOrigin = ALLOWED_ORIGINS.includes(origin || '') ? origin : ALLOWED_ORIGINS[0];
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin || ALLOWED_ORIGINS[0]);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.status(204).end();
  }

  // Set CORS headers for actual requests
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  // Extract token from Authorization header
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({
      error: 'Missing or invalid Authorization header',
      code: 'MISSING_AUTH_HEADER',
    });
  }

  // Verify the token with Supabase
  const user = await verifyToken(token);

  if (!user) {
    return res.status(401).json({
      error: 'Invalid or expired token',
      code: 'INVALID_TOKEN',
    });
  }

  // Attach user info to request for downstream handlers
  (req as any).user = user;
  (req as any).userId = user.userId;

  next();
};

/**
 * Optional middleware to check if user owns a resource
 * Use this for routes that require ownership verification
 */
export const requireOwnership = (resourceType: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).userId;
    const resourceId = req.params.id;

    if (!userId || !resourceId) {
      return res.status(400).json({
        error: 'Missing user ID or resource ID',
        code: 'MISSING_PARAMETERS',
      });
    }

    try {
      // Check ownership based on resource type
      let tableName: string;

      switch (resourceType) {
        case 'contact':
          tableName = 'contacts';
          break;
        case 'deal':
          tableName = 'deals';
          break;
        case 'task':
          tableName = 'tasks';
          break;
        default:
          // Unknown resource type - allow through (or implement custom logic)
          return next();
      }

      const result = await supabase.from(tableName).select('user_id').eq('id', resourceId).single();

      if (!result.data) {
        return res.status(404).json({
          error: `${resourceType} not found`,
          code: 'RESOURCE_NOT_FOUND',
        });
      }

      const resourceUserId = result.data.user_id;

      if (resourceUserId !== userId) {
        return res.status(403).json({
          error: 'You do not have access to this resource',
          code: 'FORBIDDEN',
        });
      }

      next();
    } catch (err) {
      console.error('Ownership check error:', err);
      return res.status(500).json({
        error: 'Failed to verify resource ownership',
        code: 'OWNERSHIP_CHECK_FAILED',
      });
    }
  };
};

/**
 * Rate limiting middleware
 * Prevents abuse by limiting requests per user
 */
export const rateLimiter = (windowMs: number = 60000) => {
  const requestCounts = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).userId;

    if (!userId) {
      return next();
    }

    const now = Date.now();
    const userRequests = requestCounts.get(userId) || { count: 0, resetTime: now };

    // Reset count if window has passed
    if (now - userRequests.resetTime > windowMs) {
      userRequests.count = 0;
      userRequests.resetTime = now;
    }

    // Check if over limit
    const MAX_REQUESTS_PER_WINDOW = 100;
    if (userRequests.count >= MAX_REQUESTS_PER_WINDOW) {
      return res.status(429).json({
        error: 'Too many requests, please try again later',
        code: 'RATE_LIMITED',
      });
    }

    // Increment count
    userRequests.count++;
    requestCounts.set(userId, userRequests);

    next();
  };
};

/**
 * Error handling wrapper
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      console.error('Async handler error:', error);

      // Don't expose internal errors to clients
      const statusCode = error.statusCode || 500;

      res.status(statusCode).json({
        error: statusCode === 500 ? 'Internal server error' : error.message,
        code: error.code || 'INTERNAL_ERROR',
        requestId: req.headers['x-request-id'],
      });
    });
  };
};

export default authenticateRequest;
