import React from 'react';
import RemoteBusinessIntelLoader from '../components/RemoteBusinessIntelLoader';

const BusinessIntelPage: React.FC = () => {
  return (
    <div className="fixed inset-0 z-40" style={{ top: '80px' }}>
      <RemoteBusinessIntelLoader />
    </div>
  );
};

export default BusinessIntelPage;