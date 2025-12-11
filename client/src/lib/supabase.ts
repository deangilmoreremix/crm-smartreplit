import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug logging for environment variables
console.log('🔍 Supabase URL:', supabaseUrl);
console.log('🔍 Supabase Anon Key:', supabaseAnonKey ? '***' + supabaseAnonKey.slice(-4) : 'undefined');

// Create client directly (like your working example)
export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder-key', {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storageKey: 'smartcrm-auth-token'
  }
});

// Export a function to check if Supabase is available
export const isSupabaseConfigured = () => !!(supabaseUrl && supabaseAnonKey);

// Helper function to check connection
export const checkSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    return { connected: !error, error: error?.message };
  } catch (error) {
    return { connected: false, error: 'Connection failed' };
  }
};

// Auth helpers
export const auth = {
  signUp: async (email: string, password: string, options?: any) => {
    // Get dynamic redirect URL based on environment
    const currentOrigin = window.location.origin;
    const isDevelopment = currentOrigin.includes('localhost') || 
                         currentOrigin.includes('replit.dev') || 
                         currentOrigin.includes('replit.app');
    
    const emailRedirectTo = isDevelopment 
      ? `${currentOrigin}/auth/confirm`
      : 'https://app.smartcrm.vip/auth/confirm';

    console.log('SignUp with emailRedirectTo:', emailRedirectTo);

    return await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo,
        ...options
      }
    });
  },

  signIn: async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({
      email,
      password
    });
  },

  signInWithProvider: async (provider: 'google' | 'github' | 'discord') => {
    // Get dynamic redirect URL based on environment
    const currentOrigin = window.location.origin;
    const isDevelopment = currentOrigin.includes('localhost') || 
                         currentOrigin.includes('replit.dev') || 
                         currentOrigin.includes('replit.app');
    
    const redirectTo = isDevelopment 
      ? `${currentOrigin}/auth/confirm`
      : 'https://app.smartcrm.vip/auth/confirm';

    console.log('OAuth SignIn with redirectTo:', redirectTo);

    return await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo
      }
    });
  },

  signInWithMagicLink: async (email: string) => {
    // Get dynamic redirect URL based on environment
    const currentOrigin = window.location.origin;
    const isDevelopment = currentOrigin.includes('localhost') || 
                         currentOrigin.includes('replit.dev') || 
                         currentOrigin.includes('replit.app');
    
    const emailRedirectTo = isDevelopment 
      ? `${currentOrigin}/auth/confirm`
      : 'https://app.smartcrm.vip/auth/confirm';

    console.log('Magic link with emailRedirectTo:', emailRedirectTo);

    return await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo
      }
    });
  },

  signOut: async () => {
    return await supabase.auth.signOut();
  },

  resetPassword: async (email: string) => {
    const currentOrigin = window.location.origin;
    const isDevelopment = currentOrigin.includes('localhost') || 
                          currentOrigin.includes('replit.dev') || 
                          currentOrigin.includes('replit.app');

    const redirectTo = isDevelopment 
      ? `${currentOrigin}/auth/reset-password`
      : 'https://app.smartcrm.vip/auth/reset-password';

    console.log('🔐 Password Reset Request:', {
      email,
      redirectTo,
      environment: isDevelopment ? 'development' : 'production',
      origin: currentOrigin
    });

    const response = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo
    });

    console.log('✅ Supabase resetPasswordForEmail Response:', {
      hasData: !!response.data,
      hasError: !!response.error,
      errorMessage: response.error?.message,
      errorStatus: response.error?.status,
      redirectTo
    });

    if (response.error) {
      console.error('❌ Supabase Error Details:', {
        message: response.error.message,
        status: response.error.status,
        name: response.error.name
      });
    }

    // Return standard Supabase response format
    return response;
  },

  updatePassword: async (password: string) => {
    return await supabase.auth.updateUser({
      password
    });
  },

  getSession: async () => {
    const { data, error } = await supabase.auth.getSession();
    return { data, error };
  },

  getUser: async () => {
    const { data, error } = await supabase.auth.getUser();
    return { data, error };
  },

  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  }
};

export default supabase;