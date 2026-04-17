export interface AIProvider {
  id: string;
  name: string;
  type: 'direct' | 'aggregator';
  baseUrl: string;
  apiKeyRequired: boolean;
  models: AIModel[];
  capabilities: AICapability[];
}

export interface AIModel {
  id: string;
  name: string;
  contextWindow: number;
  maxTokens: number;
  pricing: {
    input: number; // per 1K tokens
    output: number; // per 1K tokens
  };
  capabilities: AICapability[];
}

export type AICapability = 'chat' | 'completion' | 'embedding' | 'image' | 'audio' | 'vision';

export interface AIRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  id: string;
  model: string;
  choices: ChatChoice[];
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: string;
}

export interface ChatChoice {
  index: number;
  message: ChatMessage;
  finishReason: string;
}

export interface UserAPIKey {
  providerId: string;
  apiKey: string; // encrypted
  isActive: boolean;
  createdAt: Date;
  lastUsedAt?: Date;
}

export interface ProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
  retries?: number;
}
