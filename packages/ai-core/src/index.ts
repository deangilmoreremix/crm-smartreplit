// Core exports
export { AIClient } from './client';

// Types
export type {
  AIProvider,
  AIModel,
  AICapability,
  AIRequest,
  AIResponse,
  ChatMessage,
  UserAPIKey,
  ProviderConfig,
} from './types';

// Providers
export {
  PROVIDERS,
  getProviderById,
  getProvidersByType,
  getAllProviders,
} from './providers/config';

// Key management
export { KeyManager } from './utils/key-manager';

// Factory
export { ProviderFactory } from './providers/factory';
