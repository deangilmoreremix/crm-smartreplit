
import React, { useState, useEffect, useRef } from 'react';
import { Globe, RefreshCw, ExternalLink, AlertCircle } from 'lucide-react';

interface SmartIframeContactsProps {
  remoteUrls?: string[];
  fallbackComponent: React.ComponentType<any>;
  onContactSync?: () => void;
}

const SmartIframeContacts: React.FC<SmartIframeContactsProps> = ({
  remoteUrls = [
    'https://taupe-sprinkles-83c9ee.netlify.app',
    'https://contacts-app.vercel.app',
    'https://bolt.new'
  ],
  fallbackComponent: FallbackComponent,
  onContactSync
}) => {
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = remoteUrls.length * 2;
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const currentUrl = remoteUrls[currentUrlIndex];

  const tryNextUrl = () => {
    if (currentUrlIndex < remoteUrls.length - 1) {
      setCurrentUrlIndex(prev => prev + 1);
      setRetryCount(prev => prev + 1);
      setLoading(true);
      setError(null);
    } else {
      setError('All remote sources failed to load');
      setLoading(false);
    }
  };

  const handleIframeLoad = () => {
    console.log(`Successfully loaded: ${currentUrl}`);
    setLoading(false);
    setError(null);
    
    // Try to establish communication with the iframe
    try {
      const iframe = iframeRef.current;
      if (iframe?.contentWindow) {
        // Send initialization message
        iframe.contentWindow.postMessage({
          type: 'SMARTCRM_INIT',
          data: { source: 'smartcrm', allowSync: true }
        }, '*');
      }
    } catch (e) {
      console.warn('Cannot communicate with iframe due to CORS policy');
    }
  };

  const handleIframeError = () => {
    console.warn(`Failed to load: ${currentUrl}`);
    if (retryCount < maxRetries) {
      setTimeout(tryNextUrl, 1000);
    } else {
      setError('Unable to load any remote contacts application');
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    setError(null);
    setRetryCount(0);
    setCurrentUrlIndex(0);
    
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  // Listen for messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const { type, data } = event.data;
        
        if (type === 'CONTACT_SYNC_REQUEST') {
          console.log('Remote app requested contact sync');
          onContactSync?.();
        }
      } catch (e) {
        // Ignore invalid messages
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onContactSync]);

  // Auto-retry mechanism
  useEffect(() => {
    if (loading && !error) {
      const timer = setTimeout(() => {
        if (loading && retryCount < maxRetries) {
          console.log(`Timeout loading ${currentUrl}, trying next...`);
          tryNextUrl();
        }
      }, 8000); // 8 second timeout per URL

      return () => clearTimeout(timer);
    }
  }, [loading, currentUrl, retryCount]);

  if (error && retryCount >= maxRetries) {
    return (
      <div className="h-full w-full">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-yellow-50 dark:bg-yellow-900/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-yellow-700 dark:text-yellow-400">
              <AlertCircle className="h-4 w-4" />
              <span>Remote contacts unavailable - using local version</span>
            </div>
            <button
              onClick={handleRefresh}
              className="flex items-center space-x-1 px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Retry</span>
            </button>
          </div>
        </div>
        <FallbackComponent onContactSync={onContactSync} />
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col">
      {/* Status Bar */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Loading remote contacts... ({currentUrlIndex + 1}/{remoteUrls.length})
                </span>
              </>
            ) : (
              <>
                <Globe className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600">
                  Connected to {new URL(currentUrl).hostname}
                </span>
              </>
            )}
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={handleRefresh}
              className="flex items-center space-x-1 px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
              disabled={loading}
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            
            <a
              href={currentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
            >
              <ExternalLink className="h-3 w-3" />
              <span>Open</span>
            </a>
          </div>
        </div>
        
        {loading && (
          <div className="mt-2 text-xs text-gray-500">
            Trying: {currentUrl}
          </div>
        )}
      </div>

      {/* Iframe Container */}
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-800 z-10">
            <div className="text-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
                Connecting to Remote Contacts
              </p>
              <p className="text-gray-600 dark:text-gray-400 mb-1">
                Attempting to load from {new URL(currentUrl).hostname}...
              </p>
              <div className="mt-4 text-xs text-gray-400">
                Will fallback to local contacts if connection fails
              </div>
            </div>
          </div>
        )}
        
        <iframe
          ref={iframeRef}
          src={currentUrl}
          className={`w-full h-full border-0 ${loading ? 'opacity-0' : 'opacity-100'}`}
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation-by-user-activation"
          allow="camera; microphone; geolocation"
          title="Remote Contacts Application"
        />
      </div>
    </div>
  );
};

export default SmartIframeContacts;
