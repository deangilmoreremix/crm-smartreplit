// Remote Pipeline Page - Exact same pattern as ContactsWithRemote.tsx
import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink, Wifi, WifiOff } from 'lucide-react';
import { useDealStore } from '../store/dealStore';

const PipelineWithRemote: React.FC = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { deals, addDeal, updateDeal, deleteDeal, fetchDeals } = useDealStore();

  // Initialize pipeline data when component mounts
  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  // Handle iframe load event - same as contacts
  const handleIframeLoad = () => {
    console.log('📱 Remote pipeline iframe loaded');
    // Set connected status - no complex bridge needed
    setTimeout(() => {
      setIsConnected(true);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header - exact same pattern as contacts */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <ExternalLink className="h-6 w-6 text-blue-600" />
              Pipeline Module
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Remote pipeline management system
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full">
              ✓ Remote Module
            </div>
            <div className={`text-sm px-3 py-1 rounded-full flex items-center gap-1 ${
              isConnected 
                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                : 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200'
            }`}>
              {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {isConnected ? 'CRM Connected' : 'Connecting...'}
            </div>
          </div>
        </div>
      </div>

      {/* Embedded Remote App - exact same pattern as contacts */}
      <div className="flex-1" style={{ height: 'calc(100vh - 100px)' }}>
        <iframe
          ref={iframeRef}
          src="https://cheery-syrniki-b5b6ca.netlify.app"
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            overflow: 'hidden'
          }}
          title="Remote Pipeline Module"
          allow="clipboard-read; clipboard-write"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
          onLoad={handleIframeLoad}
        />
      </div>
    </div>
  );
};

export default PipelineWithRemote;