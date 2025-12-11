
import React, { useEffect, useRef, useState } from 'react';
import { Wifi, WifiOff, RefreshCw, ExternalLink } from 'lucide-react';

interface WebComponentsRemoteContactsProps {
  remoteUrls?: string[];
  fallbackComponent: React.ComponentType<any>;
  onContactSync?: () => void;
}

const WebComponentsRemoteContacts: React.FC<WebComponentsRemoteContactsProps> = ({
  remoteUrls = [
    'https://taupe-sprinkles-83c9ee.netlify.app',
    'https://contacts-app.vercel.app',
    'https://bolt.new/~/sb1-your-contacts-app'
  ],
  fallbackComponent: FallbackComponent,
  onContactSync
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'failed'>('checking');
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Test connectivity to remote URLs
  const testRemoteConnectivity = async () => {
    setConnectionStatus('checking');
    setError(null);

    for (const url of remoteUrls) {
      try {
        console.log(`Testing connectivity to: ${url}`);
        
        // Create a test iframe to check if URL loads
        const testFrame = document.createElement('iframe');
        testFrame.style.display = 'none';
        testFrame.src = url;
        
        const loadPromise = new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            document.body.removeChild(testFrame);
            reject(new Error('Timeout'));
          }, 5000);

          testFrame.onload = () => {
            clearTimeout(timeout);
            document.body.removeChild(testFrame);
            resolve(url);
          };

          testFrame.onerror = () => {
            clearTimeout(timeout);
            document.body.removeChild(testFrame);
            reject(new Error('Failed to load'));
          };
        });

        document.body.appendChild(testFrame);
        await loadPromise;
        
        setCurrentUrl(url);
        setConnectionStatus('connected');
        console.log(`Successfully connected to: ${url}`);
        return;
        
      } catch (error) {
        console.warn(`Failed to connect to ${url}:`, error);
        continue;
      }
    }

    setConnectionStatus('failed');
    setError('All remote contact sources are unavailable');
  };

  // Setup message listener for cross-frame communication
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Only accept messages from trusted origins
      const trustedOrigins = remoteUrls.map(url => new URL(url).origin);
      if (!trustedOrigins.includes(event.origin)) return;

      const { type, data } = event.data;

      switch (type) {
        case 'CONTACT_CREATED':
          console.log('Remote contact created:', data);
          onContactSync?.();
          break;
        case 'CONTACT_UPDATED':
          console.log('Remote contact updated:', data);
          onContactSync?.();
          break;
        case 'CONTACT_DELETED':
          console.log('Remote contact deleted:', data);
          onContactSync?.();
          break;
        case 'CONTACTS_LOADED':
          console.log('Remote contacts loaded:', data);
          setIsLoaded(true);
          break;
        case 'APP_READY':
          console.log('Remote app is ready');
          setIsLoaded(true);
          // Send initialization data to remote app
          sendMessageToRemote('INIT_CONFIG', {
            theme: 'smartcrm',
            allowCreate: true,
            allowEdit: true,
            allowDelete: true
          });
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onContactSync, remoteUrls]);

  // Send messages to remote iframe
  const sendMessageToRemote = (type: string, data: any) => {
    if (iframeRef.current && currentUrl) {
      const targetOrigin = new URL(currentUrl).origin;
      iframeRef.current.contentWindow?.postMessage({ type, data }, targetOrigin);
    }
  };

  // Initialize connectivity test
  useEffect(() => {
    testRemoteConnectivity();
  }, []);

  const handleRefresh = () => {
    setIsLoaded(false);
    setError(null);
    testRemoteConnectivity();
  };

  const renderStatus = () => {
    if (connectionStatus === 'checking') {
      return (
        <div className="flex items-center space-x-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span>Discovering remote contacts...</span>
        </div>
      );
    }
    
    if (connectionStatus === 'connected') {
      return (
        <div className="flex items-center space-x-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
          <Wifi className="h-4 w-4" />
          <span>Connected to {new URL(currentUrl!).hostname}</span>
        </div>
      );
    }
    
    return (
      <div className="flex items-center space-x-2 text-sm text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
        <WifiOff className="h-4 w-4" />
        <span>Remote unavailable - using local contacts</span>
      </div>
    );
  };

  if (connectionStatus === 'failed' || !currentUrl) {
    return (
      <div className="h-full w-full">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            {renderStatus()}
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
      {/* Status and Controls */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center justify-between">
          {renderStatus()}
          <div className="flex space-x-2">
            <button
              onClick={handleRefresh}
              className="flex items-center space-x-1 px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
            >
              <RefreshCw className="h-3 w-3" />
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
        
        {error && (
          <div className="mt-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded">
            {error}
          </div>
        )}
      </div>

      {/* Remote App Container */}
      <div className="flex-1 relative">
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-800 z-10">
            <div className="text-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
                Loading Remote Contacts
              </p>
              <p className="text-gray-600 dark:text-gray-400 mb-1">
                Connecting to {new URL(currentUrl).hostname}...
              </p>
              <div className="mt-4 text-xs text-gray-400">
                This may take a few moments on first load
              </div>
            </div>
          </div>
        )}
        
        <iframe
          ref={iframeRef}
          src={currentUrl}
          className={`w-full h-full border-0 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => {
            console.log('Remote contacts iframe loaded');
            setIsLoaded(true);
            // Send ready signal to remote app
            sendMessageToRemote('PARENT_READY', { source: 'smartcrm' });
          }}
          onError={() => {
            console.error('Failed to load remote contacts');
            setError('Failed to load remote application');
          }}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation-by-user-activation"
          allow="camera; microphone; geolocation"
          title="Remote Contacts Application"
        />
      </div>
    </div>
  );
};

export default WebComponentsRemoteContacts;
