import { createClient, SupabaseClient } from '@supabase/supabase-js';

// WebRTC signaling message types
export interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate';
  sender: string;
  receiver?: string; // For targeted messages
  data: any;
  timestamp: number;
}

export interface SignalingCallbacks {
  onOffer: (message: SignalingMessage) => void;
  onAnswer: (message: SignalingMessage) => void;
  onIceCandidate: (message: SignalingMessage) => void;
  onError: (error: Error) => void;
}

export class SupabaseSignalingService {
  private supabase: SupabaseClient;
  private currentRoomId: string | null = null;
  private currentUserId: string;
  private channel: any = null;
  private callbacks: SignalingCallbacks | null = null;

  constructor() {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and key must be configured');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.currentUserId = `user-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Join a signaling room/channel for a video call
   */
  async joinRoom(roomId: string, callbacks: SignalingCallbacks): Promise<void> {
    try {
      // Leave any existing room first
      await this.leaveRoom();

      this.currentRoomId = roomId;
      this.callbacks = callbacks;

      // Create or join a Supabase Realtime channel for this room
      const channelName = `call-${roomId}`;
      this.channel = this.supabase.channel(channelName, {
        config: {
          presence: {
            key: this.currentUserId,
          },
        },
      });

      // Handle broadcast messages (signaling data)
      this.channel.on('broadcast', { event: 'signaling' }, (payload: any) => {
        this.handleSignalingMessage(payload);
      });

      // Handle presence events (users joining/leaving)
      this.channel.on('presence', { event: 'sync' }, () => {
        console.log('Presence sync:', this.channel.presenceState());
      });

      this.channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      });

      this.channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      });

      // Subscribe to the channel
      await this.channel.subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          console.log(`✅ Joined signaling room: ${roomId}`);

          // Track presence
          await this.channel.track({
            user_id: this.currentUserId,
            online_at: new Date().toISOString(),
          });
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Failed to join signaling room:', roomId);
          this.callbacks?.onError(new Error('Failed to join signaling room'));
        } else if (status === 'TIMED_OUT') {
          console.error('⏰ Signaling room subscription timed out:', roomId);
          this.callbacks?.onError(new Error('Signaling room subscription timed out'));
        }
      });
    } catch (error) {
      console.error('Error joining signaling room:', error);
      this.callbacks?.onError(error as Error);
      throw error;
    }
  }

  /**
   * Leave the current signaling room
   */
  async leaveRoom(): Promise<void> {
    if (this.channel) {
      await this.channel.untrack();
      await this.supabase.removeChannel(this.channel);
      this.channel = null;
      console.log('📤 Left signaling room');
    }

    this.currentRoomId = null;
    this.callbacks = null;
  }

  /**
   * Send a signaling message to other participants in the room
   */
  async sendSignalingMessage(
    message: Omit<SignalingMessage, 'sender' | 'timestamp'>
  ): Promise<void> {
    if (!this.channel || !this.currentRoomId) {
      throw new Error('Not connected to a signaling room');
    }

    const fullMessage: SignalingMessage = {
      ...message,
      sender: this.currentUserId,
      timestamp: Date.now(),
    };

    try {
      await this.channel.send({
        type: 'broadcast',
        event: 'signaling',
        payload: fullMessage,
      });

      console.log(`📤 Sent ${message.type} to room ${this.currentRoomId}`);
    } catch (error) {
      console.error('Error sending signaling message:', error);
      throw error;
    }
  }

  /**
   * Handle incoming signaling messages
   */
  private handleSignalingMessage(payload: any): void {
    if (!this.callbacks) return;

    try {
      const message: SignalingMessage = payload;

      // Ignore messages from ourselves
      if (message.sender === this.currentUserId) {
        return;
      }

      console.log(`📥 Received ${message.type} from ${message.sender}`);

      switch (message.type) {
        case 'offer':
          this.callbacks.onOffer(message);
          break;
        case 'answer':
          this.callbacks.onAnswer(message);
          break;
        case 'ice-candidate':
          this.callbacks.onIceCandidate(message);
          break;
        default:
          console.warn('Unknown signaling message type:', message.type);
      }
    } catch (error) {
      console.error('Error handling signaling message:', error);
      this.callbacks.onError(error as Error);
    }
  }

  /**
   * Get the current user ID
   */
  getCurrentUserId(): string {
    return this.currentUserId;
  }

  /**
   * Get the current room ID
   */
  getCurrentRoomId(): string | null {
    return this.currentRoomId;
  }

  /**
   * Check if connected to a room
   */
  isConnected(): boolean {
    return this.channel !== null && this.currentRoomId !== null;
  }

  /**
   * Get list of users currently in the room (via presence)
   */
  getRoomParticipants(): string[] {
    if (!this.channel) return [];

    const presenceState = this.channel.presenceState();
    return Object.keys(presenceState);
  }
}

// Export a singleton instance
export const signalingService = new SupabaseSignalingService();
