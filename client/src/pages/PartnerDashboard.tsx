import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useTheme } from '../contexts/ThemeContext';
import {
  DollarSign,
  Users,
  TrendingUp,
  Calendar,
  ArrowUpRight,
  Target,
  Award,
  CreditCard,
  CheckCircle,
  Clock,
  Sun,
  Moon
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface PartnerStats {
  partnerId: string;
  totalRevenue: string;
  totalCommissions: string;
  customerCount: number;
  conversionRate: number;
  monthlyGrowth: number;
  tier: string;
  commissionRate: string;
  status: string;
}

interface Commission {
  id: string;
  amount: string;
  status: string;
  createdAt: string;
  description: string;
}

export default function PartnerDashboard() {
  const { isDark, toggleTheme } = useTheme();
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  // In a real app, this would be the logged-in partner's ID
  const partnerId = 'partner-001';

  const { data: partnerStats, isLoading: statsLoading } = useQuery<PartnerStats>({
    queryKey: [`/api/partners/${partnerId}/stats`],
    refetchInterval: 30000,
  });

  const { data: commissions, isLoading: commissionsLoading } = useQuery<Commission[]>({
    queryKey: [`/api/partners/${partnerId}/commissions`],
    refetchInterval: 30000,
  });

  const { data: customers, isLoading: customersLoading } = useQuery<any[]>({
    queryKey: [`/api/partners/${partnerId}/customers`],
    refetchInterval: 30000,
  });

  const formatCurrency = (amount: string | number) => {
    const value = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const getTierBadgeColor = (tier: string) => {
    const colors = {
      bronze: 'bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-800',
      silver: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700',
      gold: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800',
      platinum: 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-200 border-purple-200 dark:border-purple-800',
    };
    return colors[tier as keyof typeof colors] || 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700';
  };

  const getStatusBadgeColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800',
      pending: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800',
      suspended: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800',
      terminated: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700';
  };

  if (statsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse bg-white dark:bg-gray-800">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-white'} p-6 space-y-6`} data-testid="partner-dashboard">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Partner Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Monitor your performance and earnings</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            data-testid="button-theme-toggle"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            <span className="text-sm font-medium">
              {isDark ? 'Light' : 'Dark'}
            </span>
          </button>
          {partnerStats && (
            <div className="flex items-center gap-2">
              <Badge className={getTierBadgeColor(partnerStats.tier)}>
                {partnerStats.tier.toUpperCase()} TIER
              </Badge>
              <Badge className={getStatusBadgeColor(partnerStats.status)}>
                {partnerStats.status.toUpperCase()}
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card data-testid="total-revenue-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(partnerStats?.totalRevenue || '0')}
            </div>
            <div className="text-xs text-green-600 flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3" />
              {formatPercentage(partnerStats?.monthlyGrowth || 0)} this month
            </div>
          </CardContent>
        </Card>

        <Card data-testid="total-commissions-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commissions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(partnerStats?.totalCommissions || '0')}
            </div>
            <div className="text-xs text-muted-foreground">
              {formatPercentage(parseFloat(partnerStats?.commissionRate || '0') / 100)} commission rate
            </div>
          </CardContent>
        </Card>

        <Card data-testid="customer-count-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{partnerStats?.customerCount || 0}</div>
            <div className="text-xs text-muted-foreground">
              Conversion: {formatPercentage(partnerStats?.conversionRate || 0)}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="next-tier-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Tier Progress</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-sm font-medium">
                {partnerStats?.tier === 'bronze' ? 'Silver Tier' : 
                 partnerStats?.tier === 'silver' ? 'Gold Tier' : 
                 partnerStats?.tier === 'gold' ? 'Platinum Tier' : 'Max Tier'}
              </div>
              <Progress 
                value={
                  partnerStats?.tier === 'bronze' ? 60 : 
                  partnerStats?.tier === 'silver' ? 40 : 
                  partnerStats?.tier === 'gold' ? 80 : 100
                } 
                className="h-2" 
              />
              <div className="text-xs text-muted-foreground">
                {partnerStats?.tier === 'bronze' ? '$3,500 more needed' : 
                 partnerStats?.tier === 'silver' ? '$7,500 more needed' : 
                 partnerStats?.tier === 'gold' ? '$35,000 more needed' : 'Achieved!'}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value="overview" className="space-y-6">
        <TabsList data-testid="dashboard-tabs">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="commissions">Commissions</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Performance */}
            <Card className="lg:col-span-2" data-testid="performance-chart-card">
              <CardHeader>
                <CardTitle>Recent Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">This Month</div>
                      <div className="text-sm text-gray-500">Revenue Generated</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(partnerStats?.totalRevenue || '0')}
                      </div>
                      <div className="text-sm text-green-600">
                        +{formatPercentage(partnerStats?.monthlyGrowth || 0)}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">Commission Earned</div>
                      <div className="text-sm text-gray-500">This Month</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        {formatCurrency(partnerStats?.totalCommissions || '0')}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatPercentage(parseFloat(partnerStats?.commissionRate || '0') / 100)} rate
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">Customer Growth</div>
                      <div className="text-sm text-gray-500">Active Customers</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {partnerStats?.customerCount || 0}
                      </div>
                      <div className="text-sm text-green-600">
                        +15% growth
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tier Benefits */}
            <Card data-testid="tier-benefits-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Your Tier Benefits
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <Badge className={getTierBadgeColor(partnerStats?.tier || 'bronze')}>
                    {(partnerStats?.tier || 'Bronze').toUpperCase()} PARTNER
                  </Badge>
                  <div className="text-2xl font-bold mt-2">
                    {formatPercentage(parseFloat(partnerStats?.commissionRate || '0') / 100)}
                  </div>
                  <div className="text-sm text-gray-500">Commission Rate</div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Basic CRM Access
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Email Support
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Partner Portal
                  </div>
                  {partnerStats?.tier !== 'bronze' && (
                    <>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Priority Support
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Custom Branding
                      </div>
                    </>
                  )}
                </div>

                <Button className="w-full" variant="outline" data-testid="upgrade-tier-button">
                  Upgrade Tier
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="commissions" className="space-y-6">
          <Card data-testid="commissions-table-card">
            <CardHeader>
              <CardTitle>Commission History</CardTitle>
            </CardHeader>
            <CardContent>
              {commissionsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  ))}
                </div>
              ) : commissions && commissions.length > 0 ? (
                <div className="space-y-4">
                  {commissions.map((commission) => (
                    <div key={commission.id} className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">{commission.description}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(commission.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-green-600">
                          +{formatCurrency(commission.amount)}
                        </div>
                        <Badge 
                          className={commission.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                        >
                          {commission.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Commissions Yet</h3>
                  <p className="text-gray-600">Your commission history will appear here once you start earning.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <Card data-testid="customers-table-card">
            <CardHeader>
              <CardTitle>Your Customers</CardTitle>
            </CardHeader>
            <CardContent>
              {customersLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  ))}
                </div>
              ) : customers && customers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4">Customer</th>
                        <th className="text-left p-4">Email</th>
                        <th className="text-left p-4">Status</th>
                        <th className="text-right p-4">Value</th>
                        <th className="text-right p-4">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers.map((customer) => (
                        <tr key={customer.id} className="border-b hover:bg-gray-50">
                          <td className="p-4 font-medium">{customer.name}</td>
                          <td className="p-4 text-gray-600">{customer.email}</td>
                          <td className="p-4">
                            <Badge className="bg-green-100 text-green-800">
                              {customer.status}
                            </Badge>
                          </td>
                          <td className="text-right p-4 font-semibold">
                            {formatCurrency(customer.value)}
                          </td>
                          <td className="text-right p-4 text-gray-600">
                            {new Date(customer.acquisitionDate).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Customers Yet</h3>
                  <p className="text-gray-600">Start referring customers to build your revenue stream.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card data-testid="marketing-materials-card">
              <CardHeader>
                <CardTitle>Marketing Materials</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full justify-start" data-testid="download-brochures-button">
                  Download Brochures
                </Button>
                <Button variant="outline" className="w-full justify-start" data-testid="get-referral-links-button">
                  Get Referral Links
                </Button>
                <Button variant="outline" className="w-full justify-start" data-testid="access-logos-button">
                  Access Brand Assets
                </Button>
              </CardContent>
            </Card>

            <Card data-testid="support-card">
              <CardHeader>
                <CardTitle>Partner Support</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full justify-start" data-testid="contact-support-button">
                  Contact Support
                </Button>
                <Button variant="outline" className="w-full justify-start" data-testid="view-training-button">
                  Training Resources
                </Button>
                <Button variant="outline" className="w-full justify-start" data-testid="partner-community-button">
                  Partner Community
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}