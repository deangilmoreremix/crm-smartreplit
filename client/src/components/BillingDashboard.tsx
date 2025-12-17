import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import {
  CreditCard,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Calendar,
  DollarSign,
  BarChart3,
  Settings,
  Bell,
  Download
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface BillingSummary {
  currentCycle: {
    id: string;
    startDate: string;
    endDate: string;
    status: string;
    totalCostCents: number;
  } | null;
  currentPlan: {
    planName: string;
    displayName: string;
    billingType: string;
    basePriceCents: number;
  } | null;
  usageStats: {
    period: { start: string; end: string };
    featureUsage: Record<string, {
      totalQuantity: number;
      totalCost: number;
      eventCount: number;
      unit: string;
    }>;
    currentLimits: Record<string, {
      limit: number;
      used: number;
      isHardLimit: boolean;
    }>;
    totalEvents: number;
    totalCost: number;
  };
  currentBilling: {
    totalCostCents: number;
    breakdown: any;
  } | null;
  nextBillingDate: string | null;
}

interface UsageLimit {
  id: string;
  featureName: string;
  limitValue: string;
  usedValue: string;
  isHardLimit: boolean;
  resetDate: string | null;
}

interface BillingNotification {
  id: string;
  notificationType: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  metadata: Record<string, any>;
}

export const BillingDashboard: React.FC = () => {
  const { user } = useAuth();
  const [billingSummary, setBillingSummary] = useState<BillingSummary | null>(null);
  const [usageLimits, setUsageLimits] = useState<UsageLimit[]>([]);
  const [notifications, setNotifications] = useState<BillingNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    try {
      setLoading(true);

      // Load billing summary
      const summaryResponse = await fetch('/api/billing/summary');
      if (summaryResponse.ok) {
        const summary = await summaryResponse.json();
        setBillingSummary(summary);
      }

      // Load usage limits
      const limitsResponse = await fetch('/api/billing/limits');
      if (limitsResponse.ok) {
        const limitsData = await limitsResponse.json();
        setUsageLimits(limitsData.limits || []);
      }

      // Load notifications
      const notificationsResponse = await fetch('/api/billing/notifications');
      if (notificationsResponse.ok) {
        const notificationsData = await notificationsResponse.json();
        setNotifications(notificationsData.notifications || []);
      }
    } catch (error) {
      console.error('Error loading billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const markNotificationsRead = async (notificationIds: string[]) => {
    try {
      await fetch('/api/billing/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds })
      });
      setNotifications(prev => prev.map(n =>
        notificationIds.includes(n.id) ? { ...n, isRead: true } : n
      ));
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getUsagePercentage = (used: number, limit: number) => {
    return limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  const unreadNotifications = notifications.filter(n => !n.isRead);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Billing & Usage</h1>
          <p className="text-gray-600">Monitor your usage and manage your subscription</p>
        </div>
        <div className="flex gap-2">
          {unreadNotifications.length > 0 && (
            <Button
              variant="outline"
              onClick={() => markNotificationsRead(unreadNotifications.map(n => n.id))}
            >
              <Bell className="w-4 h-4 mr-2" />
              Mark All Read ({unreadNotifications.length})
            </Button>
          )}
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {unreadNotifications.length > 0 && (
        <div className="space-y-2">
          {unreadNotifications.slice(0, 3).map(notification => (
            <Alert key={notification.id}>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{notification.title}</AlertTitle>
              <AlertDescription>{notification.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Current Plan & Billing Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {billingSummary?.currentPlan?.displayName || 'Free Plan'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {billingSummary?.currentPlan?.billingType === 'subscription'
                    ? `$${billingSummary.currentPlan.basePriceCents / 100}/month`
                    : 'Pay per use'
                  }
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Billing Cycle</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {billingSummary?.currentBilling
                    ? formatCurrency(billingSummary.currentBilling.totalCostCents)
                    : '$0.00'
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  {billingSummary?.nextBillingDate
                    ? `Next billing: ${formatDate(billingSummary.nextBillingDate)}`
                    : 'No active billing cycle'
                  }
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Usage This Month</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {billingSummary?.usageStats?.totalEvents || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  API calls and AI requests
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Usage Limits */}
          <Card>
            <CardHeader>
              <CardTitle>Usage Limits</CardTitle>
              <CardDescription>
                Monitor your current usage against plan limits
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {usageLimits.map(limit => {
                const used = parseFloat(limit.usedValue);
                const limitValue = parseFloat(limit.limitValue);
                const percentage = getUsagePercentage(used, limitValue);

                return (
                  <div key={limit.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">
                        {limit.featureName.replace('_', ' ')}
                      </span>
                      <span className={`text-sm ${getUsageColor(percentage)}`}>
                        {used.toLocaleString()} / {limitValue.toLocaleString()}
                        {limit.isHardLimit && <Badge variant="destructive" className="ml-2">Hard Limit</Badge>}
                      </span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          {/* Detailed Usage Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Usage Statistics</CardTitle>
              <CardDescription>
                Detailed breakdown of your usage for the current period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {billingSummary?.usageStats && Object.entries(billingSummary.usageStats.featureUsage).map(([feature, stats]: [string, any]) => (
                  <div key={feature} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium capitalize">{feature.replace('_', ' ')}</h4>
                      <p className="text-sm text-gray-600">
                        {stats.totalQuantity.toLocaleString()} {stats.unit} • {stats.eventCount} events
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(stats.totalCost)}</p>
                      <p className="text-sm text-gray-600">
                        ${(stats.totalCost / stats.totalQuantity).toFixed(4)} per {stats.unit}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          {/* Billing History */}
          <Card>
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
              <CardDescription>
                View your past invoices and billing cycles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Billing history will appear here once you have completed billing cycles.</p>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Management */}
          <Card>
            <CardHeader>
              <CardTitle>Subscription Management</CardTitle>
              <CardDescription>
                Manage your subscription and billing preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Current Plan</h4>
                  <p className="text-sm text-gray-600">
                    {billingSummary?.currentPlan?.displayName || 'Free Plan'}
                  </p>
                </div>
                <Button variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  Change Plan
                </Button>
              </div>

              {billingSummary?.currentCycle && (
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Billing Cycle</h4>
                    <p className="text-sm text-gray-600">
                      {formatDate(billingSummary.currentCycle.startDate)} - {formatDate(billingSummary.currentCycle.endDate)}
                    </p>
                  </div>
                  <Badge variant={billingSummary.currentCycle.status === 'active' ? 'default' : 'secondary'}>
                    {billingSummary.currentCycle.status}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          {/* Billing Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Billing Settings</CardTitle>
              <CardDescription>
                Configure your billing preferences and notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Email Notifications</h4>
                  <p className="text-sm text-gray-600">
                    Receive billing alerts and usage warnings
                  </p>
                </div>
                <Button variant="outline">Configure</Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Auto-renewal</h4>
                  <p className="text-sm text-gray-600">
                    Automatically renew your subscription
                  </p>
                </div>
                <Button variant="outline">Manage</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};