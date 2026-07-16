// SimpleEventBus - Lightweight cross-app communication
type EventHandler = (event: any) => void;

export class SimpleEventBus {
  private listeners: Map<string, Set<EventHandler>> = new Map();
  private bc: BroadcastChannel | null = null;

  constructor() {
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.bc = new BroadcastChannel('federation_events');
        this.bc.addEventListener('message', (e) => this.notifyListeners(e.data));
      } catch { /* not available */ }
    }
  }

  subscribe(type: string, handler: EventHandler): () => void {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)!.add(handler);
    return () => { this.listeners.get(type)?.delete(handler); };
  }

  publish(event: any): void {
    const fullEvent = { ...event, timestamp: Date.now() };
    if (this.bc) {
      try { this.bc.postMessage(fullEvent); } catch { /* closed */ }
    }
    this.notifyListeners(fullEvent);
  }

  private notifyListeners(event: any): void {
    const listeners = this.listeners.get(event.type);
    if (listeners) listeners.forEach(h => h(event));
  }

  async request<T = any>(appId: string, action: string, data?: any): Promise<T> {
    return new Promise((resolve, reject) => {
      const requestId = `${Date.now()}-${Math.random()}`;
      let settled = false;
      const timeout = setTimeout(() => {
        if (!settled) { settled = true; unsub(); reject(new Error(`Request to ${appId} timed out`)); }
      }, 10000);
      const unsub = this.subscribe(`response:${requestId}`, (e: any) => {
        if (settled) return;
        settled = true; clearTimeout(timeout); unsub();
        e.payload?.error ? reject(new Error(e.payload.error)) : resolve(e.payload?.data);
      });
      this.publish({ type: `request:${appId}`, payload: { action, data, requestId }, source: 'remote' });
    });
  }

  onRequest(appId: string, handler: (action: string, data: any) => Promise<any>) {
    return this.subscribe(`request:${appId}`, async (event: any) => {
      try {
        const result = await handler(event.payload.action, event.payload.data);
        this.publish({ type: `response:${event.payload.requestId}`, payload: { data: result }, source: appId });
      } catch (error: any) {
        this.publish({ type: `response:${event.payload.requestId}`, payload: { error: error.message }, source: appId });
      }
    });
  }

  destroy(): void {
    if (this.bc) { this.bc.close(); this.bc = null; }
    this.listeners.clear();
  }
}

export const eventBus = new SimpleEventBus();
