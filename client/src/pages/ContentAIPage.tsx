import React from 'react';
import RemoteContentAILoader from '../components/RemoteContentAILoader';

const ContentAIPage: React.FC = () => {
  return (
    <div className="fixed inset-0 z-40">
      <RemoteContentAILoader />
    </div>
  );
};

export default ContentAIPage;