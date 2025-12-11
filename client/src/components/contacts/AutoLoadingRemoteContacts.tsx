
import React, { useState, useEffect } from 'react';
import { AlertCircle, Wifi, WifiOff, RefreshCw, ExternalLink } from 'lucide-react';

interface AutoLoadingRemoteContactsProps {
  remoteUrls?: string[];
  fallbackComponent: React.ComponentType<any>;
  onContactSync?: () => void;
}

const AutoLoadingRemoteContacts: React.FC<AutoLoadingRemoteContactsProps> = ({
  remoteUrls = [
    'https://taupe-sprinkles-83c9ee.netlify.app',
    'https://contacts-app.vercel.app',
    'https://your-backup-contacts.netlify.app'
  ],
  fallbackComponent: FallbackComponent,
  onContactSync
}) => {
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [loadingState, setLoadingState] = useState<'testing' | 'connected' | 'fallback'>('testing');
  const [connectionInfo, setConnectionInfo] = useState<string>('');
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);

  const testUrlConnection = async (url: string): Promise<boolean> => {
    try {
      console.log(`Testing connection to: ${url}`);
      
      // Test if the URL responds
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(url, {
        method: 'HEAD',
        mode: 'no-cors',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      console.log(`Connection test to ${url}: success`);
      return true;
    } catch (error) {
      console.log(`Connection test to ${url}: failed`, error);
      return false;
    }
  };

  const tryNextUrl = async () => {
    if (currentUrlIndex >= remoteUrls.length) {
      // All URLs failed, use fallback
      setLoadingState('fallback');
      setConnectionInfo('All remote sources unavailable - using local contacts');
      return;
    }

    const url = remoteUrls[currentUrlIndex];
    setConnectionInfo(`Testing ${url}...`);
    
    const isConnected = await testUrlConnection(url);
    
    if (isConnected) {
      setCurrentUrl(url);
      setLoadingState('connected');
      setConnectionInfo(`Connected to ${url}`);
      setIsIframeLoaded(false);
    } else {
      setCurrentUrlIndex(prev => prev + 1);
      // Try next URL after a brief delay
      setTimeout(tryNextUrl, 1000);
    }
  };

  useEffect(() => {
    tryNextUrl();
  }, []);

  const handleIframeLoad = () => {
    console.log('Remote contacts iframe loaded successfully');
    setIsIframeLoaded(true);
  };

  const handleIframeError = () => {
    console.log('Iframe failed to load, trying next URL');
    setCurrentUrlIndex(prev => prev + 1);
    tryNextUrl();
  };

  const handleRetry = () => {
    setCurrentUrlIndex(0);
    setLoadingState('testing');
    setIsIframeLoaded(false);
    setConnectionInfo('Retrying connections...');
    tryNextUrl();
  };

  const renderStatus = () => {
    if (loadingState === 'testing') {
      return (
        <div className="flex items-center space-x-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span>{connectionInfo || 'Testing remote connections...'}</span>
        </div>
      );
    }
    
    if (loadingState === 'connected') {
      return (
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
            <Wifi className="h-4 w-4" />
            <span>{connectionInfo}</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRetry}
              className="flex items-center space-x-1 px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Retry</span>
            </button>
            {currentUrl && (
              <a
                href={currentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                <span>Open</span>
              </a>
            )}
          </div>
        </div>
      );
    }
    
    return (
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center space-x-2 text-sm text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
          <WifiOff className="h-4 w-4" />
          <span>{connectionInfo}</span>
        </div>
        <button
          onClick={handleRetry}
          className="flex items-center space-x-1 px-3 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
        >
          <RefreshCw className="h-3 w-3" />
          <span>Retry Remote</span>
        </button>
      </div>
    );
  };

  if (loadingState === 'testing') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-8 max-w-md">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Loading Smart Contacts
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {connectionInfo}
          </p>
          <div className="text-xs text-gray-500">
            Trying: {remoteUrls[currentUrlIndex] || 'All sources tested'}
          </div>
          <button
            onClick={() => setLoadingState('fallback')}
            className="mt-4 px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
          >
            Use Local Contacts
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col">
      {/* Status Bar */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        {renderStatus()}
      </div>
      
      {/* Main Content */}
      <div className="flex-1 relative">
        {loadingState === 'connected' && currentUrl ? (
          <div className="h-full w-full relative">
            {!isIframeLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-800 z-10">
                <div className="text-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">Loading remote contacts app...</p>
                  <p className="text-xs text-gray-500 mt-2">{currentUrl}</p>
                </div>
              </div>
            )}
            <iframe
              src={currentUrl}
              className={`w-full h-full border-0 ${isIframeLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation-by-user-activation"
              allow="camera; microphone; geolocation"
              title="Remote Contacts Application"
            />
          </div>
        ) : (
          <FallbackComponent onContactSync={onContactSync} />
        )}
      </div>
    </div>
  );
};

export default AutoLoadingRemoteContacts;
