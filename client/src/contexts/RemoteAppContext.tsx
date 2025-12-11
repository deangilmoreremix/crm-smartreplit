
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { unifiedEventSystem } from '../services/unifiedEventSystem';
import { unifiedApiClient } from '../services/unifiedApiClient';

interface RemoteApp {
  id: string;
  title: string;
  src: string;
  lastRefreshed: number;
  autoRefreshEnabled: boolean;
  refreshInterval: number;
}

interface RemoteAppContextType {
  apps: Record<string, RemoteApp>;
  sharedData: {
    contacts: any[];
    deals: any[];
    tasks: any[];
    analytics: any;
    user: any;
    settings: any;
  };
  registerApp: (id: string, title: string, src: string) => void;
  unregisterApp: (id: string) => void;
  refreshApp: (id: string) => void;
  refreshAllApps: () => void;
  toggleAutoRefresh: (id: string) => void;
  setRefreshInterval: (id: string, interval: number) => void;
  getAppStatus: (id: string) => RemoteApp | undefined;
  syncDataToAllApps: (dataType: string, data: any) => void;
  broadcastToRemoteApps: (eventType: string, data: any) => void;
  // New unified methods
  syncDataToApp: (appId: string, dataType: string, data: any) => void;
  broadcastToAllApps: (eventType: string, data: any) => void;
  updateSharedData: (dataType: string, data: any) => void;
  requestAI: (appId: string, request: any) => Promise<any>;
  getSharedData: (dataType: string) => any;
}

const RemoteAppContext = createContext<RemoteAppContextType | undefined>(undefined);

export const useRemoteApps = () => {
  const context = useContext(RemoteAppContext);
  if (!context) {
    throw new Error('useRemoteApps must be used within a RemoteAppProvider');
  }
  return context;
};

export const RemoteAppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [apps, setApps] = useState<Record<string, RemoteApp>>({});
  const [sharedData, setSharedData] = useState({
    contacts: [],
    deals: [],
    tasks: [],
    analytics: {},
    user: null,
    settings: {}
  });

  // Setup unified event system integration
  useEffect(() => {
    // Listen for cross-app events
    const handleCrossAppEvent = (event: any) => {
      const { type, source, data } = event.detail || event;

      switch (type) {
        case 'REMOTE_APP_READY':
          setApps(prev => ({
            ...prev,
            [source]: {
              ...prev[source],
              status: 'ready',
              lastSync: Date.now()
            }
          }));
          break;

        case 'DATA_SYNC_REQUEST':
          // Handle data sync requests from remote apps
          handleDataSyncRequest(source, data);
          break;

        case 'AI_REQUEST':
          // Handle AI requests from remote apps
          handleAIRequest(source, data);
          break;
      }
    };

    // Register event handler
    const unsubscribe = unifiedEventSystem.registerHandler({
      id: 'remote-app-context',
      handler: handleCrossAppEvent,
      priority: 10,
      filters: { type: 'REMOTE_APP_*' }
    });

    return unsubscribe;
  }, []);

  const handleDataSyncRequest = useCallback(async (sourceApp: string, request: any) => {
    const { dataType, filters } = request;

    try {
      let data;
      switch (dataType) {
        case 'contacts':
          const contactsResponse = await unifiedApiClient.request({ endpoint: '/api/contacts' });
          data = contactsResponse.success ? contactsResponse.data : [];
          break;
        case 'deals':
          const dealsResponse = await unifiedApiClient.request({ endpoint: '/api/deals' });
          data = dealsResponse.success ? dealsResponse.data : [];
          break;
        case 'tasks':
          const tasksResponse = await unifiedApiClient.request({ endpoint: '/api/tasks' });
          data = tasksResponse.success ? tasksResponse.data : [];
          break;
        default:
          data = sharedData[dataType as keyof typeof sharedData] || [];
      }

      // Send data back to requesting app
      unifiedEventSystem.emitTo(sourceApp, {
        type: 'DATA_SYNC_RESPONSE',
        source: 'crm',
        data: { requestId: request.id, dataType, data },
        priority: 'high'
      });
    } catch (error: any) {
      unifiedEventSystem.emitTo(sourceApp, {
        type: 'DATA_SYNC_ERROR',
        source: 'crm',
        data: { requestId: request.id, error: error.message },
        priority: 'high'
      });
    }
  }, [sharedData]);

  const handleAIRequest = useCallback(async (sourceApp: string, request: any) => {
    try {
      const response = await unifiedApiClient.request({
        endpoint: '/api/respond',
        method: 'POST',
        data: request
      });

      unifiedEventSystem.emitTo(sourceApp, {
        type: 'AI_RESPONSE',
        source: 'crm',
        data: {
          requestId: request.id,
          success: response.success,
          result: response.data,
          error: response.error
        },
        priority: 'high'
      });
    } catch (error: any) {
      unifiedEventSystem.emitTo(sourceApp, {
        type: 'AI_ERROR',
        source: 'crm',
        data: { requestId: request.id, error: error.message },
        priority: 'high'
      });
    }
  }, []);

  const registerApp = useCallback((id: string, title: string, src: string) => {
    setApps(prev => ({
      ...prev,
      [id]: {
        id,
        title,
        src,
        lastRefreshed: Date.now(),
        autoRefreshEnabled: false,
        refreshInterval: 300 // 5 minutes default
      }
    }));
  }, []);

  const unregisterApp = useCallback((id: string) => {
    setApps(prev => {
      const newApps = { ...prev };
      delete newApps[id];
      return newApps;
    });
  }, []);

  const refreshApp = useCallback((id: string) => {
    // Trigger refresh via unified event system
    unifiedEventSystem.emitTo(id, {
      type: 'APP_REFRESH',
      source: 'crm',
      data: { timestamp: Date.now() },
      priority: 'high'
    });

    // Also trigger legacy event for backward compatibility
    window.dispatchEvent(new CustomEvent('refreshRemoteApp', { detail: { id } }));

    setApps(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        lastRefreshed: Date.now()
      }
    }));
  }, []);

  const refreshAllApps = useCallback(() => {
    Object.keys(apps).forEach(id => {
      refreshApp(id);
    });
  }, [apps, refreshApp]);

  const syncDataToAllApps = useCallback((dataType: string, data: any) => {
    // Dispatch to all registered remote apps
    window.dispatchEvent(new CustomEvent('syncToRemoteApps', { 
      detail: { dataType, data, timestamp: Date.now() } 
    }));
  }, []);

  const broadcastToRemoteApps = useCallback((eventType: string, data: any) => {
    Object.keys(apps).forEach(appId => {
      window.dispatchEvent(new CustomEvent('remoteAppMessage', {
        detail: {
          targetApp: appId,
          eventType,
          data,
          timestamp: Date.now()
        }
      }));
    });
  }, [apps]);

  const toggleAutoRefresh = useCallback((id: string) => {
    setApps(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        autoRefreshEnabled: !prev[id].autoRefreshEnabled
      }
    }));
  }, []);

  const setRefreshInterval = useCallback((id: string, interval: number) => {
    setApps(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        refreshInterval: interval
      }
    }));
  }, []);

  const getAppStatus = useCallback((id: string) => {
    return apps[id];
  }, [apps]);

  // Enhanced methods for unified communication
  const syncDataToApp = useCallback((appId: string, dataType: string, data: any) => {
    unifiedEventSystem.emitTo(appId, {
      type: 'DATA_SYNC',
      source: 'crm',
      data: { dataType, data },
      priority: 'high'
    });
  }, []);

  const broadcastToAllApps = useCallback((eventType: string, data: any) => {
    Object.keys(apps).forEach(appId => {
      unifiedEventSystem.emitTo(appId, {
        type: eventType,
        source: 'crm',
        data,
        priority: 'medium'
      });
    });
  }, [apps]);

  const updateSharedData = useCallback((dataType: string, data: any) => {
    setSharedData(prev => ({
      ...prev,
      [dataType]: data
    }));

    // Broadcast update to all apps
    broadcastToAllApps('SHARED_DATA_UPDATE', { dataType, data });
  }, [broadcastToAllApps]);

  const requestAI = useCallback(async (appId: string, request: any) => {
    return handleAIRequest(appId, request);
  }, [handleAIRequest]);

  const getSharedData = useCallback((dataType: string) => {
    return sharedData[dataType as keyof typeof sharedData];
  }, [sharedData]);

  const value = {
    apps,
    sharedData,
    registerApp,
    unregisterApp,
    refreshApp,
    refreshAllApps,
    toggleAutoRefresh,
    setRefreshInterval,
    getAppStatus,
    syncDataToAllApps,
    broadcastToRemoteApps,
    // New unified methods
    syncDataToApp,
    broadcastToAllApps,
    updateSharedData,
    requestAI,
    getSharedData
  };

  return (
    <RemoteAppContext.Provider value={value}>
      {children}
    </RemoteAppContext.Provider>
  );
};
