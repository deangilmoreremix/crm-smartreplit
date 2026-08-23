/**
 * Server-side Authentication Routes & Middleware
 * These routes require the service_role key and should only be called from the server.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

const router = Router();

// Initialize Supabase client with service role key
const supabaseUrl = process.env.SUPABASE_URL || '';
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export interface RequireAuthOptions {
  checkEntitlement?: boolean;
}

function isRequireAuthOptions(arg: any): arg is RequireAuthOptions {
  return arg && typeof arg === 'object' && !('method' in arg) && !('headers' in arg);
}

async function requireAuthHandler(
  req: Request,
  res: Response,
  next: NextFunction,
  checkEntitlement: boolean
) {
  try {
    const userId = (req.session as any)?.userId;
    const userEmail = (req.session as any)?.userEmail;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized - Not authenticated' });
    }

    (req as any).userId = userId;
    if (userEmail) {
      (req as any).userEmail = userEmail;
    }

    if (checkEntitlement) {
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
    }

    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Internal server error during authentication' });
  }
}

/**
 * requireAuth Middleware
 * Checks if user is authenticated via session.
 * Optionally checks entitlement (no_access) if checkEntitlement is true (default).
 *
 * Can be used directly as middleware: requireAuth
 * Or with options: requireAuth({ checkEntitlement: false })
 *
 * Sets { userId, userEmail } on the req object.
 */
export const requireAuth = (options?: RequireAuthOptions | Request) => {
  if (isRequireAuthOptions(options)) {
    const checkEntitlement = options.checkEntitlement !== false;
    return (req: Request, res: Response, next: NextFunction) =>
      requireAuthHandler(req, res, next, checkEntitlement);
  }
  // Called directly as middleware with no options
  return (req: Request, res: Response, next: NextFunction) =>
    requireAuthHandler(req, res, next, true);
};

/**
 * requireAdmin Middleware
 * Checks if user is a super admin AND has super_admin entitlement package
 */
export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req.session as any)?.userId;
    const userEmail = (req.session as any)?.userEmail;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized - Not authenticated' });
    }

    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

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

export default router;
