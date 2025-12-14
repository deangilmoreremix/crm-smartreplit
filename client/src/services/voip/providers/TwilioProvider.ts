import { VoIPProvider, ProviderConfig, Room, RoomConnection, Call, CallParticipant, RoomOptions, CallOptions, Recording, RecordingResult } from '../VoIPProvider';

export class TwilioProvider implements VoIPProvider {
  name = 'twilio';
  displayName = 'Twilio';
  description = 'Enterprise-grade VoIP and video calling with global infrastructure';
  website = 'https://twilio.com';

  private accountSid: string = '';
  private authToken: string = '';
  private apiKeySid: string = '';
  private apiKeySecret: string = '';

  getConfigSchema(): ProviderConfig[] {
    return [
      {
        key: 'accountSid',
        label: 'Account SID',
        type: 'password',
        required: true,
        placeholder: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        description: 'Your Twilio Account SID from the console'
      },
      {
        key: 'authToken',
        label: 'Auth Token',
        type: 'password',
        required: true,
        placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        description: 'Your Twilio Auth Token'
      },
      {
        key: 'apiKeySid',
        label: 'API Key SID',
        type: 'password',
        required: true,
        placeholder: 'SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        description: 'Twilio API Key SID for Video'
      },
      {
        key: 'apiKeySecret',
        label: 'API Key Secret',
        type: 'password',
        required: true,
        placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        description: 'Twilio API Key Secret for Video'
      }
    ];
  }

  async initialize(config: Record<string, any>): Promise<void> {
    this.accountSid = config.accountSid;
    this.authToken = config.authToken;
    this.apiKeySid = config.apiKeySid;
    this.apiKeySecret = config.apiKeySecret;

    if (!this.accountSid || !this.authToken || !this.apiKeySid || !this.apiKeySecret) {
      throw new Error('Twilio configuration incomplete');
    }

    // Test connection
    try {
      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Calls.json?PageSize=1`, {
        headers: {
          'Authorization': 'Basic ' + btoa(`${this.accountSid}:${this.authToken}`)
        }
      });

      if (!response.ok) {
        throw new Error('Invalid Twilio credentials');
      }
    } catch (error) {
      throw new Error(`Twilio initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createRoom(participants: string[], options: RoomOptions = {}): Promise<Room> {
    const roomName = options.name || `room-${Date.now()}`;

    try {
      // Create Twilio Video Room
      const response = await fetch(`https://video.twilio.com/v1/Rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + btoa(`${this.apiKeySid}:${this.apiKeySecret}`)
        },
        body: new URLSearchParams({
          UniqueName: roomName,
          Type: 'group',
          MaxParticipants: (options.maxParticipants || 50).toString(),
          RecordParticipantsOnConnect: (options.recordingEnabled ? 'true' : 'false')
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to create Twilio room: ${error}`);
      }

      const roomData = await response.json();

      return {
        id: roomData.sid,
        name: roomData.unique_name,
        url: `https://video.twilio.com/v1/Rooms/${roomData.sid}`,
        participants: participants.map(id => ({ id, name: id })),
        createdAt: new Date(roomData.date_created)
      };
    } catch (error) {
      throw new Error(`Twilio room creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async joinRoom(roomId: string, participantId: string): Promise<RoomConnection> {
    try {
      // Generate access token for participant
      const response = await fetch('/api/voip/twilio/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          participantId,
          accountSid: this.accountSid,
          apiKeySid: this.apiKeySid,
          apiKeySecret: this.apiKeySecret
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate access token');
      }

      const { token } = await response.json();

      // Get room details
      const roomResponse = await fetch(`https://video.twilio.com/v1/Rooms/${roomId}`, {
        headers: {
          'Authorization': 'Basic ' + btoa(`${this.apiKeySid}:${this.apiKeySecret}`)
        }
      });

      const roomData = await roomResponse.json();

      return {
        room: {
          id: roomData.sid,
          name: roomData.unique_name,
          url: `https://video.twilio.com/v1/Rooms/${roomData.sid}`,
          participants: [], // Would need to fetch participants separately
          createdAt: new Date(roomData.date_created)
        },
        token,
        participantId
      };
    } catch (error) {
      throw new Error(`Twilio room join failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async leaveRoom(roomId: string, participantId: string): Promise<void> {
    // Twilio handles participant cleanup automatically
    // We could optionally disconnect the participant here
    console.log(`Participant ${participantId} left room ${roomId}`);
  }

  async startCall(participants: CallParticipant[], options: CallOptions = {}): Promise<Call> {
    // For Twilio, we create a room and return call info
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
      // Complete the Twilio room
      const response = await fetch(`https://video.twilio.com/v1/Rooms/${callId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + btoa(`${this.apiKeySid}:${this.apiKeySecret}`)
        },
        body: new URLSearchParams({
          Status: 'completed'
        })
      });

      if (!response.ok) {
        console.warn('Failed to complete Twilio room');
      }
    } catch (error) {
      console.warn('Error ending Twilio call:', error);
    }
  }

  async muteParticipant(callId: string, participantId: string, muted: boolean): Promise<void> {
    // Twilio Video doesn't have a direct mute API
    // This would need to be handled client-side
    console.log(`Participant ${participantId} ${muted ? 'muted' : 'unmuted'} in call ${callId}`);
  }

  async startRecording(callId: string): Promise<Recording> {
    try {
      const response = await fetch('/api/voip/twilio/recording/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomSid: callId,
          accountSid: this.accountSid,
          authToken: this.authToken
        })
      });

      const recording = await response.json();

      return {
        id: recording.sid,
        callId,
        startedAt: new Date(),
        status: 'recording'
      };
    } catch (error) {
      throw new Error(`Twilio recording start failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async stopRecording(recordingId: string): Promise<RecordingResult> {
    try {
      const response = await fetch('/api/voip/twilio/recording/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordingSid: recordingId,
          accountSid: this.accountSid,
          authToken: this.authToken
        })
      });

      const result = await response.json();

      return {
        id: recordingId,
        url: result.url,
        duration: result.duration,
        size: result.size,
        format: 'mp4'
      };
    } catch (error) {
      throw new Error(`Twilio recording stop failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}