// Enhanced Module Federation - Shared Services
export { unifiedEventSystem } from './unifiedEventSystem';
export { unifiedApiClient, api } from './unifiedApiClient';
export { useOpenAIEmbeddings } from './openaiEmbeddingsService';
export { openAIService } from './openAIService';
export { aiAssistantService } from './aiAssistantService';
export { webSocketManager, useWebSocket } from './webSocketManager';

export * from './themeService';

// Re-export service utilities
export * from './serviceUtils';
