// Advanced Module Federation Orchestrator with Shared State
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// Event Bus for Cross-Module Communication
class EventBus {
  private listeners: { [key: string]: Function[] } = {};

  emit(event: string, data: any) {
    console.log(`📡 EventBus emitting: ${event}`, data);
    this.listeners[event]?.forEach((callback) => callback(data));
  }

  on(event: string, callback: Function) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
    console.log(`👂 EventBus listener added for: ${event}`);
  }

  off(event: string, callback: Function) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback);
    }
  }
}

export const globalEventBus = new EventBus();

// Shared State Store
interface SharedModuleState {
  modules: {
    [key: string]: {
      loaded: boolean;
      component: React.ComponentType | null;
      data: any;
      status: 'loading' | 'ready' | 'error' | 'disconnected';
    };
  };
  sharedData: {
    contacts: any[];
    appointments: any[];
    deals: any[];
    theme: string;
    user: any;
    gtmAnalytics: {
      contactInsights: any;
      dealInsights: any;
      recommendations: any[];
      performanceMetrics: any;
    };
  };

  // Actions
  setModuleLoaded: (moduleId: string, component: React.ComponentType, data?: any) => void;
  setModuleStatus: (moduleId: string, status: string) => void;
  updateSharedData: (key: string, data: any) => void;
  syncDataAcrossModules: (source: string, data: any) => void;
  // GTM Analytics Actions
  updateContactInsights: (contactId: string, insights: any) => void;
  updateDealInsights: (dealId: string, insights: any) => void;
  addRecommendation: (recommendation: any) => void;
  clearRecommendations: () => void;
  updatePerformanceMetrics: (metrics: any) => void;
}

export const useSharedModuleState = create<SharedModuleState>()(
  subscribeWithSelector((set, get) => ({
    modules: {},
    sharedData: {
      contacts: [],
      appointments: [],
      deals: [],
      theme: 'light',
      user: null,
      gtmAnalytics: {
        contactInsights: {},
        dealInsights: {},
        recommendations: [],
        performanceMetrics: {}
      },
    },

    setModuleLoaded: (moduleId: string, component: React.ComponentType, data = {}) => {
      set((state) => ({
        modules: {
          ...state.modules,
          [moduleId]: {
            loaded: true,
            component,
            data,
            status: 'ready',
          },
        },
      }));

      // Emit global event
      globalEventBus.emit('MODULE_LOADED', { moduleId, data });
    },

    setModuleStatus: (moduleId: string, status: string) => {
      set((state) => ({
        modules: {
          ...state.modules,
          [moduleId]: {
            ...state.modules[moduleId],
            status: status as any,
          },
        },
      }));
    },

    updateSharedData: (key: string, data: any) => {
      set((state) => ({
        sharedData: {
          ...state.sharedData,
          [key]: data,
        },
      }));

      // Notify all modules of data update
      globalEventBus.emit('SHARED_DATA_UPDATED', { key, data });
    },

    syncDataAcrossModules: (source: string, data: any) => {
      console.log(`🔄 Syncing data from ${source}:`, data);

      // Update shared state
      const currentState = get();
      set((state) => ({
        sharedData: {
          ...state.sharedData,
          ...data,
        },
      }));

      // Emit to all other modules
      globalEventBus.emit('MODULE_DATA_SYNC', { source, data });
    },

    // GTM Analytics Methods
    updateContactInsights: (contactId: string, insights: any) => {
      set((state) => ({
        sharedData: {
          ...state.sharedData,
          gtmAnalytics: {
            ...state.sharedData.gtmAnalytics,
            contactInsights: {
              ...state.sharedData.gtmAnalytics.contactInsights,
              [contactId]: insights
            }
          }
        }
      }));

      globalEventBus.emit('CONTACT_INSIGHTS_UPDATED', { contactId, insights });
    },

    updateDealInsights: (dealId: string, insights: any) => {
      set((state) => ({
        sharedData: {
          ...state.sharedData,
          gtmAnalytics: {
            ...state.sharedData.gtmAnalytics,
            dealInsights: {
              ...state.sharedData.gtmAnalytics.dealInsights,
              [dealId]: insights
            }
          }
        }
      }));

      globalEventBus.emit('DEAL_INSIGHTS_UPDATED', { dealId, insights });
    },

    addRecommendation: (recommendation: any) => {
      set((state) => ({
        sharedData: {
          ...state.sharedData,
          gtmAnalytics: {
            ...state.sharedData.gtmAnalytics,
            recommendations: [
              ...state.sharedData.gtmAnalytics.recommendations,
              { ...recommendation, id: Date.now() }
            ]
          }
        }
      }));

      globalEventBus.emit('RECOMMENDATION_ADDED', recommendation);
    },

    clearRecommendations: () => {
      set((state) => ({
        sharedData: {
          ...state.sharedData,
          gtmAnalytics: {
            ...state.sharedData.gtmAnalytics,
            recommendations: []
          }
        }
      }));

      globalEventBus.emit('RECOMMENDATIONS_CLEARED');
    },

    updatePerformanceMetrics: (metrics: any) => {
      set((state) => ({
        sharedData: {
          ...state.sharedData,
          gtmAnalytics: {
            ...state.sharedData.gtmAnalytics,
            performanceMetrics: {
              ...state.sharedData.gtmAnalytics.performanceMetrics,
              ...metrics
            }
          }
        }
      }));

      globalEventBus.emit('PERFORMANCE_METRICS_UPDATED', metrics);
    },
  }))
);

// Module Federation Manager
export class ModuleFederationOrchestrator {
  private static instance: ModuleFederationOrchestrator;
  private messageHandlers: Map<string, Function> = new Map();

  static getInstance(): ModuleFederationOrchestrator {
    if (!ModuleFederationOrchestrator.instance) {
      ModuleFederationOrchestrator.instance = new ModuleFederationOrchestrator();
    }
    return ModuleFederationOrchestrator.instance;
  }

  constructor() {
    this.setupGlobalMessageHandler();
    this.setupSharedStateSync();
  }

  private setupGlobalMessageHandler() {
    window.addEventListener('message', (event: MessageEvent) => {
      const { type, module, data } = event.data;

      switch (type) {
        case 'MODULE_READY':
          this.handleModuleReady(module, data);
          break;
        case 'MODULE_DATA_UPDATED':
          this.handleModuleDataUpdate(module, data);
          break;
        case 'MODULE_REQUEST_DATA':
          this.handleDataRequest(module, data);
          break;
        case 'MODULE_SYNC_REQUEST':
          this.handleSyncRequest(module, data);
          break;
        default:
          // Forward to specific handlers
          const handler = this.messageHandlers.get(type);
          if (handler) handler(data, module);
      }
    });
  }

  private setupSharedStateSync() {
    // Subscribe to shared state changes and broadcast to modules
    useSharedModuleState.subscribe(
      (state) => state.sharedData,
      (sharedData) => {
        this.broadcastToAllModules('SHARED_STATE_UPDATED', sharedData);
      }
    );
  }

  private handleModuleReady(moduleId: string, data: any) {
    console.log(`✅ Module ${moduleId} ready with data:`, data);

    const store = useSharedModuleState.getState();
    store.setModuleStatus(moduleId, 'ready');

    // Send initial shared data to newly ready module
    this.sendToModule(moduleId, 'INITIAL_DATA_SYNC', store.sharedData);

    globalEventBus.emit('MODULE_READY', { moduleId, data });
  }

  private handleModuleDataUpdate(moduleId: string, data: any) {
    console.log(`📊 Data update from ${moduleId}:`, data);

    const store = useSharedModuleState.getState();
    store.syncDataAcrossModules(moduleId, data);
  }

  private handleDataRequest(moduleId: string, requestData: any) {
    const store = useSharedModuleState.getState();
    const requestedData = store.sharedData;

    this.sendToModule(moduleId, 'DATA_RESPONSE', requestedData);
  }

  private handleSyncRequest(moduleId: string, data: any) {
    // Handle synchronization requests between modules
    this.broadcastToAllModules('MODULE_SYNC_BROADCAST', {
      source: moduleId,
      data,
    });
  }

  public registerModule(moduleId: string, component: React.ComponentType, initialData = {}) {
    const store = useSharedModuleState.getState();
    store.setModuleLoaded(moduleId, component, initialData);

    // Send theme and initial state
    setTimeout(() => {
      this.sendToModule(moduleId, 'SET_THEME', { theme: 'light', mode: 'light' });
      this.sendToModule(moduleId, 'INITIAL_DATA_SYNC', store.sharedData);
    }, 100);
  }

  public sendToModule(moduleId: string, type: string, data: any) {
    // Send via PostMessage to iframe or Module Federation component
    const message = {
      type,
      targetModule: moduleId,
      data,
      source: 'CRM_HOST',
      timestamp: Date.now(),
    };

    // Try iframe communication first
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach((iframe) => {
      try {
        iframe.contentWindow?.postMessage(message, '*');
      } catch (e) {
        // Handle cross-origin errors
      }
    });

    // Also emit via event bus for Module Federation components
    globalEventBus.emit(`MESSAGE_TO_${moduleId}`, message);
  }

  public broadcastToAllModules(type: string, data: any) {
    const store = useSharedModuleState.getState();
    Object.keys(store.modules).forEach((moduleId) => {
      this.sendToModule(moduleId, type, data);
    });
  }

  public addMessageHandler(type: string, handler: Function) {
    this.messageHandlers.set(type, handler);
  }

  public removeMessageHandler(type: string) {
    this.messageHandlers.delete(type);
  }
}

// Export singleton instance
export const moduleFederationOrchestrator = ModuleFederationOrchestrator.getInstance();
