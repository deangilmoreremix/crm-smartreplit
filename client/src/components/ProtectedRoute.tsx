import { ReactNode, useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { EntitlementContext } from '../contexts/EntitlementContext';
import { canAccessFeature, getFeatureForRoute } from '../types/entitlements';
import { LoadingSpinner } from './ui/LoadingSpinner';

interface ProtectedRouteProps {
  children: ReactNode;
  featureKey?: string | FeatureKey;
}

/**
 * ProtectedRoute - Enforces authentication and feature-based access control
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
 * <ProtectedRoute>                             // Auth only
 * <ProtectedRoute featureKey="contacts">       // Auth + specific feature required
 * <ProtectedRoute featureKey={FeatureKey.AI_TOOLS}> // Using enum
 */
const ProtectedRoute = ({ children, featureKey }: ProtectedRouteProps) => {
  const { user, loading: authLoading, isSessionReady, isAuthenticated } = useAuth();
  const entitlementContext = useContext(EntitlementContext);
  const entitlement = entitlementContext?.entitlement;
  const entitlementsLoading = entitlementContext?.isLoading ?? false;
  const location = useLocation();

  // Show loading while session resolves
  if (!isSessionReady || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner message="Verifying session..." />
      </div>
    );
  }

  // Show loading while entitlements are being fetched (if feature check required)
  if (featureKey && entitlementsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner message="Checking feature access..." />
      </div>
    );
  }

  // Not authenticated - redirect
  if (!user || !isAuthenticated) {
    if (location.pathname === '/signin' || location.pathname === '/signup') {
      return <>{children}</>;
    }

    return (
      <Navigate
        to="/signin"
        state={{
          from: { pathname: location.pathname, search: location.search },
          message: 'Please sign in to access this page',
        }}
        replace
      />
    );
  }

  // Check feature access if required
  if (featureKey) {
    const hasAccess = canAccessFeature(entitlement, featureKey);

    if (!hasAccess) {
      return (
        <Navigate
          to="/upgrade"
          state={{
            from: { pathname: location.pathname, search: location.search },
            requiredFeature: featureKey,
            featureName: featureKey,
          }}
          replace
        />
      );
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
