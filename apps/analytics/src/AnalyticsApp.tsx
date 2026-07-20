import React, { useEffect, useRef } from 'react';
import { eventBus } from './eventBus';

interface AnalyticsData {
  totalContacts: number; totalDeals: number; totalRevenue: number;
}

interface AnalyticsAppProps {
  sharedData?: { user?: any; isAuthenticated?: boolean };
}

const AnalyticsApp: React.FC<AnalyticsAppProps> = () => {
  const [analytics] = useState<AnalyticsData>({ totalContacts: 0, totalDeals: 0, totalRevenue: 0 });
  const analyticsRef = useRef(analytics);
  analyticsRef.current = analytics;

  useEffect(() => {
    return eventBus.onRequest('analytics', async (action) => {
      switch (action) {
        case 'getAnalytics': return analyticsRef.current;
        case 'getInsights': return [{ id: '1', type: 'forecast' }];
        default: throw new Error(`Unknown action: ${action}`);
      }
    });
  }, []);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Analytics Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-6 border">
          <h3 className="text-sm text-gray-600">Total Contacts</h3>
          <p className="text-2xl font-bold">{analytics.totalContacts.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg p-6 border">
          <h3 className="text-sm text-gray-600">Total Deals</h3>
          <p className="text-2xl font-bold">{analytics.totalDeals.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg p-6 border">
          <h3 className="text-sm text-gray-600">Total Revenue</h3>
          <p className="text-2xl font-bold text-green-600">${analytics.totalRevenue.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsApp;
