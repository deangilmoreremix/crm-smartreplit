import React from 'react';
import RemoteIntelLoader from '../components/RemoteIntelLoader';

const IntelPage: React.FC = () => {
  return (
    <div className="fixed inset-0 z-40">
      <RemoteIntelLoader />
    </div>
  );
};

export default IntelPage;