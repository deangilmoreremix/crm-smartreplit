export enum Role {
  Admin = 'admin',
  Manager = 'manager',
  User = 'user',
  Viewer = 'viewer',
}

export enum Permission {
  Read = 'read',
  Write = 'write',
  Delete = 'delete',
  Admin = 'admin',
}

export enum PermissionScope {
  Global = 'global',
  Tenant = 'tenant',
  Record = 'record',
}

export type ObjectType =
  | 'contacts'
  | 'deals'
  | 'tasks'
  | 'accounts'
  | 'reports'
  | 'settings'
  | 'users'
  | 'workflows';

export interface ObjectPermission {
  object: ObjectType;
  role: Role;
  permissions: Permission[];
}

export interface UserRole {
  id: string;
  tenantId: string;
  userId: string;
  role: Role;
  scope: PermissionScope;
  objectPermissions?: ObjectPermission[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RoleDefinition {
  id: string;
  name: Role;
  label: string;
  description: string;
  icon?: string;
  isSystem: boolean;
  permissions: Permission[];
  objectPermissions?: ObjectPermission[];
}

export const DEFAULT_ROLES: RoleDefinition[] = [
  {
    id: 'admin',
    name: Role.Admin,
    label: 'Administrator',
    description: 'Full access to all resources and settings',
    icon: 'shield',
    isSystem: true,
    permissions: [Permission.Read, Permission.Write, Permission.Delete, Permission.Admin],
  },
  {
    id: 'manager',
    name: Role.Manager,
    label: 'Manager',
    description: 'Can manage team members and assigned resources',
    icon: 'users',
    isSystem: true,
    permissions: [Permission.Read, Permission.Write, Permission.Delete],
  },
  {
    id: 'user',
    name: Role.User,
    label: 'User',
    description: 'Standard user with read and write access',
    icon: 'user',
    isSystem: true,
    permissions: [Permission.Read, Permission.Write],
  },
  {
    id: 'viewer',
    name: Role.Viewer,
    label: 'Viewer',
    description: 'Read-only access to resources',
    icon: 'eye',
    isSystem: true,
    permissions: [Permission.Read],
  },
];

export interface PermissionCheck {
  allowed: boolean;
  reason?: string;
  requiredPermissions?: Permission[];
  userPermissions?: Permission[];
}

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  userId: string;
  userEmail: string;
  action: AuditAction;
  resourceType: ObjectType | 'system';
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export enum AuditAction {
  Create = 'create',
  Read = 'read',
  Update = 'update',
  Delete = 'delete',
  Login = 'login',
  Logout = 'logout',
  PermissionChange = 'permission_change',
  RoleChange = 'role_change',
  Export = 'export',
  Import = 'import',
  AdminAction = 'admin_action',
}

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  [AuditAction.Create]: 'Created',
  [AuditAction.Read]: 'Viewed',
  [AuditAction.Update]: 'Updated',
  [AuditAction.Delete]: 'Deleted',
  [AuditAction.Login]: 'Logged In',
  [AuditAction.Logout]: 'Logged Out',
  [AuditAction.PermissionChange]: 'Permission Changed',
  [AuditAction.RoleChange]: 'Role Changed',
  [AuditAction.Export]: 'Exported',
  [AuditAction.Import]: 'Imported',
  [AuditAction.AdminAction]: 'Admin Action',
};
