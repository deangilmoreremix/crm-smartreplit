import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { useAuth } from '../../contexts/AuthContext';
import { PermissionChecker, PermissionScope } from '@smartcrm/shared/permissions';
import { Role, Permission, DEFAULT_ROLES, ObjectType } from '@smartcrm/shared/permissions/types';
import { Shield, Users, User, Eye, Key, Globe, Building, FileText } from 'lucide-react';

const ROLE_ICONS: Record<Role, React.ReactNode> = {
  [Role.Admin]: <Shield className="h-4 w-4" />,
  [Role.Manager]: <Users className="h-4 w-4" />,
  [Role.User]: <User className="h-4 w-4" />,
  [Role.Viewer]: <Eye className="h-4 w-4" />,
};

const SCOPE_ICONS: Record<PermissionScope, React.ReactNode> = {
  [PermissionScope.Global]: <Globe className="h-4 w-4" />,
  [PermissionScope.Tenant]: <Building className="h-4 w-4" />,
  [PermissionScope.Record]: <FileText className="h-4 w-4" />,
};

const PERMISSION_ICONS: Record<Permission, React.ReactNode> = {
  [Permission.Read]: <Eye className="h-3 w-3" />,
  [Permission.Write]: <Key className="h-3 w-3" />,
  [Permission.Delete]: <Shield className="h-3 w-3" />,
  [Permission.Admin]: <Shield className="h-3 w-3" />,
};

const ROLE_COLORS: Record<Role, string> = {
  [Role.Admin]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  [Role.Manager]: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  [Role.User]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  [Role.Viewer]: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
};

const OBJECT_LABELS: Record<ObjectType, string> = {
  contacts: 'Contacts',
  deals: 'Deals',
  tasks: 'Tasks',
  accounts: 'Accounts',
  reports: 'Reports',
  settings: 'Settings',
  users: 'Users',
  workflows: 'Workflows',
};

interface UserPermissionsProps {
  userId?: string;
  className?: string;
  compact?: boolean;
}

export const UserPermissions: React.FC<UserPermissionsProps> = ({
  userId,
  className,
  compact = false,
}) => {
  const { user: authUser } = useAuth();
  const user = authUser;

  if (!user) {
    return null;
  }

  const userRoles =
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
  const userRole = checker.getUserRole();
  const permissions = checker.getUserPermissions();
  const scope = checker.getScope();
  const tenantId = checker.getTenantId();
  const isAdmin = checker.isAdmin();
  const isManager = checker.isManager();

  if (compact) {
    return (
      <div className={className}>
        {userRole && (
          <Badge className={ROLE_COLORS[userRole]}>
            <span className="flex items-center gap-1">
              {ROLE_ICONS[userRole]}
              {DEFAULT_ROLES.find((r) => r.name === userRole)?.label}
            </span>
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Your Permissions
        </CardTitle>
        <CardDescription>View your current role and access permissions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              {userRole && ROLE_ICONS[userRole]}
              <span className="text-sm font-medium text-muted-foreground">Role</span>
            </div>
            <div className="flex items-center gap-2">
              {userRole && (
                <Badge className={ROLE_COLORS[userRole]}>
                  {DEFAULT_ROLES.find((r) => r.name === userRole)?.label}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {DEFAULT_ROLES.find((r) => r.name === userRole)?.description}
            </p>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              {SCOPE_ICONS[scope]}
              <span className="text-sm font-medium text-muted-foreground">Scope</span>
            </div>
            <div className="font-medium capitalize">{scope}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {scope === PermissionScope.Global && 'Access to all resources globally'}
              {scope === PermissionScope.Tenant && 'Access limited to your organization'}
              {scope === PermissionScope.Record && 'Access limited to owned records'}
            </p>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4" />
              <span className="text-sm font-medium text-muted-foreground">Access Level</span>
            </div>
            <div className="flex gap-2">
              {isAdmin && <Badge variant="destructive">Admin</Badge>}
              {isManager && !isAdmin && <Badge variant="default">Manager</Badge>}
              {!isAdmin && !isManager && <Badge variant="secondary">Standard</Badge>}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {isAdmin
                ? 'Full system access'
                : isManager
                  ? 'Team and resource management'
                  : 'Standard user access'}
            </p>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Key className="h-4 w-4" />
            Permissions
          </h4>
          <div className="flex flex-wrap gap-2">
            {permissions.map((permission) => (
              <Badge key={permission} variant="outline" className="px-3 py-1">
                <span className="flex items-center gap-1">
                  {PERMISSION_ICONS[permission]}
                  {permission}
                </span>
              </Badge>
            ))}
            {permissions.length === 0 && (
              <span className="text-sm text-muted-foreground">No specific permissions</span>
            )}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Role Capabilities
          </h4>
          <div className="border rounded-lg divide-y">
            {DEFAULT_ROLES.filter((r) => r.name === userRole).map((roleDef) => (
              <div key={roleDef.id} className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Badge className={ROLE_COLORS[roleDef.name]}>
                    <span className="flex items-center gap-1">
                      {ROLE_ICONS[roleDef.name]}
                      {roleDef.label}
                    </span>
                  </Badge>
                  <span className="text-sm text-muted-foreground">{roleDef.description}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {roleDef.permissions.map((perm) => (
                    <Badge
                      key={perm}
                      className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    >
                      {PERMISSION_ICONS[perm]}
                      <span className="ml-1">{perm}</span>
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {tenantId && <div className="text-xs text-muted-foreground">Tenant ID: {tenantId}</div>}
      </CardContent>
    </Card>
  );
};

export default UserPermissions;
