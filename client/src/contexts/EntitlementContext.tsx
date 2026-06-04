import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import {
  UserEntitlement,
  canAccessFeature,
  canAccessRoute,
  FeatureKey,
  PACKAGE_FEATURES,
} from '../types/entitlements';

interface EntitlementContextType {
  entitlement: UserEntitlement | null;
  isLoading: boolean;
  error: string | null;
  hasFeature: (feature: FeatureKey | string) => boolean;
  canAccess: (feature: FeatureKey | string) => boolean;
  canAccessRoute: (route: string) => boolean;
  refresh: () => Promise<void>;
}

const EntitlementContext = createContext<EntitlementContextType | undefined>(undefined);

export { EntitlementContext };

export const useEntitlements = () => {
  const context = useContext(EntitlementContext);
  if (context === undefined) {
    throw new Error('useEntitlements must be used within an EntitlementProvider');
  }
  return context;
};

interface EntitlementProviderProps {
  children: React.ReactNode;
}

export const EntitlementProvider: React.FC<EntitlementProviderProps> = ({ children }) => {
  const [entitlement, setEntitlement] = useState<UserEntitlement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated, isSupabaseConfigured } = useAuth();

  /**
   * Fetch entitlements for the current user's email
   */
  const fetchEntitlement = useCallback(async () => {
    if (!isSupabaseConfigured() || !user?.email) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('user_entitlements')
        .select('*')
        .eq('email', user.email)
        .single();

      if (fetchError) {
        // If no entitlement found, create a default regular user entitlement
        if (fetchError.code === 'PGRST116') {
          console.log('No entitlement found for user, creating default regular package...');

          // Create default entitlement for new user
          const { data: newEntitlement, error: insertError } = await supabase
            .from('user_entitlements')
            .insert({
              email: user.email,
              package: 'regular',
              openclaw_enabled: false,
              admin_enabled: false,
              source: 'Auto-created on first login',
              notes: 'Default regular user package',
            })
            .select()
            .single();

          if (insertError) {
            throw new Error(`Failed to create entitlement: ${insertError.message}`);
          }

          setEntitlement(newEntitlement);
        } else {
          throw fetchError;
        }
      } else {
        setEntitlement(data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch entitlement';
      console.error('Entitlement fetch error:', errorMessage);
      setError(errorMessage);
      setEntitlement(null);
    } finally {
      setIsLoading(false);
    }
  }, [user, isSupabaseConfigured]);

  /**
   * Refresh entitlements - call after any package change
   */
  const refresh = useCallback(async () => {
    await fetchEntitlement();
  }, [fetchEntitlement]);

  // Fetch entitlement when user changes
  useEffect(() => {
    if (user?.email) {
      fetchEntitlement();
    } else {
      setEntitlement(null);
      setIsLoading(false);
    }
  }, [user, fetchEntitlement]);

  /**
   * Check if user has access to a specific feature
   */
  const hasFeature = useCallback(
    (featureKey: FeatureKey | string): boolean => {
      if (!entitlement) return false;
      return canAccessFeature(entitlement, featureKey);
    },
    [entitlement]
  );

  /**
   * Alias for hasFeature
   */
  const canAccess = useCallback(
    (featureKey: FeatureKey | string): boolean => {
      return hasFeature(featureKey);
    },
    [hasFeature]
  );

  /**
   * Check if user can access a given route
   */
  const canAccessRouteWrapper = useCallback(
    (route: string): boolean => {
      if (!entitlement) return false;
      return canAccessRoute(entitlement, route);
    },
    [entitlement]
  );

  const value: EntitlementContextType = {
    entitlement,
    isLoading,
    error,
    hasFeature,
    canAccess,
    canAccessRoute: canAccessRouteWrapper,
    refresh,
  };

  return <EntitlementContext.Provider value={value}>{children}</EntitlementContext.Provider>;
};

export default EntitlementProvider;
