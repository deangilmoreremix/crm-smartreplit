import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { useToast } from '../hooks/use-toast';
import { Search, Filter, Calendar, User, Shield, Database, Mail, RefreshCw } from 'lucide-react';

interface AuditLog {
  id: number;
  adminId: string;
  adminEmail: string;
  action: string;
  targetUserId: string | null;
  targetUserEmail: string | null;
  details: any;
  ipAddress: string;
  createdAt: string;
}

interface AuditLogsResponse {
  logs: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const ACTION_ICONS = {
  USER_CREATE: User,
  USER_UPDATE: User,
  USER_DELETE: User,
  BULK_IMPORT: Database,
  ROLE_CHANGE: Shield,
  TIER_CHANGE: Shield,
  EMAIL_SEND: Mail,
};

const ACTION_COLORS = {
  USER_CREATE: 'bg-green-100 text-green-800',
  USER_UPDATE: 'bg-blue-100 text-blue-800',
  USER_DELETE: 'bg-red-100 text-red-800',
  BULK_IMPORT: 'bg-purple-100 text-purple-800',
  ROLE_CHANGE: 'bg-orange-100 text-orange-800',
  TIER_CHANGE: 'bg-yellow-100 text-yellow-800',
  EMAIL_SEND: 'bg-cyan-100 text-cyan-800',
};

export default function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    action: '',
    userId: '',
    dateFrom: '',
    dateTo: '',
  });
  const { toast } = useToast();

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '')
        )
      });

      const response = await fetch(`/api/admin/audit-logs?${queryParams}`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data: AuditLogsResponse = await response.json();
        setLogs(data.logs);
        setTotalPages(data.totalPages);
      } else {
        throw new Error('Failed to fetch audit logs');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [page, filters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setFilters({
      action: '',
      userId: '',
      dateFrom: '',
      dateTo: '',
    });
    setPage(1);
  };

  const formatAction = (action: string) => {
    return action.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Audit Log Viewer
          </CardTitle>
          <CardDescription>
            Monitor all administrative actions and system events
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Select value={filters.action} onValueChange={(value) => handleFilterChange('action', value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Actions</SelectItem>
                <SelectItem value="USER_CREATE">User Create</SelectItem>
                <SelectItem value="USER_UPDATE">User Update</SelectItem>
                <SelectItem value="USER_DELETE">User Delete</SelectItem>
                <SelectItem value="BULK_IMPORT">Bulk Import</SelectItem>
                <SelectItem value="ROLE_CHANGE">Role Change</SelectItem>
                <SelectItem value="TIER_CHANGE">Tier Change</SelectItem>
                <SelectItem value="EMAIL_SEND">Email Send</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Target User ID"
              value={filters.userId}
              onChange={(e) => handleFilterChange('userId', e.target.value)}
            />

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

            <Button onClick={clearFilters} variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>

          {/* Logs Table */}
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Admin
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Target
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                        Loading audit logs...
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                        No audit logs found
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => {
                      const Icon = ACTION_ICONS[log.action as keyof typeof ACTION_ICONS] || Shield;
                      return (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Icon className="h-4 w-4 mr-2 text-gray-400" />
                              <Badge className={ACTION_COLORS[log.action as keyof typeof ACTION_COLORS] || 'bg-gray-100 text-gray-800'}>
                                {formatAction(log.action)}
                              </Badge>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {log.adminEmail}
                            </div>
                            <div className="text-sm text-gray-500">
                              {log.ipAddress}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            {log.targetUserEmail ? (
                              <div className="text-sm text-gray-900">
                                {log.targetUserEmail}
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm text-gray-900 max-w-xs truncate">
                              {log.details ? JSON.stringify(log.details) : '-'}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(log.createdAt)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Page {page} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  disabled={page === 1}
                  variant="outline"
                  size="sm"
                >
                  Previous
                </Button>
                <Button
                  onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={page === totalPages}
                  variant="outline"
                  size="sm"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}