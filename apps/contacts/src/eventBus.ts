// SimpleEventBus - Lightweight cross-app communication
// Used by remote apps for same-window event handling
// Cross-origin communication is handled by postMessage from the host

type EventHandler = (event: any) => void;

export class SimpleEventBus {
  private listeners: Map<string, Set<EventHandler>> = new Map();
  private bc: BroadcastChannel | null = null;

  constructor() {
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.bc = new BroadcastChannel('federation_events');
        this.bc.addEventListener('message', (e) => {
          this.notifyListeners(e.data);
        });
      } catch {
        // BroadcastChannel not available
      }
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

  publish(event: any): void {
    const fullEvent = { ...event, timestamp: Date.now() };
    // Broadcast to other tabs/windows via BroadcastChannel
    if (this.bc) {
      try {
        this.bc.postMessage(fullEvent);
      } catch {
        // Channel may be closed
      }
    }
    // Notify local listeners
    this.notifyListeners(fullEvent);
  }

  private notifyListeners(event: any): void {
    const listeners = this.listeners.get(event.type);
    if (listeners) {
      listeners.forEach(handler => handler(event));
    }
  }

  async request<T = any>(appId: string, action: string, data?: any): Promise<T> {
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

      const unsubscribe = this.subscribe(`response:${requestId}`, (event: any) => {
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
        source: 'remote'
      });
    });
  }

  onRequest(appId: string, handler: (action: string, data: any) => Promise<any>) {
    return this.subscribe(`request:${appId}`, async (event: any) => {
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

  destroy(): void {
    if (this.bc) {
      this.bc.close();
      this.bc = null;
    }
    this.listeners.clear();
  }
}

// Singleton instance per app
export const eventBus = new SimpleEventBus();
