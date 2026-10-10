import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { PermissionChecker, Permission, ObjectType } from '@smartcrm/shared/permissions';
import { Role, PermissionScope, UserRole } from '@smartcrm/shared/permissions/types';
import { cn } from '../../lib/utils';

interface PermissionGateProps {
  permission?: Permission;
  object?: ObjectType;
  role?: Role;
  requireAll?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  showDisabled?: boolean;
  onUnauthorized?: () => void;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  permission,
  object,
  role,
  requireAll = false,
  fallback = null,
  children,
  className,
  showDisabled = false,
  onUnauthorized,
}) => {
  const { user } = useAuth();

  const checkAccess = (): boolean => {
    if (!user) return false;

    const userRoles: UserRole[] =
      user.user_roles?.map((ur: any) => ({
        id: ur.id,
        tenantId: ur.tenant_id || '',
        userId: ur.user_id || user.id,
        role: (ur.role?.toLowerCase() as Role) || Role.User,
        scope: PermissionScope.Tenant,
        createdAt: new Date(ur.created_at),
        updatedAt: new Date(ur.updated_at),
      })) || [];

    const checker = new PermissionChecker(userRoles);

    if (role) {
      const userRole = checker.getUserRole();
      const roleLevels: Record<Role, number> = {
        [Role.Viewer]: 1,
        [Role.User]: 2,
        [Role.Manager]: 3,
        [Role.Admin]: 4,
      };
      const hasRole = userRole && roleLevels[userRole] >= roleLevels[role];
      if (!hasRole) {
        onUnauthorized?.();
        return false;
      }
    }

    if (permission && object) {
      const result = checker.canAccess(object, permission);
      if (!result.allowed) {
        onUnauthorized?.();
        return showDisabled ? true : false;
      }
    }

    if (permission && !object) {
      const hasPermission = checker.hasPermission(permission);
      if (!hasPermission) {
        onUnauthorized?.();
        return showDisabled ? true : false;
      }
    }

    return true;
  };

  const hasAccess = checkAccess();

  if (!hasAccess && !showDisabled) {
    return <>{fallback}</>;
  }

  return (
    <div className={cn(hasAccess ? '' : 'opacity-50 pointer-events-none', className)}>
      {children}
    </div>
  );
};

interface RequirePermissionProps {
  permission: Permission;
  object?: ObjectType;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RequirePermission: React.FC<RequirePermissionProps> = ({
  permission,
  object,
  children,
  fallback = null,
}) => (
  <PermissionGate permission={permission} object={object} fallback={fallback}>
    {children}
  </PermissionGate>
);

interface RequireRoleProps {
  role: Role;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RequireRole: React.FC<RequireRoleProps> = ({ role, children, fallback = null }) => (
  <PermissionGate role={role} fallback={fallback}>
    {children}
  </PermissionGate>
);

interface RequireAdminProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RequireAdmin: React.FC<RequireAdminProps> = ({ children, fallback = null }) => (
  <PermissionGate role={Role.Admin} fallback={fallback}>
    {children}
  </PermissionGate>
);

interface RequireManagerProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RequireManager: React.FC<RequireManagerProps> = ({ children, fallback = null }) => (
  <PermissionGate role={Role.Manager} fallback={fallback}>
    {children}
  </PermissionGate>
);
