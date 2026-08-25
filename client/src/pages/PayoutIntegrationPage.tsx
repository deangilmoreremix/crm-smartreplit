import React, { useState } from 'react';
import PageLayout from '../components/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTheme } from '../contexts/ThemeContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  DollarSign,
  CreditCard,
  Clock,
  CheckCircle,
  AlertCircle,
  Sun,
  Moon,
  Filter,
} from 'lucide-react';

interface Payout {
  id: string;
  partnerId: string;
  amount: string;
  status: 'pending' | 'paid' | 'failed';
  paidAt?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export default function PayoutIntegrationPage() {
  const { isDark, toggleTheme } = useTheme();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [partnerFilter, setPartnerFilter] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: payouts, isLoading: payoutsLoading, refetch } = useQuery<Payout[]>({
    queryKey: ['/api/payouts', statusFilter, partnerFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (partnerFilter) params.append('partnerId', partnerFilter);
      const response = await fetch(`/api/payouts?${params}`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to fetch payouts');
      return response.json();
    },
    refetchInterval: 30000,
  });

  const stripeMutation = useMutation({
    mutationFn: ({ payoutId, destination }: { payoutId: string; destination?: string }) =>
      apiRequest(`/api/payouts/stripe`, {
        method: 'POST',
        body: { payoutId, destination },
      }),
    onSuccess: () => {
      refetch();
      toast({ title: 'Stripe payout processed successfully' });
    },
  });

  const paypalMutation = useMutation({
    mutationFn: ({ payoutId, paypalEmail }: { payoutId: string; paypalEmail: string }) =>
      apiRequest(`/api/payouts/paypal`, {
        method: 'POST',
        body: { payoutId, paypalEmail },
      }),
    onSuccess: () => {
      refetch();
      toast({ title: 'PayPal payout processed successfully' });
    },
  });

  const formatCurrency = (amount: string | number) => {
    const value = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getProviderBadge = (provider: string) => {
    const colors: Record<string, string> = {
      stripe: 'bg-indigo-100 text-indigo-800',
      paypal: 'bg-blue-100 text-blue-800',
    };
    return colors[provider] || 'bg-gray-100 text-gray-800';
  };

  const pendingPayouts = payouts?.filter((p) => p.status === 'pending') || [];
  const totalPending = pendingPayouts.reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0);
  const totalPaid = payouts?.filter((p) => p.status === 'paid').reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0) || 0;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Payout Integration
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Process partner payouts via Stripe or PayPal
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            <span className="text-sm font-medium">{isDark ? 'Light' : 'Dark'}</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingPayouts.length}</div>
            <div className="text-xs text-muted-foreground">{formatCurrency(totalPending)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPaid)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stripe</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {payouts?.filter((p) => p.metadata?.provider === 'stripe').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PayPal</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {payouts?.filter((p) => p.metadata?.provider === 'paypal').length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="statusFilter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="partnerFilter">Partner ID</Label>
              <Input
                id="partnerFilter"
                value={partnerFilter}
                onChange={(e) => setPartnerFilter(e.target.value)}
                placeholder="Filter by partner ID"
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setStatusFilter('all');
                  setPartnerFilter('');
                }}
              >
                <Filter className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payouts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payouts</CardTitle>
        </CardHeader>
        <CardContent>
          {payoutsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : payouts && payouts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">Payout ID</th>
                    <th className="text-left p-4">Partner ID</th>
                    <th className="text-right p-4">Amount</th>
                    <th className="text-center p-4">Status</th>
                    <th className="text-center p-4">Provider</th>
                    <th className="text-center p-4">Created</th>
                    <th className="text-center p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((payout) => (
                    <tr key={payout.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="p-4 font-mono text-sm">{payout.id.slice(0, 8)}...</td>
                      <td className="p-4 font-mono text-sm">{payout.partnerId.slice(0, 8)}...</td>
                      <td className="text-right p-4 font-semibold">{formatCurrency(payout.amount)}</td>
                      <td className="text-center p-4">
                        <Badge className={getStatusBadge(payout.status)}>
                          {payout.status}
                        </Badge>
                      </td>
                      <td className="text-center p-4">
                        {payout.metadata?.provider && (
                          <Badge className={getProviderBadge(payout.metadata.provider)}>
                            {payout.metadata.provider}
                          </Badge>
                        )}
                      </td>
                      <td className="text-center p-4 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(payout.createdAt).toLocaleDateString()}
                      </td>
                      <td className="text-center p-4">
                        {payout.status === 'pending' ? (
                          <div className="flex justify-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                stripeMutation.mutate({
                                  payoutId: payout.id,
                                  destination: `acct_${payout.partnerId.slice(0, 8)}`,
                                })
                              }
                              disabled={stripeMutation.isPending}
                            >
                              <CreditCard className="h-4 w-4 mr-1" />
                              Stripe
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                paypalMutation.mutate({
                                  payoutId: payout.id,
                                  paypalEmail: `partner${payout.partnerId.slice(0, 4)}@example.com`,
                                })
                              }
                              disabled={paypalMutation.isPending}
                            >
                              <CreditCard className="h-4 w-4 mr-1" />
                              PayPal
                            </Button>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">
                            {payout.paidAt
                              ? new Date(payout.paidAt).toLocaleDateString()
                              : '-'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Payouts Found</h3>
              <p className="text-gray-600">
                Payouts will appear here once they are created.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
