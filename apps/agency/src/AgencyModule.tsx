// AgencyModule.tsx - Lightweight module federation entry
import React from 'react';

interface AgencyModuleProps {
  sharedData?: { user?: any; isAuthenticated?: boolean };
}

const CampaignBuilder: React.FC<AgencyModuleProps> = () => {
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold">Campaign Builder</h2>
      <p className="text-sm text-gray-600">Build and automate marketing campaigns</p>
    </div>
  );
};

export default CampaignBuilder;
