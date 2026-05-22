// InsightsModule.tsx - Insights Module Federation Entry
import React from 'react';

interface InsightsModuleProps {
  sharedData?: {
    analytics?: any;
    user?: any;
  };
}

const InsightsModule: React.FC<InsightsModuleProps> = ({ sharedData }) => {
  return (
    <div className="p-4 bg-gray-50">
      <h3 className="font-semibold mb-2">Insights Module</h3>
      <p className="text-sm text-gray-600">
        Analytics data available
      </p>
    </div>
  );
};

export default InsightsModule;
