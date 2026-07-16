// PipelineModule.tsx - Lightweight module federation entry
import React from 'react';

interface PipelineModuleProps {
  sharedData?: { user?: any; isAuthenticated?: boolean };
  onDealSelect?: (deal: any) => void;
}

const PipelineModule: React.FC<PipelineModuleProps> = ({ sharedData, onDealSelect }) => {
  const isAuthenticated = sharedData?.isAuthenticated ?? false;

  if (!isAuthenticated) {
    return (
      <div className="p-4 bg-gray-50 text-center">
        <p className="text-gray-600">Please log in via the main CRM.</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-50">
      <h3 className="font-semibold mb-2">Pipeline Module</h3>
      <p className="text-sm text-gray-600">Sales pipeline overview</p>
    </div>
  );
};

export default PipelineModule;
