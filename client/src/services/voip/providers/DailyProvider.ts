import { VoIPProvider, ProviderConfig, Room, RoomConnection, Call, CallParticipant, RoomOptions, CallOptions, Recording, RecordingResult } from '../VoIPProvider';

export class DailyProvider implements VoIPProvider {
  name = 'daily';
  displayName = 'Daily.co';
  description = 'Simple, developer-friendly video calling with powerful APIs';
  website = 'https://daily.co';

  private apiKey: string = '';
  private domain: string = '';

  getConfigSchema(): ProviderConfig[] {
    return [
      {
        key: 'apiKey',
        label: 'API Key',
        type: 'password',
        required: true,
        placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        description: 'Your Daily.co API key from the dashboard'
      },
      {
        key: 'domain',
        label: 'Domain',
        type: 'text',
        required: false,
        placeholder: 'your-domain.daily.co',
        description: 'Your custom domain (optional, uses daily.co if not set)'
      }
    ];
  }

  async initialize(config: Record<string, any>): Promise<void> {
    this.apiKey = config.apiKey;
    this.domain = config.domain || 'daily.co';

    if (!this.apiKey) {
      throw new Error('Daily.co API key is required');
    }

    // Test connection
    try {
      const response = await fetch('https://api.daily.co/v1/', {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error('Invalid Daily.co API key');
      }
    } catch (error) {
      throw new Error(`Daily.co initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createRoom(participants: string[], options: RoomOptions = {}): Promise<Room> {
    const roomName = options.name || `room-${Date.now()}`;

    try {
      const response = await fetch('https://api.daily.co/v1/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          name: roomName,
          privacy: 'private',
          properties: {
            max_participants: options.maxParticipants || 10,
            enable_recording: options.recordingEnabled ? 'cloud' : 'disabled',
            enable_chat: options.chatEnabled || false,
            start_video_off: false,
            start_audio_off: false
          }
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to create Daily room: ${error}`);
      }

      const roomData = await response.json();

      return {
        id: roomData.id,
        name: roomData.name,
        url: roomData.url,
        participants: participants.map(id => ({ id, name: id })),
        createdAt: new Date(roomData.created_at)
      };
    } catch (error) {
      throw new Error(`Daily room creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async joinRoom(roomId: string, participantId: string): Promise<RoomConnection> {
    try {
      // Get room details
      const roomResponse = await fetch(`https://api.daily.co/v1/rooms/${roomId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!roomResponse.ok) {
        throw new Error('Room not found');
      }

      const roomData = await roomResponse.json();

      // Generate meeting token for participant
      const tokenResponse = await fetch(`https://api.daily.co/v1/meeting-tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          properties: {
            room_name: roomData.name,
            user_name: participantId,
            user_id: participantId,
            start_video_off: false,
            start_audio_off: false
          }
        })
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to generate meeting token');
      }

      const tokenData = await tokenResponse.json();

      return {
        room: {
          id: roomData.id,
          name: roomData.name,
          url: roomData.url,
          participants: [], // Daily doesn't expose participant list in room details
          createdAt: new Date(roomData.created_at)
        },
        token: tokenData.token,
        participantId
      };
    } catch (error) {
      throw new Error(`Daily room join failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async leaveRoom(roomId: string, participantId: string): Promise<void> {
    // Daily handles participant cleanup automatically
    console.log(`Participant ${participantId} left room ${roomId}`);
  }

  async startCall(participants: CallParticipant[], options: CallOptions = {}): Promise<Call> {
    const room = await this.createRoom(participants.map(p => p.id), {
      name: `call-${Date.now()}`,
      recordingEnabled: options.recordingEnabled
    });

    return {
      id: room.id,
      roomId: room.id,
      participants,
      status: 'ringing',
      startedAt: new Date(),
      recordingEnabled: options.recordingEnabled || false
    };
  }

  async endCall(callId: string): Promise<void> {
    try {
      // Delete the room to end the call
      const response = await fetch(`https://api.daily.co/v1/rooms/${callId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        console.warn('Failed to delete Daily room');
      }
    } catch (error) {
      console.warn('Error ending Daily call:', error);
    }
  }

  async muteParticipant(callId: string, participantId: string, muted: boolean): Promise<void> {
    // Daily doesn't have a server-side mute API
    // This would need to be handled client-side via Daily's JavaScript SDK
    console.log(`Participant ${participantId} ${muted ? 'muted' : 'unmuted'} in call ${callId}`);
  }

  async startRecording(callId: string): Promise<Recording> {
    try {
      const response = await fetch(`https://api.daily.co/v1/recordings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          room_name: callId // Assuming callId is room name
        })
      });

      const recording = await response.json();

      return {
        id: recording.id,
        callId,
        startedAt: new Date(),
        status: 'recording'
      };
    } catch (error) {
      throw new Error(`Daily recording start failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async stopRecording(recordingId: string): Promise<RecordingResult> {
    try {
      // Get recording details
      const response = await fetch(`https://api.daily.co/v1/recordings/${recordingId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      const recording = await response.json();

      return {
        id: recordingId,
        url: recording.download_link,
        duration: recording.duration || 0,
        size: recording.size || 0,
        format: recording.format || 'mp4'
      };
    } catch (error) {
      throw new Error(`Daily recording retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}