import { remoteAppManager } from '../utils/remoteAppManager';

export interface UnifiedEvent {
  id: string;
  type: string;
  source: string;
  target?: string;
  data: any;
  timestamp: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  ttl?: number; // Time to live in milliseconds
}

export interface EventHandler {
  id: string;
  handler: (event: UnifiedEvent) => void | Promise<void>;
  priority: number;
  filters?: {
    type?: string;
    source?: string;
    target?: string;
  };
}

class UnifiedEventSystem {
  private static instance: UnifiedEventSystem;
  private eventHandlers: Map<string, EventHandler[]> = new Map();
  private eventQueue: UnifiedEvent[] = [];
  private processingQueue: boolean = false;
  private eventHistory: UnifiedEvent[] = [];
  private maxHistorySize: number = 1000;

  static getInstance(): UnifiedEventSystem {
    if (!UnifiedEventSystem.instance) {
      UnifiedEventSystem.instance = new UnifiedEventSystem();
    }
    return UnifiedEventSystem.instance;
  }

  private constructor() {
    this.startEventProcessor();
    this.setupGlobalListeners();
  }

  // Register an event handler
  registerHandler(handler: EventHandler): () => void {
    if (!this.eventHandlers.has(handler.id)) {
      this.eventHandlers.set(handler.id, []);
    }

    this.eventHandlers.get(handler.id)!.push(handler);

    // Sort handlers by priority (higher priority first)
    this.eventHandlers.get(handler.id)!.sort((a, b) => b.priority - a.priority);

    // Return unsubscribe function
    return () => {
      const handlers = this.eventHandlers.get(handler.id);
      if (handlers) {
        const index = handlers.findIndex(h => h === handler);
        if (index !== -1) {
          handlers.splice(index, 1);
        }
        if (handlers.length === 0) {
          this.eventHandlers.delete(handler.id);
        }
      }
    };
  }

  // Emit an event
  async emit(event: Omit<UnifiedEvent, 'id' | 'timestamp'>): Promise<void> {
    const unifiedEvent: UnifiedEvent = {
      ...event,
      id: this.generateEventId(),
      timestamp: Date.now(),
      priority: event.priority || 'medium'
    };

    // Add to history
    this.eventHistory.push(unifiedEvent);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    // Add to processing queue
    this.eventQueue.push(unifiedEvent);

    // Broadcast to remote apps if needed
    if (event.target !== 'local') {
      remoteAppManager.broadcastToAllApps(event.type, event.data, event.source);
    }

    console.log(`📡 Event emitted: ${event.type} from ${event.source}`, event.data);
  }

  // Emit event to specific target
  async emitTo(target: string, event: Omit<UnifiedEvent, 'id' | 'timestamp' | 'target'>): Promise<void> {
    await this.emit({ ...event, target });
  }

  // Process events in queue
  private async startEventProcessor(): Promise<void> {
    setInterval(async () => {
      if (this.processingQueue || this.eventQueue.length === 0) return;

      this.processingQueue = true;

      try {
        const event = this.eventQueue.shift();
        if (event) {
          await this.processEvent(event);
        }
      } catch (error) {
        console.error('Error processing event:', error);
      } finally {
        this.processingQueue = false;
      }
    }, 10); // Process events every 10ms
  }

  // Process a single event
  private async processEvent(event: UnifiedEvent): Promise<void> {
    // Check TTL
    if (event.ttl && Date.now() - event.timestamp > event.ttl) {
      console.warn(`Event ${event.id} expired (TTL: ${event.ttl}ms)`);
      return;
    }

    // Find matching handlers
    const matchingHandlers: EventHandler[] = [];

    Array.from(this.eventHandlers.entries()).forEach(([handlerId, handlers]) => {
      handlers.forEach(handler => {
        if (this.matchesFilters(event, handler.filters)) {
          matchingHandlers.push(handler);
        }
      });
    });

    // Execute handlers in priority order
    for (const handler of matchingHandlers.sort((a, b) => b.priority - a.priority)) {
      try {
        await handler.handler(event);
      } catch (error) {
        console.error(`Error in event handler ${handler.id}:`, error);
      }
    }
  }

  // Check if event matches handler filters
  private matchesFilters(event: UnifiedEvent, filters?: EventHandler['filters']): boolean {
    if (!filters) return true;

    if (filters.type && event.type !== filters.type) return false;
    if (filters.source && event.source !== filters.source) return false;
    if (filters.target && event.target !== filters.target) return false;

    return true;
  }

  // Generate unique event ID
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Setup global event listeners for cross-app communication
  private setupGlobalListeners(): void {
    // Listen for remote app events
    window.addEventListener('remoteAppMessage', (e: any) => {
      const { eventType, data, sourceApp } = e.detail;
      this.emit({
        type: eventType,
        source: sourceApp || 'remote',
        data,
        priority: 'medium'
      });
    });

    // Listen for data sync events
    window.addEventListener('dataSync', (e: any) => {
      this.emit({
        type: 'DATA_SYNC',
        source: e.detail.source || 'system',
        data: e.detail,
        priority: 'high'
      });
    });

    // Listen for AI events
    window.addEventListener('aiEvent', (e: any) => {
      this.emit({
        type: 'AI_EVENT',
        source: e.detail.source || 'ai',
        data: e.detail,
        priority: 'medium'
      });
    });
  }

  // Get event history
  getEventHistory(limit: number = 100): UnifiedEvent[] {
    return this.eventHistory.slice(-limit);
  }

  // Clear event history
  clearEventHistory(): void {
    this.eventHistory = [];
  }

  // Get active handlers count
  getActiveHandlersCount(): number {
    let count = 0;
    Array.from(this.eventHandlers.values()).forEach(handlers => {
      count += handlers.length;
    });
    return count;
  }

  // Get queue status
  getQueueStatus(): { queueLength: number; processing: boolean } {
    return {
      queueLength: this.eventQueue.length,
      processing: this.processingQueue
    };
  }
}

// Create singleton instance
export const unifiedEventSystem = UnifiedEventSystem.getInstance();

// React hook for using the unified event system
import { useEffect, useCallback } from 'react';

export function useUnifiedEvents(
  handlerId: string,
  handler: (event: UnifiedEvent) => void | Promise<void>,
  filters?: EventHandler['filters'],
  priority: number = 0
) {
  useEffect(() => {
    const eventHandler: EventHandler = {
      id: handlerId,
      handler,
      priority,
      filters
    };

    const unsubscribe = unifiedEventSystem.registerHandler(eventHandler);

    return unsubscribe;
  }, [handlerId, handler, filters, priority]);

  const emit = useCallback((event: Omit<UnifiedEvent, 'id' | 'timestamp'>) => {
    return unifiedEventSystem.emit(event);
  }, []);

  const emitTo = useCallback((target: string, event: Omit<UnifiedEvent, 'id' | 'timestamp' | 'target'>) => {
    return unifiedEventSystem.emitTo(target, event);
  }, []);

  return { emit, emitTo };
}