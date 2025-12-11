// Store utilities for Module Federation
import { unifiedEventSystem } from '../services/unifiedEventSystem';

// Store synchronization utilities
export const createSyncedStore = (storeName: string, store: any) => {
  // Subscribe to store changes and broadcast to remote apps
  const unsubscribe = store.subscribe((state: any) => {
    unifiedEventSystem.emit({
      type: `STORE_UPDATE_${storeName.toUpperCase()}`,
      source: 'crm',
      data: { storeName, state },
      priority: 'medium'
    });
  });

  return { store, unsubscribe };
};

// Remote store synchronization
export const syncStoreWithRemote = (storeName: string, store: any) => {
  const handlerId = `remote-${storeName}-sync`;

  const unsubscribe = unifiedEventSystem.registerHandler({
    id: handlerId,
    handler: (event: any) => {
      if (event.type === `STORE_UPDATE_${storeName.toUpperCase()}` && event.source !== 'crm') {
        // Update local store with remote changes
        store.setState(event.data.state);
      }
    },
    priority: 5,
    filters: { type: `STORE_UPDATE_${storeName.toUpperCase()}` }
  });

  return unsubscribe;
};

// Store persistence helpers
export const createPersistentStore = (store: any, storageKey: string) => {
  // Load initial state from localStorage
  const savedState = localStorage.getItem(storageKey);
  if (savedState) {
    try {
      const parsedState = JSON.parse(savedState);
      store.setState(parsedState);
    } catch (error) {
      console.warn(`Failed to parse saved state for ${storageKey}:`, error);
    }
  }

  // Save state changes to localStorage
  const unsubscribe = store.subscribe((state: any) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch (error) {
      console.warn(`Failed to save state for ${storageKey}:`, error);
    }
  });

  return unsubscribe;
};

// Cross-app store communication
export const createSharedStore = (storeName: string, initialState: any) => {
  let currentState = initialState;
  const listeners: ((state: any) => void)[] = [];

  const store = {
    getState: () => currentState,
    setState: (newState: any) => {
      currentState = { ...currentState, ...newState };
      listeners.forEach(listener => listener(currentState));

      // Broadcast to remote apps
      unifiedEventSystem.emit({
        type: `SHARED_STORE_UPDATE_${storeName.toUpperCase()}`,
        source: 'crm',
        data: { storeName, state: currentState },
        priority: 'medium'
      });
    },
    subscribe: (listener: (state: any) => void) => {
      listeners.push(listener);
      return () => {
        const index = listeners.indexOf(listener);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      };
    }
  };

  // Listen for remote updates
  unifiedEventSystem.registerHandler({
    id: `shared-${storeName}-handler`,
    handler: (event: any) => {
      if (event.type === `SHARED_STORE_UPDATE_${storeName.toUpperCase()}` && event.source !== 'crm') {
        currentState = { ...currentState, ...event.data.state };
        listeners.forEach(listener => listener(currentState));
      }
    },
    priority: 5,
    filters: { type: `SHARED_STORE_UPDATE_${storeName.toUpperCase()}` }
  });

  return store;
};