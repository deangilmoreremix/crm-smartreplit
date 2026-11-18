export interface AIModel {
  id: string;
  name: string;
  provider: 'google-ai' | 'openai' | 'anthropic';
  family: 'gemma' | 'gemini' | 'gpt' | 'claude';
  version: string;
  contextWindow: number;
  maxTokens: number;
  pricing: {
    input: number; // per 1M tokens
    output: number; // per 1M tokens
  };
  capabilities: string[];
  description: string;
  apiEndpoint: string;
  isAvailable: boolean;
  recommended?: boolean;
}

export const AI_MODELS: Record<string, AIModel> = {
  'gpt-6-luna': {
    id: 'gpt-6-luna',
    name: 'GPT-6 Luna',
    provider: 'openai',
    family: 'gpt',
    version: '6',
    contextWindow: 1000000,
    maxTokens: 128000,
    pricing: {
      input: 0.1, // $0.10 per 1M tokens
      output: 0.5, // $0.50 per 1M tokens
    },
    capabilities: ['text-generation', 'code-generation', 'reasoning', 'multimodal', 'function-calling', 'json-mode'],
    description: 'Efficient OpenAI model for high-volume, everyday CRM tasks.',
    apiEndpoint: '/api/ai/generate',
    isAvailable: true,
    recommended: true,
  },

  'gpt-6.1-sol': {
    id: 'gpt-6.1-sol',
    name: 'GPT-6.1 Sol',
    provider: 'openai',
    family: 'gpt',
    version: '6.1',
    contextWindow: 1050000,
    maxTokens: 128000,
    pricing: {
      input: 2, // $2.00 per 1M tokens
      output: 10, // $10.00 per 1M tokens
    },
    capabilities: ['text-generation', 'code-generation', 'reasoning', 'multimodal', 'function-calling', 'json-mode', 'complex-tasks'],
    description: 'Near-flagship OpenAI model for complex analysis and reasoning.',
    apiEndpoint: '/api/ai/generate',
    isAvailable: true,
    recommended: true,
  },
};

// Model categories for easier filtering
export const MODEL_CATEGORIES = {
  RECOMMENDED: 'recommended',
  ALL: 'all',
} as const;

// Get models by category
export const getModelsByCategory = (category: string): AIModel[] => {
  if (category === MODEL_CATEGORIES.RECOMMENDED) {
    return Object.values(AI_MODELS).filter((model) => model.recommended);
  }
  return Object.values(AI_MODELS);
};

// Get model by ID
export const getModelById = (id: string): AIModel | undefined => {
  return AI_MODELS[id];
};

// Get models by capability
export const getModelsByCapability = (capability: string): AIModel[] => {
  return Object.values(AI_MODELS).filter((model) => model.capabilities.includes(capability));
};

// Get cheapest model for a capability
export const getCheapestModelForCapability = (capability: string): AIModel | undefined => {
  const models = getModelsByCapability(capability);
  return models.reduce((cheapest, current) =>
    current.pricing.input < cheapest.pricing.input ? current : cheapest
  );
};

// Get fastest model (smallest context window as proxy for speed)
export const getFastestModels = (): AIModel[] => {
  return Object.values(AI_MODELS)
    .sort((a, b) => a.contextWindow - b.contextWindow)
    .slice(0, 3);
};

// Model selection helpers for different use cases
export const AI_MODEL_RECOMMENDATIONS = {
  EMAIL_GENERATION: ['gpt-6-luna'],
  BUSINESS_ANALYSIS: ['gpt-6.1-sol', 'gpt-6-luna'],
  CONTENT_CREATION: ['gpt-6-luna', 'gpt-6.1-sol'],
  QUICK_RESPONSES: ['gpt-6-luna'],
  COMPLEX_REASONING: ['gpt-6.1-sol'],
  CODE_GENERATION: ['gpt-6.1-sol', 'gpt-6-luna'],
  MULTIMODAL: ['gpt-6-luna', 'gpt-6.1-sol'],
};

export type AIModelRecommendation = keyof typeof AI_MODEL_RECOMMENDATIONS;
