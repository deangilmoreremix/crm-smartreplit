import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'join-room' | 'leave-room';
  roomId?: string;
  userId?: string;
  data?: any;
  recipient?: string;
}

interface Room {
  id: string;
  participants: Map<string, WebSocket>;
}

export class SignalingServer {
  private wss: WebSocketServer;
  private rooms: Map<string, Room> = new Map();
  private userConnections: Map<WebSocket, { userId: string; roomId: string }> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/signaling'
    });

    this.wss.on('connection', this.handleConnection.bind(this));
    console.log('✅ WebSocket signaling server initialized on /signaling');
  }

  private handleConnection(ws: WebSocket) {
    console.log('📞 New WebSocket connection');

    ws.on('message', (message: string) => {
      try {
        const data: SignalingMessage = JSON.parse(message.toString());
        this.handleMessage(ws, data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
        this.sendError(ws, 'Invalid message format');
      }
    });

    ws.on('close', () => {
      this.handleDisconnect(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.handleDisconnect(ws);
    });
  }

  private handleMessage(ws: WebSocket, message: SignalingMessage) {
    console.log('📨 Received message:', message.type, 'room:', message.roomId);

    switch (message.type) {
      case 'join-room':
        this.handleJoinRoom(ws, message);
        break;
      case 'leave-room':
        this.handleLeaveRoom(ws);
        break;
      case 'offer':
      case 'answer':
      case 'ice-candidate':
        this.handleSignalingMessage(ws, message);
        break;
      default:
        console.warn('Unknown message type:', message.type);
    }
  }

  private handleJoinRoom(ws: WebSocket, message: SignalingMessage) {
    const { roomId, userId } = message;
    
    if (!roomId || !userId) {
      this.sendError(ws, 'Missing roomId or userId');
      return;
    }

    // Remove from previous room if exists
    this.handleLeaveRoom(ws);

    // Get or create room
    let room = this.rooms.get(roomId);
    if (!room) {
      room = {
        id: roomId,
        participants: new Map()
      };
      this.rooms.set(roomId, room);
      console.log(`🏠 Created new room: ${roomId}`);
    }

    // Add user to room
    room.participants.set(userId, ws);
    this.userConnections.set(ws, { userId, roomId });

    console.log(`👤 User ${userId} joined room ${roomId}. Total participants: ${room.participants.size}`);

    // Notify user of successful join
    this.send(ws, {
      type: 'joined-room',
      roomId,
      userId,
      participants: Array.from(room.participants.keys()).filter(id => id !== userId)
    });

    // Notify other participants
    this.broadcastToRoom(roomId, {
      type: 'user-joined',
      userId
    }, userId);
  }

  private handleLeaveRoom(ws: WebSocket) {
    const connection = this.userConnections.get(ws);
    if (!connection) return;

    const { userId, roomId } = connection;
    const room = this.rooms.get(roomId);
    
    if (room) {
      room.participants.delete(userId);
      console.log(`👋 User ${userId} left room ${roomId}. Remaining: ${room.participants.size}`);

      // Notify other participants
      this.broadcastToRoom(roomId, {
        type: 'user-left',
        userId
      }, userId);

      // Clean up empty rooms
      if (room.participants.size === 0) {
        this.rooms.delete(roomId);
        console.log(`🗑️ Deleted empty room: ${roomId}`);
      }
    }

    this.userConnections.delete(ws);
  }

  private handleSignalingMessage(ws: WebSocket, message: SignalingMessage) {
    const connection = this.userConnections.get(ws);
    if (!connection) {
      this.sendError(ws, 'Not in a room');
      return;
    }

    const { userId, roomId } = connection;
    const room = this.rooms.get(roomId);
    
    if (!room) {
      this.sendError(ws, 'Room not found');
      return;
    }

    // If recipient specified, send only to them
    if (message.recipient) {
      const recipientWs = room.participants.get(message.recipient);
      if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
        this.send(recipientWs, {
          type: message.type,
          sender: userId,
          data: message.data
        });
        console.log(`📤 Sent ${message.type} from ${userId} to ${message.recipient}`);
      }
    } else {
      // Broadcast to all other participants
      this.broadcastToRoom(roomId, {
        type: message.type,
        sender: userId,
        data: message.data
      }, userId);
      console.log(`📢 Broadcast ${message.type} from ${userId} to room ${roomId}`);
    }
  }

  private handleDisconnect(ws: WebSocket) {
    this.handleLeaveRoom(ws);
    console.log('🔌 WebSocket disconnected');
  }

  private broadcastToRoom(roomId: string, message: any, excludeUserId?: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.participants.forEach((participantWs, participantId) => {
      if (participantId !== excludeUserId && participantWs.readyState === WebSocket.OPEN) {
        this.send(participantWs, message);
      }
    });
  }

  private send(ws: WebSocket, message: any) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private sendError(ws: WebSocket, error: string) {
    this.send(ws, {
      type: 'error',
      error
    });
  }

  public getRoomCount(): number {
    return this.rooms.size;
  }

  public getTotalConnections(): number {
    return this.userConnections.size;
  }
}
