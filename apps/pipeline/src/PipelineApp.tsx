import React, { useEffect, useState, useRef } from 'react';
import { eventBus } from './eventBus';

interface Deal { id: string; title: string; value: number; stage: string | { name: string }; }

interface PipelineAppProps {
  sharedData?: { user?: any; isAuthenticated?: boolean };
  deals?: Deal[];
}

const PipelineApp: React.FC<PipelineAppProps> = ({ sharedData, deals = [] }) => {
  const [authState, setAuthState] = useState({
    user: sharedData?.user ?? null,
    isAuthenticated: sharedData?.isAuthenticated ?? false
  });
  const dealsRef = useRef(deals);
  dealsRef.current = deals;

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
    return eventBus.onRequest('pipeline', async (action, data) => {
      switch (action) {
        case 'getDeal': return dealsRef.current.find(d => d.id === data?.id) || null;
        case 'listDeals': return dealsRef.current;
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

  if (deals.length === 0) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">No Deals Available</h2>
          <p className="text-gray-600">There are no deals in your pipeline yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Sales Pipeline</h1>
      <div className="space-y-4">
        {deals.map(deal => (
          <div key={deal.id} className="border rounded-lg p-4 bg-white">
            <h3 className="font-semibold">{deal.title}</h3>
            <p className="text-sm text-gray-600">${deal.value.toLocaleString()} - {typeof deal.stage === 'string' ? deal.stage : deal.stage?.name || 'Unknown'}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PipelineApp;
