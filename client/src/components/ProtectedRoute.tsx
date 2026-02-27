import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useFeatureAccess } from '../hooks/useFeatures';
import { useRole } from './RoleBasedAccess';
import { LoadingSpinner } from './ui/LoadingSpinner';

interface ProtectedRouteProps {
  children: ReactNode;
  featureKey?: string; // Optional feature key for tier-based access control
  resource?: string; // Alias for featureKey (legacy support)
  requireProductTier?: boolean; // If true, requires user to have ANY valid product tier (not null)
}

/**
 * ProtectedRoute - Enforces authentication and product tier-based access control
 *
 * This component:
 * 1. Waits for session resolution before making any routing decisions
 * 2. Preserves the intended destination in navigation state
 * 3. Never redirects prematurely (waits for isSessionReady)
 * 4. Never creates redirect loops (checks current path before redirecting)
 * 5. Handles edge cases:
 *    - User signs out in another tab
 *    - Refresh on protected page
 *    - Expired token on load
 *    - Network temporarily offline
 *
 * Usage:
 * <ProtectedRoute>                                        // Auth only
 * <ProtectedRoute requireProductTier>                     // Auth + Any tier required
 * <ProtectedRoute featureKey="contacts">                  // Auth + Feature
 * <ProtectedRoute resource="pipeline" requireProductTier> // Auth + Tier + Feature
 */
const ProtectedRoute = ({
  children,
  featureKey,
  resource,
  requireProductTier = false,
}: ProtectedRouteProps) => {
  const {
    user,
    loading: authLoading,
    isSessionReady,
    isAuthenticated,
    isOffline,
    session,
  } = useAuth();
  const { user: roleUser, isLoading: roleLoading } = useRole();
  const location = useLocation();
  const navigate = useNavigate();

  // Track if we've made a routing decision to prevent flicker
  const [routingDecision, setRoutingDecision] = useState<'pending' | 'allow' | 'redirect'>(
    'pending'
  );

  // Use either featureKey or resource (resource is alias for backward compatibility)
  const requiredFeature = featureKey || resource;

  // Only pass feature key to hook when user is authenticated
  const { data: accessData, isLoading: featureLoading } = useFeatureAccess(
    user && requiredFeature ? requiredFeature : ''
  );

  /**
   * Wait for session to be ready before making any decisions
   * This prevents premature redirects and page flicker
   */
  useEffect(() => {
    // Don't make any decisions until session is ready
    if (!isSessionReady) {
      return;
    }

    // If offline and no cached user, show offline message
    if (isOffline && !user) {
      // Could render an offline fallback here
      return;
    }

    // Session is ready but user is not authenticated
    if (!user && !authLoading) {
      // Check if we're not already on the signin page to prevent loops
      if (location.pathname !== '/signin' && location.pathname !== '/signup') {
        setRoutingDecision('redirect');
        // Use Navigate component instead of imperative navigation
      }
      return;
    }

    // User is authenticated
    if (user && isAuthenticated) {
      // Check if session is valid (not expired)
      if (session?.expires_at) {
        const now = Math.floor(Date.now() / 1000);
        if (session.expires_at < now) {
          // Session expired - will be handled by auth context
          return;
        }
      }

      // All checks passed - allow access
      setRoutingDecision('allow');
    }
  }, [isSessionReady, user, authLoading, isAuthenticated, isOffline, session, location.pathname]);

  // Show loading state while session is being resolved
  if (!isSessionReady || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner message="Verifying session..." />
      </div>
    );
  }

  // Show loading while role data is being fetched (if required)
  if (requireProductTier && roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner message="Checking access..." />
      </div>
    );
  }

  // Not authenticated - redirect to signin with preserved destination
  if (!user || !isAuthenticated) {
    // Prevent redirect loops
    if (location.pathname === '/signin' || location.pathname === '/signup') {
      return <>{children}</>;
    }

    return (
      <Navigate
        to="/signin"
        state={{
          from: {
            pathname: location.pathname,
            search: location.search,
          },
          message: 'Please sign in to access this page',
        }}
        replace
      />
    );
  }

  // Check product tier requirement
  if (requireProductTier && !roleLoading) {
    const hasTier = roleUser?.role === 'super_admin' || roleUser?.productTier;
    if (!hasTier) {
      return (
        <Navigate
          to="/upgrade"
          state={{
            from: {
              pathname: location.pathname,
              search: location.search,
            },
            reason: 'no_product_tier',
            message: 'Please purchase a subscription to access this feature',
          }}
          replace
        />
      );
    }
  }

  // Check feature access if required
  if (requiredFeature) {
    // Show loading while checking feature access
    if (featureLoading || accessData === undefined) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner message="Checking feature access..." />
        </div>
      );
    }

    const hasAccess = accessData?.hasAccess ?? false;

    if (!hasAccess) {
      return (
        <Navigate
          to="/upgrade"
          state={{
            from: {
              pathname: location.pathname,
              search: location.search,
            },
            requiredFeature,
            featureName: accessData?.feature?.name || requiredFeature,
          }}
          replace
        />
      );
    }
  }

  // All checks passed - render the protected content
  return <>{children}</>;
};

export default ProtectedRoute;
