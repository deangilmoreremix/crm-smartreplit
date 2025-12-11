import React from 'react';
import RemoteWLLoader from '../components/RemoteWLLoader';

const WLPage: React.FC = () => {
  return (
    <div className="fixed inset-0 z-40">
      <RemoteWLLoader />
    </div>
  );
};

export default WLPage;