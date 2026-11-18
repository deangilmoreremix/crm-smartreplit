import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { TrendingUp, Users, DollarSign, Target } from 'lucide-react';

interface EmbeddableDashboardProps {
  apiUrl?: string;
  tenantId?: string;
  className?: string;
}

const EmbeddableDashboard: React.FC<EmbeddableDashboardProps> = ({
  apiUrl = '/api',
  tenantId,
  className = '',
}) => {
  const [metrics, setMetrics] = useState({
    totalDeals: 0,
    totalValue: 0,
    activeContacts: 0,
    conversionRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, [apiUrl, tenantId]);

  // Metrics computed from the user's real deals and contacts (GET {apiUrl}/deals and /contacts)
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const query = tenantId ? `?tenantId=${encodeURIComponent(tenantId)}` : '';
      const [dealsRes, contactsRes] = await Promise.all([
        fetch(`${apiUrl}/deals${query}`),
        fetch(`${apiUrl}/contacts${query}`),
      ]);
      if (!dealsRes.ok || !contactsRes.ok) {
        throw new Error(`Request failed (${dealsRes.ok ? contactsRes.status : dealsRes.status})`);
      }
      const dealList: any[] = await dealsRes.json();
      const contactList: any[] = await contactsRes.json();

      const closed = dealList.filter((d) => ['closed-won', 'closed-lost', 'won', 'lost'].includes(d.stage));
      const won = closed.filter((d) => d.stage === 'closed-won' || d.stage === 'won');
      setMetrics({
        totalDeals: dealList.length,
        totalValue: dealList.reduce((sum, d) => sum + (Number(d.value) || 0), 0),
        activeContacts: contactList.filter((c) => (c.status || 'active') !== 'inactive').length,
        conversionRate: closed.length ? Math.round((won.length / closed.length) * 1000) / 10 : 0,
      });
    } catch (err) {
      setError(`Failed to load dashboard data: ${err instanceof Error ? err.message : 'unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`p-6 bg-white rounded-lg shadow-sm ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 bg-white rounded-lg shadow-sm ${className}`}>
        <div className="text-center text-red-600">
          <p>{error}</p>
          <button
            onClick={fetchDashboardData}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 bg-white rounded-lg shadow-sm ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">CRM Dashboard</h2>
        <p className="text-gray-600">Real-time business metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalDeals}</div>
            <p className="text-xs text-muted-foreground">
              <Badge variant="secondary" className="text-green-600">
                +12%
              </Badge>{' '}
              from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(metrics.totalValue / 1000).toFixed(0)}k</div>
            <p className="text-xs text-muted-foreground">
              <Badge variant="secondary" className="text-green-600">
                +8%
              </Badge>{' '}
              from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Contacts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeContacts}</div>
            <p className="text-xs text-muted-foreground">
              <Badge variant="secondary" className="text-blue-600">
                +5%
              </Badge>{' '}
              from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              <Badge variant="secondary" className="text-green-600">
                +2.1%
              </Badge>{' '}
              from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="text-center">
        <a
          href="/dashboard"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          View Full Dashboard
        </a>
      </div>
    </div>
  );
};

export default EmbeddableDashboard;
