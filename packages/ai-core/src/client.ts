import { AIRequest, AIResponse, AIProvider } from './types';
import { KeyManager } from './utils/key-manager';
import { ProviderFactory } from './providers/factory';
import { PROVIDERS } from './providers/config';

export class AIClient {
  private adapters: Map<string, any> = new Map();

  constructor() {
    // Initialize adapters for providers that have keys
    this.initializeAdapters();
  }

  private initializeAdapters() {
    for (const providerId of Object.keys(PROVIDERS)) {
      if (KeyManager.hasKey(providerId)) {
        try {
          const config = KeyManager.getProviderConfig(providerId);
          const adapter = ProviderFactory.createAdapter(providerId, config);
          this.adapters.set(providerId, adapter);
        } catch (error) {
          console.warn(`Failed to initialize adapter for ${providerId}:`, error);
        }
      }
    }
  }

  async chat(providerId: string, request: AIRequest): Promise<AIResponse> {
    const adapter = this.adapters.get(providerId);
    if (!adapter) {
      throw new Error(
        `No adapter available for provider ${providerId}. Please configure an API key.`
      );
    }

    return adapter.chat(request);
  }

  async chatWithFallback(request: AIRequest, preferredProvider?: string): Promise<AIResponse> {
    const availableProviders = Array.from(this.adapters.keys());

    if (availableProviders.length === 0) {
      throw new Error('No AI providers configured. Please add API keys in settings.');
    }

    // Try preferred provider first
    if (preferredProvider && availableProviders.includes(preferredProvider)) {
      try {
        return await this.chat(preferredProvider, request);
      } catch (error) {
        console.warn(`Preferred provider ${preferredProvider} failed, trying fallback:`, error);
      }
    }

    // Try other providers
    for (const providerId of availableProviders) {
      if (providerId !== preferredProvider) {
        try {
          return await this.chat(providerId, request);
        } catch (error) {
          console.warn(`Provider ${providerId} failed:`, error);
          continue;
        }
      }
    }

    throw new Error('All configured AI providers failed');
  }

  getAvailableProviders(): string[] {
    return Array.from(this.adapters.keys());
  }

  getProviderInfo(providerId: string): AIProvider | null {
    return ProviderFactory.getProviderInfo(providerId);
  }

  hasProvider(providerId: string): boolean {
    return this.adapters.has(providerId);
  }

  refreshAdapters() {
    this.adapters.clear();
    this.initializeAdapters();
  }

  // Static methods for key management
  static setAPIKey(providerId: string, apiKey: string) {
    KeyManager.setKey(providerId, apiKey);
  }

  static removeAPIKey(providerId: string) {
    KeyManager.removeKey(providerId);
  }

  static hasAPIKey(providerId: string): boolean {
    return KeyManager.hasKey(providerId);
  }

  static getConfiguredProviders(): string[] {
    return KeyManager.getKeys().map((k) => k.providerId);
  }
}
