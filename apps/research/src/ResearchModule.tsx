// ResearchModule.tsx - Lightweight module federation entry
import React from 'react';

interface ResearchModuleProps {
  sharedData?: { user?: any; isAuthenticated?: boolean };
}

const ResearchModule: React.FC<ResearchModuleProps> = ({ sharedData }) => {
  const isAuthenticated = sharedData?.isAuthenticated ?? false;

  return (
    <div className="p-4 bg-gray-50">
      <h3 className="font-semibold mb-2">Research Module</h3>
      <p className="text-sm text-gray-600">Market research and product insights</p>
    </div>
  );
};

export default ResearchModule;
