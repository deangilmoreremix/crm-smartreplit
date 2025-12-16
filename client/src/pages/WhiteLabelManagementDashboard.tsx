import React from 'react';
import PageLayout from '../components/PageLayout';
import RemoteWhiteLabelLoader from '../components/RemoteWhiteLabelLoader';

const WhiteLabelManagementDashboard: React.FC = () => {
  return (
    <div className="h-full w-full min-h-screen overflow-auto">
      <RemoteWhiteLabelLoader />
    </div>
  );
};

export default WhiteLabelManagementDashboard;