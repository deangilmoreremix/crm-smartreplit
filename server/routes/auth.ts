/**
 * Server-side Authentication Routes & Middleware
 * These routes require the service_role key and should only be called from the server.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

const router = Router();

// Password validation utility
const validatePasswordStrength = (password: string): { valid: boolean; error?: string } => {
  if (!password || password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' };
  }
  // Check for common weak passwords
  const weakPasswords = ['password', 'password123', 'Password123', '12345678', 'qwerty123'];
  if (weakPasswords.includes(password)) {
    return { valid: false, error: 'Password is too common. Please choose a stronger password' };
  }
  return { valid: true };
};

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
 * POST /api/auth/change-password
 * Change password for authenticated user with current password verification
 *
 * Body: { currentPassword: string, newPassword: string }
 * Requires: session with valid access token
 */
router.post('/change-password', async (req: Request, res: Response) => {
  try {
    const userId = (req.session as any)?.userId;
    const userEmail = (req.session as any)?.userEmail;
    const hostname = req.get('host') || '';

    // Input validation
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Both currentPassword and newPassword are required',
      });
    }

    // Password strength validation
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        error: 'Weak password',
        message: passwordValidation.error,
      });
    }

    // Dev bypass check - ONLY for development environments
    if (isDevelopment && isDevelopmentEnvironment(hostname) && userEmail && DEV_BYPASS_EMAILS.includes(userEmail.toLowerCase())) {
      console.log('[change-password] Dev bypass used for:', userEmail);
      return res.json({
        success: true,
        message: 'Password updated (dev mode)',
      });
    }

    // Require authentication
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'You must be authenticated to change your password',
      });
    }

    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(500).json({
        error: 'Server configuration error',
        message: 'Authentication service not configured',
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify current password by attempting to get the user and re-authenticate
    // Get user to verify they exist
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
    if (userError || !userData?.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not found',
      });
    }

    // Get the user's email to attempt re-authentication
    const userEmailFromDB = userData.user.email;

    // For security: require the user to re-authenticate with current password
    // This prevents session hijacking attacks where someone steals a session
    // and changes the password without knowing the original
    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email: userEmailFromDB || '',
      password: currentPassword,
    });

    if (reauthError) {
      // Don't reveal if it's wrong password vs other error
      const isWrongPassword = reauthError.message?.includes('Invalid login credentials') ||
                             reauthError.message?.includes('invalid');
      return res.status(401).json({
        error: 'Invalid credentials',
        message: isWrongPassword
          ? 'Current password is incorrect. Please try again.'
          : 'Authentication failed. Please sign in again.',
      });
    }

    // Update password using admin API
    const { data, error } = await supabase.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (error) {
      console.error('Password update error:', error);
      return res.status(400).json({
        error: 'Password update failed',
        message: error.message,
      });
    }

    // Log the password change for audit purposes
    console.log(`[audit] Password changed for user ${userId} at ${new Date().toISOString()}`);

    // Clear the session to force re-authentication on other tabs/devices
    // This is a security best practice
    if (req.session) {
      (req.session as any).destroy?.((err: Error) => {
        if (err) console.error('Session destruction error:', err);
      });
    }

    res.json({
      success: true,
      message: 'Password updated successfully. Please sign in again.',
    });
  } catch (err: any) {
    console.error('Change password error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: err.message || 'An unexpected error occurred',
    });
  }
});

export default router;
