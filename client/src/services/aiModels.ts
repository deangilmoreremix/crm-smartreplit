// OpenAI-only model catalog, derived from the shared tier definitions (@shared/aiModels).
// Pricing and context windows are intentionally not hard-coded here; add them from OpenAI's
// pricing page if they should be displayed.
import { SELECTABLE_MODELS, type ModelTier } from '@shared/aiModels';

export interface AIModel {
  id: string;
  name: string;
  provider: 'openai';
  family: 'gpt';
  tier: ModelTier;
  version: string;
  contextWindow?: number;
  maxTokens?: number;
  pricing?: {
    input: number; // per 1M tokens
    output: number; // per 1M tokens
  };
  capabilities: string[];
  description: string;
  isAvailable: boolean;
  recommended?: boolean;
}

const TIER_CAPABILITIES: Record<ModelTier, string[]> = {
  fast: ['text-generation', 'json-mode', 'function-calling', 'lightweight'],
  default: ['text-generation', 'code-generation', 'json-mode', 'function-calling'],
  deep: ['text-generation', 'code-generation', 'reasoning', 'json-mode', 'function-calling'],
  max: [
    'text-generation',
    'code-generation',
    'advanced-reasoning',
    'json-mode',
    'function-calling',
    'complex-tasks',
  ],
};

export const AI_MODELS: Record<string, AIModel> = Object.fromEntries(
  SELECTABLE_MODELS.map((m) => [
    m.id,
    {
      id: m.id,
      name: m.label,
      provider: 'openai',
      family: 'gpt',
      tier: m.tier,
      version: m.id.replace(/^gpt-/, '').split('-')[0],
      capabilities: TIER_CAPABILITIES[m.tier],
      description: m.description,
      isAvailable: true,
      recommended: m.tier === 'default',
    } satisfies AIModel,
  ])
);

// Model categories for easier filtering
export const MODEL_CATEGORIES = {
  RECOMMENDED: 'recommended',
  FAST: 'fast',
  REASONING: 'reasoning',
} as const;

// Get models by category
export const getModelsByCategory = (category: string): AIModel[] => {
  switch (category) {
    case MODEL_CATEGORIES.RECOMMENDED:
      return Object.values(AI_MODELS).filter((model) => model.recommended);

    case MODEL_CATEGORIES.FAST:
      return Object.values(AI_MODELS).filter((model) => model.tier === 'fast');

    case MODEL_CATEGORIES.REASONING:
      return Object.values(AI_MODELS).filter(
        (model) => model.tier === 'deep' || model.tier === 'max'
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
  return Object.values(AI_MODELS).filter((model) => model.capabilities.includes(capability));
};

const tierId = (tier: ModelTier): string =>
  SELECTABLE_MODELS.find((m) => m.tier === tier)?.id ?? '';

// Model selection helpers for different use cases (model IDs from the tier table)
export const AI_MODEL_RECOMMENDATIONS = {
  EMAIL_GENERATION: [tierId('default')],
  BUSINESS_ANALYSIS: [tierId('deep')],
  CONTENT_CREATION: [tierId('default')],
  QUICK_RESPONSES: [tierId('fast')],
  COMPLEX_REASONING: [tierId('max'), tierId('deep')],
  CODE_GENERATION: [tierId('default'), tierId('deep')],
  MULTIMODAL: [tierId('default')],
};

export type AIModelRecommendation = keyof typeof AI_MODEL_RECOMMENDATIONS;
