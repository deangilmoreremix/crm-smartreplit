// AgencyModule.tsx - Lightweight module federation entry
import React from 'react';

interface AgencyModuleProps {
  sharedData?: { user?: any; isAuthenticated?: boolean };
}

const CampaignBuilder: React.FC<AgencyModuleProps> = ({ sharedData }) => {
  const isAuthenticated = sharedData?.isAuthenticated ?? false;

  // Only gate when embedded in the host CRM with explicit auth failure.
  // When loaded standalone (no sharedData), render the full module.
  if (sharedData && !isAuthenticated) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-600">Please log in via the main CRM.</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold">Campaign Builder</h2>
      <p className="text-sm text-gray-600">Build and automate marketing campaigns</p>
    </div>
  );
};

export default CampaignBuilder;
