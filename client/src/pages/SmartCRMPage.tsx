import React from 'react';
import RemoteSmartCRMLoader from '../components/RemoteSmartCRMLoader';

const SmartCRMPage: React.FC = () => {
  return (
    <div className="fixed inset-0 z-40">
      <RemoteSmartCRMLoader />
    </div>
  );
};

export default SmartCRMPage;