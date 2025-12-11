
import { useEffect, useRef, useState } from 'react';
import { remoteAppManager } from '../utils/remoteAppManager';
import { universalDataSync } from '../services/universalDataSync';
import { useContactStore } from '../store/contactStore';
import { useDealStore } from '../store/dealStore';
import { useTaskStore } from '../store/taskStore';

export interface RemoteAppConfig {
  id: string;
  name: string;
  url: string;
  type: 'contacts' | 'pipeline' | 'analytics' | 'tools' | 'ai';
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useUniversalRemoteIntegration(config: RemoteAppConfig) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [errorCount, setErrorCount] = useState(0);

  const { contacts } = useContactStore();
  const { deals } = useDealStore();
  const { tasks } = useTaskStore();

  useEffect(() => {
    if (!iframeRef.current) return;

    // Initialize universal sync service
    universalDataSync.initialize();

    // Create bridge for this specific app
    const bridge = createAppBridge(config);
    remoteAppManager.registerBridge(config.id, bridge);

    // Set up iframe reference
    bridge.setIframe(iframeRef.current);

    // Start auto-refresh if enabled
    if (config.autoRefresh) {
      remoteAppManager.startAutoRefresh(
        config.id,
        config.url,
        config.refreshInterval || 60000
      );
    }

    // Listen for connection status
    const handleConnection = (event: MessageEvent) => {
      if (event.data?.type === 'REMOTE_READY' && event.data?.appId === config.id) {
        setIsConnected(true);
        setLastSync(new Date());
        setErrorCount(0);
        
        // Send initial data sync
        setTimeout(() => {
          syncInitialData(bridge);
        }, 1000);
      }
    };

    window.addEventListener('message', handleConnection);

    return () => {
      window.removeEventListener('message', handleConnection);
      remoteAppManager.stopAutoRefresh(config.id);
    };
  }, [config]);

  const createAppBridge = (appConfig: RemoteAppConfig) => {
    return {
      iframe: null as HTMLIFrameElement | null,
      
      setIframe(iframe: HTMLIFrameElement) {
        this.iframe = iframe;
      },

      sendMessage(type: string, data: any) {
        if (!this.iframe?.contentWindow) return false;

        try {
          this.iframe.contentWindow.postMessage({
            type,
            data,
            appId: appConfig.id,
            source: 'crm',
            timestamp: Date.now()
          }, '*');
          return true;
        } catch (error) {
          console.error(`Failed to send message to ${appConfig.id}:`, error);
          setErrorCount(prev => prev + 1);
          return false;
        }
      },

      onMessage(type: string, handler: Function) {
        const messageHandler = (event: MessageEvent) => {
          if (event.data?.type === type && event.data?.appId === appConfig.id) {
            handler(event.data);
          }
        };
        window.addEventListener('message', messageHandler);
        return () => window.removeEventListener('message', messageHandler);
      }
    };
  };

  const syncInitialData = (bridge: any) => {
    console.log(`🔄 Syncing initial data to ${config.name}`);

    // Send all current data to the remote app
    bridge.sendMessage('CRM_INIT', {
      appInfo: {
        name: 'Smart CRM',
        version: '2.0.0',
        timestamp: new Date().toISOString()
      },
      data: {
        contacts: Object.values(contacts),
        deals: Object.values(deals),
        tasks: Object.values(tasks)
      },
      config: {
        theme: 'light',
        features: ['sync', 'realtime', 'ai']
      }
    });

    setLastSync(new Date());
  };

  const manualSync = () => {
    universalDataSync.forceSyncAll();
    setLastSync(new Date());
  };

  const refreshApp = () => {
    remoteAppManager.refreshIframe(config.id);
  };

  return {
    iframeRef,
    isConnected,
    lastSync,
    errorCount,
    manualSync,
    refreshApp,
    config
  };
}
