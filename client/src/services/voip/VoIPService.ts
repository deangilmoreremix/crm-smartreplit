import { VoIPProvider, VoIPProviderRegistry, CallParticipant, CallOptions, Call, Recording, RecordingResult } from './VoIPProvider';
import { TwilioProvider } from './providers/TwilioProvider';
import { DailyProvider } from './providers/DailyProvider';

// Register providers
VoIPProviderRegistry.register('twilio', TwilioProvider);
VoIPProviderRegistry.register('daily', DailyProvider);

export interface VoIPConfig {
  provider: string;
  config: Record<string, any>;
  enabled: boolean;
}

export class VoIPService {
  private static instance: VoIPService;
  private currentProvider: VoIPProvider | null = null;
  private config: VoIPConfig | null = null;

  private constructor() {}

  static getInstance(): VoIPService {
    if (!VoIPService.instance) {
      VoIPService.instance = new VoIPService();
    }
    return VoIPService.instance;
  }

  // Configuration management
  async configure(config: VoIPConfig): Promise<void> {
    this.config = config;

    if (!config.enabled) {
      this.currentProvider = null;
      return;
    }

    const ProviderClass = VoIPProviderRegistry.getProvider(config.provider);
    if (!ProviderClass) {
      throw new Error(`VoIP provider '${config.provider}' not found`);
    }

    this.currentProvider = ProviderClass;
    await this.currentProvider.initialize(config.config);
  }

  // Get available providers
  getAvailableProviders(): Array<{
    name: string;
    displayName: string;
    description: string;
    website: string;
  }> {
    return VoIPProviderRegistry.getAvailableProviders().map(name => {
      const provider = VoIPProviderRegistry.getProvider(name);
      return provider ? {
        name: provider.name,
        displayName: provider.displayName,
        description: provider.description,
        website: provider.website
      } : null;
    }).filter(Boolean) as any[];
  }

  // Get provider configuration schema
  getProviderConfigSchema(providerName: string) {
    const provider = VoIPProviderRegistry.getProvider(providerName);
    return provider ? provider.getConfigSchema() : null;
  }

  // Check if VoIP is configured and enabled
  isEnabled(): boolean {
    return Boolean(this.config?.enabled && this.currentProvider !== null);
  }

  // Get current provider info
  getCurrentProvider(): { name: string; displayName: string } | null {
    return this.currentProvider ? {
      name: this.currentProvider.name,
      displayName: this.currentProvider.displayName
    } : null;
  }

  // Core VoIP functionality with fallback
  async startCall(participants: CallParticipant[], options: CallOptions = {}): Promise<Call> {
    if (!this.isEnabled()) {
      throw new Error('VoIP is not configured or enabled. Please configure a VoIP provider in settings.');
    }

    try {
      return await this.currentProvider!.startCall(participants, options);
    } catch (error) {
      console.error('VoIP provider call failed:', error);
      throw new Error(`Call failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please check your VoIP provider configuration.`);
    }
  }

  async endCall(callId: string): Promise<void> {
    this.ensureProvider();
    return this.currentProvider!.endCall(callId);
  }

  async muteParticipant(callId: string, participantId: string, muted: boolean): Promise<void> {
    this.ensureProvider();
    return this.currentProvider!.muteParticipant(callId, participantId, muted);
  }

  async startRecording(callId: string): Promise<Recording> {
    this.ensureProvider();
    return this.currentProvider!.startRecording(callId);
  }

  async stopRecording(recordingId: string): Promise<RecordingResult> {
    this.ensureProvider();
    return this.currentProvider!.stopRecording(recordingId);
  }

  // Room management (for advanced use cases)
  async createRoom(participants: string[], options?: any) {
    this.ensureProvider();
    return this.currentProvider!.createRoom(participants, options);
  }

  async joinRoom(roomId: string, participantId: string) {
    this.ensureProvider();
    return this.currentProvider!.joinRoom(roomId, participantId);
  }

  async leaveRoom(roomId: string, participantId: string) {
    this.ensureProvider();
    return this.currentProvider!.leaveRoom(roomId, participantId);
  }

  // Event handlers
  onCallStarted(callback: (call: Call) => void) {
    if (this.currentProvider) {
      this.currentProvider.onCallStarted = callback;
    }
  }

  onCallEnded(callback: (call: Call) => void) {
    if (this.currentProvider) {
      this.currentProvider.onCallEnded = callback;
    }
  }

  onParticipantJoined(callback: (callId: string, participant: CallParticipant) => void) {
    if (this.currentProvider) {
      this.currentProvider.onParticipantJoined = callback;
    }
  }

  onParticipantLeft(callback: (callId: string, participantId: string) => void) {
    if (this.currentProvider) {
      this.currentProvider.onParticipantLeft = callback;
    }
  }

  private ensureProvider(): void {
    if (!this.currentProvider) {
      throw new Error('VoIP provider not configured or disabled');
    }
  }

  // Load configuration from storage
  async loadConfig(): Promise<void> {
    try {
      // In a real app, this would load from database/API
      const savedConfig = localStorage.getItem('voip-config');
      if (savedConfig) {
        const config = JSON.parse(savedConfig);
        await this.configure(config);
      }
    } catch (error) {
      console.error('Failed to load VoIP config:', error);
    }
  }

  // Save configuration to storage
  async saveConfig(config: VoIPConfig): Promise<void> {
    try {
      localStorage.setItem('voip-config', JSON.stringify(config));
      await this.configure(config);
    } catch (error) {
      console.error('Failed to save VoIP config:', error);
      throw error;
    }
  }

  // Test provider configuration
  async testConfig(config: VoIPConfig): Promise<{ success: boolean; message: string }> {
    try {
      const testProvider = VoIPProviderRegistry.getProvider(config.provider);
      if (!testProvider) {
        return { success: false, message: `Provider '${config.provider}' not found` };
      }

      await testProvider.initialize(config.config);
      return { success: true, message: 'Configuration test successful' };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Configuration test failed'
      };
    }
  }
}

// Export singleton instance
export const voipService = VoIPService.getInstance();