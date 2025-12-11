import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTenant } from '../contexts/TenantProvider';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'super_admin' | 'wl_user' | 'regular_user';
  productTier?: 'super_admin' | 'whitelabel' | 'smartcrm' | 'sales_maximizer' | 'ai_boost_unlimited' | 'ai_communication' | 'smartcrm_bundle';
  tenantId: string;
  permissions: string[];
  lastActive: string;
  status: 'active' | 'inactive' | 'suspended';
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

  useEffect(() => {
    fetchUserRole();
  }, [tenant]);

  const fetchUserRole = async () => {
    try {
      setIsLoading(true);

      // Get current user with role information
      const response = await fetch('/api/auth/user-role', {
        credentials: 'include',  // Include session cookies for authentication
        headers: {
          'Content-Type': 'application/json',
          ...(tenant ? { 'X-Tenant-ID': tenant.id } : {})
        }
      });

      if (response.ok) {
        const userData = await response.json();
        console.log('✅ User role loaded:', {
          email: userData.user?.email,
          role: userData.user?.role,
          productTier: userData.user?.productTier
        });
        setUser(userData.user);
      } else {
        // Silently handle non-200 responses during development
        console.debug('User role not available:', response.status);
      }
    } catch (error) {
      // Only log significant errors, not network failures during development
      console.debug('User role fetch skipped:', error instanceof Error ? error.message : 'Unknown error');
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

    // Super admin can access everything (including dev bypass)
    if (user.role === 'super_admin' || user.email === 'dev@smartcrm.local') return true;

    // SECURITY: Users with null productTier have NO access to any premium features
    // They must purchase a subscription before accessing anything beyond basic auth
    const productTier = user.productTier;
    if (!productTier) {
      console.warn('🚫 Access denied: User has no product tier. Upgrade required.');
      return false;
    }

    // Resource-specific access control combining role and product tier
    const resourcePermissions: Record<string, string[]> = {
      // Super Admin only
      'admin_dashboard': ['super_admin'],
      'user_management': ['super_admin'], 
      'bulk_import_users': ['super_admin'],
      'system_settings': ['super_admin'],
      'billing_management': ['super_admin'],
      
      // WL Users and Super Admin (legacy)
      'advanced_analytics': ['super_admin', 'wl_user'],
      'custom_branding': ['super_admin', 'wl_user'],
      'api_access': ['super_admin', 'wl_user'],
      'advanced_features': ['super_admin', 'wl_user'],
      
      // Core CRM features - All users
      'dashboard': ['super_admin', 'wl_user', 'regular_user'],
      'contacts': ['super_admin', 'wl_user', 'regular_user'],
      'contacts_csv': ['super_admin', 'wl_user', 'regular_user'],
      'pipeline': ['super_admin', 'wl_user', 'regular_user'],
      'pipeline_csv': ['super_admin', 'wl_user', 'regular_user'],
      'calendar': ['super_admin', 'wl_user', 'regular_user'],
      'communication': ['super_admin', 'wl_user', 'regular_user'],
    };

    // Product tier-based access (7-tier system)
    const productTierAccess: Record<string, string[]> = {
      // Core CRM features - ALL paid tiers get baseline CRM access
      'smartcrm_base': ['super_admin', 'whitelabel', 'smartcrm', 'sales_maximizer', 'ai_boost_unlimited', 'ai_communication', 'smartcrm_bundle'],
      
      // AI Goals & AI Tools - Sales Maximizer and higher tiers
      'ai_goals': ['super_admin', 'whitelabel', 'sales_maximizer', 'ai_boost_unlimited', 'smartcrm_bundle'],
      'ai_tools': ['super_admin', 'whitelabel', 'sales_maximizer', 'ai_boost_unlimited', 'smartcrm_bundle'],
      
      // AI Communication features - AI Communication tier
      'video_email': ['super_admin', 'whitelabel', 'ai_communication', 'smartcrm_bundle'],
      'sms_automation': ['super_admin', 'whitelabel', 'ai_communication', 'smartcrm_bundle'],
      'voip_phone': ['super_admin', 'whitelabel', 'ai_communication', 'smartcrm_bundle'],
      'invoicing': ['super_admin', 'whitelabel', 'ai_communication', 'smartcrm_bundle'],
      'lead_automation': ['super_admin', 'whitelabel', 'ai_communication', 'smartcrm_bundle'],
      'circle_prospecting': ['super_admin', 'whitelabel', 'ai_communication', 'smartcrm_bundle'],
      
      // AI Boost Unlimited - unlimited AI credits (platform-wide)
      'ai_credits_unlimited': ['super_admin', 'whitelabel', 'ai_boost_unlimited', 'smartcrm_bundle'],
      
      // Whitelabel features - Whitelabel tier only
      'whitelabel_branding': ['super_admin', 'whitelabel'],
      'whitelabel_settings': ['super_admin', 'whitelabel'],
    };

    // Check role-based access first
    const allowedRoles = resourcePermissions[resource];
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return false;
    }

    // Check product tier-based access
    const requiredTiers = productTierAccess[resource];
    if (requiredTiers) {
      return requiredTiers.includes(productTier);
    }

    // If resource not explicitly defined, check role permissions
    return allowedRoles ? allowedRoles.includes(user.role) : false;
  };

  const isSuperAdmin = (): boolean => {
    if (!user) return false;
    
    // Super admin emails
    const superAdminEmails = [
      'dev@smartcrm.local',
      'dean@smartcrm.vip',
      'dean@videoremix.io',
      'samuel@videoremix.io',
      'victor@videoremix.io'
    ];
    
    return user.role === 'super_admin' || superAdminEmails.includes(user.email?.toLowerCase());
  };
  
  const hasProductTier = (): boolean => {
    if (!user) return false;
    // Super admins always have access regardless of productTier field
    if (user.role === 'super_admin') return true;
    // Check if user has any valid product tier (not null/undefined)
    return !!user.productTier;
  };
  
  const isWLUser = (): boolean => user?.role === 'wl_user';
  const isRegularUser = (): boolean => user?.role === 'regular_user';

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
  fallback = <div className="p-8 text-center text-red-600">Access Denied</div>
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
  inverse = false
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