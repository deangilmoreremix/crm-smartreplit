import React from 'react';
import AutoRefreshRemoteApp from './AutoRefreshRemoteApp';

const RemoteAnalyticsLoader: React.FC = () => {
  return (
    <div className="w-full h-full">
      <AutoRefreshRemoteApp
        src="https://ai-analytics.smartcrm.vip?theme=light&mode=light"
        title="AI-Powered Analytics Dashboard"
        defaultRefreshInterval={180} // 3 minutes for analytics
        allowFullscreen={true}
      />
    </div>
  );
};

export default RemoteAnalyticsLoader;