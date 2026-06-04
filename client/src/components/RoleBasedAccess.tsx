import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTenant } from '../contexts/TenantProvider';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { canAccessFeature, FeatureKey } from '../types/entitlements';
import { EntitlementContext } from '../contexts/EntitlementContext';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'super_admin' | 'wl_user' | 'regular_user';
  productTier?: string;
  tenantId: string;
  permissions: string[];
  lastActive: string;
  status: 'active' | 'inactive' | 'suspended';
  entitlement?: {
    package: 'no_access' | 'regular' | 'smartmarketer' | 'whitelabel' | 'super_admin';
    openclaw_enabled: boolean;
    admin_enabled: boolean;
  };
}

interface RoleContextType {
  user: User | null;
  isLoading: boolean;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  canAccess: (resource: string) => boolean;
  hasProductTier: () => boolean; // Returns true if user has ANY valid product tier (not null)
  isSuperAdmin: () => boolean;
  isWLUser: () => boolean;
  isRegularUser: () => boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const useRole = () => {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};

interface RoleProviderProps {
  children: React.ReactNode;
}

export const RoleProvider: React.FC<RoleProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { tenant } = useTenant();
  const { user: authUser } = useAuth(); // Get auth user
  const entitlementContext = useContext(EntitlementContext);
  const entitlement = entitlementContext?.entitlement;
  const entitlementsLoading = entitlementContext?.isLoading ?? false;

  useEffect(() => {
    fetchUserRole();
  }, [tenant, authUser, entitlement]);

  const fetchUserRole = async () => {
    try {
      setIsLoading(true);

      // Wait for auth user to be available
      if (!authUser) {
        setIsLoading(false);
        return;
      }

      // Get profile from Supabase
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) {
        console.debug('Profile fetch error:', error);
        setIsLoading(false);
        return;
      }

      if (profile) {
        const userData: User = {
          id: profile.id,
          email: authUser.email || '',
          firstName: profile.first_name || '',
          lastName: profile.last_name || '',
          role: profile.role || 'regular_user',
          productTier: profile.product_tier,
          tenantId: tenant?.id || 'default',
          permissions: [], // Using entitlements-based permissions now
          lastActive: new Date().toISOString(),
          status: 'active',
          // Attach entitlement data for feature gating
          entitlement: entitlement
            ? {
                package: entitlement.package as any,
                openclaw_enabled: entitlement.openclaw_enabled,
                admin_enabled: entitlement.admin_enabled,
              }
            : undefined,
        };

        setUser(userData);
      }
    } catch (error) {
      console.debug(
        'User role fetch skipped:',
        error instanceof Error ? error.message : 'Unknown error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    return user.permissions.includes(permission) || user.role === 'super_admin';
  };

  const hasRole = (role: string): boolean => {
    if (!user) return false;
    return user.role === role;
  };

  const canAccess = (resource: string): boolean => {
    if (!user) return false;

    // Super admin always has access
    if (user.role === 'super_admin') return true;

    // Use entitlement-based feature gating
    if (user.entitlement) {
      return canAccessFeature(user.entitlement, resource);
    }

    // No entitlements yet - deny (will be granted after entitlement loads)
    return false;
  };

  const isSuperAdmin = (): boolean => {
    if (!user) return false;
    return user.role === 'super_admin' || user.entitlement?.package === 'super_admin';
  };

  const hasProductTier = (): boolean => {
    if (!user?.entitlement) return false;
    // Consider any paid package as having product tier
    const paidPackages: Array<'smartmarketer' | 'whitelabel' | 'super_admin'> = [
      'smartmarketer',
      'whitelabel',
      'super_admin',
    ];
    return paidPackages.includes(user.entitlement.package);
  };

  const isWLUser = (): boolean => user?.entitlement?.package === 'whitelabel';
  const isRegularUser = (): boolean => user?.entitlement?.package === 'regular';

  return (
    <RoleContext.Provider
      value={{
        user,
        isLoading,
        hasPermission,
        hasRole,
        canAccess,
        hasProductTier,
        isSuperAdmin,
        isWLUser,
        isRegularUser,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
};

// HOC for protecting routes based on roles
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  requiredPermission?: string;
  resource?: string;
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requiredPermission,
  resource,
  fallback = <div className="p-8 text-center text-red-600">Access Denied</div>,
}) => {
  const { user, isLoading, hasRole, hasPermission, canAccess } = useRole();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return fallback;
  }

  // Check role-based access
  if (requiredRole && !hasRole(requiredRole)) {
    return fallback;
  }

  // Check permission-based access
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return fallback;
  }

  // Check resource-based access
  if (resource && !canAccess(resource)) {
    return fallback;
  }

  return <>{children}</>;
};

// Component for conditional rendering based on permissions
interface ConditionalRenderProps {
  children: React.ReactNode;
  role?: string;
  permission?: string;
  resource?: string;
  inverse?: boolean;
}

export const ConditionalRender: React.FC<ConditionalRenderProps> = ({
  children,
  role,
  permission,
  resource,
  inverse = false,
}) => {
  const { hasRole, hasPermission, canAccess } = useRole();

  let hasAccess = true;

  if (role) {
    hasAccess = hasAccess && hasRole(role);
  }

  if (permission) {
    hasAccess = hasAccess && hasPermission(permission);
  }

  if (resource) {
    hasAccess = hasAccess && canAccess(resource);
  }

  // Apply inverse logic if needed
  if (inverse) {
    hasAccess = !hasAccess;
  }

  return hasAccess ? <>{children}</> : null;
};

// Role badge component
interface RoleBadgeProps {
  role: string;
  className?: string;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, className = '' }) => {
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'partner_admin':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'customer_admin':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'end_user':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'Super Admin';
      case 'partner_admin':
        return 'Partner Admin';
      case 'customer_admin':
        return 'Customer Admin';
      case 'end_user':
        return 'End User';
      default:
        return role;
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleColor(role)} ${className}`}
    >
      {getRoleLabel(role)}
    </span>
  );
};

// Permission checker hook
export const usePermissions = () => {
  const { user, hasPermission, hasRole, canAccess } = useRole();

  return {
    user,
    can: hasPermission,
    is: hasRole,
    canAccess,
    permissions: user?.permissions || [],
    role: user?.role || null,
  };
};

export default RoleProvider;
