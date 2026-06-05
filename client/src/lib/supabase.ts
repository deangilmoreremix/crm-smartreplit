import { createClient } from '@supabase/supabase-js';

// Get environment variables with fallbacks
const supabaseUrl =
  (import.meta as unknown as { env: Record<string, string> }).env.VITE_SUPABASE_URL || '';

// Support both the legacy ANON_KEY and the newer PUBLISHABLE_KEY naming (Supabase publishable keys)
const rawAnonKey =
  (import.meta as unknown as { env: Record<string, string> }).env.VITE_SUPABASE_ANON_KEY || '';
const rawPublishableKey =
  (import.meta as unknown as { env: Record<string, string> }).env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
const supabaseAnonKey = rawAnonKey || rawPublishableKey;

// Debug logging for environment variables - MORE DETAILED
console.log('🔍 Supabase Config Debug:');
console.log(
  '  - VITE_SUPABASE_URL present:',
  !!supabaseUrl,
  supabaseUrl ? supabaseUrl.substring(0, 50) + '...' : 'NOT SET'
);
console.log('  - VITE_SUPABASE_ANON_KEY present:', !!rawAnonKey);
console.log('  - VITE_SUPABASE_PUBLISHABLE_KEY present (fallback):', !!rawPublishableKey);
console.log('  - Effective anon/publishable key present:', !!supabaseAnonKey);

// Check each condition separately for debugging
const hasUrl = !!supabaseUrl;
const hasKey = !!supabaseAnonKey;
const urlNotUndefined = supabaseUrl !== 'undefined';
const keyNotUndefined = supabaseAnonKey !== 'undefined';
const hasSupabaseDomain = supabaseUrl.includes('supabase.co');
const noPlaceholder =
  !supabaseUrl.includes('placeholder') &&
  !supabaseUrl.includes('your_supabase') &&
  !supabaseUrl.includes('your-project');
const looksLikeRealUrl = supabaseUrl.startsWith('http://') || supabaseUrl.startsWith('https://');

console.log('🔍 Config validation:');
console.log('  - hasUrl:', hasUrl);
console.log('  - hasKey:', hasKey);
console.log('  - urlNotUndefined:', urlNotUndefined);
console.log('  - keyNotUndefined:', keyNotUndefined);
console.log('  - hasSupabaseDomain:', hasSupabaseDomain);
console.log('  - noPlaceholder:', noPlaceholder);
console.log('  - looksLikeRealUrl:', looksLikeRealUrl);

// Check if Supabase is properly configured
const supabaseIsConfigured =
  hasUrl && hasKey && urlNotUndefined && keyNotUndefined && hasSupabaseDomain && noPlaceholder && looksLikeRealUrl;

console.log('🔍 Final supabaseIsConfigured:', supabaseIsConfigured);

// Create Supabase client only if properly configured
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let supabaseClient: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let authClient: any;

// Determine the cookie domain based on environment
const getCookieDomain = (): string | undefined => {
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  if (currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1')) {
    return undefined; // No domain restriction for local development
  }
  if (currentOrigin.includes('replit.dev') || currentOrigin.includes('replit.app')) {
    return undefined; // No domain restriction for Replit environments
  }
  return '.smartcrm.vip'; // Production domain
};

if (supabaseIsConfigured) {
  // Create real Supabase client
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storageKey: 'smartcrm-auth-token',
      cookieOptions: {
        domain: getCookieDomain(),
        path: '/',
        sameSite: 'lax',
      },
    },
  });

  authClient = {
    signUp: async (email: string, password: string, options?: Record<string, unknown>) => {
      const currentOrigin = window.location.origin;
      const isDevelopment =
        currentOrigin.includes('localhost') ||
        currentOrigin.includes('replit.dev') ||
        currentOrigin.includes('replit.app');

      const emailRedirectTo = isDevelopment
        ? `${currentOrigin}/auth/confirm`
        : 'https://app.smartcrm.vip/auth/confirm';

      return await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo,
          ...options,
        },
      });
    },
    signIn: async (email: string, password: string) => {
      return await supabaseClient.auth.signInWithPassword({ email, password });
    },
    signInWithProvider: async (provider: 'google' | 'github' | 'discord') => {
      const currentOrigin = window.location.origin;
      const isDevelopment =
        currentOrigin.includes('localhost') ||
        currentOrigin.includes('replit.dev') ||
        currentOrigin.includes('replit.app');

      const redirectTo = isDevelopment
        ? `${currentOrigin}/auth/confirm`
        : 'https://app.smartcrm.vip/auth/confirm';

      return await supabaseClient.auth.signInWithOAuth({
        provider,
        options: { redirectTo },
      });
    },
signInWithMagicLink: async (email: string) => {
      const currentOrigin = window.location.origin;
      const isDevelopment =
        currentOrigin.includes('localhost') ||
        currentOrigin.includes('replit.dev') ||
        currentOrigin.includes('replit.app');

      const emailRedirectTo = isDevelopment
        ? `${currentOrigin}/auth/confirm`
        : 'https://app.smartcrm.vip/auth/confirm';

      return await supabaseClient.auth.signInWithOtp({
        email,
        options: { emailRedirectTo },
      });
    },
    signOut: async () => {
      return await supabaseClient.auth.signOut();
    },
    resetPassword: async (email: string) => {
      const currentOrigin = window.location.origin;
      const isDevelopment =
        currentOrigin.includes('localhost') ||
        currentOrigin.includes('replit.dev') ||
        currentOrigin.includes('replit.app');

      const redirectTo = isDevelopment
        ? `${currentOrigin}/auth/reset-password`
        : 'https://app.smartcrm.vip/auth/reset-password';

      return await supabaseClient.auth.resetPasswordForEmail(email, { redirectTo });
    },
    updatePassword: async (password: string) => {
      return await supabaseClient.auth.updateUser({ password });
    },
    // changePassword requires current password and uses server endpoint
    changePassword: async (currentPassword: string, newPassword: string) => {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) {
        return { error: { message: data.message || data.error || 'Failed to change password' } };
      }
      // Sign out after password change
      await supabaseClient.auth.signOut().catch(() => {});
      return { data: { success: true } };
    },
    getSession: async () => {
      const { data, error } = await supabaseClient.auth.getSession();
      return { data, error };
    },
    getUser: async () => {
      const { data, error } = await supabaseClient.auth.getUser();
      return { data, error };
    },
    onAuthStateChange: (callback: (event: string, session: unknown) => void) => {
      return supabaseClient.auth.onAuthStateChange(callback);
    },
  };
} else {
  // Mock Supabase client for when not configured - prevents infinite retry loops
  console.warn(
    '⚠️ Supabase not configured properly. Using fallback mode to prevent infinite retries.'
  );

  supabaseClient = {
    from: (_table: string) => ({
      select: () => Promise.resolve({ data: [], error: null }),
      insert: () => Promise.resolve({ data: null, error: null }),
      update: () => Promise.resolve({ data: null, error: null }),
      delete: () => Promise.resolve({ data: null, error: null }),
      upsert: () => Promise.resolve({ data: null, error: null }),
    }),
    rpc: () => Promise.resolve({ data: null, error: null }),
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: null, error: null }),
        download: () => Promise.resolve({ data: null, error: null }),
        list: () => Promise.resolve({ data: null, error: null }),
        remove: () => Promise.resolve({ data: null, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
      }),
    },
    auth: {
      signUp: async () => ({
        data: null,
        error: { message: 'Supabase not configured', name: 'ConfigurationError' },
      }),
      signInWithPassword: async () => ({
        data: null,
        error: { message: 'Supabase not configured', name: 'ConfigurationError' },
      }),
      signInWithOAuth: async () => ({
        data: null,
        error: { message: 'Supabase not configured', name: 'ConfigurationError' },
      }),
      signInWithOtp: async () => ({
        data: null,
        error: { message: 'Supabase not configured', name: 'ConfigurationError' },
      }),
      signOut: async () => ({}),
      resetPasswordForEmail: async () => ({
        data: null,
        error: { message: 'Supabase not configured', name: 'ConfigurationError' },
      }),
      updateUser: async () => ({
        data: null,
        error: { message: 'Supabase not configured', name: 'ConfigurationError' },
      }),
      // changePassword requires server endpoint which isn't available in mock mode
      changePassword: async () => ({
        data: null,
        error: { message: 'Supabase not configured', name: 'ConfigurationError' },
      }),
      updatePassword: async () => ({
        data: null,
        error: { message: 'Supabase not configured', name: 'ConfigurationError' },
      }),
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
  };

  authClient = supabaseClient.auth;
}

// Export check function
export const isSupabaseConfigured = (): boolean => supabaseIsConfigured;

// Helper function to check connection with timeout
export const checkSupabaseConnection = async (): Promise<{
  connected: boolean;
  error: string | null;
}> => {
  if (!supabaseIsConfigured) {
    return { connected: false, error: 'Supabase not configured' };
  }

  try {
    const { data, error } = await supabaseClient.from('profiles').select('count').limit(1);
    return { connected: !error, error: error?.message || null };
  } catch (err) {
    return { connected: false, error: err instanceof Error ? err.message : 'Connection failed' };
  }
};

// Export named exports
export { supabaseClient as supabase, authClient as auth };
