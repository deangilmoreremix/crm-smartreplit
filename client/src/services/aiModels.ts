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
  // Gemini 2.5 Flash Models
  'gemini-2.5-flash': {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'google-ai',
    family: 'gemini',
    version: '2.5',
    contextWindow: 1048576, // 1M tokens
    maxTokens: 8192,
    pricing: {
      input: 0.075, // $0.075 per 1M tokens
      output: 0.30   // $0.30 per 1M tokens
    },
    capabilities: [
      'text-generation',
      'code-generation',
      'reasoning',
      'multimodal',
      'function-calling',
      'json-mode'
    ],
    description: 'Fast and versatile performance across a diverse variety of tasks. Optimized for speed and efficiency.',
    apiEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash',
    isAvailable: true,
    recommended: true
  },
  
  'gemini-2.5-flash-8b': {
    id: 'gemini-2.5-flash-8b',
    name: 'Gemini 2.5 Flash 8B',
    provider: 'google-ai',
    family: 'gemini',
    version: '2.5',
    contextWindow: 1048576, // 1M tokens
    maxTokens: 8192,
    pricing: {
      input: 0.0375, // $0.0375 per 1M tokens
      output: 0.15   // $0.15 per 1M tokens
    },
    capabilities: [
      'text-generation',
      'code-generation',
      'reasoning',
      'multimodal',
      'function-calling',
      'json-mode'
    ],
    description: 'Smaller, faster, and more cost-effective version of Gemini 2.5 Flash. Great for high-volume applications.',
    apiEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-8b',
    isAvailable: true
  },

  // Gemma Models (via Gemini API)
  'gemma-2-2b-it': {
    id: 'gemma-2-2b-it',
    name: 'Gemma 2 2B Instruction Tuned',
    provider: 'google-ai',
    family: 'gemma',
    version: '2.0',
    contextWindow: 8192,
    maxTokens: 2048,
    pricing: {
      input: 0.035, // $0.035 per 1M tokens
      output: 0.105  // $0.105 per 1M tokens
    },
    capabilities: [
      'text-generation',
      'instruction-following',
      'conversation',
      'lightweight'
    ],
    description: 'Lightweight, instruction-tuned model optimized for following instructions and conversations. Perfect for resource-constrained environments.',
    apiEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemma-2-2b-it',
    isAvailable: true
  },

  'gemma-2-9b-it': {
    id: 'gemma-2-9b-it',
    name: 'Gemma 2 9B Instruction Tuned',
    provider: 'google-ai',
    family: 'gemma',
    version: '2.0',
    contextWindow: 8192,
    maxTokens: 2048,
    pricing: {
      input: 0.05,  // $0.05 per 1M tokens
      output: 0.15  // $0.15 per 1M tokens
    },
    capabilities: [
      'text-generation',
      'instruction-following',
      'reasoning',
      'conversation',
      'code-understanding'
    ],
    description: 'Balanced performance and efficiency. Excellent for complex reasoning tasks while maintaining good speed.',
    apiEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemma-2-9b-it',
    isAvailable: true,
    recommended: true
  },

  'gemma-2-27b-it': {
    id: 'gemma-2-27b-it',
    name: 'Gemma 2 27B Instruction Tuned',
    provider: 'google-ai',
    family: 'gemma',
    version: '2.0',
    contextWindow: 8192,
    maxTokens: 2048,
    pricing: {
      input: 0.125, // $0.125 per 1M tokens
      output: 0.375 // $0.375 per 1M tokens
    },
    capabilities: [
      'text-generation',
      'instruction-following',
      'advanced-reasoning',
      'conversation',
      'code-generation',
      'complex-tasks'
    ],
    description: 'Most capable Gemma model with superior performance on complex reasoning and generation tasks.',
    apiEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemma-2-27b-it',
    isAvailable: true
  },

  // Legacy Gemini Models for completeness
  'gemini-1.5-pro': {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'google-ai',
    family: 'gemini',
    version: '1.5',
    contextWindow: 2097152, // 2M tokens
    maxTokens: 8192,
    pricing: {
      input: 1.25,  // $1.25 per 1M tokens
      output: 5.00  // $5.00 per 1M tokens
    },
    capabilities: [
      'text-generation',
      'code-generation',
      'reasoning',
      'multimodal',
      'function-calling',
      'long-context'
    ],
    description: 'Mid-size multimodal model with excellent performance across a variety of reasoning tasks.',
    apiEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro',
    isAvailable: true
  },

  'gemini-1.5-flash': {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    provider: 'google-ai',
    family: 'gemini',
    version: '1.5',
    contextWindow: 1048576, // 1M tokens
    maxTokens: 8192,
    pricing: {
      input: 0.075, // $0.075 per 1M tokens
      output: 0.30  // $0.30 per 1M tokens
    },
    capabilities: [
      'text-generation',
      'code-generation',
      'reasoning',
      'multimodal',
      'function-calling'
    ],
    description: 'Fast and versatile performance across a diverse variety of tasks.',
    apiEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash',
    isAvailable: true
  }
};

// Model categories for easier filtering
export const MODEL_CATEGORIES = {
  RECOMMENDED: 'recommended',
  GEMINI_FLASH: 'gemini-flash',
  GEMMA: 'gemma',
  LEGACY: 'legacy'
} as const;

// Get models by category
export const getModelsByCategory = (category: string): AIModel[] => {
  switch (category) {
    case MODEL_CATEGORIES.RECOMMENDED:
      return Object.values(AI_MODELS).filter(model => model.recommended);
    
    case MODEL_CATEGORIES.GEMINI_FLASH:
      return Object.values(AI_MODELS).filter(model => 
        model.family === 'gemini' && model.id.includes('flash')
      );
    
    case MODEL_CATEGORIES.GEMMA:
      return Object.values(AI_MODELS).filter(model => model.family === 'gemma');
    
    case MODEL_CATEGORIES.LEGACY:
      return Object.values(AI_MODELS).filter(model => 
        model.family === 'gemini' && model.version === '1.5'
      );
    
    default:
      return Object.values(AI_MODELS);
  }
};

// Get model by ID
export const getModelById = (id: string): AIModel | undefined => {
  return AI_MODELS[id];
};

// Get models by capability
export const getModelsByCapability = (capability: string): AIModel[] => {
  return Object.values(AI_MODELS).filter(model => 
    model.capabilities.includes(capability)
  );
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
  // For CRM email generation
  EMAIL_GENERATION: ['gemini-2.5-flash', 'gemma-2-9b-it'],
  
  // For business analysis
  BUSINESS_ANALYSIS: ['gemini-2.5-flash', 'gemma-2-27b-it'],
  
  // For content creation
  CONTENT_CREATION: ['gemini-2.5-flash', 'gemma-2-27b-it'],
  
  // For quick responses
  QUICK_RESPONSES: ['gemini-2.5-flash-8b', 'gemma-2-2b-it'],
  
  // For complex reasoning
  COMPLEX_REASONING: ['gemini-2.5-flash', 'gemma-2-27b-it', 'gemini-1.5-pro'],
  
  // For code generation
  CODE_GENERATION: ['gemini-2.5-flash', 'gemma-2-27b-it'],
  
  // For multimodal tasks
  MULTIMODAL: ['gemini-2.5-flash', 'gemini-1.5-pro', 'gemini-1.5-flash']
};

export type AIModelRecommendation = keyof typeof AI_MODEL_RECOMMENDATIONS;