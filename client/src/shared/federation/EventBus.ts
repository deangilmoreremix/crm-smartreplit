// Event Bus - Cross-app communication system
import { FederationEvent } from './types';

type EventHandler = (event: FederationEvent) => void;

class EventBus {
  private listeners: Map<string, Set<EventHandler>> = new Map();
  private broadcastChannel: BroadcastChannel | null = null;

  constructor() {
    if (typeof BroadcastChannel !== 'undefined') {
      this.broadcastChannel = new BroadcastChannel('federation_events');
      this.setupBroadcastListener();
    }
  }

  private setupBroadcastListener() {
    if (this.broadcastChannel) {
      this.broadcastChannel.addEventListener('message', (event) => {
        const receivedEvent: FederationEvent = event.data;
        this.notifyLocalListeners(receivedEvent);
      });
    }
  }

  subscribe(type: string, handler: EventHandler): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(handler);

    return () => {
      this.listeners.get(type)?.delete(handler);
    };
  }

  publish(event: Omit<FederationEvent, 'timestamp'>): void {
    const fullEvent: FederationEvent = {
      ...event,
      timestamp: Date.now()
    };

    // Send via BroadcastChannel if available
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage(fullEvent);
    } else {
      this.publishViaLocalStorage(fullEvent);
    }

    // Notify local listeners
    this.notifyLocalListeners(fullEvent);
  }

  private notifyLocalListeners(event: FederationEvent) {
    const listeners = this.listeners.get(event.type);
    if (listeners) {
      listeners.forEach(handler => handler(event));
    }
  }

  private publishViaLocalStorage(event: FederationEvent) {
    try {
      const storageKey = 'federation_event';
      localStorage.setItem(storageKey, JSON.stringify(event));
      window.dispatchEvent(new CustomEvent('federation-local-event', {
        detail: event
      }));
    } catch {
      // localStorage not available
    }
  }

  /**
   * Request data from a specific app with proper cleanup
   */
  async request<T = any>(
    appId: string,
    action: string,
    data?: any
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const requestId = `${Date.now()}-${Math.random()}`;
      let settled = false;

      const timeout = setTimeout(() => {
        if (!settled) {
          settled = true;
          unsubscribe();
          reject(new Error(`Request to ${appId} timed out`));
        }
      }, 10000);

      const unsubscribe = this.subscribe(`response:${requestId}`, (event) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        unsubscribe();

        if (event.payload?.error) {
          reject(new Error(event.payload.error));
        } else {
          resolve(event.payload?.data);
        }
      });

      this.publish({
        type: `request:${appId}`,
        payload: { action, data, requestId },
        source: 'host'
      });
    });
  }

  onRequest(appId: string, handler: (action: string, data: any) => Promise<any>) {
    return this.subscribe(`request:${appId}`, async (event) => {
      const { action, data, requestId } = event.payload;

      try {
        const result = await handler(action, data);
        this.publish({
          type: `response:${requestId}`,
          payload: { data: result },
          source: appId
        });
      } catch (error: any) {
        this.publish({
          type: `response:${requestId}`,
          payload: { error: error.message || 'Unknown error' },
          source: appId
        });
      }
    });
  }

  destroy() {
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }
    this.listeners.clear();
  }
}

export const eventBus = new EventBus();

// React hooks
import { useEffect, useCallback } from 'react';

export function useEventBus(type: string, handler: EventHandler) {
  useEffect(() => {
    return eventBus.subscribe(type, handler);
  }, [type, handler]);
}

export function useEventBusPublish() {
  return useCallback((event: Omit<FederationEvent, 'timestamp'>) => {
    eventBus.publish(event);
  }, []);
}
