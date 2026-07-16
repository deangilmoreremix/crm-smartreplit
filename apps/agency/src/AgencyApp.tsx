import React, { useEffect, useState, useCallback, useRef } from 'react';
import { eventBus } from './eventBus';

interface AgencyAppProps {
  sharedData?: { user?: any; isAuthenticated?: boolean };
}

const AgencyApp: React.FC<AgencyAppProps> = ({ sharedData }) => {
  const [campaigns] = useState([
    { id: '1', name: 'Summer Sale', status: 'active' },
    { id: '2', name: 'Product Launch', status: 'draft' }
  ]);
  const [authState, setAuthState] = useState({
    user: sharedData?.user ?? null,
    isAuthenticated: sharedData?.isAuthenticated ?? false
  });
  const campaignsRef = useRef(campaigns);
  campaignsRef.current = campaigns;

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'AUTH_STATE_CHANGED') {
        setAuthState({
          user: event.data.payload?.user ?? null,
          isAuthenticated: event.data.payload?.isAuthenticated ?? false
        });
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    return eventBus.onRequest('agency', async (action, data) => {
      switch (action) {
        case 'getCampaigns': return campaignsRef.current;
        case 'getCampaign': return campaignsRef.current.find(c => c.id === data?.id) || null;
        default: throw new Error(`Unknown action: ${action}`);
      }
    });
  }, []);

  if (!authState.isAuthenticated) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Authentication Required</h2>
          <p className="text-gray-600">Please log in via the main CRM.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Agency Suite</h1>
      <p className="text-gray-600 mb-4">AI Campaign Builder and Automation</p>
      <div className="space-y-2">
        {campaigns.map(c => (
          <div key={c.id} className="border rounded p-3">
            <h3 className="font-semibold">{c.name}</h3>
            <span className="text-xs bg-blue-100 px-2 py-1 rounded">{c.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AgencyApp;
