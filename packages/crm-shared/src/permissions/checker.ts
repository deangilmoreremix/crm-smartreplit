import {
  Role,
  Permission,
  PermissionScope,
  ObjectType,
  ObjectPermission,
  UserRole,
  RoleDefinition,
  DEFAULT_ROLES,
  PermissionCheck,
} from './types';

export class PermissionChecker {
  private userRoles: UserRole[];
  private roleDefinitions: Map<Role, RoleDefinition>;

  constructor(userRoles: UserRole[] = [], roleDefinitions: RoleDefinition[] = DEFAULT_ROLES) {
    this.userRoles = userRoles;
    this.roleDefinitions = new Map(roleDefinitions.map((r) => [r.name, r]));
  }

  canAccess(object: ObjectType, permission: Permission = Permission.Read): PermissionCheck {
    const effectiveRole = this.getEffectiveRole();

    if (!effectiveRole) {
      return { allowed: false, reason: 'No role assigned' };
    }

    const roleDef = this.roleDefinitions.get(effectiveRole.role);
    if (!roleDef) {
      return { allowed: false, reason: 'Unknown role' };
    }

    if (roleDef.permissions.includes(Permission.Admin)) {
      return { allowed: true };
    }

    if (roleDef.permissions.includes(permission)) {
      return { allowed: true };
    }

    const objectPermission = this.getObjectPermission(object);
    if (objectPermission && objectPermission.permissions.includes(permission)) {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: `Missing ${permission} permission for ${object}`,
      requiredPermissions: [permission],
    };
  }

  canRead(object: ObjectType): PermissionCheck {
    return this.canAccess(object, Permission.Read);
  }

  canWrite(object: ObjectType): PermissionCheck {
    return this.canAccess(object, Permission.Write);
  }

  canDelete(object: ObjectType): PermissionCheck {
    return this.canAccess(object, Permission.Delete);
  }

  canAdmin(): PermissionCheck {
    const effectiveRole = this.getEffectiveRole();

    if (!effectiveRole) {
      return { allowed: false, reason: 'No role assigned' };
    }

    const roleDef = this.roleDefinitions.get(effectiveRole.role);
    if (!roleDef) {
      return { allowed: false, reason: 'Unknown role' };
    }

    if (roleDef.permissions.includes(Permission.Admin)) {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: 'Admin permission required',
      requiredPermissions: [Permission.Admin],
    };
  }

  getUserPermissions(): Permission[] {
    const effectiveRole = this.getEffectiveRole();

    if (!effectiveRole) {
      return [];
    }

    const roleDef = this.roleDefinitions.get(effectiveRole.role);
    return roleDef?.permissions || [];
  }

  getUserRole(): Role | null {
    return this.getEffectiveRole()?.role || null;
  }

  getScope(): PermissionScope {
    return this.getEffectiveRole()?.scope || PermissionScope.Tenant;
  }

  getTenantId(): string | null {
    return this.getEffectiveRole()?.tenantId || null;
  }

  isAdmin(): boolean {
    return this.getUserRole() === Role.Admin;
  }

  isManager(): boolean {
    return this.getUserRole() === Role.Manager || this.isAdmin();
  }

  private getEffectiveRole(): UserRole | null {
    if (this.userRoles.length === 0) {
      return null;
    }

    const sortedRoles = [...this.userRoles].sort((a, b) => {
      const roleOrder = { [Role.Admin]: 0, [Role.Manager]: 1, [Role.User]: 2, [Role.Viewer]: 3 };
      return (roleOrder[a.role] || 99) - (roleOrder[b.role] || 99);
    });

    return sortedRoles[0];
  }

  private getObjectPermission(object: ObjectType): ObjectPermission | undefined {
    const effectiveRole = this.getEffectiveRole();
    if (!effectiveRole?.objectPermissions) {
      return undefined;
    }
    return effectiveRole.objectPermissions.find((op) => op.object === object);
  }

  hasPermission(permission: Permission): boolean {
    return this.getUserPermissions().includes(permission);
  }

  hasAnyPermission(permissions: Permission[]): boolean {
    const userPerms = this.getUserPermissions();
    return permissions.some((p) => userPerms.includes(p));
  }

  hasAllPermissions(permissions: Permission[]): boolean {
    const userPerms = this.getUserPermissions();
    return permissions.every((p) => userPerms.includes(p));
  }

  canAccessRecord(object: ObjectType, recordOwnerId: string, userId: string): PermissionCheck {
    const scope = this.getScope();

    if (scope === PermissionScope.Global) {
      return { allowed: true };
    }

    if (scope === PermissionScope.Record) {
      const baseCheck = this.canAccess(object);
      if (!baseCheck.allowed) {
        return baseCheck;
      }

      if (recordOwnerId === userId) {
        return { allowed: true };
      }

      if (this.isManager()) {
        return { allowed: true };
      }

      return {
        allowed: false,
        reason: 'You can only access your own records',
      };
    }

    return this.canAccess(object);
  }
}

export function createPermissionChecker(userRoles: UserRole[]): PermissionChecker {
  return new PermissionChecker(userRoles);
}

export function checkPermission(
  userRoles: UserRole[],
  object: ObjectType,
  permission: Permission
): PermissionCheck {
  const checker = new PermissionChecker(userRoles);
  return checker.canAccess(object, permission);
}

export function getUserRoleLevel(role: Role): number {
  const levels: Record<Role, number> = {
    [Role.Admin]: 100,
    [Role.Manager]: 75,
    [Role.User]: 50,
    [Role.Viewer]: 25,
  };
  return levels[role] || 0;
}

export function hasElevatedRole(roles: UserRole[], comparedTo: Role): boolean {
  if (roles.length === 0) return false;

  const checker = new PermissionChecker(roles);
  const userLevel = getUserRoleLevel(checker.getUserRole() || Role.Viewer);
  const comparedLevel = getUserRoleLevel(comparedTo);

  return userLevel > comparedLevel;
}
