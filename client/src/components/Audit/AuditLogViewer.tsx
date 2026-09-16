import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useToast } from '../../hooks/use-toast';
import { AuditLogItem } from './AuditLogItem';
import { AuditAction, ObjectType } from '@smartcrm/shared/permissions/types';
import {
  Shield,
  Search,
  Filter,
  Calendar,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Download,
  Activity,
} from 'lucide-react';

interface AuditLog {
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

interface AuditLogsResponse {
  logs: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface AuditLogViewerProps {
  className?: string;
  pageSize?: number;
  showFilters?: boolean;
  showExport?: boolean;
  resourceType?: ObjectType;
  userId?: string;
}

const ACTION_OPTIONS = [
  { value: AuditAction.Create, label: 'Create' },
  { value: AuditAction.Read, label: 'Read' },
  { value: AuditAction.Update, label: 'Update' },
  { value: AuditAction.Delete, label: 'Delete' },
  { value: AuditAction.Login, label: 'Login' },
  { value: AuditAction.Logout, label: 'Logout' },
  { value: AuditAction.PermissionChange, label: 'Permission Change' },
  { value: AuditAction.RoleChange, label: 'Role Change' },
  { value: AuditAction.Export, label: 'Export' },
  { value: AuditAction.Import, label: 'Import' },
  { value: AuditAction.AdminAction, label: 'Admin Action' },
];

const RESOURCE_OPTIONS = [
  { value: 'all', label: 'All Resources' },
  { value: 'contacts', label: 'Contacts' },
  { value: 'deals', label: 'Deals' },
  { value: 'tasks', label: 'Tasks' },
  { value: 'accounts', label: 'Accounts' },
  { value: 'users', label: 'Users' },
  { value: 'workflows', label: 'Workflows' },
  { value: 'system', label: 'System' },
];

export const AuditLogViewer: React.FC<AuditLogViewerProps> = ({
  className,
  pageSize = 20,
  showFilters = true,
  showExport = true,
  resourceType,
  userId,
}) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    action: '' as AuditAction | '',
    resourceType: resourceType || ('' as ObjectType | ''),
    userId: userId || '',
    search: '',
    dateFrom: '',
    dateTo: '',
  });
  const { toast } = useToast();

  const fetchAuditLogs = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
      });

      if (filters.action) queryParams.set('action', filters.action);
      if (filters.resourceType && filters.resourceType !== 'all')
        queryParams.set('resourceType', filters.resourceType);
      if (filters.userId) queryParams.set('userId', filters.userId);
      if (filters.search) queryParams.set('search', filters.search);
      if (filters.dateFrom) queryParams.set('dateFrom', filters.dateFrom);
      if (filters.dateTo) queryParams.set('dateTo', filters.dateTo);

      const response = await fetch(`/api/admin/audit-logs?${queryParams}`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data: AuditLogsResponse = await response.json();
        setLogs(
          data.logs.map((log) => ({
            ...log,
            timestamp: new Date(log.timestamp),
          }))
        );
        setTotalPages(data.totalPages);
        setTotal(data.total);
      } else {
        throw new Error('Failed to fetch audit logs');
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
  }, [page, pageSize, filters, toast]);

  useEffect(() => {
    fetchAuditLogs();
  }, [page, filters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({
      action: '',
      resourceType: resourceType || '',
      userId: userId || '',
      search: '',
      dateFrom: '',
      dateTo: '',
    });
    setPage(1);
  };

  const handleExport = async () => {
    try {
      const queryParams = new URLSearchParams({
        export: 'true',
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== '')),
      });

      const response = await fetch(`/api/admin/audit-logs?${queryParams}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: 'Success',
          description: 'Audit logs exported successfully',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to export audit logs',
        variant: 'destructive',
      });
    }
  };

  const hasActiveFilters =
    filters.action ||
    filters.resourceType ||
    filters.userId ||
    filters.search ||
    filters.dateFrom ||
    filters.dateTo;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Audit Log
            </CardTitle>
            <CardDescription>Monitor all administrative actions and system events</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{total} entries</Badge>
            {showExport && (
              <Button size="sm" variant="outline" onClick={handleExport}>
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showFilters && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button variant="outline" onClick={() => fetchAuditLogs()} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <Select
                value={filters.action}
                onValueChange={(value) => handleFilterChange('action', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Actions</SelectItem>
                  {ACTION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.resourceType || 'all'}
                onValueChange={(value) => handleFilterChange('resourceType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Resources" />
                </SelectTrigger>
                <SelectContent>
                  {RESOURCE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                type="date"
                placeholder="From Date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              />

              <Input
                type="date"
                placeholder="To Date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              />
            </div>

            {hasActiveFilters && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Showing filtered results</span>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <Filter className="h-4 w-4 mr-1" />
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        )}

        <div className="space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              Loading audit logs...
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border rounded-lg">
              <Shield className="h-12 w-12 mb-3 opacity-20" />
              <p>No audit logs found</p>
              {hasActiveFilters && (
                <Button variant="link" onClick={clearFilters} className="mt-2">
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <>
              {logs.map((log) => (
                <AuditLogItem
                  key={log.id}
                  id={log.id}
                  timestamp={log.timestamp}
                  userEmail={log.userEmail}
                  action={log.action}
                  resourceType={log.resourceType}
                  resourceId={log.resourceId}
                  details={log.details}
                  ipAddress={log.ipAddress}
                />
              ))}
            </>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AuditLogViewer;
