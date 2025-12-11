import React, { useState, useEffect } from 'react';
import { Settings, ExternalLink, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { useContactStore } from '../../hooks/useContactStore';
import { Contact } from '../../types/contact';

interface RemoteContactsIntegrationProps {
  remoteUrl: string;
  onContactSync?: () => void;
}

const RemoteContactsIntegration: React.FC<RemoteContactsIntegrationProps> = ({
  remoteUrl,
  onContactSync
}) => {
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);
  const [iframeSrc, setIframeSrc] = useState('');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'failed'>('checking');
  
  const {
    contacts,
    addContact,
    updateContact,
    deleteContact,
    fetchContacts
  } = useContactStore();

  useEffect(() => {
    // Clean up the URL and set iframe source
    const cleanUrl = remoteUrl.endsWith('/') ? remoteUrl.slice(0, -1) : remoteUrl;
    setIframeSrc(cleanUrl);
    
    // Reset loading state when URL changes
    setIsIframeLoaded(false);
    setConnectionStatus('checking');
    
    // Test if URL is accessible
    const testConnection = async () => {
      try {
        console.log('Testing connection to:', cleanUrl);
        const response = await fetch(cleanUrl, { 
          method: 'HEAD', 
          mode: 'no-cors',
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });
        console.log('Connection test completed');
        setConnectionStatus('connected');
      } catch (error) {
        console.warn('Connection test failed:', error);
        setConnectionStatus('failed');
        // Still try to load iframe even if HEAD request fails
      }
    };
    
    testConnection();
    
    // Set a maximum timeout for loading
    const loadTimeout = setTimeout(() => {
      if (!isIframeLoaded) {
        console.warn('Remote contacts app took too long to load');
        setIsIframeLoaded(true); // Force show iframe
      }
    }, 30000); // 30 second timeout
    
    return () => clearTimeout(loadTimeout);
  }, [remoteUrl]);

  // Handle messages from the embedded contacts app
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Security: only accept messages from your trusted domain
      if (!event.origin.includes('netlify.app') && !event.origin.includes('localhost')) {
        return;
      }

      const { type, data } = event.data;

      switch (type) {
        case 'CONTACT_SELECTED':
          console.log('Contact selected in remote app:', data);
          break;
          
        case 'CONTACT_CREATED':
          console.log('Contact created in remote app:', data);
          if (data && data.contact) {
            addContact(data.contact);
            setSyncStatus('success');
            setTimeout(() => setSyncStatus('idle'), 3000);
          }
          onContactSync?.();
          break;
          
        case 'CONTACT_UPDATED':
          console.log('Contact updated in remote app:', data);
          if (data && data.contact && data.contact.id) {
            updateContact(data.contact.id, data.contact);
            setSyncStatus('success');
            setTimeout(() => setSyncStatus('idle'), 3000);
          }
          onContactSync?.();
          break;
          
        case 'CONTACT_DELETED':
          console.log('Contact deleted in remote app:', data);
          if (data && data.contactId) {
            deleteContact(data.contactId);
            setSyncStatus('success');
            setTimeout(() => setSyncStatus('idle'), 3000);
          }
          onContactSync?.();
          break;
          
        case 'REQUEST_CONTACTS':
          // Send current contacts to the remote app
          const requestIframe = document.getElementById('remote-contacts-iframe') as HTMLIFrameElement;
          if (requestIframe && requestIframe.contentWindow) {
            requestIframe.contentWindow.postMessage({
              type: 'CONTACTS_DATA',
              data: { contacts: Object.values(contacts) }
            }, '*');
          }
          break;
          
        case 'APP_READY':
          console.log('Remote contacts app is ready');
          setIsIframeLoaded(true);
          // Send initial data
          const appReadyIframe = document.getElementById('remote-contacts-iframe') as HTMLIFrameElement;
          if (appReadyIframe && appReadyIframe.contentWindow) {
            appReadyIframe.contentWindow.postMessage({
              type: 'INIT_DATA',
              data: { 
                contacts: Object.values(contacts),
                theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light'
              }
            }, '*');
          }
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [contacts, addContact, updateContact, deleteContact, onContactSync]);

  const handleSyncContacts = () => {
    setSyncStatus('syncing');
    fetchContacts().then(() => {
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 3000);
    }).catch(() => {
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 3000);
    });
  };

  const handleIframeLoad = () => {
    console.log('Iframe loaded, waiting for app ready signal...');
    // Set a timeout to show error if app doesn't respond
    setTimeout(() => {
      if (!isIframeLoaded) {
        console.warn('Remote app did not send ready signal within 15 seconds');
        setIsIframeLoaded(true); // Show iframe anyway
      }
    }, 15000);
  };

  return (
    <div className="h-full w-full">
      {/* Status Bar */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-700/50 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                isIframeLoaded ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
              }`}></div>
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Remote Contacts {isIframeLoaded ? 'Connected' : 'Loading...'}
              </span>
            </div>
            
            {syncStatus !== 'idle' && (
              <div className="flex items-center space-x-2">
                {syncStatus === 'syncing' && (
                  <>
                    <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
                    <span className="text-sm text-blue-700 dark:text-blue-300">Syncing...</span>
                  </>
                )}
                {syncStatus === 'success' && (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-700 dark:text-green-300">Synced</span>
                  </>
                )}
                {syncStatus === 'error' && (
                  <>
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-red-700 dark:text-red-300">Sync failed</span>
                  </>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSyncContacts}
              disabled={syncStatus === 'syncing'}
              className="flex items-center space-x-1 px-3 py-1 bg-blue-100 dark:bg-blue-800/50 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors text-sm disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
              <span>Sync</span>
            </button>
            
            <button
              onClick={() => {
                const iframe = document.getElementById('remote-contacts-iframe') as HTMLIFrameElement;
                if (iframe) {
                  setIsIframeLoaded(false);
                  iframe.src = iframe.src; // Reload iframe
                }
              }}
              className="flex items-center space-x-1 px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Reload</span>
            </button>
            
            {!isIframeLoaded && (
              <button
                onClick={() => setIsIframeLoaded(true)}
                className="flex items-center space-x-1 px-3 py-1 bg-orange-100 dark:bg-orange-800/50 text-orange-700 dark:text-orange-300 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-800 transition-colors text-sm"
              >
                <span>Force Load</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Remote App Container */}
      <div className="relative w-full" style={{ height: 'calc(100vh - 120px)' }}>
        {!isIframeLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-800 z-10">
            <div className="text-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">Loading Remote Contacts</p>
              <p className="text-gray-600 dark:text-gray-400 mb-1">
                {connectionStatus === 'checking' && 'Testing connection...'}
                {connectionStatus === 'connected' && 'Loading remote application...'}
                {connectionStatus === 'failed' && 'Connection test failed, trying anyway...'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                {remoteUrl}
              </p>
              <div className="mt-4 text-xs text-gray-400">
                {connectionStatus === 'failed' ? 
                  'The remote app might be slow or temporarily unavailable' :
                  'This may take a few moments on first load'
                }
              </div>
            </div>
          </div>
        )}
        
        <iframe
          id="remote-contacts-iframe"
          src={iframeSrc}
          className={`w-full h-full border-0 ${isIframeLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={handleIframeLoad}
          onError={() => {
            console.error('Failed to load remote contacts iframe');
            setIsIframeLoaded(true); // Show iframe even if there's an error
          }}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation-by-user-activation"
          allow="camera; microphone; geolocation"
          title="Remote Contacts Application"
        />
      </div>
    </div>
  );
};

export default RemoteContactsIntegration;