import React, { useState, useEffect, useRef } from 'react';
import PageLayout from '../components/PageLayout';
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
import { Button } from '../components/ui/button';

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
      <PageLayout
        title="Pipeline & Deal Management"
        description="Remote pipeline module unavailable - connection failed"
      >
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
            <Button onClick={retryConnection} variant="secondary">
              <RefreshCw size={16} className="mr-2" />
              Retry Connection
            </Button>
            <Button
              onClick={() => window.location.hash = '/dashboard'}
              variant="outline"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Pipeline & Deal Management"
      description="Advanced pipeline management with remote integration"
      actions={
        <div className="flex items-center gap-3">
          {bridgeStatus.lastSync && (
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Last sync: {bridgeStatus.lastSync.toLocaleTimeString()}
            </span>
          )}
          <Button onClick={retryConnection} disabled={isLoading} variant="outline">
            <RefreshCw size={16} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <a
            href={REMOTE_PIPELINE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <ExternalLink size={16} className="mr-2" />
            Open Direct
          </a>
        </div>
      }
    >
      {/* Pipeline Status Indicator */}
      <div className="mb-6">
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
    </PageLayout>
  );
};

export default Pipeline;
