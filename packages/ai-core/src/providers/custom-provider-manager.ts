import { AIProvider } from '../types';
import { PROVIDERS } from './config';

export interface CustomProvider extends AIProvider {
  isCustom: true;
  customConfig: {
    authType: 'bearer' | 'api-key' | 'basic' | 'custom';
    authHeader?: string;
    baseUrl: string;
    modelsEndpoint?: string;
    chatEndpoint: string;
    responseFormat: 'openai' | 'anthropic' | 'custom';
    customHeaders?: Record<string, string>;
  };
}

export class CustomProviderManager {
  private static readonly STORAGE_KEY = 'smartcrm_custom_providers';

  static getCustomProviders(): CustomProvider[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  static addCustomProvider(provider: Omit<CustomProvider, 'isCustom'>): void {
    const customProviders = this.getCustomProviders();

    // Check if provider with this ID already exists
    if (customProviders.find((p) => p.id === provider.id)) {
      throw new Error(`Provider with ID '${provider.id}' already exists`);
    }

    const customProvider: CustomProvider = {
      ...provider,
      isCustom: true,
    };

    customProviders.push(customProvider);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(customProviders));
  }

  static removeCustomProvider(providerId: string): void {
    const customProviders = this.getCustomProviders().filter((p) => p.id !== providerId);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(customProviders));
  }

  static getAllProviders(): AIProvider[] {
    const customProviders = this.getCustomProviders();
    const builtInProviders = Object.values(PROVIDERS);
    return [...builtInProviders, ...customProviders];
  }

  static validateCustomProvider(config: CustomProvider['customConfig']): string[] {
    const errors: string[] = [];

    if (!config.baseUrl) {
      errors.push('Base URL is required');
    }

    if (!config.chatEndpoint) {
      errors.push('Chat endpoint is required');
    }

    if (config.authType === 'api-key' && !config.authHeader) {
      errors.push('Auth header is required for API key authentication');
    }

    return errors;
  }
}
