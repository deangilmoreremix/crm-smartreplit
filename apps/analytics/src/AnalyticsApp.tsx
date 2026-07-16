import React, { useEffect, useState, useRef } from 'react';
import { eventBus } from './eventBus';

interface AnalyticsData {
  totalContacts: number; totalDeals: number; totalRevenue: number;
}

interface AnalyticsAppProps {
  sharedData?: { user?: any; isAuthenticated?: boolean };
}

const AnalyticsApp: React.FC<AnalyticsAppProps> = ({ sharedData }) => {
  const [analytics] = useState<AnalyticsData>({ totalContacts: 0, totalDeals: 0, totalRevenue: 0 });
  const [authState, setAuthState] = useState({
    user: sharedData?.user ?? null,
    isAuthenticated: sharedData?.isAuthenticated ?? false
  });
  const analyticsRef = useRef(analytics);
  analyticsRef.current = analytics;

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'AUTH_STATE_CHANGED') {
        setAuthState({ user: event.data.payload?.user ?? null, isAuthenticated: event.data.payload?.isAuthenticated ?? false });
      }
      if (event.data?.type === 'CRM_ANALYTICS_SYNC') {
        // Handle data sync from host
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    return eventBus.onRequest('analytics', async (action) => {
      switch (action) {
        case 'getAnalytics': return analyticsRef.current;
        case 'getInsights': return [{ id: '1', type: 'forecast' }];
        default: throw new Error(`Unknown action: ${action}`);
      }
    });
  }, []);

  if (!authState.isAuthenticated) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Authentication Required</h2>
          <p className="text-gray-600">Please log in via the main CRM.</p>
        </div>
      </div>
    );
  }

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
