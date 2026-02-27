/**
 * AuthContext - Centralized Authentication State Manager
 *
 * This provider handles:
 * - Session management with Supabase
 * - Tab synchronization (sign out in another tab)
 * - Token refresh and expiration handling
 * - Network offline/online detection
 * - Deep link authentication
 * - Loading states to prevent page flicker
 *
 * Exposes:
 * - session: Current Supabase session
 * - user: Current user object
 * - loading: Initial loading state
 * - isAuthenticated: Boolean for auth status
 * - isSessionReady: Boolean for session resolution complete
 */

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { User, Session, AuthError, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Dev bypass configuration - MUST be set via environment variable in production
const DEV_BYPASS_PASSWORD = (import.meta as unknown as { env: Record<string, string> }).env.VITE_DEV_BYPASS_PASSWORD || '';
const ALLOWED_DEV_DOMAINS = [
  'localhost',
  '127.0.0.1',
  'replit.dev',
  'github.dev',
  'app.github.dev',
];
const APP_CONTEXT = 'smartcrm';
const EMAIL_TEMPLATE_SET = 'smartcrm';

// Session storage keys for cross-tab sync
const SESSION_SYNC_KEY = 'smartcrm-session-sync';
const SESSION_SYNC_EVENT = 'smartcrm-session-change';

// Types
interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isSessionReady: boolean;
  isAuthenticated: boolean;
  authError: string | null;
  isOffline: boolean;
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, options?: any) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Utility functions
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isDevelopmentEnvironment = (): boolean => {
  return (
    ALLOWED_DEV_DOMAINS.some(
      (domain) =>
        window.location.hostname === domain || window.location.hostname.endsWith('.' + domain)
    ) &&
    !window.location.hostname.includes('replit.app') &&
    !window.location.hostname.includes('production')
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Core auth state
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Refs for cleanup and preventing race conditions
  const initialized = useRef(false);
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);
  const sessionCheckInterval = useRef<NodeJS.Timeout | null>(null);

  // Derived state
  const isAuthenticated = !!(user && session);

  /**
   * Handle session sync from other tabs
   * This ensures sign out in one tab is reflected in all tabs
   */
  const handleStorageEvent = useCallback((event: StorageEvent) => {
    if (event.key === SESSION_SYNC_KEY) {
      try {
        const syncData = JSON.parse(event.newValue || '{}');
        if (syncData.type === 'signout') {
          // Another tab signed out - clear local state
          setUser(null);
          setSession(null);
          setAuthError(null);
        } else if (syncData.type === 'signin' && syncData.session) {
          // Another tab signed in - update local state
          setSession(syncData.session);
          setUser(syncData.session.user);
        }
      } catch {
        // Invalid sync data, ignore
      }
    }
  }, []);

  /**
   * Broadcast session change to other tabs
   */
  const broadcastSessionChange = useCallback(
    (type: 'signin' | 'signout', session?: Session | null) => {
      try {
        localStorage.setItem(
          SESSION_SYNC_KEY,
          JSON.stringify({
            type,
            session: type === 'signin' ? session : null,
            timestamp: Date.now(),
          })
        );
        // Trigger storage event for other tabs
        window.dispatchEvent(
          new StorageEvent('storage', {
            key: SESSION_SYNC_KEY,
            newValue: localStorage.getItem(SESSION_SYNC_KEY),
          })
        );
      } catch {
        // Storage not available, continue
      }
    },
    []
  );

  /**
   * Handle online/offline status
   */
  const handleOnlineStatus = useCallback(() => {
    setIsOffline(!navigator.onLine);
    if (navigator.onLine) {
      // Coming back online - refresh session
      refreshSession();
    }
  }, []);

  /**
   * Refresh the current session
   */
  const refreshSession = useCallback(async () => {
    if (!isSupabaseConfigured()) return;

    try {
      const {
        data: { session: newSession },
        error,
      } = await supabase.auth.getSession();
      if (error) {
        console.warn('Session refresh warning:', error);
        return;
      }
      setSession(newSession);
      setUser(newSession?.user ?? null);
    } catch (error) {
      console.warn('Session refresh failed:', error);
    }
  }, []);

  /**
   * Check for and handle expired sessions
   */
  const checkSessionExpiry = useCallback(() => {
    if (!session) return;

    const expiresAt = session.expires_at;
    if (!expiresAt) return;

    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = expiresAt - now;

    // If session expires in less than 5 minutes, try to refresh
    if (timeUntilExpiry < 300 && timeUntilExpiry > 0) {
      supabase.auth.refreshSession().catch(() => {
        // Refresh failed, session will expire naturally
      });
    }

    // If session is already expired, clear state
    if (timeUntilExpiry <= 0) {
      setUser(null);
      setSession(null);
    }
  }, [session]);

  /**
   * Initialize authentication state
   */
  useEffect(() => {
    // Prevent duplicate initialization
    if (initialized.current) return;
    initialized.current = true;

    const initializeAuth = async () => {
      try {
        // Check if Supabase is configured
        if (!isSupabaseConfigured()) {
          console.warn('Supabase not configured, skipping auth initialization');
          setLoading(false);
          setIsSessionReady(true);
          return;
        }

        // Check for dev session in development environments
        if (isDevelopmentEnvironment()) {
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
                userData = {
                  id: 'dev-user-12345',
                  email: 'dev@smartcrm.local',
                  username: 'developer',
                  firstName: 'Development',
                  lastName: 'User',
                  role: 'super_admin',
                  productTier: 'dev_all_access',
                  app_context: APP_CONTEXT,
                };
                tokenData = {
                  access_token: 'dev-bypass-token',
                  refresh_token: 'dev-bypass-refresh',
                  expires_at: Date.now() + 24 * 60 * 60 * 1000,
                };
              }

              setUser(userData);
              setSession({
                user: userData,
                access_token: tokenData.access_token || 'dev-bypass-token',
                refresh_token: tokenData.refresh_token || 'dev-bypass-refresh',
                expires_at: tokenData.expires_at || Date.now() + 24 * 60 * 60 * 1000,
              } as any);
              setLoading(false);
              setIsSessionReady(true);
              return;
            } catch (error) {
              console.error('Invalid dev session data:', error);
              localStorage.removeItem('dev-user-session');
              localStorage.removeItem('sb-supabase-auth-token');
              localStorage.removeItem('smartcrm-dev-mode');
              localStorage.removeItem('smartcrm-dev-user');
            }
          }
        } else {
          // Production - clear any dev sessions
          localStorage.removeItem('dev-user-session');
          localStorage.removeItem('sb-supabase-auth-token');
          localStorage.removeItem('smartcrm-dev-mode');
          localStorage.removeItem('smartcrm-dev-user');
        }

        // Get initial session
        const {
          data: { session: initialSession },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.warn('Initial session check warning:', sessionError);
          // Don't block - continue with null session
        }

        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        setAuthError(null);

        // Set up auth state listener
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(
          async (event: AuthChangeEvent, newSession: Session | null) => {
            // Handle different auth events
            switch (event) {
              case 'SIGNED_IN':
                setSession(newSession);
                setUser(newSession?.user ?? null);
                broadcastSessionChange('signin', newSession);
                break;

              case 'SIGNED_OUT':
                setUser(null);
                setSession(null);
                setAuthError(null);
                broadcastSessionChange('signout');
                // Clear cached data
                localStorage.removeItem('supabase.auth.token');
                localStorage.removeItem('smartcrm-auth-token');
                break;

              case 'TOKEN_REFRESHED':
                setSession(newSession);
                setUser(newSession?.user ?? null);
                break;

              case 'USER_UPDATED':
                setUser(newSession?.user ?? null);
                setSession(newSession);
                break;

              case 'PASSWORD_RECOVERY':
                // Handle password recovery - session will be set
                setSession(newSession);
                setUser(newSession?.user ?? null);
                break;

              default:
                setSession(newSession);
                setUser(newSession?.user ?? null);
            }
          }
        );

        subscriptionRef.current = subscription;

        // Set up periodic session check (every 60 seconds)
        sessionCheckInterval.current = setInterval(checkSessionExpiry, 60000);
      } catch (error) {
        console.error('Auth initialization error:', error);
        setAuthError(error instanceof Error ? error.message : 'Authentication error');
      } finally {
        setLoading(false);
        setIsSessionReady(true);
      }
    };

    initializeAuth();

    // Set up event listeners for cross-tab sync and online/offline
    window.addEventListener('storage', handleStorageEvent);
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    // Cleanup
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
      if (sessionCheckInterval.current) {
        clearInterval(sessionCheckInterval.current);
      }
      window.removeEventListener('storage', handleStorageEvent);
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, [handleStorageEvent, handleOnlineStatus, broadcastSessionChange, checkSessionExpiry]);

  /**
   * Sign in with email and password
   */
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);

      if (!validateEmail(email)) {
        return { error: { message: 'Invalid email format' } as AuthError };
      }

      // Handle dev bypass - ONLY if password matches env var AND we're in development
      if (DEV_BYPASS_PASSWORD && password === DEV_BYPASS_PASSWORD && isDevelopmentEnvironment()) {
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
      return { error: error as AuthError };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sign up with email and password
   */
  const signUp = async (email: string, password: string, options?: any) => {
    try {
      setLoading(true);

      if (!validateEmail(email)) {
        return { error: { message: 'Invalid email format' } as AuthError };
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
          data: {
            app_context: APP_CONTEXT,
            email_template_set: EMAIL_TEMPLATE_SET,
            ...options?.data,
          },
        },
      });

      return { error };
    } catch (error) {
      return { error: error as AuthError };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sign out - clears all auth data
   */
  const signOut = async () => {
    try {
      setLoading(true);

      // Clear all auth-related data
      localStorage.removeItem('dev-user-session');
      localStorage.removeItem('sb-supabase-auth-token');
      localStorage.removeItem('smartcrm-auth-token');
      localStorage.removeItem('supabase.auth.token');

      // Clear any user-specific data
      if (user?.id) {
        localStorage.removeItem(`onboarding-${user.id}`);
      }

      // Sign out from Supabase
      await supabase.auth.signOut();

      // Clear state
      setUser(null);
      setSession(null);
      setAuthError(null);

      // Broadcast to other tabs
      broadcastSessionChange('signout');
    } catch (error) {
      console.error('Sign out error:', error);
      // Still clear local state even if signOut fails
      setUser(null);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Reset password for email
   */
  const resetPassword = async (email: string) => {
    try {
      const currentOrigin = window.location.origin;
      const isDev = isDevelopmentEnvironment();

      const redirectUrl = isDev
        ? `${currentOrigin}/auth/reset-password`
        : 'https://app.smartcrm.vip/auth/reset-password';

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    isSessionReady,
    isAuthenticated,
    authError,
    isOffline,
    signIn,
    signUp,
    signOut,
    resetPassword,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Loading Gate Component
 * Prevents page flicker by waiting for session resolution
 */
interface LoadingGateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const AuthLoadingGate: React.FC<LoadingGateProps> = ({
  children,
  fallback = <DefaultLoadingFallback />,
}) => {
  const { isSessionReady } = useAuth();

  if (!isSessionReady) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

const DefaultLoadingFallback: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading...</h2>
      <p className="text-gray-600">Please wait while we initialize your session...</p>
    </div>
  </div>
);

export default AuthProvider;
