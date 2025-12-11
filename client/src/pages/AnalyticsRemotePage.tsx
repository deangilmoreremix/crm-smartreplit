import React from 'react';
import RemoteAnalyticsLoader from '../components/RemoteAnalyticsLoader';

const AnalyticsRemotePage: React.FC = () => {
  return (
    <div className="fixed inset-0 z-40">
      <RemoteAnalyticsLoader />
    </div>
  );
};

export default AnalyticsRemotePage;