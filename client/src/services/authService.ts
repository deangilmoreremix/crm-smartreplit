/**
 * Supabase Email/Password Authentication Service
 * Simple and focused on email/password auth only.
 */

import { supabase } from '../lib/supabase';

// ==================== SIGN UP ====================

export const signUpWithEmail = async (
  email: string,
  password: string,
  options?: {
    data?: Record<string, any>;
    redirectTo?: string;
  }
) => {
  const redirectTo = options?.redirectTo || 
    `${window.location.origin}/auth/confirm`;
  
  console.log('📧 SignUp with Email:', { email, redirectTo });
  
  return await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectTo,
      data: options?.data
    }
  });
};

// ==================== LOG IN ====================

export const signInWithEmail = async (
  email: string,
  password: string
) => {
  console.log('📧 SignIn with Email:', email);
  return await supabase.auth.signInWithPassword({ email, password });
};

// ==================== PASSWORD RECOVERY ====================

export const resetPasswordForEmail = async (email: string) => {
  const redirectTo = `${window.location.origin}/auth/reset-password`;
  console.log('🔐 Password Reset Request:', { email, redirectTo });
  return await supabase.auth.resetPasswordForEmail(email, { redirectTo });
};

// ==================== UPDATE USER ====================

export const updateUser = async (options: { 
  email?: string; 
  password?: string; 
  data?: Record<string, any> 
}) => {
  console.log('✏️ Update User:', { 
    hasEmail: !!options.email, 
    hasPassword: !!options.password,
    hasData: !!options.data 
  });
  return await supabase.auth.updateUser(options);
};

export const updateUserEmail = async (email: string) => {
  return await supabase.auth.updateUser({ email });
};

export const updateUserPassword = async (password: string) => {
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
  return await supabase.auth.signOut();
};

// ==================== EVENT LISTENERS ====================

export const onAuthStateChange = (
  callback: (event: string, session: any) => void
) => {
  return supabase.auth.onAuthStateChange(callback);
};

// ==================== HELPERS ====================

export const isAuthenticated = async (): Promise<boolean> => {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
};

export const hasConfirmedEmail = (user: any): boolean => {
  return !!user?.email_confirmed_at;
};

export const getUserMetadata = (): Record<string, any> | null => {
  try {
    const { data: { user } } = supabase.auth.getUser() as any;
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
  updateUser,
  updateUserEmail,
  updateUserPassword,
  getCurrentUser,
  getSession,
  signOut,
  onAuthStateChange,
  isAuthenticated,
  hasConfirmedEmail,
  getUserMetadata
};

export default authService;
