// Exposed Analytics Component for Module Federation
// File: src/AnalyticsApp.tsx (for analytics app)

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

interface AnalyticsAppProps {
  onInsightGenerated?: (insight: any) => void;
  initialData?: Partial<AnalyticsData>;
}

const AnalyticsApp: React.FC<AnalyticsAppProps> = ({
  onInsightGenerated,
  initialData = {}
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
    ...initialData
  });

  // Listen for messages from parent CRM
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'CRM_ANALYTICS_SYNC') {
        setAnalytics(prev => ({ ...prev, ...event.data.analytics }));
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Notify parent that analytics module is ready
    window.parent.postMessage({
      type: 'ANALYTICS_MODULE_READY',
      source: 'REMOTE_ANALYTICS'
    }, '*');

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const generateInsight = (type: string) => {
    const insight = {
      id: Date.now().toString(),
      type,
      title: `${type} Insight`,
      description: `Generated insight for ${type}`,
      timestamp: new Date().toISOString()
    };

    // Notify parent CRM
    window.parent.postMessage({
      type: 'INSIGHT_GENERATED',
      data: insight,
      source: 'REMOTE_ANALYTICS'
    }, '*');

    onInsightGenerated?.(insight);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${Math.round(value)}%`;
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Analytics Dashboard</h1>
        
        {/* Key Metrics */}
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

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 border">
            <h3 className="text-lg font-semibold mb-4">Sales Performance</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Win Rate</span>
                  <span className="text-sm font-medium">{formatPercentage(analytics.winRate)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${analytics.winRate}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Sales Velocity</span>
                  <span className="text-sm font-medium">{analytics.salesVelocity} days</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${Math.min(analytics.salesVelocity / 2, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border">
            <h3 className="text-lg font-semibold mb-4">Deal Distribution</h3>
            <div className="space-y-3">
              {Object.entries(analytics.dealsByStage).map(([stage, count]) => (
                <div key={stage} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{stage}</span>
                  <span className="text-sm font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Insights */}
        <div className="bg-white rounded-lg p-6 border">
          <h3 className="text-lg font-semibold mb-4">AI Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => generateInsight('Revenue Forecast')}
              className="p-4 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <h4 className="font-medium text-blue-900 mb-2">Revenue Forecast</h4>
              <p className="text-sm text-blue-700">Generate AI-powered revenue predictions</p>
            </button>
            
            <button
              onClick={() => generateInsight('Lead Scoring')}
              className="p-4 border border-green-200 rounded-lg hover:bg-green-50 transition-colors"
            >
              <h4 className="font-medium text-green-900 mb-2">Lead Scoring</h4>
              <p className="text-sm text-green-700">Analyze lead quality and conversion potential</p>
            </button>
            
            <button
              onClick={() => generateInsight('Performance Analysis')}
              className="p-4 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
            >
              <h4 className="font-medium text-purple-900 mb-2">Performance Analysis</h4>
              <p className="text-sm text-purple-700">Deep dive into sales team performance</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsApp;