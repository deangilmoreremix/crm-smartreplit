// DealsModule.tsx - Deals Module Federation Entry
import React from 'react';

interface DealsModuleProps {
  sharedData?: {
    deals?: any[];
    user?: any;
  };
  onDealSelect?: (deal: any) => void;
}

const DealsModule: React.FC<DealsModuleProps> = ({ sharedData, onDealSelect }) => {
  return (
    <div className="p-4 bg-gray-50">
      <h3 className="font-semibold mb-2">Deals Module</h3>
      <p className="text-sm text-gray-600">
        Total Deals: {sharedData?.deals?.length || 0}
      </p>
    </div>
  );
};

export default DealsModule;
