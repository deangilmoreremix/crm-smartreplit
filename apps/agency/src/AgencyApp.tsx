import React, { useEffect, useState, useRef } from 'react';
import { eventBus } from './eventBus';

interface AgencyAppProps {
  sharedData?: { user?: any; isAuthenticated?: boolean };
}

const AgencyApp: React.FC<AgencyAppProps> = () => {
  const [campaigns] = useState([
    { id: '1', name: 'Summer Sale', status: 'active' },
    { id: '2', name: 'Product Launch', status: 'draft' }
  ]);
  const campaignsRef = useRef(campaigns);
  campaignsRef.current = campaigns;

  useEffect(() => {
    return eventBus.onRequest('agency', async (action, data) => {
      switch (action) {
        case 'getCampaigns': return campaignsRef.current;
        case 'getCampaign': return campaignsRef.current.find(c => c.id === data?.id) || null;
        default: throw new Error(`Unknown action: ${action}`);
      }
    });
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Agency Suite</h1>
      <p className="text-gray-600 mb-4">AI Campaign Builder and Automation</p>
      <p className="text-xs text-gray-400 mb-2">remote: agency.smartcrm.vip · auth: host-managed</p>
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
