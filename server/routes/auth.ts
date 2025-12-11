
import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';

const router = Router();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Get user role endpoint
router.get('/user-role', async (req, res) => {
  try {
    // Check if we're in development mode first
    if (process.env.NODE_ENV === 'development') {
      const devUser = {
        userId: 'dev-user-12345',
        email: 'dev@smartcrm.local',
        role: 'super_admin'
      };
      return res.json({
        success: true,
        data: devUser
      });
    }

    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Missing or invalid authorization header',
        code: 'UNAUTHORIZED' 
      });
    }

    const token = authHeader.substring(7);

    // Verify the token with Supabase
    const { data: user, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ 
        error: 'Invalid token',
        code: 'INVALID_TOKEN' 
      });
    }

    // Get user role from user metadata or default to 'user'
    const role = user.user?.user_metadata?.role || user.user?.app_metadata?.role || 'user';

    res.json({
      success: true,
      data: {
        userId: user.user?.id,
        email: user.user?.email,
        role: role
      }
    });

  } catch (error: any) {
    console.error('User role fetch error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      message: error.message
    });
  }
});

// Token refresh endpoint
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ 
        error: 'Refresh token is required',
        code: 'MISSING_REFRESH_TOKEN' 
      });
    }

    // Use Supabase to refresh the token
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken
    });

    if (error || !data.session) {
      return res.status(401).json({ 
        error: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN' 
      });
    }

    res.json({
      success: true,
      data: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: data.session.expires_at
      }
    });

  } catch (error: any) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      message: error.message
    });
  }
});

export default router;
