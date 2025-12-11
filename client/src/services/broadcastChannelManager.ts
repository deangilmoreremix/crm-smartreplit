import { unifiedEventSystem } from './unifiedEventSystem';

export interface BroadcastMessage {
  type: string;
  data: any;
  source: string;
  timestamp: number;
  target?: string;
  id: string;
}

export interface BroadcastChannelConfig {
  name: string;
  enableLogging: boolean;
}

class BroadcastChannelManager {
  private static instance: BroadcastChannelManager;
  private channels: Map<string, BroadcastChannel> = new Map();
  private config: BroadcastChannelConfig;
  private messageHistory: Map<string, BroadcastMessage[]> = new Map();
  private maxHistorySize = 100;

  static getInstance(): BroadcastChannelManager {
    if (!BroadcastChannelManager.instance) {
      BroadcastChannelManager.instance = new BroadcastChannelManager();
    }
    return BroadcastChannelManager.instance;
  }

  private constructor() {
    this.config = {
      name: 'crm-broadcast-channel',
      enableLogging: true
    };

    this.createChannel(this.config.name);
  }

  private createChannel(name: string): BroadcastChannel {
    if (this.channels.has(name)) {
      return this.channels.get(name)!;
    }

    const channel = new BroadcastChannel(name);
    this.channels.set(name, channel);
    this.messageHistory.set(name, []);

    channel.onmessage = (event) => {
      const message: BroadcastMessage = event.data;

      if (this.config.enableLogging) {
        console.log(`📡 BroadcastChannel [${name}]:`, message);
      }

      // Store in history
      this.addToHistory(name, message);

      // Emit to unified event system
      unifiedEventSystem.emit({
        type: `BC_${message.type}`,
        source: message.source || 'broadcast',
        data: message.data,
        priority: 'medium'
      });
    };

    channel.onmessageerror = (event) => {
      console.error('BroadcastChannel message error:', event);
      unifiedEventSystem.emit({
        type: 'BROADCAST_CHANNEL_ERROR',
        source: 'broadcastChannelManager',
        data: { channel: name, error: 'Message parsing failed' },
        priority: 'high'
      });
    };

    return channel;
  }

  private addToHistory(channelName: string, message: BroadcastMessage): void {
    const history = this.messageHistory.get(channelName) || [];
    history.push(message);

    if (history.length > this.maxHistorySize) {
      history.shift();
    }

    this.messageHistory.set(channelName, history);
  }

  private generateMessageId(): string {
    return `bc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API
  broadcast(type: string, data: any, target?: string): void {
    const message: BroadcastMessage = {
      type,
      data,
      source: 'crm',
      timestamp: Date.now(),
      target,
      id: this.generateMessageId()
    };

    const channel = this.channels.get(this.config.name);
    if (channel) {
      try {
        channel.postMessage(message);
        this.addToHistory(this.config.name, message);
      } catch (error) {
        console.error('Failed to broadcast message:', error);
        unifiedEventSystem.emit({
          type: 'BROADCAST_SEND_ERROR',
          source: 'broadcastChannelManager',
          data: { error: error instanceof Error ? error.message : String(error), message },
          priority: 'high'
        });
      }
    }
  }

  sendToTarget(target: string, type: string, data: any): void {
    this.broadcast(type, data, target);
  }

  createNamedChannel(name: string): BroadcastChannel {
    return this.createChannel(name);
  }

  broadcastToChannel(channelName: string, type: string, data: any): void {
    const channel = this.channels.get(channelName);
    if (channel) {
      const message: BroadcastMessage = {
        type,
        data,
        source: 'crm',
        timestamp: Date.now(),
        id: this.generateMessageId()
      };

      try {
        channel.postMessage(message);
        this.addToHistory(channelName, message);
      } catch (error) {
        console.error(`Failed to broadcast to channel ${channelName}:`, error);
      }
    } else {
      console.warn(`Channel ${channelName} does not exist`);
    }
  }

  getChannelHistory(channelName: string = this.config.name): BroadcastMessage[] {
    return this.messageHistory.get(channelName) || [];
  }

  clearChannelHistory(channelName: string = this.config.name): void {
    this.messageHistory.set(channelName, []);
  }

  getActiveChannels(): string[] {
    return Array.from(this.channels.keys());
  }

  closeChannel(channelName: string): void {
    const channel = this.channels.get(channelName);
    if (channel) {
      channel.close();
      this.channels.delete(channelName);
      this.messageHistory.delete(channelName);
    }
  }

  closeAllChannels(): void {
    Array.from(this.channels.entries()).forEach(([name, channel]) => {
      channel.close();
    });
    this.channels.clear();
    this.messageHistory.clear();
  }

  // Data synchronization methods
  syncData(dataType: string, data: any): void {
    this.broadcast('DATA_SYNC', { dataType, data });
  }

  syncContacts(contacts: any[]): void {
    this.syncData('contacts', contacts);
  }

  syncDeals(deals: any[]): void {
    this.syncData('deals', deals);
  }

  syncTasks(tasks: any[]): void {
    this.syncData('tasks', tasks);
  }

  syncAnalytics(analytics: any): void {
    this.syncData('analytics', analytics);
  }

  // Real-time collaboration methods
  userJoined(user: any): void {
    this.broadcast('USER_JOINED', user);
  }

  userLeft(userId: string): void {
    this.broadcast('USER_LEFT', { userId });
  }

  updatePresence(userId: string, presence: any): void {
    this.broadcast('PRESENCE_UPDATE', { userId, presence });
  }

  // Configuration
  updateConfig(newConfig: Partial<BroadcastChannelConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): BroadcastChannelConfig {
    return { ...this.config };
  }

  getStats(): {
    activeChannels: number;
    totalMessages: number;
    channels: Record<string, number>;
  } {
    const channels: Record<string, number> = {};
    let totalMessages = 0;

    Array.from(this.messageHistory.entries()).forEach(([name, history]) => {
      channels[name] = history.length;
      totalMessages += history.length;
    });

    return {
      activeChannels: this.channels.size,
      totalMessages,
      channels
    };
  }
}

// Create singleton instance
export const broadcastChannelManager = BroadcastChannelManager.getInstance();

// React hook for using BroadcastChannel
import { useEffect, useCallback } from 'react';

export function useBroadcastChannel(channelName?: string) {
  useEffect(() => {
    let customChannel: BroadcastChannel | null = null;

    if (channelName && channelName !== broadcastChannelManager.getConfig().name) {
      customChannel = broadcastChannelManager.createNamedChannel(channelName);
    }

    return () => {
      if (customChannel) {
        // Note: We don't close the channel here as it might be used by other components
        // The BroadcastChannelManager handles cleanup
      }
    };
  }, [channelName]);

  const broadcast = useCallback((type: string, data: any) => {
    if (channelName) {
      broadcastChannelManager.broadcastToChannel(channelName, type, data);
    } else {
      broadcastChannelManager.broadcast(type, data);
    }
  }, [channelName]);

  const syncData = useCallback((dataType: string, data: any) => {
    broadcastChannelManager.syncData(dataType, data);
  }, []);

  return {
    broadcast,
    syncData,
    syncContacts: broadcastChannelManager.syncContacts.bind(broadcastChannelManager),
    syncDeals: broadcastChannelManager.syncDeals.bind(broadcastChannelManager),
    syncTasks: broadcastChannelManager.syncTasks.bind(broadcastChannelManager),
    syncAnalytics: broadcastChannelManager.syncAnalytics.bind(broadcastChannelManager),
    stats: broadcastChannelManager.getStats()
  };
}