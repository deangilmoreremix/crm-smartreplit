// Simple iframe-based remote contacts integration
import React, { useRef, useEffect, useState } from 'react';

interface RemoteContactsIframeProps {
  remoteUrl: string; // URL of your deployed Bolt contacts app
  onContactSelect?: (contact: any) => void;
  onContactCreate?: (contact: any) => void;
  onContactUpdate?: (contact: any) => void;
  onContactDelete?: (contactId: string) => void;
  initialContacts?: any[];
  theme?: 'light' | 'dark';
  height?: string;
  className?: string;
}

interface MessageData {
  type: 'CONTACT_SELECTED' | 'CONTACT_CREATED' | 'CONTACT_UPDATED' | 'CONTACT_DELETED' | 'READY';
  contact?: any;
  contactId?: string;
}

const RemoteContactsIframe: React.FC<RemoteContactsIframeProps> = ({
  remoteUrl,
  onContactSelect,
  onContactCreate,
  onContactUpdate,
  onContactDelete,
  initialContacts,
  theme = 'light',
  height = '600px',
  className = ''
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Message handler for iframe communication
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verify origin for security
      try {
        const url = new URL(remoteUrl);
        if (event.origin !== url.origin) {
          return; // Ignore messages from unknown origins
        }
      } catch {
        return; // Invalid URL
      }

      const data: MessageData = event.data;

      switch (data.type) {
        case 'READY':
          setIsReady(true);
          setError(null);
          // Send initial data to iframe
          sendMessageToIframe({
            type: 'INIT',
            contacts: initialContacts,
            theme
          });
          break;
          
        case 'CONTACT_SELECTED':
          onContactSelect?.(data.contact);
          break;
          
        case 'CONTACT_CREATED':
          onContactCreate?.(data.contact);
          break;
          
        case 'CONTACT_UPDATED':
          onContactUpdate?.(data.contact);
          break;
          
        case 'CONTACT_DELETED':
          onContactDelete?.(data.contactId);
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [remoteUrl, onContactSelect, onContactCreate, onContactUpdate, onContactDelete, initialContacts, theme]);

  const sendMessageToIframe = (message: any) => {
    if (iframeRef.current?.contentWindow) {
      try {
        const url = new URL(remoteUrl);
        iframeRef.current.contentWindow.postMessage(message, url.origin);
      } catch (err) {
        console.error('Failed to send message to iframe:', err);
      }
    }
  };

  const handleIframeLoad = () => {
    // iframe loaded, wait for READY message
    setTimeout(() => {
      if (!isReady) {
        setError('Remote contacts app did not respond');
      }
    }, 10000); // 10 second timeout
  };

  const handleIframeError = () => {
    setError('Failed to load remote contacts app');
  };

  // Update iframe when props change
  useEffect(() => {
    if (isReady) {
      sendMessageToIframe({
        type: 'UPDATE_PROPS',
        contacts: initialContacts,
        theme
      });
    }
  }, [initialContacts, theme, isReady]);

  return (
    <div className={`relative ${className}`}>
      {!isReady && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading remote contacts...</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Remote Contacts Error</h3>
          <p className="text-red-700 text-sm mt-1">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setIsReady(false);
              iframeRef.current?.contentWindow?.location.reload();
            }}
            className="mt-2 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 text-xs rounded"
          >
            Retry
          </button>
        </div>
      )}
      
      <iframe
        ref={iframeRef}
        src={remoteUrl}
        style={{ height }}
        className="w-full border border-gray-200 rounded-lg"
        onLoad={handleIframeLoad}
        onError={handleIframeError}
        sandbox="allow-scripts allow-same-origin allow-forms"
        title="Remote Contacts Application"
      />
    </div>
  );
};

export default RemoteContactsIframe;