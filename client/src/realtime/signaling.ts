/**
 * WebSocket Signaling Client with error handling and exponential backoff
 * 
 * Feature flag: VITE_ENABLE_SIGNALING (default: false)
 */

// Feature flag - set to true to enable signaling
const ENABLE_SIGNALING = import.meta.env.VITE_ENABLE_SIGNALING === 'true';

// Configuration
const MAX_RECONNECT_DELAY = 30000; // 30 seconds max
const INITIAL_RECONNECT_DELAY = 1000; // 1 second
const MAX_RECONNECT_ATTEMPTS = 10;

/**
 * Message types for signaling
 */
export interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'join' | 'leave' | 'error';
  roomId?: string;
  userId?: string;
  payload?: unknown;
}

type MessageHandler = (message: SignalingMessage) => void;
type ConnectionHandler = (connected: boolean) => void;

/**
 * Signaling client class with automatic reconnection
 */
export class SignalingClient {
  private ws: WebSocket | null = null;
  private url: string;
  private roomId: string | null = null;
  private userId: string | null = null;
  
  private reconnectAttempts = 0;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private isConnected = false;
  private isIntentionalClose = false;
  
  private messageHandlers: Set<MessageHandler> = new Set();
  private connectionHandlers: Set<ConnectionHandler> = new Set();
  
  // Track if tab is visible (pause reconnect when hidden)
  private isTabVisible = true;
  private visibilityHandler: () => void;

  constructor(url: string) {
    this.url = url;
    
    // Track tab visibility
    this.visibilityHandler = () => {
      this.isTabVisible = !document.hidden;
      if (this.isTabVisible && !this.isConnected && !this.isIntentionalClose) {
        console.log('[Signaling] Tab visible, attempting reconnect...');
        this.connect();
      }
    };
    
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.visibilityHandler);
    }
  }

  /**
   * Connect to the signaling server
   */
  connect(roomId?: string, userId?: string): void {
    // Don't connect if feature is disabled
    if (!ENABLE_SIGNALING) {
      console.log('[Signaling] Signaling is disabled via VITE_ENABLE_SIGNALING flag');
      return;
    }

    // Don't connect if intentionally closed
    if (this.isIntentionalClose) {
      return;
    }

    // Don't connect if already connected
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.roomId = roomId || this.roomId || 'default';
    this.userId = userId || this.userId;

    try {
      console.log(`[Signaling] Connecting to ${this.url}...`);
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('[Signaling] Connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.notifyConnectionHandlers(true);

        // Join room if we have one
        if (this.roomId && this.userId) {
          this.send({ type: 'join', roomId: this.roomId, userId: this.userId });
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as SignalingMessage;
          this.notifyMessageHandlers(message);
        } catch (error) {
          console.warn('[Signaling] Failed to parse message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log(`[Signaling] Connection closed: ${event.code} - ${event.reason}`);
        this.isConnected = false;
        this.notifyConnectionHandlers(false);

        // Don't reconnect if intentionally closed
        if (this.isIntentionalClose) {
          return;
        }

        // Attempt reconnection with exponential backoff
        this.scheduleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('[Signaling] WebSocket error:', error);
      };
    } catch (error) {
      console.error('[Signaling] Failed to create WebSocket:', error);
      this.scheduleReconnect();
    }
  }

  /**
   * Schedule a reconnection attempt with exponential backoff
   */
  private scheduleReconnect(): void {
    if (this.isIntentionalClose) {
      return;
    }

    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error('[Signaling] Max reconnection attempts reached');
      return;
    }

    // Don't reconnect if tab is hidden (optional optimization)
    if (!this.isTabVisible) {
      console.log('[Signaling] Tab hidden, skipping reconnect');
      return;
    }

    // Calculate delay with exponential backoff and jitter
    const delay = Math.min(
      INITIAL_RECONNECT_DELAY * Math.pow(2, this.reconnectAttempts),
      MAX_RECONNECT_DELAY
    );
    
    // Add jitter (0-25% of delay)
    const jitter = delay * Math.random() * 0.25;
    const finalDelay = delay + jitter;

    console.log(`[Signaling] Reconnecting in ${Math.round(finalDelay)}ms (attempt ${this.reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})`);

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, finalDelay);
  }

  /**
   * Disconnect from the signaling server
   */
  disconnect(): void {
    this.isIntentionalClose = true;
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      // Send leave message before closing
      if (this.roomId && this.userId && this.isConnected) {
        this.send({ type: 'leave', roomId: this.roomId, userId: this.userId });
      }
      
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    this.isConnected = false;
    this.notifyConnectionHandlers(false);
    console.log('[Signaling] Disconnected');
  }

  /**
   * Send a message through the signaling server
   */
  send(message: SignalingMessage): boolean {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      console.warn('[Signaling] Cannot send message: not connected');
      return false;
    }

    try {
      this.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('[Signaling] Failed to send message:', error);
      return false;
    }
  }

  /**
   * Register a message handler
   */
  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  /**
   * Register a connection state handler
   */
  onConnectionChange(handler: ConnectionHandler): () => void {
    this.connectionHandlers.add(handler);
    return () => this.connectionHandlers.delete(handler);
  }

  /**
   * Notify all message handlers
   */
  private notifyMessageHandlers(message: SignalingMessage): void {
    this.messageHandlers.forEach((handler) => {
      try {
        handler(message);
      } catch (error) {
        console.error('[Signaling] Message handler error:', error);
      }
    });
  }

  /**
   * Notify all connection handlers
   */
  private notifyConnectionHandlers(connected: boolean): void {
    this.connectionHandlers.forEach((handler) => {
      try {
        handler(connected);
      } catch (error) {
        console.error('[Signaling] Connection handler error:', error);
      }
    });
  }

  /**
   * Check if currently connected
   */
  get connected(): boolean {
    return this.isConnected;
  }

  /**
   * Cleanup - call when done with the client
   */
  destroy(): void {
    this.disconnect();
    
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
    }
    
    this.messageHandlers.clear();
    this.connectionHandlers.clear();
  }
}

/**
 * Create a signaling client instance (lazy initialization)
 */
let signalingClient: SignalingClient | null = null;

export function getSignalingClient(url?: string): SignalingClient {
  if (!signalingClient) {
    const wsUrl = url || import.meta.env.VITE_SIGNALING_URL || 'wss://app.smartcrm.vip/signaling';
    signalingClient = new SignalingClient(wsUrl);
  }
  return signalingClient;
}

/**
 * Cleanup signaling client
 */
export function destroySignalingClient(): void {
  if (signalingClient) {
    signalingClient.destroy();
    signalingClient = null;
  }
}

export default SignalingClient;
