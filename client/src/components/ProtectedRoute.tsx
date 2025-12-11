import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
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
 * 1. Checks if user is authenticated (redirects to /signin if not)
 * 2. If requireProductTier=true, ensures user has a valid product tier (redirects to /upgrade if null)
 * 3. If featureKey/resource is provided, checks if user's tier has access to that feature
 * 4. Redirects to /upgrade if user doesn't have required feature access
 * 
 * Usage:
 * <ProtectedRoute>                                        // Auth only
 * <ProtectedRoute requireProductTier>                     // Auth + Any tier required
 * <ProtectedRoute featureKey="contacts">                  // Auth + Feature
 * <ProtectedRoute resource="pipeline" requireProductTier> // Auth + Tier + Feature
 */
const ProtectedRoute = ({ children, featureKey, resource, requireProductTier = false }: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { user: roleUser, isLoading: roleLoading } = useRole();
  const location = useLocation();
  
  // Use either featureKey or resource (resource is alias for backward compatibility)
  const requiredFeature = featureKey || resource;

  // Only pass feature key to hook when user is authenticated (prevents 401s from unauthenticated requests)
  // useFeatureAccess has enabled: !!featureKey internally, so empty string = no network request
  const { data: accessData, isLoading: featureLoading } = useFeatureAccess(
    user && requiredFeature ? requiredFeature : ''
  );

  // Check auth first - show loading or redirect
  if (authLoading || (requireProductTier && roleLoading)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  // Not logged in - redirect to signin (before checking features)
  if (!user) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  // Check product tier requirement - users with null productTier must upgrade
  if (requireProductTier && !roleLoading) {
    // Use hasProductTier from RoleContext which handles super admin check
    const hasTier = roleUser?.role === 'super_admin' || roleUser?.productTier;
    if (!hasTier) {
      return (
        <Navigate 
          to="/upgrade" 
          state={{ 
            from: location,
            reason: 'no_product_tier',
            message: 'Please purchase a subscription to access this feature'
          }} 
          replace 
        />
      );
    }
  }

  // If feature is required, wait for the check to complete
  if (requiredFeature) {
    // Show loading while checking features
    if (featureLoading || accessData === undefined) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner />
        </div>
      );
    }

    const hasAccess = accessData?.hasAccess ?? false;
    
    // No feature access - redirect to upgrade page
    if (!hasAccess) {
      return (
        <Navigate 
          to="/upgrade" 
          state={{ 
            from: location,
            requiredFeature,
            featureName: accessData?.feature?.name || requiredFeature
          }} 
          replace 
        />
      );
    }
  }

  // Has access (or no feature required) - render the protected content
  return <>{children}</>;
};

export default ProtectedRoute;
