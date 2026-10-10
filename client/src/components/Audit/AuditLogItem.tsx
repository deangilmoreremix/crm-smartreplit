import React from 'react';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { AuditAction, AuditActionLabels, ObjectType } from '@smartcrm/shared/permissions/types';
import {
  User,
  Shield,
  Database,
  Mail,
  Eye,
  Edit2,
  Trash2,
  LogIn,
  LogOut,
  Key,
  Download,
  Upload,
  Settings,
  FileText,
} from 'lucide-react';

const ACTION_ICONS: Record<AuditAction, React.ReactNode> = {
  [AuditAction.Create]: <Plus className="h-3 w-3" />,
  [AuditAction.Read]: <Eye className="h-3 w-3" />,
  [AuditAction.Update]: <Edit2 className="h-3 w-3" />,
  [AuditAction.Delete]: <Trash2 className="h-3 w-3" />,
  [AuditAction.Login]: <LogIn className="h-3 w-3" />,
  [AuditAction.Logout]: <LogOut className="h-3 w-3" />,
  [AuditAction.PermissionChange]: <Key className="h-3 w-3" />,
  [AuditAction.RoleChange]: <Shield className="h-3 w-3" />,
  [AuditAction.Export]: <Download className="h-3 w-3" />,
  [AuditAction.Import]: <Upload className="h-3 w-3" />,
  [AuditAction.AdminAction]: <Settings className="h-3 w-3" />,
};

const ACTION_COLORS: Record<AuditAction, string> = {
  [AuditAction.Create]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  [AuditAction.Read]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  [AuditAction.Update]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  [AuditAction.Delete]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  [AuditAction.Login]: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  [AuditAction.Logout]: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  [AuditAction.PermissionChange]:
    'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  [AuditAction.RoleChange]: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  [AuditAction.Export]: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  [AuditAction.Import]: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200',
  [AuditAction.AdminAction]: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
};

interface AuditLogItemProps {
  id: string;
  timestamp: Date;
  userEmail: string;
  action: AuditAction;
  resourceType: ObjectType | 'system';
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  className?: string;
}

export const AuditLogItem: React.FC<AuditLogItemProps> = ({
  id,
  timestamp,
  userEmail,
  action,
  resourceType,
  resourceId,
  details,
  ipAddress,
  className,
}) => {
  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const formatAction = (action: AuditAction): string => {
    return AuditActionLabels[action] || action;
  };

  return (
    <div className={className}>
      <div className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
        <div className={`p-2 rounded-full ${ACTION_COLORS[action]}`}>{ACTION_ICONS[action]}</div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={ACTION_COLORS[action]} variant="outline">
              {formatAction(action)}
            </Badge>
            <span className="text-sm font-medium">
              {resourceType !== 'system' ? resourceType : 'System'}
            </span>
            {resourceId && (
              <span className="text-xs text-muted-foreground truncate">
                #{resourceId.slice(0, 8)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
            <User className="h-3 w-3" />
            <span>{userEmail}</span>
          </div>

          {details && Object.keys(details).length > 0 && (
            <div className="mt-2 p-2 bg-muted/50 rounded text-xs font-mono overflow-x-auto">
              {JSON.stringify(details, null, 2)}
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground">
          <span>{formatDate(timestamp)}</span>
          {ipAddress && <span className="font-mono">{ipAddress}</span>}
        </div>
      </div>
    </div>
  );
};

export default AuditLogItem;
