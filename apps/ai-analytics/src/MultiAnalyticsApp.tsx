import React, { useEffect, useState, useRef } from 'react';
import { eventBus } from './eventBus';

interface MultiAnalyticsAppProps {
  sharedData?: { user?: any; isAuthenticated?: boolean };
}

const MultiAnalyticsApp: React.FC<MultiAnalyticsAppProps> = ({ sharedData }) => {
  const [metrics] = useState([
    { id: '1', name: 'Total Revenue', value: 125000 },
    { id: '2', name: 'Active Contacts', value: 1240 }
  ]);
  const [authState, setAuthState] = useState({
    user: sharedData?.user ?? null,
    isAuthenticated: sharedData?.isAuthenticated ?? false
  });
  const metricsRef = useRef(metrics);
  metricsRef.current = metrics;

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'AUTH_STATE_CHANGED') {
        setAuthState({ user: event.data.payload?.user ?? null, isAuthenticated: event.data.payload?.isAuthenticated ?? false });
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    return eventBus.onRequest('ai-analytics', async (action) => {
      if (action === 'getAnalytics') return metricsRef.current;
      throw new Error(`Unknown action: ${action}`);
    });
  }, []);

  // Only gate when embedded in the host CRM with explicit auth failure.
  // When loaded standalone (no sharedData), render the full app.
  if (sharedData && !authState.isAuthenticated) {
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
      <h1 className="text-2xl font-bold mb-6">AI Analytics Dashboard</h1>
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
