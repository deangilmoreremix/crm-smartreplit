// Remote AI Goals Loader for Dashboard Sections
import React from 'react';
import { useRemoteEmbedStatus } from '../utils/remoteAppManager';
import RemoteEmbedFallback from './RemoteEmbedFallback';

interface RemoteAIGoalsLoaderProps {
  showHeader?: boolean;
}

// Override with VITE_AGENCY_REMOTE_URL (e.g. a staging host).
export const AGENCY_REMOTE_URL: string =
  import.meta.env.VITE_AGENCY_REMOTE_URL || 'https://agency.smartcrm.vip/';

const RemoteAIGoalsLoader: React.FC<RemoteAIGoalsLoaderProps> = ({ showHeader = true }) => {
  // No auto-refresh: a periodic reload would wipe in-progress work.
  const { iframeRef, status, onLoad, retry, attempt } = useRemoteEmbedStatus(AGENCY_REMOTE_URL);

  return (
    <div className="w-full h-full">
      {showHeader && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 border-b border-blue-200 dark:border-blue-800">
          <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">Remote AI Goals</h3>
        </div>
      )}

      <div className="relative" style={{ height: showHeader ? 'calc(100% - 50px)' : '100%' }}>
        {status === 'timeout' && (
          <RemoteEmbedFallback title="AI Goals" url={AGENCY_REMOTE_URL} onRetry={retry} />
        )}
        <iframe
          key={attempt}
          ref={iframeRef}
          src={AGENCY_REMOTE_URL}
          onLoad={onLoad}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            display: status === 'timeout' ? 'none' : undefined,
          }}
          title="Remote AI Goals"
          allow="clipboard-read; clipboard-write"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
        />
      </div>
    </div>
  );
};

export default RemoteAIGoalsLoader;
