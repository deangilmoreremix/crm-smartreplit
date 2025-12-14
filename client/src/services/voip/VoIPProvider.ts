// VoIP Provider Abstraction Interface
export interface VoIPProvider {
  name: string;
  displayName: string;
  description: string;
  website: string;

  // Configuration
  getConfigSchema(): ProviderConfig[];

  // Core functionality
  initialize(config: Record<string, any>): Promise<void>;
  createRoom(participants: string[], options?: RoomOptions): Promise<Room>;
  joinRoom(roomId: string, participantId: string): Promise<RoomConnection>;
  leaveRoom(roomId: string, participantId: string): Promise<void>;

  // Call management
  startCall(participants: CallParticipant[], options?: CallOptions): Promise<Call>;
  endCall(callId: string): Promise<void>;
  muteParticipant(callId: string, participantId: string, muted: boolean): Promise<void>;

  // Recording
  startRecording(callId: string): Promise<Recording>;
  stopRecording(recordingId: string): Promise<RecordingResult>;

  // Events
  onCallStarted?: (call: Call) => void;
  onCallEnded?: (call: Call) => void;
  onParticipantJoined?: (callId: string, participant: CallParticipant) => void;
  onParticipantLeft?: (callId: string, participantId: string) => void;
}

export interface ProviderConfig {
  key: string;
  label: string;
  type: 'text' | 'password' | 'number' | 'boolean' | 'select';
  required: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  description?: string;
}

export interface RoomOptions {
  name?: string;
  maxParticipants?: number;
  recordingEnabled?: boolean;
  chatEnabled?: boolean;
}

export interface CallOptions {
  videoEnabled?: boolean;
  audioEnabled?: boolean;
  screenShareEnabled?: boolean;
  recordingEnabled?: boolean;
}

export interface CallParticipant {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
}

export interface Room {
  id: string;
  name: string;
  url: string;
  participants: CallParticipant[];
  createdAt: Date;
  expiresAt?: Date;
}

export interface RoomConnection {
  room: Room;
  token: string;
  participantId: string;
}

export interface Call {
  id: string;
  roomId: string;
  participants: CallParticipant[];
  status: 'ringing' | 'connected' | 'ended';
  startedAt: Date;
  endedAt?: Date;
  recordingEnabled: boolean;
}

export interface Recording {
  id: string;
  callId: string;
  startedAt: Date;
  status: 'recording' | 'stopped' | 'processing';
}

export interface RecordingResult {
  id: string;
  url: string;
  duration: number;
  size: number;
  format: string;
}

// Provider Registry
export class VoIPProviderRegistry {
  private static providers: Map<string, new () => VoIPProvider> = new Map();

  static register(name: string, providerClass: new () => VoIPProvider) {
    this.providers.set(name, providerClass);
  }

  static getProvider(name: string): VoIPProvider | null {
    const ProviderClass = this.providers.get(name);
    return ProviderClass ? new ProviderClass() : null;
  }

  static getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }
}