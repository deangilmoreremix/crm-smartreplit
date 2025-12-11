import React from 'react';
import RemoteFunnelCraftLoader from '../components/RemoteFunnelCraftLoader';

const FunnelCraftPage: React.FC = () => {
  return (
    <div className="fixed inset-0 z-40">
      <RemoteFunnelCraftLoader />
    </div>
  );
};

export default FunnelCraftPage;