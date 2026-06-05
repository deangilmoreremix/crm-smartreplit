/**
 * Supabase Email/Password Authentication Service
 * Simple and focused on email/password auth only.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';

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
  const weakPasswords = ['password', 'password123', 'Password123', '12345678', 'qwerty123'];
  if (weakPasswords.includes(password)) {
    return { valid: false, error: 'Password is too common. Please choose a stronger password' };
  }
  return { valid: true };
};

// ==================== SIGN UP ====================

export const signUpWithEmail = async (
  email: string,
  password: string,
  options?: {
    data?: Record<string, any>;
    redirectTo?: string;
  }
) => {
  const redirectTo = options?.redirectTo || `${window.location.origin}/auth/confirm`;

  console.log('📧 SignUp with Email:', { email, redirectTo });

  return await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectTo,
      data: options?.data,
    },
  });
};

// ==================== LOG IN ====================

export const signInWithEmail = async (email: string, password: string) => {
  console.log('📧 SignIn with Email:', email);
  return await supabase.auth.signInWithPassword({ email, password });
};

// ==================== PASSWORD RECOVERY ====================

export const resetPasswordForEmail = async (email: string) => {
  const redirectTo = `${window.location.origin}/auth/reset-password`;
  console.log('🔐 Password Reset Request:', { email, redirectTo });
  return await supabase.auth.resetPasswordForEmail(email, { redirectTo });
};

// ==================== PASSWORD CHANGE (SECURE) ====================

/**
 * Change password for authenticated user with current password verification
 * This is the SECURE way to change passwords - it validates the current password
 * via a server endpoint before allowing the change.
 */
export const changePassword = async (currentPassword: string, newPassword: string) => {
  // Validate password strength
  const validation = validatePasswordStrength(newPassword);
  if (!validation.valid) {
    return { error: { message: validation.error } };
  }

  if (!isSupabaseConfigured()) {
    return { error: { message: 'Authentication service not configured' } };
  }

  try {
    const response = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include session cookies
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: { message: data.message || data.error || 'Failed to change password' } };
    }

    // Sign out after successful password change
    await signOut();

    return { data: { success: true } };
  } catch (error: any) {
    return { error: { message: error.message || 'Failed to change password' } };
  }
};

// ==================== UPDATE USER ====================

export const updateUser = async (options: {
  email?: string;
  password?: string;
  data?: Record<string, any>;
}) => {
  console.log('✏️ Update User:', {
    hasEmail: !!options.email,
    hasPassword: !!options.password,
    hasData: !!options.data,
  });
  return await supabase.auth.updateUser(options);
};

export const updateUserEmail = async (email: string) => {
  return await supabase.auth.updateUser({ email });
};

/**
 * @deprecated USE changePassword() INSTEAD
 * This function is insecure as it doesn't verify the current password.
 * It's kept for backward compatibility with ResetPassword flow.
 */
export const updateUserPassword = async (password: string) => {
  console.warn('⚠️ updateUserPassword called without current password verification. Consider using changePassword() instead.');
  return await supabase.auth.updateUser({ password });
};

// ==================== USER INFO ====================

export const getCurrentUser = async () => {
  console.log('👤 Get Current User');
  return await supabase.auth.getUser();
};

export const getSession = async () => {
  return await supabase.auth.getSession();
};

// ==================== LOG OUT ====================

export const signOut = async () => {
  console.log('👋 Sign Out');

  // Clear all auth-related storage before calling signOut
  const authKeysToRemove = [
    'sb-supabase-auth-token',
    'smartcrm-auth-token',
    'supabase.auth.token',
    'supabase.auth.token-videoremix',
    'supabase.auth.token-smartcrm',
  ];

  authKeysToRemove.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore localStorage errors
    }
  });

  try {
    return await supabase.auth.signOut();
  } catch (error) {
    console.warn('Supabase signOut failed:', error);
    // Still return a resolved promise to allow clean signout flow
    return { error: null };
  }
};

// ==================== EVENT LISTENERS ====================

export const onAuthStateChange = (callback: (event: string, session: any) => void) => {
  return supabase.auth.onAuthStateChange(callback);
};

// ==================== HELPERS ====================

export const isAuthenticated = async (): Promise<boolean> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return !!session;
};

export const hasConfirmedEmail = (user: any): boolean => {
  return !!user?.email_confirmed_at;
};

export const getUserMetadata = (): Record<string, any> | null => {
  try {
    const {
      data: { user },
    } = supabase.auth.getUser() as any;
    return user?.user_metadata || null;
  } catch {
    return null;
  }
};

// Export all functions
const authService = {
  signUpWithEmail,
  signInWithEmail,
  resetPasswordForEmail,
  changePassword,
  updateUser,
  updateUserEmail,
  updateUserPassword,
  getCurrentUser,
  getSession,
  signOut,
  onAuthStateChange,
  isAuthenticated,
  hasConfirmedEmail,
  getUserMetadata,
};

export default authService;
