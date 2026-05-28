/**
 * Server-side Authentication Routes & Middleware
 * These routes require the service_role key and should only be called from the server.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

const router = Router();

// Initialize Supabase client with service role key
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const serviceRoleKey =
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// DEV BYPASS EMAILS - Development users who can bypass auth
// These should ONLY be used in development environments
const DEV_BYPASS_EMAILS = ['dev@smartcrm.local'];

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * isDevelopmentEnvironment - Check if running in development
 * More robust check including common dev hostnames
 */
function isDevelopmentEnvironment(hostname?: string): boolean {
  if (!isDevelopment) return false;

  const devHosts = ['localhost', '127.0.0.1', 'replit.dev', 'replit.app', 'dev.'];
  const checkHost = hostname || 'localhost';
  return devHosts.some((host) => checkHost.includes(host));
}

/**
 * requireAuth Middleware
 * Checks if user is authenticated via session AND has valid entitlement (not no_access)
 * DEV BYPASS: Only works in development with explicit DEV_BYPASS_EMAILS
 */
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req.session as any)?.userId;
    const userEmail = (req.session as any)?.userEmail;
    const hostname = req.get('host') || '';

    // Check for dev bypass ONLY in development with explicit emails
    if (isDevelopment && isDevelopmentEnvironment(hostname)) {
      if (userEmail && DEV_BYPASS_EMAILS.includes(userEmail.toLowerCase())) {
        (req as any).user = {
          id: 'dev-user-12345',
          email: userEmail,
          role: 'super_admin',
          productTier: 'super_admin',
        };
        (req as any).userId = 'dev-user-12345';
        (req as any).userEmail = userEmail;
        (req as any).entitlement = {
          package: 'super_admin',
          openclaw_enabled: true,
          admin_enabled: true,
        };
        return next();
      }
    }

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized - Not authenticated' });
    }

    // Attach identity for downstream
    (req as any).userId = userId;
    if (userEmail) {
      (req as any).userEmail = userEmail;
    }

    // Check user entitlement to block no_access accounts
    if (supabaseUrl && serviceRoleKey) {
      const supabase = createClient(supabaseUrl, serviceRoleKey);
      const { data: entitlement } = await supabase
        .from('user_entitlements')
        .select('package')
        .eq('user_id', userId)
        .single();

      if (entitlement && entitlement.package === 'no_access') {
        return res.status(403).json({
          error: 'Forbidden - No subscription',
          message:
            'Your account has no active subscription. Please upgrade to access this feature.',
        });
      }
    }

    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Internal server error during authentication' });
  }
};

/**
 * requireAdmin Middleware
 * Checks if user is a super admin AND has super_admin entitlement package
 * DEV BYPASS: Only works in development with explicit DEV_BYPASS_EMAILS
 */
export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req.session as any)?.userId;
    const userEmail = (req.session as any)?.userEmail;
    const hostname = req.get('host') || '';

    // Check for dev bypass ONLY in development with explicit emails
    if (isDevelopment && isDevelopmentEnvironment(hostname)) {
      if (userEmail && DEV_BYPASS_EMAILS.includes(userEmail.toLowerCase())) {
        (req as any).user = {
          id: 'dev-user-12345',
          email: userEmail,
          role: 'super_admin',
          productTier: 'super_admin',
        };
        (req as any).entitlement = {
          package: 'super_admin',
          openclaw_enabled: true,
          admin_enabled: true,
        };
        return next();
      }
    }

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized - Not authenticated' });
    }

    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Check profile role AND entitlement in parallel
    const [profileResult, entitlementResult] = await Promise.all([
      supabase.from('profiles').select('role, product_tier').eq('id', userId).single(),
      userEmail
        ? supabase.rpc('user_has_feature', {
            input_email: userEmail,
            input_feature_key: 'admin_panel',
          })
        : null,
    ]);

    const profile = profileResult.data;
    if (profileResult.error || !profile) {
      return res.status(403).json({ error: 'Forbidden - User not found' });
    }

    if (profile.role !== 'super_admin') {
      return res.status(403).json({ error: 'Forbidden - Admin access required' });
    }

    // Verify entitlement allows admin_panel feature
    if (entitlementResult && entitlementResult.data !== true) {
      return res.status(403).json({
        error: 'Forbidden - Admin entitlement not found',
        message: 'Your account does not have admin privileges. Please contact support.',
      });
    }

    (req as any).user = profile;
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ error: 'Internal server error during admin check' });
  }
};

/**
 * POST /api/auth/invite
 * Send a user invitation email
 *
 * Body: { "email": "user@example.com" }
 */
router.post('/invite', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    if (!serviceRoleKey) {
      console.error('Service role key not configured');
      return res.status(500).json({ error: 'Service role key not configured' });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Send invitation email using Supabase Admin API
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email);

    if (error) {
      console.error('Invite error:', error);
      return res.status(400).json({ error: error.message });
    }

    console.log('Invitation sent successfully:', email);

    res.json({
      success: true,
      message: `Invitation sent to ${email}`,
      data: {
        user: (data as any).user,
      },
    });
  } catch (err: any) {
    console.error('Unexpected error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

/**
 * GET /api/auth/users
 * List all users (paginated)
 */
router.get('/users', async (req: Request, res: Response) => {
  try {
    if (!serviceRoleKey) {
      return res.status(500).json({ error: 'Service role key not configured' });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const page = parseInt(req.query.page as string) || 1;
    const perPage = parseInt(req.query.per_page as string) || 50;

    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      console.error('List users error:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json({
      success: true,
      data: {
        users: data.users,
        total: data.total_metadata?.total_count ?? data.users.length,
      },
    });
  } catch (err: any) {
    console.error('Unexpected error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

/**
 * DELETE /api/auth/users/:id
 * Delete a user
 */
router.delete('/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!serviceRoleKey) {
      return res.status(500).json({ error: 'Service role key not configured' });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { error } = await supabase.auth.admin.deleteUser(id);

    if (error) {
      console.error('Delete user error:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json({
      success: true,
      message: `User ${id} deleted successfully`,
    });
  } catch (err: any) {
    console.error('Unexpected error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

/**
 * POST /api/auth/users/:id
 * Update a user
 */
router.patch('/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { email, phone, email_confirm, phone_confirm, user_metadata, app_metadata } = req.body;

    if (!serviceRoleKey) {
      return res.status(500).json({ error: 'Service role key not configured' });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const updateData: any = {};
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (email_confirm !== undefined) updateData.email_confirm = email_confirm;
    if (phone_confirm !== undefined) updateData.phone_confirm = phone_confirm;
    if (user_metadata !== undefined) updateData.user_metadata = user_metadata;
    if (app_metadata !== undefined) updateData.app_metadata = app_metadata;

    const { data, error } = await supabase.auth.admin.updateUserById(id, updateData);

    if (error) {
      console.error('Update user error:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json({
      success: true,
      data: { user: data.user },
    });
  } catch (err: any) {
    console.error('Unexpected error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

/**
 * POST /api/auth/dev-bypass
 * Development-only endpoint to create a mock session
 * SECURITY: Only works on localhost/replit.dev with NODE_ENV=development
 */
router.post('/dev-bypass', async (req: Request, res: Response) => {
  // SECURITY: Check both NODE_ENV and hostname
  const hostname = req.get('host') || '';
  const isProductionDomain = hostname.includes('replit.app') || hostname.includes('smartcrm.vip');

  if (process.env.NODE_ENV !== 'development' || isProductionDomain) {
    console.log('🔒 Dev bypass blocked - ENV:', process.env.NODE_ENV, 'Host:', hostname);
    return res.status(404).json({ error: 'Not found' });
  }

  const devUser = {
    id: 'dev-user-12345',
    email: 'dev@smartcrm.local',
    username: 'developer',
    firstName: 'Development',
    lastName: 'User',
    role: 'super_admin',
    permissions: ['all'],
    tenantId: 'development',
    status: 'active',
    lastActive: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    app_context: 'smartcrm',
  };

  const devSession = {
    access_token: 'dev-bypass-token-' + Date.now(),
    refresh_token: 'dev-bypass-refresh-' + Date.now(),
    expires_at: Date.now() + 24 * 60 * 60 * 1000,
    user: devUser,
  };

  console.log('✅ Dev bypass session created for:', devUser.email);

  res.json({
    success: true,
    user: devUser,
    session: devSession,
    hasAccess: true,
    permissions: ['all'],
  });
});

/**
 * registerAuthRoutes - Register authentication routes with Express app
 * This function is called by the main routes index to set up /api/auth endpoints
 */
export const registerAuthRoutes = (app: any) => {
  app.use('/api/auth', router);
};

export default router;
