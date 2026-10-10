import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useToast } from '../../hooks/use-toast';
import { useAuth } from '../../contexts/AuthContext';
import { Role, Permission, DEFAULT_ROLES, ObjectType } from '@smartcrm/shared/permissions/types';
import { Shield, Users, User, Eye, Plus, Trash2, Edit2, Check, X } from 'lucide-react';

const ROLE_ICONS: Record<Role, React.ReactNode> = {
  [Role.Admin]: <Shield className="h-4 w-4" />,
  [Role.Manager]: <Users className="h-4 w-4" />,
  [Role.User]: <User className="h-4 w-4" />,
  [Role.Viewer]: <Eye className="h-4 w-4" />,
};

const ROLE_COLORS: Record<Role, string> = {
  [Role.Admin]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  [Role.Manager]: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  [Role.User]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  [Role.Viewer]: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
};

interface UserWithRoles {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: Role;
}

interface RoleManagerProps {
  onRoleChange?: (userId: string, newRole: Role) => void;
  className?: string;
}

export const RoleManager: React.FC<RoleManagerProps> = ({ onRoleChange, className }) => {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  useEffect(() => {
    fetchUsersWithRoles();
  }, []);

  const fetchUsersWithRoles = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/users', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        throw new Error('Failed to fetch users');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleUpdate = async (userId: string, newRole: Role) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        throw new Error('Failed to update role');
      }

      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));

      onRoleChange?.(userId, newRole);

      toast({
        title: 'Success',
        description: `Role updated to ${newRole}`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setEditingUserId(null);
      setSelectedRole(null);
    }
  };

  const startEditing = (user: UserWithRoles) => {
    setEditingUserId(user.id);
    setSelectedRole(user.role || Role.User);
  };

  const cancelEditing = () => {
    setEditingUserId(null);
    setSelectedRole(null);
  };

  const getRoleLabel = (role: Role): string => {
    return DEFAULT_ROLES.find((r) => r.name === role)?.label || role;
  };

  const getRoleDescription = (role: Role): string => {
    return DEFAULT_ROLES.find((r) => r.name === role)?.description || '';
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Role Manager
        </CardTitle>
        <CardDescription>Assign and manage user roles across your organization</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border rounded-lg divide-y">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No users found</div>
          ) : (
            users.map((user) => (
              <div
                key={user.id}
                className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {user.firstName && user.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : user.email}
                    </span>
                    <span className="text-sm text-muted-foreground">{user.email}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {editingUserId === user.id ? (
                    <>
                      <Select
                        value={selectedRole || undefined}
                        onValueChange={(value) => setSelectedRole(value as Role)}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {DEFAULT_ROLES.map((roleDef) => (
                            <SelectItem key={roleDef.id} value={roleDef.name}>
                              <div className="flex items-center gap-2">
                                {ROLE_ICONS[roleDef.name]}
                                <span>{roleDef.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => selectedRole && handleRoleUpdate(user.id, selectedRole)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={cancelEditing}>
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Badge className={ROLE_COLORS[user.role || Role.User]}>
                        <span className="flex items-center gap-1">
                          {ROLE_ICONS[user.role || Role.User]}
                          {getRoleLabel(user.role || Role.User)}
                        </span>
                      </Badge>
                      {currentUser?.id !== user.id && (
                        <Button size="sm" variant="ghost" onClick={() => startEditing(user)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border rounded-lg p-4 bg-muted/30">
          <h4 className="font-medium mb-3">Role Definitions</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {DEFAULT_ROLES.map((roleDef) => (
              <div key={roleDef.id} className="flex items-start gap-3 p-2">
                <div className={ROLE_COLORS[roleDef.name]}>{ROLE_ICONS[roleDef.name]}</div>
                <div>
                  <div className="font-medium text-sm">{roleDef.label}</div>
                  <div className="text-xs text-muted-foreground">{roleDef.description}</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {roleDef.permissions.map((perm) => (
                      <Badge key={perm} variant="outline" className="text-xs">
                        {perm}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RoleManager;
