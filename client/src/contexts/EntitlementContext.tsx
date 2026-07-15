import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
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
  const { user, isAuthenticated } = useAuth();

  /**
   * Derive an entitlement from the authenticated user's Supabase metadata.
   *
   * Admin/owner privileges live in the auth user's metadata
   * (`app_metadata.role` / `app_metadata.product_tier`), NOT in the
   * `user_entitlements` table. Deriving from metadata keeps super-admin
   * accounts working even when that table is missing or empty.
   */
  const deriveEntitlementFromUser = useCallback(
    (u: any): UserEntitlement | null => {
      if (!u) return null;

      const meta = u.app_metadata || {};
      const umeta = u.user_metadata || {};
      const role = meta.role || u.role || umeta.role || null;
      const tier =
        meta.product_tier || u.productTier || umeta.product_tier || null;

      const isSuper =
        role === 'super_admin' ||
        tier === 'super_admin' ||
        tier === 'dev_all_access';

      if (isSuper) {
        return {
          id: 'derived-super-admin',
          email: u.email || '',
          package: 'super_admin',
          openclaw_enabled: true,
          admin_enabled: true,
          source: 'Derived from auth metadata',
          notes: 'Super admin privileges inherited from user metadata',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }

      return null;
    },
    []
  );

  /**
   * Fetch entitlements for the current user's email
   */
  const fetchEntitlement = useCallback(async () => {
    if (!user) {
      setEntitlement(null);
      setIsLoading(false);
      return;
    }

    // No Supabase configured → fall back to metadata (e.g. local/dev)
    if (!isSupabaseConfigured()) {
      setIsLoading(false);
      setEntitlement(deriveEntitlementFromUser(user));
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
        // If no entitlement row exists yet, create a default regular package.
        if (fetchError.code === 'PGRST116') {
          // Super admins are defined in auth metadata, not the table.
          const derived = deriveEntitlementFromUser(user);
          if (derived) {
            console.log('Super admin detected from metadata — granting full access.');
            setEntitlement(derived);
            return;
          }

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
            // Table may not exist yet — fall back to metadata so admins still work
            const fallback = deriveEntitlementFromUser(user);
            if (fallback) {
              setEntitlement(fallback);
              return;
            }
            throw new Error(`Failed to create entitlement: ${insertError.message}`);
          }

          setEntitlement(newEntitlement);
        } else {
          // Any other error (e.g. table missing) → fall back to metadata
          const derived = deriveEntitlementFromUser(user);
          if (derived) {
            setEntitlement(derived);
            return;
          }
          throw fetchError;
        }
      } else {
        setEntitlement(data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch entitlement';
      console.error('Entitlement fetch error:', errorMessage);

      // Don't lock the admin out — try metadata one last time
      const derived = deriveEntitlementFromUser(user);
      if (derived) {
        setEntitlement(derived);
        setError(null);
      } else {
        setError(errorMessage);
        setEntitlement(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [user, isSupabaseConfigured, deriveEntitlementFromUser]);

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
