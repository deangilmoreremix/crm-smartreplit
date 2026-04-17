import { AIProvider } from '../types';

export const PROVIDERS: Record<string, AIProvider> = {
  // Direct Providers
  openai: {
    id: 'openai',
    name: 'OpenAI',
    type: 'direct',
    baseUrl: 'https://api.openai.com/v1',
    apiKeyRequired: true,
    models: [
      {
        id: 'gpt-5.4',
        name: 'GPT-5.4',
        contextWindow: 128000,
        maxTokens: 4096,
        pricing: { input: 0.0015, output: 0.002 },
        capabilities: ['chat', 'completion'],
      },
      {
        id: 'gpt-4.1',
        name: 'GPT-4.1',
        contextWindow: 128000,
        maxTokens: 4096,
        pricing: { input: 0.001, output: 0.002 },
        capabilities: ['chat', 'completion'],
      },
    ],
    capabilities: ['chat', 'completion', 'embedding', 'image'],
  },

  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    type: 'direct',
    baseUrl: 'https://api.anthropic.com',
    apiKeyRequired: true,
    models: [
      {
        id: 'claude-3.5-sonnet-20241022',
        name: 'Claude 3.5 Sonnet',
        contextWindow: 200000,
        maxTokens: 4096,
        pricing: { input: 0.003, output: 0.015 },
        capabilities: ['chat', 'completion'],
      },
    ],
    capabilities: ['chat', 'completion'],
  },

  google: {
    id: 'google',
    name: 'Google AI',
    type: 'direct',
    baseUrl: 'https://generativelanguage.googleapis.com',
    apiKeyRequired: true,
    models: [
      {
        id: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        contextWindow: 1048576,
        maxTokens: 8192,
        pricing: { input: 0.00125, output: 0.005 },
        capabilities: ['chat', 'completion', 'vision'],
      },
    ],
    capabilities: ['chat', 'completion', 'vision'],
  },

  // Aggregator Providers
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    type: 'aggregator',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKeyRequired: true,
    models: [
      {
        id: 'openai/gpt-5.4',
        name: 'GPT-5.4 (via OpenRouter)',
        contextWindow: 128000,
        maxTokens: 4096,
        pricing: { input: 0.0015, output: 0.002 },
        capabilities: ['chat', 'completion'],
      },
      {
        id: 'anthropic/claude-3.5-sonnet',
        name: 'Claude 3.5 Sonnet (via OpenRouter)',
        contextWindow: 200000,
        maxTokens: 4096,
        pricing: { input: 0.003, output: 0.015 },
        capabilities: ['chat', 'completion'],
      },
      {
        id: 'google/gemini-pro-1.5',
        name: 'Gemini Pro 1.5 (via OpenRouter)',
        contextWindow: 1048576,
        maxTokens: 8192,
        pricing: { input: 0.00125, output: 0.005 },
        capabilities: ['chat', 'completion', 'vision'],
      },
    ],
    capabilities: ['chat', 'completion', 'embedding', 'image', 'vision'],
  },

  together: {
    id: 'together',
    name: 'Together AI',
    type: 'aggregator',
    baseUrl: 'https://api.together.xyz/v1',
    apiKeyRequired: true,
    models: [
      {
        id: 'meta-llama/Llama-3.1-70B-Instruct-Turbo',
        name: 'Llama 3.1 70B Instruct',
        contextWindow: 131072,
        maxTokens: 4096,
        pricing: { input: 0.0009, output: 0.0009 },
        capabilities: ['chat', 'completion'],
      },
    ],
    capabilities: ['chat', 'completion'],
  },

  groq: {
    id: 'groq',
    name: 'Groq',
    type: 'aggregator',
    baseUrl: 'https://api.groq.com/openai/v1',
    apiKeyRequired: true,
    models: [
      {
        id: 'llama3-70b-8192',
        name: 'Llama 3 70B',
        contextWindow: 8192,
        maxTokens: 4096,
        pricing: { input: 0.00059, output: 0.00079 },
        capabilities: ['chat', 'completion'],
      },
    ],
    capabilities: ['chat', 'completion'],
  },
};

export const getProviderById = (id: string): AIProvider | undefined => {
  return PROVIDERS[id];
};

export const getProvidersByType = (type: 'direct' | 'aggregator'): AIProvider[] => {
  return Object.values(PROVIDERS).filter((provider) => provider.type === type);
};

export const getAllProviders = (): AIProvider[] => {
  return Object.values(PROVIDERS);
};
