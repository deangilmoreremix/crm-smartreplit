/**
 * Secure Netlify Function Template
 * 
 * This template provides a reusable pattern for creating secure Netlify Functions
 * that properly authenticate and authorize requests using Supabase tokens.
 * 
 * SECURITY PRINCIPLES:
 * 1. Never trust client-provided user_id - always extract from verified token
 * 2. Validate all input with Zod schemas
 * 3. Enforce ownership checks on resource access
 * 4. Return safe error messages (no stack traces or internal details)
 * 5. Use strict CORS allowlist
 */

import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * CORS Configuration
 * WHY: Prevents cross-origin request forgery and limits API access to known origins.
 * Without this, any website could make requests to your API from a user's browser.
 */
const ALLOWED_ORIGINS = [
  'https://app.smartcrm.vip',
  'https://smartcrm.vip',
  'http://localhost:3000',
  'http://localhost:5173',
];

/**
 * Initialize Supabase client with service role key
 * WHY: Service role key has elevated privileges needed for backend operations.
 * IMPORTANT: This key must NEVER be exposed to the client.
 */
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

// ============================================================================
// TYPES
// ============================================================================

interface AuthenticatedUser {
  userId: string;
  email: string;
}

interface SecureRequest {
  user: AuthenticatedUser;
  body: unknown;
  query: Record<string, string>;
  path: string;
}

type SecureHandler = (req: SecureRequest) => Promise<{
  statusCode: number;
  body: unknown;
}>;

// ============================================================================
// SECURITY UTILITIES
// ============================================================================

/**
 * Set CORS headers for the response
 * WHY: Required for browsers to allow cross-origin requests.
 * Strict origin checking prevents unauthorized domains from accessing the API.
 */
const setCorsHeaders = (origin: string | undefined): Record<string, string> => {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) 
    ? origin 
    : ALLOWED_ORIGINS[0];
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };
};

/**
 * Create a standardized error response
 * WHY: Ensures consistent error format and prevents information leakage.
 * Never expose internal errors, stack traces, or sensitive details.
 */
const errorResponse = (
  statusCode: number, 
  message: string, 
  code: string,
  requestId?: string
) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    error: message,
    code,
    requestId,
  }),
});

/**
 * Extract and verify the Supabase JWT token
 * WHY: Validates that the request comes from an authenticated user.
 * The token is verified by Supabase, ensuring it hasn't been tampered with.
 * 
 * SECURITY: We NEVER trust user_id from the request body - it must come from
 * the verified token to prevent impersonation attacks.
 */
const authenticateRequest = async (authHeader: string | undefined): Promise<AuthenticatedUser | null> => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');
  
  try {
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data.user) {
      return null;
    }
    
    return {
      userId: data.user.id,
      email: data.user.email || '',
    };
  } catch {
    return null;
  }
};

/**
 * Validate request body against a Zod schema
 * WHY: Prevents malformed or malicious input from reaching your business logic.
 * Zod provides runtime type validation with clear error messages.
 */
const validateBody = <T>(schema: z.ZodSchema<T>, body: unknown): T => {
  const result = schema.safeParse(body);
  
  if (!result.success) {
    throw new ValidationError(result.error.message);
  }
  
  return result.data;
};

/**
 * Check if user owns a resource
 * WHY: Prevents Insecure Direct Object Reference (IDOR) attacks.
 * Users should only be able to access their own resources.
 */
const checkOwnership = async (
  tableName: string, 
  resourceId: string, 
  userId: string
): Promise<boolean> => {
  const { data, error } = await supabase
    .from(tableName)
    .select('user_id')
    .eq('id', resourceId)
    .single();
  
  if (error || !data) {
    return false;
  }
  
  return data.user_id === userId;
};

// ============================================================================
// ERROR CLASSES
// ============================================================================

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ForbiddenError';
  }
}

// ============================================================================
// MAIN HANDLER FACTORY
// ============================================================================

/**
 * Create a secure Netlify Function handler
 * 
 * This factory function wraps your business logic with security middleware:
 * 1. CORS handling for preflight and actual requests
 * 2. Token authentication via Authorization header
 * 3. Request body validation with Zod
 * 4. Standardized error handling
 * 
 * @param config Configuration including Zod schema for body validation
 * @param handler Your business logic handler function
 */
export const createSecureFunction = <T = unknown>(
  config: {
    bodySchema?: z.ZodSchema<T>;
    requireAuth?: boolean;
  },
  handler: SecureHandler
): Handler => {
  return async (event, context) => {
    const requestId = context.awsRequestId;
    const origin = event.headers.origin;
    
    // Handle CORS preflight requests
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 204,
        headers: setCorsHeaders(origin),
        body: '',
      };
    }
    
    try {
      // Parse request body
      let body: unknown;
      try {
        body = event.body ? JSON.parse(event.body) : {};
      } catch {
        return errorResponse(400, 'Invalid JSON body', 'INVALID_BODY', requestId);
      }
      
      // Authenticate request (if required)
      let user: AuthenticatedUser | null = null;
      
      if (config.requireAuth !== false) {
        const authHeader = event.headers.authorization;
        user = await authenticateRequest(authHeader);
        
        if (!user) {
          return errorResponse(401, 'Missing or invalid authorization', 'UNAUTHORIZED', requestId);
        }
      }
      
      // Validate body against schema
      let validatedBody: T | undefined;
      if (config.bodySchema) {
        try {
          validatedBody = validateBody(config.bodySchema, body);
        } catch (err) {
          if (err instanceof ValidationError) {
            return errorResponse(400, err.message, 'VALIDATION_ERROR', requestId);
          }
          throw err;
        }
      }
      
      // Call the handler
      const result = await handler({
        user: user!,
        body: validatedBody ?? body,
        query: event.queryStringParameters || {},
        path: event.path,
      });
      
      return {
        statusCode: result.statusCode,
        headers: {
          ...setCorsHeaders(origin),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(result.body),
      };
      
    } catch (err) {
      console.error('Function error:', err);
      
      // Handle known error types
      if (err instanceof ValidationError) {
        return errorResponse(400, err.message, 'VALIDATION_ERROR', requestId);
      }
      if (err instanceof NotFoundError) {
        return errorResponse(404, err.message, 'NOT_FOUND', requestId);
      }
      if (err instanceof ForbiddenError) {
        return errorResponse(403, err.message, 'FORBIDDEN', requestId);
      }
      
      // Generic error - don't expose internal details
      return errorResponse(500, 'Internal server error', 'INTERNAL_ERROR', requestId);
    }
  };
};

// Export utilities for use in handlers
export { 
  supabase, 
  checkOwnership, 
  ValidationError, 
  NotFoundError, 
  ForbiddenError 
};

// Type exports
export type { SecureRequest, AuthenticatedUser };
