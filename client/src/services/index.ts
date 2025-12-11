// Enhanced Module Federation - Shared Services
export { unifiedEventSystem } from './unifiedEventSystem';
export { unifiedApiClient, api } from './unifiedApiClient';
export { useOpenAIEmbeddings } from './openaiEmbeddingsService';
export { openAIService } from './openAIService';
export { geminiService } from './geminiService';
export { webSocketManager, useWebSocket } from './webSocketManager';

// Re-export service utilities
export * from './serviceUtils';