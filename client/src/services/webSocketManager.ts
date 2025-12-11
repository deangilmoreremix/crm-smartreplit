import { unifiedEventSystem } from './unifiedEventSystem';

export interface WebSocketMessage {
  type: string;
  data: any;
  source: string;
  timestamp: number;
  id: string;
}

export interface WebSocketConfig {
  url: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
}

class WebSocketManager {
  private static instance: WebSocketManager;
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private reconnectAttempts = 0;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private messageQueue: WebSocketMessage[] = [];
  private isConnected = false;
  private connectionId = '';

  static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  private constructor() {
    this.config = {
      url: this.getWebSocketUrl(),
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000
    };

    this.connect();
  }

  private getWebSocketUrl(): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/ws`;
  }

  private connect(): void {
    try {
      this.ws = new WebSocket(this.config.url);
      this.setupEventHandlers();
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.handleReconnect();
    }
  }

  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = (event) => {
      console.log('WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.connectionId = this.generateConnectionId();
      this.startHeartbeat();
      this.flushMessageQueue();

      // Emit connection event
      unifiedEventSystem.emit({
        type: 'WEBSOCKET_CONNECTED',
        source: 'webSocketManager',
        data: { connectionId: this.connectionId },
        priority: 'high'
      });
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);

        // Emit message to unified event system
        unifiedEventSystem.emit({
          type: `WS_${message.type}`,
          source: message.source || 'websocket',
          data: message.data,
          priority: 'medium'
        });
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason);
      this.isConnected = false;
      this.stopHeartbeat();

      unifiedEventSystem.emit({
        type: 'WEBSOCKET_DISCONNECTED',
        source: 'webSocketManager',
        data: { code: event.code, reason: event.reason },
        priority: 'high'
      });

      if (!event.wasClean) {
        this.handleReconnect();
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);

      unifiedEventSystem.emit({
        type: 'WEBSOCKET_ERROR',
        source: 'webSocketManager',
        data: { error: error.toString() },
        priority: 'high'
      });
    };
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      unifiedEventSystem.emit({
        type: 'WEBSOCKET_MAX_RECONNECT_REACHED',
        source: 'webSocketManager',
        data: {},
        priority: 'critical'
      });
      return;
    }

    this.reconnectAttempts++;
    const delay = this.config.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected) {
        this.send({
          type: 'HEARTBEAT',
          data: { timestamp: Date.now() },
          source: 'client'
        });
      }
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.isConnected) {
      const message = this.messageQueue.shift();
      if (message) {
        this.sendMessage(message);
      }
    }
  }

  private generateConnectionId(): string {
    return `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API
  send(message: Omit<WebSocketMessage, 'id' | 'timestamp'>): void {
    const fullMessage: WebSocketMessage = {
      ...message,
      id: this.generateMessageId(),
      timestamp: Date.now()
    };

    if (this.isConnected) {
      this.sendMessage(fullMessage);
    } else {
      this.messageQueue.push(fullMessage);
    }
  }

  private sendMessage(message: WebSocketMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('Failed to send WebSocket message:', error);
      }
    }
  }

  broadcast(type: string, data: any): void {
    this.send({
      type: 'BROADCAST',
      data: { messageType: type, payload: data },
      source: 'client'
    });
  }

  subscribeToRoom(roomId: string): void {
    this.send({
      type: 'SUBSCRIBE_ROOM',
      data: { roomId },
      source: 'client'
    });
  }

  unsubscribeFromRoom(roomId: string): void {
    this.send({
      type: 'UNSUBSCRIBE_ROOM',
      data: { roomId },
      source: 'client'
    });
  }

  sendToRoom(roomId: string, type: string, data: any): void {
    this.send({
      type: 'ROOM_MESSAGE',
      data: { roomId, messageType: type, payload: data },
      source: 'client'
    });
  }

  disconnect(): void {
    this.isConnected = false;
    this.stopHeartbeat();

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
  }

  getConnectionStatus(): {
    isConnected: boolean;
    connectionId: string;
    reconnectAttempts: number;
    queueLength: number;
  } {
    return {
      isConnected: this.isConnected,
      connectionId: this.connectionId,
      reconnectAttempts: this.reconnectAttempts,
      queueLength: this.messageQueue.length
    };
  }
}

// Create singleton instance
export const webSocketManager = WebSocketManager.getInstance();

// React hook for using WebSocket
import { useEffect, useCallback } from 'react';

export function useWebSocket() {
  useEffect(() => {
    // Component will automatically connect via singleton
    return () => {
      // Cleanup if needed
    };
  }, []);

  const send = useCallback((type: string, data: any) => {
    webSocketManager.send({
      type,
      data,
      source: 'client'
    });
  }, []);

  const broadcast = useCallback((type: string, data: any) => {
    webSocketManager.broadcast(type, data);
  }, []);

  const subscribeToRoom = useCallback((roomId: string) => {
    webSocketManager.subscribeToRoom(roomId);
  }, []);

  const sendToRoom = useCallback((roomId: string, type: string, data: any) => {
    webSocketManager.sendToRoom(roomId, type, data);
  }, []);

  return {
    send,
    broadcast,
    subscribeToRoom,
    sendToRoom,
    connectionStatus: webSocketManager.getConnectionStatus()
  };
}