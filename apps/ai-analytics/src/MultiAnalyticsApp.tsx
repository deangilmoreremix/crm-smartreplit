import React, { useEffect, useState, useRef } from 'react';
import { eventBus } from './eventBus';

interface MultiAnalyticsAppProps {
  sharedData?: { user?: any; isAuthenticated?: boolean };
}

const MultiAnalyticsApp: React.FC<MultiAnalyticsAppProps> = () => {
  const [metrics] = useState([
    { id: '1', name: 'Total Revenue', value: 125000 },
    { id: '2', name: 'Active Contacts', value: 1240 }
  ]);
  const metricsRef = useRef(metrics);
  metricsRef.current = metrics;

  useEffect(() => {
    return eventBus.onRequest('ai-analytics', async (action) => {
      if (action === 'getAnalytics') return metricsRef.current;
      throw new Error(`Unknown action: ${action}`);
    });
  }, []);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">AI Analytics Dashboard</h1>
      <p className="text-xs text-gray-400 mb-4">remote: ai-analytics.smartcrm.vip · auth: host-managed</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {metrics.map(m => (
          <div key={m.id} className="bg-white rounded-lg p-4 border">
            <h3 className="text-sm text-gray-600">{m.name}</h3>
            <p className="text-2xl font-bold">{m.value.toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MultiAnalyticsApp;
