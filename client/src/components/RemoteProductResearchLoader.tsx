// Remote Product Research Module Loader
import React from 'react';
import { RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { useRemoteEmbedStatus } from '../utils/remoteAppManager';
import RemoteEmbedFallback from './RemoteEmbedFallback';

interface RemoteProductResearchLoaderProps {
  showHeader?: boolean;
}

// Default is a bolt.new preview host; override with VITE_PRODUCT_RESEARCH_URL for a stable host.
export const PRODUCT_RESEARCH_URL: string =
  import.meta.env.VITE_PRODUCT_RESEARCH_URL || 'https://product-research-mod-uay0.bolt.host/';
const REMOTE_URL = PRODUCT_RESEARCH_URL;

const RemoteProductResearchLoader: React.FC<RemoteProductResearchLoaderProps> = ({
  showHeader = false,
}) => {
  // No auto-refresh: a periodic reload would wipe in-progress research.
  const { iframeRef, status, onLoad, retry, attempt } = useRemoteEmbedStatus(REMOTE_URL);

  return (
    <div className="h-full flex flex-col">
      {showHeader && (
        <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Product Research</h3>
            {status === 'confirmed' ? (
              <div className="flex items-center text-green-600 text-xs">
                <Wifi className="w-3 h-3 mr-1" />
                Connected
              </div>
            ) : (
              <div className="flex items-center text-gray-500 text-xs">
                <WifiOff className="w-3 h-3 mr-1" />
                {status === 'unconfirmed'
                  ? 'Loaded (not confirmed)'
                  : status === 'timeout'
                    ? 'Unavailable'
                    : 'Connecting...'}
              </div>
            )}
          </div>

          <button
            onClick={retry}
            className="flex items-center px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Refresh
          </button>
        </div>
      )}

      <div className="flex-1 relative">
        {status === 'timeout' && (
          <RemoteEmbedFallback title="Product Research" url={REMOTE_URL} onRetry={retry} />
        )}

        <iframe
          key={attempt}
          ref={iframeRef}
          src={REMOTE_URL}
          onLoad={onLoad}
          className={`w-full h-full border-0 ${status === 'timeout' ? 'hidden' : ''}`}
          title="Product Research Module"
          style={{ minHeight: '600px', height: 'calc(100vh - 120px)' }}
          allow="clipboard-read; clipboard-write; fullscreen; microphone; camera; web-share"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-downloads"
          allowFullScreen
          loading="lazy"
        />
      </div>
    </div>
  );
};

export default RemoteProductResearchLoader;
