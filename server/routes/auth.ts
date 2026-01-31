import type { Express } from "express";
import { handleAuthWebhook, createUserMetadata, determineUserRole } from '../email-routing';
import { supabase, isSupabaseConfigured } from '../supabase';

// Development bypass emails that always have full access
const DEV_BYPASS_EMAILS = (
  process.env.DEV_BYPASS_EMAILS || 'dev@smartcrm.local,dean@smartcrm.vip,dean@videoremix.io,samuel@videoremix.io,victor@videoremix.io'
).split(',');

// Simple in-memory rate limiter for auth endpoints
const authRateLimits = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 5; // 5 attempts per window

const checkRateLimit = (identifier: string): { allowed: boolean; remaining: number; resetTime: number } => {
  const now = Date.now();
  const record = authRateLimits.get(identifier);
  
  if (!record || now > record.resetTime) {
    // Create new rate limit window
    authRateLimits.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetTime: now + RATE_LIMIT_WINDOW };
  }
  
  if (record.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }
  
  record.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX - record.count, resetTime: record.resetTime };
};

// Rate limiting middleware for auth endpoints
const authRateLimiter = (req: any, res: any, next: any) => {
  const identifier = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  const result = checkRateLimit(identifier);
  
  // Add rate limit headers
  res.setHeader('X-RateLimit-Limit', RATE_LIMIT_MAX);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, result.remaining));
  res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000));
  
  if (!result.allowed) {
    return res.status(429).json({
      error: 'Too many authentication attempts',
      message: 'Please try again later.',
      retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
    });
  }
  
  next();
};

// Authentication middleware - ensures user is logged in
export const requireAuth = (req: any, res: any, next: any) => {
  // Check for dev bypass token in Authorization header (for dev environment only)
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer dev-bypass-token-')) {
    const hostname = req.headers.host || '';
    const isProductionDomain = hostname.includes('smartcrm.vip');

    // Allow dev bypass in non-production environments
    if (!isProductionDomain) {
      // In development/staging, allow dev bypass with full admin access
      req.user = {
        id: 'dev-user-12345',
        email: 'dev@smartcrm.local',
        username: 'dev@smartcrm.local',
        role: 'super_admin',
        productTier: 'super_admin'
      };
      console.log('✅ Dev bypass auth granted via token');
      return next();
    }
  }

  const userId = req.session?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
};

// Authorization middleware - checks if user is admin
export const requireAdmin = async (req: any, res: any, next: any) => {
  const userId = req.session?.userId;

  // Check for dev bypass token in Authorization header (for dev environment only)
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer dev-bypass-token-')) {
    const hostname = req.headers.host || '';
    const isProductionDomain = hostname.includes('smartcrm.vip');

    // Allow dev bypass in non-production environments
    if (!isProductionDomain) {
      // In development/staging, allow dev bypass with full admin access
      req.user = {
        id: 'dev-user-12345',
        email: 'dev@smartcrm.local',
        username: 'dev@smartcrm.local',
        role: 'super_admin',
        productTier: 'super_admin'
      };
      console.log('✅ Dev bypass admin access granted via token');
      return next();
    }
  }

  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const { db } = await import('../db');
    const user = await db.query.profiles.findFirst({
      where: (profiles, { eq }) => eq(profiles.id, userId),
    });

    // DEV BYPASS: Allow full admin access for dev/admin accounts
    const userEmail = user?.username || '';
    if (user && DEV_BYPASS_EMAILS.includes(userEmail) || user.role === 'super_admin') {
      req.user = user;
      return next();
    }

    if (!user || (user.role !== 'super_admin' && user.role !== 'wl_user')) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Authorization check failed' });
  }
};

// Product tier hierarchy - higher index = more access
const TIER_HIERARCHY = [
  'ai_communication',      // Level 0 - Video Email, SMS, VoIP, Invoicing
  'ai_boost_unlimited',    // Level 1 - Unlimited AI credits
  'sales_maximizer',       // Level 2 - AI Goals and AI Tools
  'smartcrm',              // Level 3 - Dashboard, Contacts, Pipeline, Calendar
  'smartcrm_bundle',       // Level 4 - All tools except whitelabel
  'whitelabel',            // Level 5 - All features including whitelabel
  'super_admin'            // Level 6 - All features including admin
] as const;

// Get tier level (returns -1 if no tier/null)
const getTierLevel = (tier: string | null | undefined): number => {
  if (!tier) return -1;
  return TIER_HIERARCHY.indexOf(tier as any);
};

// Product tier middleware - ensures user has ANY valid product tier (not null)
export const requireProductTier = async (req: any, res: any, next: any) => {
  const userId = req.session?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const { db } = await import('../db');
    const user = await db.query.profiles.findFirst({
      where: (profiles, { eq }) => eq(profiles.id, userId),
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // DEV BYPASS: Allow full access for dev/admin accounts
    const userEmail = user.username?.toLowerCase() || '';
    if (DEV_BYPASS_EMAILS.includes(userEmail) || user.role === 'super_admin') {
      req.user = user;
      req.userTier = 'super_admin'; // Grant highest tier access
      return next();
    }

    // Check if user has a valid product tier
    if (!user.productTier) {
      return res.status(403).json({
        error: 'Subscription required',
        message: 'Please purchase a subscription to access this feature',
        code: 'NO_PRODUCT_TIER'
      });
    }

    // Also check entitlement status if available
    const { getUserEntitlement, isUserActive } = await import('../entitlements-utils');
    const entitlement = await getUserEntitlement(userId);
    if (entitlement && !isUserActive(entitlement)) {
      return res.status(403).json({
        error: 'Subscription inactive',
        message: 'Your subscription has expired or been revoked',
        code: 'SUBSCRIPTION_INACTIVE'
      });
    }

    req.user = user;
    req.userTier = user.productTier;
    next();
  } catch (error) {
    console.error('Product tier check failed:', error);
    res.status(500).json({ error: 'Authorization check failed' });
  }
};

// Tier-specific middleware factory - checks if user has required tier level or higher
export const requireTier = (requiredTier: typeof TIER_HIERARCHY[number]) => {
  return async (req: any, res: any, next: any) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
      const { db } = await import('../db');
      const user = await db.query.profiles.findFirst({
        where: (profiles, { eq }) => eq(profiles.id, userId),
      });

      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      // DEV BYPASS: Allow full access for dev/admin accounts
      const userEmail = user.username?.toLowerCase() || '';
      if (DEV_BYPASS_EMAILS.includes(userEmail) || user.role === 'super_admin') {
        req.user = user;
        req.userTier = 'super_admin'; // Grant highest tier access
        return next();
      }

      const userTierLevel = getTierLevel(user.productTier);
      const requiredTierLevel = getTierLevel(requiredTier);

      // No tier = no access
      if (userTierLevel === -1) {
        return res.status(403).json({
          error: 'Subscription required',
          message: 'Please purchase a subscription to access this feature',
          code: 'NO_PRODUCT_TIER'
        });
      }

      // User tier must be >= required tier level
      if (userTierLevel < requiredTierLevel) {
        return res.status(403).json({
          error: 'Upgrade required',
          message: `This feature requires ${requiredTier} tier or higher`,
          requiredTier,
          currentTier: user.productTier,
          code: 'INSUFFICIENT_TIER'
        });
      }

      // Also check entitlement status
      const { getUserEntitlement, isUserActive } = await import('../entitlements-utils');
      const entitlement = await getUserEntitlement(userId);
      if (entitlement && !isUserActive(entitlement)) {
        return res.status(403).json({
          error: 'Subscription inactive',
          message: 'Your subscription has expired or been revoked',
          code: 'SUBSCRIPTION_INACTIVE'
        });
      }

      req.user = user;
      req.userTier = user.productTier;
      next();
    } catch (error) {
      console.error('Tier check failed:', error);
      res.status(500).json({ error: 'Authorization check failed' });
    }
  };
};

export function registerAuthRoutes(app: Express): void {
  // Apply rate limiting to auth endpoints
  app.use('/api/auth', authRateLimiter);
  
  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0'
    });
  });

  // Development bypass endpoint - Only works in development
  app.post('/api/auth/dev-bypass', (req, res) => {
    // SECURITY: Check both NODE_ENV and hostname
    const hostname = req.headers.host || '';
    const isProductionDomain = hostname.includes('replit.app') || hostname.includes('smartcrm.vip');

    if (process.env.NODE_ENV !== 'development' || isProductionDomain) {
      console.log('🔒 Dev bypass blocked - ENV:', process.env.NODE_ENV, 'Host:', hostname);
      return res.status(404).json({ error: 'Not found' });
    }

    // Return dev user with full permissions and session
    const devUser = {
      id: 'dev-user-12345',
      email: 'dev@smartcrm.local',
      username: 'developer',
      firstName: 'Development',
      lastName: 'User',
      role: 'super_admin',
      productTier: 'super_admin',
      permissions: ['all'],
      tenantId: 'development',
      status: 'active',
      lastActive: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      app_context: 'smartcrm'
    };

    const devSession = {
      access_token: 'dev-bypass-token-' + Date.now(),
      refresh_token: 'dev-bypass-refresh-' + Date.now(),
      expires_at: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
      user: devUser
    };

    console.log('✅ Dev bypass session created for:', devUser.email);

    res.json({
      success: true,
      user: devUser,
      session: devSession,
      hasAccess: true,
      permissions: ['all']
    });
  });

  // User role check endpoint - returns actual user role from session
  app.get('/api/auth/user-role', async (req: any, res) => {
    const userId = req.session?.userId;

    // If no session, return unauthenticated
    if (!userId) {
      return res.json({
        success: false,
        user: null,
        hasAccess: false,
        permissions: []
      });
    }

    try {
      const { db } = await import('../db');
      // Get actual user from database
      const user = await db.query.profiles.findFirst({
        where: (profiles, { eq }) => eq(profiles.id, userId),
      });

      if (!user) {
        return res.json({
          success: false,
          user: null,
          hasAccess: false,
          permissions: []
        });
      }

      // Return actual user with their real role and tier
      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.username,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          productTier: user.productTier,
          permissions: user.role === 'super_admin' ? ['all'] : [],
          status: 'active',
          lastActive: new Date().toISOString(),
          createdAt: user.createdAt
        },
        hasAccess: !!user.productTier,
        permissions: user.role === 'super_admin' ? ['all'] : []
      });
    } catch (error) {
      console.error('Error fetching user role:', error);
      res.status(500).json({ error: 'Failed to fetch user role' });
    }
  });

  // Quick dev access route - Direct redirect to dashboard in dev mode
  app.get('/dev', (req, res) => {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(404).send('Not found');
    }

    // Redirect to app with dev bypass token in URL
    res.redirect('/?dev=true');
  });

  // Multi-tenant email routing webhook for Supabase
  app.post('/api/auth-webhook', (req, res) => {
    try {
      // Optional webhook signature verification
      const signature = req.headers['x-webhook-signature'] as string;
      const expectedSignature = process.env.SUPABASE_WEBHOOK_SECRET;

      if (expectedSignature && signature && signature !== expectedSignature) {
        console.warn('⚠️ Invalid webhook signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }

      const { type, record } = req.body;

      if (type === 'INSERT' && record) {
        // Get app context from user metadata
        const appContext = record.raw_user_meta_data?.app_context ||
                          record.user_metadata?.app_context ||
                          'smartcrm';

        // Enhanced logging for monitoring
        console.log(`🎯 Email routing: ${record.email} → ${appContext} templates`, {
          userId: record.id,
          email: record.email,
          appContext,
          timestamp: new Date().toISOString(),
          metadata: record.raw_user_meta_data || record.user_metadata
        });

        // Log successful routing for monitoring
        res.json({
          success: true,
          appContext,
          message: `User routed to ${appContext} email templates`,
          timestamp: new Date().toISOString()
        });
      } else {
        res.json({ success: true, message: 'Event processed' });
      }
    } catch (error) {
      console.error('❌ Auth webhook error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process auth webhook',
        timestamp: new Date().toISOString()
      });
    }
  });
}
