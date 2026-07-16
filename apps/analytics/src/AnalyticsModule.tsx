// AnalyticsModule.tsx - Module Federation Entry for Analytics
import React, { useEffect, useState } from 'react';

interface AnalyticsData {
  totalContacts: number;
  totalDeals: number;
  totalRevenue: number;
  avgDealSize: number;
  winRate: number;
  salesVelocity: number;
  contactsBySource: { [source: string]: number };
  dealsByStage: { [stage: string]: number };
  revenueByMonth: { month: string; revenue: number }[];
}

interface AnalyticsModuleProps {
  sharedData?: {
    user?: any;
    isAuthenticated?: boolean;
  };
  onInsightGenerated?: (insight: any) => void;
  initialData?: Partial<AnalyticsData>;
}

const AnalyticsModule: React.FC<AnalyticsModuleProps> = ({
  sharedData,
  onInsightGenerated,
  initialData = {},
}) => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalContacts: 0,
    totalDeals: 0,
    totalRevenue: 0,
    avgDealSize: 0,
    winRate: 0,
    salesVelocity: 0,
    contactsBySource: {},
    dealsByStage: {},
    revenueByMonth: [],
    ...initialData,
  });

  // Use shared auth from host CRM — no separate auth needed
  const isAuthenticated = sharedData?.isAuthenticated ?? false;
  const user = sharedData?.user ?? null;

  // Listen for data sync from parent CRM via postMessage
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'CRM_ANALYTICS_SYNC') {
        setAnalytics((prev) => ({ ...prev, ...event.data.analytics }));
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  if (!isAuthenticated) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Authentication Required</h2>
          <p className="text-gray-600">Please log in via the main CRM to access Analytics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Analytics Module</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 border">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total Contacts</h3>
            <p className="text-2xl font-bold text-gray-900">{analytics.totalContacts.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg p-6 border">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total Deals</h3>
            <p className="text-2xl font-bold text-gray-900">{analytics.totalDeals.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg p-6 border">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total Revenue</h3>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(analytics.totalRevenue)}</p>
          </div>
          <div className="bg-white rounded-lg p-6 border">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Avg Deal Size</h3>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(analytics.avgDealSize)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsModule;
