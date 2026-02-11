/**
 * Server-side Authentication Routes & Middleware
 * These routes require the service_role key and should only be called from the server.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

const router = Router();

// Initialize Supabase client with service role key
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// DEV BYPASS EMAILS - Development users who can bypass auth
const DEV_BYPASS_EMAILS = [
  'dev@smartcrm.local',
  'dean@smartcrm.vip',
  'dean@videoremix.io',
  'samuel@videoremix.io',
  'victor@videoremix.io'
];

/**
 * requireAuth Middleware
 * Checks if user is authenticated via session
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const userId = (req.session as any)?.userId;
  
  // Check for dev bypass in development
  if (process.env.NODE_ENV === 'development' && !userId) {
    // Allow dev bypass for development
    (req as any).user = {
      id: 'dev-user-12345',
      email: 'dev@smartcrm.local',
      role: 'super_admin',
      productTier: 'super_admin'
    };
    return next();
  }
  
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized - Not authenticated' });
  }
  
  // Attach user ID to request for downstream handlers
  (req as any).userId = userId;
  next();
};

/**
 * requireAdmin Middleware
 * Checks if user is a super admin
 */
export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req.session as any)?.userId;
    
    // Check for dev bypass in development
    if (process.env.NODE_ENV === 'development') {
      // Allow dev bypass for development
      (req as any).user = {
        id: 'dev-user-12345',
        email: 'dev@smartcrm.local',
        role: 'super_admin',
        productTier: 'super_admin'
      };
      return next();
    }
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized - Not authenticated' });
    }
    
    // Check if user is admin by looking up their profile
    if (!supabaseUrl || !serviceRoleKey) {
      // Fallback: check session data
      const userEmail = (req.session as any)?.userEmail;
      if (userEmail && DEV_BYPASS_EMAILS.includes(userEmail.toLowerCase())) {
        return next();
      }
      return res.status(500).json({ error: 'Supabase not configured' });
    }
    
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role, product_tier')
      .eq('id', userId)
      .single();
    
    if (error || !profile) {
      // Check if user is in dev bypass list
      const userEmail = (req.session as any)?.userEmail;
      if (userEmail && DEV_BYPASS_EMAILS.includes(userEmail.toLowerCase())) {
        return next();
      }
      return res.status(403).json({ error: 'Forbidden - User not found' });
    }
    
    if (profile.role !== 'super_admin') {
      return res.status(403).json({ error: 'Forbidden - Admin access required' });
    }
    
    (req as any).user = profile;
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ error: 'Internal server error during admin check' });
  }
};

/**
 * requireProductTier Middleware
 * Checks if user has required product tier (ai_communication or higher)
 */
export const requireProductTier = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req.session as any)?.userId;
    
    // Check for dev bypass in development
    if (process.env.NODE_ENV === 'development') {
      (req as any).user = {
        id: 'dev-user-12345',
        email: 'dev@smartcrm.local',
        role: 'super_admin',
        productTier: 'super_admin'
      };
      return next();
    }
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized - Not authenticated' });
    }
    
    // Required tiers (in order of access): basic -> starter -> professional -> enterprise -> ai_communication -> super_admin
    // wl_user role also gets basic access
    const requiredTiers = ['ai_communication', 'enterprise', 'professional', 'starter', 'super_admin', 'wl_user', 'basic'];
    
    if (!supabaseUrl || !serviceRoleKey) {
      // Fallback for development
      const userEmail = (req.session as any)?.userEmail;
      if (userEmail && DEV_BYPASS_EMAILS.includes(userEmail.toLowerCase())) {
        return next();
      }
      return res.status(500).json({ error: 'Supabase not configured' });
    }
    
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('product_tier, role')
      .eq('id', userId)
      .single();
    
    if (error || !profile) {
      // Check if user is in dev bypass list
      const userEmail = (req.session as any)?.userEmail;
      if (userEmail && DEV_BYPASS_EMAILS.includes(userEmail.toLowerCase())) {
        return next();
      }
      return res.status(403).json({ error: 'Forbidden - User profile not found' });
    }
    
    const userTier = profile.product_tier || profile.role;
    
    // super_admin bypasses all tier checks
    if (userTier === 'super_admin') {
      (req as any).user = profile;
      return next();
    }
    
    // Check if user has required tier
    const hasAccess = requiredTiers.includes(userTier);
    
    if (!hasAccess) {
      return res.status(403).json({ 
        error: 'Forbidden - Product tier upgrade required',
        requiredTier: 'ai_communication',
        currentTier: userTier
      });
    }
    
    (req as any).user = profile;
    next();
  } catch (error) {
    console.error('Product tier check error:', error);
    res.status(500).json({ error: 'Internal server error during tier check' });
  }
};

/**
 * requireTier Middleware
 * Checks if user has specific tier (flexible tier checking)
 */
export const requireTier = (requiredTier: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req.session as any)?.userId;
      
      // Check for dev bypass in development
      if (process.env.NODE_ENV === 'development') {
        (req as any).user = {
          id: 'dev-user-12345',
          email: 'dev@smartcrm.local',
          role: 'super_admin',
          productTier: 'super_admin'
        };
        return next();
      }
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized - Not authenticated' });
      }
      
      if (!supabaseUrl || !serviceRoleKey) {
        const userEmail = (req.session as any)?.userEmail;
        if (userEmail && DEV_BYPASS_EMAILS.includes(userEmail.toLowerCase())) {
          return next();
        }
        return res.status(500).json({ error: 'Supabase not configured' });
      }
      
      const supabase = createClient(supabaseUrl, serviceRoleKey);
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('product_tier, role')
        .eq('id', userId)
        .single();
      
      if (error || !profile) {
        const userEmail = (req.session as any)?.userEmail;
        if (userEmail && DEV_BYPASS_EMAILS.includes(userEmail.toLowerCase())) {
          return next();
        }
        return res.status(403).json({ error: 'Forbidden - User profile not found' });
      }
      
      const userTier = profile.product_tier || profile.role;
      
      // super_admin bypasses all tier checks
      if (userTier === 'super_admin') {
        (req as any).user = profile;
        return next();
      }
      
      // Check for exact tier match or higher
      const tierHierarchy = ['basic', 'starter', 'professional', 'enterprise', 'ai_communication', 'wl_user'];
      const userTierIndex = tierHierarchy.indexOf(userTier);
      const requiredTierIndex = tierHierarchy.indexOf(requiredTier);
      
      // Also check for special roles
      if (userTier === requiredTier) {
        (req as any).user = profile;
        return next();
      }
      
      // Allow access if user tier is higher in hierarchy
      if (userTierIndex >= requiredTierIndex && userTierIndex >= 0) {
        (req as any).user = profile;
        return next();
      }
      
      return res.status(403).json({ 
        error: 'Forbidden - Tier upgrade required',
        requiredTier,
        currentTier: userTier
      });
    } catch (error) {
      console.error('Tier check error:', error);
      res.status(500).json({ error: 'Internal server error during tier check' });
    }
  };
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
        user: (data as any).user
      }
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
      perPage
    });

    if (error) {
      console.error('List users error:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json({
      success: true,
      data: {
        users: data.users,
        total: data.total
      }
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
      message: `User ${id} deleted successfully`
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
      data: { user: data.user }
    });
  } catch (err: any) {
    console.error('Unexpected error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

export default router;
