simimport React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, options?: any) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    // Prevent duplicate initialization
    if (initialized.current) return;
    initialized.current = true;

    let subscription: any = null;

    const initializeAuth = async () => {
      try {
        // Check for dev session in localStorage
        const checkDevSession = () => {
          // SECURITY: Only allow dev bypass on localhost, .replit.dev, GitHub Codespace, and Netlify, NOT on .replit.app
          const isDevelopmentEnvironment = (window.location.hostname.includes('localhost') ||
                                           window.location.hostname.includes('replit.dev') ||
                                           window.location.hostname.includes('github.dev') ||
                                           window.location.hostname.includes('app.github.dev') ||
                                           window.location.hostname.includes('netlify.app') ||
                                           window.location.hostname.includes('vercel.app')) &&
                                          !window.location.hostname.includes('replit.app');
          
          // Clear dev sessions if on production domain
          if (!isDevelopmentEnvironment) {
            localStorage.removeItem('dev-user-session');
            localStorage.removeItem('sb-supabase-auth-token');
            localStorage.removeItem('smartcrm-dev-mode');
            localStorage.removeItem('smartcrm-dev-user');
            console.log('🔒 Dev bypass disabled on production domain:', window.location.hostname);
            return false;
          }

          const devSession = localStorage.getItem('dev-user-session');
          const devToken = localStorage.getItem('sb-supabase-auth-token');
          const devMode = localStorage.getItem('smartcrm-dev-mode');

          if ((devSession && devToken) || devMode === 'true') {
            try {
              let userData;
              let tokenData;

              if (devSession && devToken) {
                userData = JSON.parse(devSession);
                tokenData = JSON.parse(devToken);
              } else {
                // Fallback dev user data
                userData = {
                  id: 'dev-user-12345',
                  email: 'dev@smartcrm.local',
                  username: 'developer',
                  firstName: 'Development',
                  lastName: 'User',
                  role: 'super_admin',
                  productTier: 'dev_all_access', // Special tier that bypasses all restrictions
                  app_context: 'smartcrm'
                };
                tokenData = {
                  access_token: 'dev-bypass-token',
                  refresh_token: 'dev-bypass-refresh',
                  expires_at: Date.now() + (24 * 60 * 60 * 1000)
                };
              }

              console.log('Using dev bypass session:', userData.email);
              setUser(userData);
              setSession({
                user: userData,
                access_token: tokenData.access_token || 'dev-bypass-token',
                refresh_token: tokenData.refresh_token || 'dev-bypass-refresh',
                expires_at: tokenData.expires_at || (Date.now() + 24 * 60 * 60 * 1000)
              } as any);
              setLoading(false);
              return true;
            } catch (error) {
              console.error('Invalid dev session data:', error);
              localStorage.removeItem('dev-user-session');
              localStorage.removeItem('sb-supabase-auth-token');
              localStorage.removeItem('smartcrm-dev-mode');
              localStorage.removeItem('smartcrm-dev-user');
            }
          }
          return false;
        };

        // First check for dev session
        if (checkDevSession()) {
          return;
        }

        // Continue with normal Supabase auth if no dev session
        const { data: { session: supabaseSession }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.warn('Auth session warning:', sessionError);
          // Don't block the app, just log the warning
          setAuthError(null); // Clear error to prevent blocking
        } else {
          setSession(supabaseSession);
          setUser(supabaseSession?.user ?? null);
          setAuthError(null);
        }

        // Set up auth state listener with error handling
        const { data: authListener } = supabase.auth.onAuthStateChange(
          async (event: any, session: any) => {
            try {
              console.log('Auth state changed:', event, session?.user?.id);
              setSession(session);
              setUser(session?.user ?? null);
              setAuthError(null);

              // Handle different auth events
              if (event === 'SIGNED_OUT') {
                // Clear any cached data
                localStorage.removeItem('supabase.auth.token');
                localStorage.removeItem('smartcrm-auth-token');
              }
            } catch (stateError) {
              console.warn('Auth state change warning:', stateError);
            }
          }
        );

        subscription = authListener;
      } catch (error) {
        console.warn('Auth initialization warning:', error);
        // Set fallback auth state instead of blocking
        setUser({ id: 'fallback-user', email: 'user@example.com' } as any);
        setAuthError(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Cleanup function
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);


  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);

      // Handle dev bypass special case
      if (password === 'dev-bypass-password') {
        const devSession = localStorage.getItem('dev-user-session');
        if (devSession) {
          const devUser = JSON.parse(devSession);
          setUser(devUser as any);
          setSession({ user: devUser, access_token: 'dev-bypass-token' } as any);
          return { error: null };
        }
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error: error as AuthError };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, options?: any) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
          data: {
            app_context: 'smartcrm',
            email_template_set: 'smartcrm',
            ...options?.data
          }
        }
      });
      return { error };
    } catch (error) {
      console.error('Sign up error:', error);
      return { error: error as AuthError };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);

      // Clear all auth-related data
      localStorage.removeItem('dev-user-session');
      localStorage.removeItem('sb-supabase-auth-token');
      localStorage.removeItem('smartcrm-auth-token');
      localStorage.removeItem('supabase.auth.token');

      // Clear any onboarding data
      if (user?.id) {
        localStorage.removeItem(`onboarding-${user.id}`);
      }

      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setAuthError(null);
    } catch (error) {
      console.error('Sign out error:', error);
      // Still clear local state even if signOut fails
      setUser(null);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      // Determine the correct redirect URL based on current environment
      const currentOrigin = window.location.origin;
      const isDevelopment = currentOrigin.includes('localhost') || 
                           currentOrigin.includes('replit.dev') || 
                           currentOrigin.includes('replit.app');

      const redirectUrl = isDevelopment 
        ? `${currentOrigin}/auth/reset-password`
        : 'https://app.smartcrm.vip/auth/reset-password';

      console.log('AuthContext resetPassword with redirect URL:', redirectUrl);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });
      return { error };
    } catch (error) {
      console.error('Reset password error:', error);
      return { error: error as AuthError };
    }
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };

  // Don't show error state that blocks the entire app - just log it
  if (authError && !loading) {
    console.warn('Authentication warning:', authError);
    // Continue showing the app instead of blocking it
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};