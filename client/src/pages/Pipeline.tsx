import React, { useState, useEffect, useRef } from 'react';
import { 
  ExternalLink, 
  RefreshCw, 
  Activity,
  AlertCircle,
  CheckCircle,
  ArrowLeft
} from 'lucide-react';
import { useDealStore } from '../store/dealStore';
import { useContactStore } from '../store/contactStore';
import { useTheme } from '../contexts/ThemeContext';
import { RemotePipelineBridge, type RemotePipelineStatus } from '../services/remotePipelineBridge';

const Pipeline: React.FC = () => {
  const { isDark } = useTheme();
  const { deals, addDeal, updateDeal, deleteDeal } = useDealStore();
  const { contacts } = useContactStore();
  
  // Remote Pipeline Integration State
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const bridgeRef = useRef<RemotePipelineBridge | null>(null);
  const [bridgeStatus, setBridgeStatus] = useState<RemotePipelineStatus>({
    isConnected: false,
    lastSync: null,
    dealCount: 0,
    connectionAttempts: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showLocalFallback, setShowLocalFallback] = useState(false);
  
  const REMOTE_PIPELINE_URL = 'https://cheery-syrniki-b5b6ca.netlify.app';
  const MAX_CONNECTION_ATTEMPTS = 3;

  // Initialize Remote Pipeline Bridge
  useEffect(() => {
    if (!bridgeRef.current) {
      bridgeRef.current = new RemotePipelineBridge((status: RemotePipelineStatus) => {
        setBridgeStatus(status);
        setIsLoading(!status.isConnected && status.connectionAttempts < MAX_CONNECTION_ATTEMPTS);
        setShowLocalFallback(status.connectionAttempts >= MAX_CONNECTION_ATTEMPTS && !status.isConnected);
      });
    }

    return () => {
      if (bridgeRef.current) {
        bridgeRef.current.destroy();
        bridgeRef.current = null;
      }
    };
  }, []);

  // Update iframe reference when it changes
  useEffect(() => {
    if (bridgeRef.current && iframeRef.current) {
      bridgeRef.current.setIframe(iframeRef.current);
    }
  }, [iframeRef.current]);

  // Retry connection
  const retryConnection = () => {
    if (bridgeRef.current) {
      const success = bridgeRef.current.retry();
      if (success) {
        setIsLoading(true);
        setShowLocalFallback(false);
      }
    }
  };

  if (showLocalFallback) {
    return (
      <div className={`min-h-screen p-6 ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="max-w-4xl mx-auto">
          <div className={`p-6 rounded-xl border ${
            isDark ? 'border-yellow-500/30 bg-yellow-500/10' : 'border-yellow-200 bg-yellow-50'
          }`}>
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className={`${isDark ? 'text-yellow-400' : 'text-yellow-600'}`} size={24} />
              <h2 className={`text-xl font-semibold ${isDark ? 'text-yellow-300' : 'text-yellow-800'}`}>
                Remote Pipeline Unavailable
              </h2>
            </div>
            <p className={`mb-4 ${isDark ? 'text-yellow-200' : 'text-yellow-700'}`}>
              The remote pipeline module couldn't be loaded from https://cheery-syrniki-b5b6ca.netlify.app. 
              This might be due to network issues or the remote service being temporarily unavailable.
            </p>
            <div className="flex gap-3">
              <button
                onClick={retryConnection}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isDark 
                    ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
                    : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                }`}
              >
                <RefreshCw size={16} className="inline mr-2" />
                Retry Connection
              </button>
              <button
                onClick={() => window.location.hash = '/dashboard'}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  isDark 
                    ? 'border-gray-600 hover:bg-gray-800 text-gray-300' 
                    : 'border-gray-300 hover:bg-gray-100 text-gray-700'
                }`}
              >
                <ArrowLeft size={16} className="inline mr-2" />
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Pipeline Status Header */}
      <div className={`border-b ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'} px-6 py-4`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Pipeline & Deal Management
            </h1>
            <div className="flex items-center gap-2">
              {bridgeStatus.isConnected ? (
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30">
                  <CheckCircle size={16} className="text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">
                    Connected
                  </span>
                </div>
              ) : isLoading ? (
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30">
                  <Activity size={16} className="text-blue-600 dark:text-blue-400 animate-pulse" />
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    Connecting...
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30">
                  <AlertCircle size={16} className="text-red-600 dark:text-red-400" />
                  <span className="text-sm font-medium text-red-700 dark:text-red-300">
                    Disconnected
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {bridgeStatus.lastSync && (
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Last sync: {bridgeStatus.lastSync.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={retryConnection}
              disabled={isLoading}
              className={`px-4 py-2 rounded-lg border transition-colors disabled:opacity-50 ${
                isDark 
                  ? 'border-gray-600 hover:bg-gray-800 text-gray-300' 
                  : 'border-gray-300 hover:bg-gray-100 text-gray-700'
              }`}
            >
              <RefreshCw size={16} className={`inline mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <a
              href={REMOTE_PIPELINE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`px-4 py-2 rounded-lg border transition-colors ${
                isDark 
                  ? 'border-gray-600 hover:bg-gray-800 text-gray-300' 
                  : 'border-gray-300 hover:bg-gray-100 text-gray-700'
              }`}
            >
              <ExternalLink size={16} className="inline mr-2" />
              Open Direct
            </a>
          </div>
        </div>
      </div>

      {/* Remote Pipeline Iframe */}
      <div className="flex-1">
        {isLoading && (
          <div className={`absolute inset-0 flex items-center justify-center ${
            isDark ? 'bg-gray-900/90' : 'bg-white/90'
          } z-10`}>
            <div className="text-center">
              <Activity size={48} className={`mx-auto mb-4 ${isDark ? 'text-blue-400' : 'text-blue-600'} animate-spin`} />
              <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Loading Pipeline
              </h3>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Connecting to remote pipeline module...
              </p>
              <div className={`mt-4 text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                Attempt {bridgeStatus.connectionAttempts + 1} of {MAX_CONNECTION_ATTEMPTS}
              </div>
            </div>
          </div>
        )}
        
        <iframe
          ref={iframeRef}
          src={REMOTE_PIPELINE_URL}
          className="w-full h-screen border-0"
          title="Remote Pipeline Management"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-top-navigation"
          allow="clipboard-read; clipboard-write"
          onLoad={() => {
            console.log('📱 Remote pipeline iframe loaded');
            // Give the remote app time to initialize before connecting bridge
            setTimeout(() => {
              if (bridgeRef.current) {
                bridgeRef.current.initializePipeline();
              }
            }, 2000);
          }}
          onError={(e) => {
            console.error('❌ Remote pipeline iframe failed to load:', e);
            setIsLoading(false);
            setBridgeStatus(prev => ({
              ...prev,
              isConnected: false,
              errorMessage: 'Failed to load remote pipeline',
              connectionAttempts: prev.connectionAttempts + 1
            }));
          }}
        />
      </div>
    </div>
  );
};

export default Pipeline;
