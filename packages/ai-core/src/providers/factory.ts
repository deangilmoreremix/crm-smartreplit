import { AIProvider, ProviderConfig } from '../types';
import { BaseProviderAdapter } from './base-adapter';
import { OpenAIAdapter } from './openai-adapter';
import { AnthropicAdapter } from './anthropic-adapter';
import { OpenRouterAdapter } from './openrouter-adapter';
import { CustomProviderAdapter } from './custom-adapter';
import { PROVIDERS } from './config';
import { CustomProviderManager } from './custom-provider-manager';

export class ProviderFactory {
  static createAdapter(providerId: string, config: ProviderConfig): BaseProviderAdapter {
    let provider = PROVIDERS[providerId];

    // If not a built-in provider, check custom providers
    if (!provider) {
      const customProviders = CustomProviderManager.getCustomProviders();
      provider = customProviders.find((p) => p.id === providerId) as AIProvider;
      if (!provider) {
        throw new Error(`Unknown provider: ${providerId}`);
      }
    }

    switch (providerId) {
      case 'openai':
        return new OpenAIAdapter(provider, config);

      case 'openrouter':
        return new OpenRouterAdapter(provider, config);

      case 'anthropic':
        return new AnthropicAdapter(provider, config);

      case 'google':
        // TODO: Implement GoogleAdapter
        throw new Error('Google adapter not yet implemented');

      case 'together':
        // TODO: Implement TogetherAdapter
        throw new Error('Together adapter not yet implemented');

      case 'groq':
        // TODO: Implement GroqAdapter
        throw new Error('Groq adapter not yet implemented');

      default:
        throw new Error(`Adapter not implemented for provider: ${providerId}`);
    }
  }

  static getSupportedProviders(): string[] {
    const builtIn = Object.keys(PROVIDERS);
    const custom = CustomProviderManager.getCustomProviders().map((p) => p.id);
    return [...builtIn, ...custom];
  }

  static getProviderInfo(providerId: string): AIProvider | null {
    return (
      PROVIDERS[providerId] ||
      CustomProviderManager.getCustomProviders().find((p) => p.id === providerId) ||
      null
    );
  }
}
