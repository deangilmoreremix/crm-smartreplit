/**
 * Single source of truth for OpenAI model selection.
 * Model IDs follow OpenAI's "latest model" guide. Override any tier with an env var
 * (OPENAI_MODEL_FAST / _DEFAULT / _DEEP / _MAX) without touching call sites.
 * The Supabase edge helper (supabase/functions/_shared/openai.ts) mirrors these defaults.
 */

export type ModelTier = 'fast' | 'default' | 'deep' | 'max';
export type ReasoningEffort = 'none' | 'minimal' | 'low' | 'medium' | 'high';

export const MODEL_TIERS: Record<ModelTier, string> = {
  fast: 'gpt-6-luna',
  default: 'gpt-6.1-terra',
  deep: 'gpt-6.1-sol',
  max: 'gpt-6-astra',
};

export interface SelectableModel {
  id: string;
  label: string;
  tier: ModelTier;
  description: string;
}

/** Models offered in selectors / settings UIs. */
export const SELECTABLE_MODELS: SelectableModel[] = [
  { id: 'gpt-6-luna', label: 'GPT-6 Luna', tier: 'fast', description: 'Fastest and most cost-effective' },
  { id: 'gpt-6.1-terra', label: 'GPT-6.1 Terra', tier: 'default', description: 'Fast and efficient (default)' },
  { id: 'gpt-6.1-sol', label: 'GPT-6.1 Sol', tier: 'deep', description: 'Balanced speed, cost and intelligence' },
  { id: 'gpt-6-astra', label: 'GPT-6 Astra', tier: 'max', description: 'Highest intelligence' },
];

export const DEFAULT_MODEL = MODEL_TIERS.default;

const ENV_NAMES: Record<ModelTier, string> = {
  fast: 'OPENAI_MODEL_FAST',
  default: 'OPENAI_MODEL_DEFAULT',
  deep: 'OPENAI_MODEL_DEEP',
  max: 'OPENAI_MODEL_MAX',
};

type Env = Record<string, string | undefined>;

const defaultEnv = (): Env =>
  typeof process !== 'undefined' && process.env ? (process.env as Env) : {};

/** Model ID for a tier, honouring env overrides. */
export function tierModel(tier: ModelTier = 'default', env: Env = defaultEnv()): string {
  return env[ENV_NAMES[tier]]?.trim() || MODEL_TIERS[tier];
}

/** Accepts a tier name or a concrete model ID; falls back to the default tier. */
export function resolveModel(tierOrModel?: string | null, env: Env = defaultEnv()): string {
  if (!tierOrModel) return tierModel('default', env);
  if (tierOrModel in MODEL_TIERS) return tierModel(tierOrModel as ModelTier, env);
  return tierOrModel;
}

/** Astra and 6.1 Sol reject reasoning effort "none"; Terra and Luna accept it. */
export function modelSupportsNoReasoning(model: string): boolean {
  return !/^gpt-6(\.1)?-(astra|sol)/.test(model) || model === 'gpt-6-sol';
}

/**
 * Normalise a requested effort for a model:
 * - "minimal" is replaced by "low" (per migration guidance)
 * - "none" becomes "low" on models that do not support it
 */
export function normalizeEffort(
  model: string,
  effort?: ReasoningEffort | null
): ReasoningEffort | undefined {
  if (!effort) return undefined;
  if (effort === 'minimal') return 'low';
  if (effort === 'none' && !modelSupportsNoReasoning(model)) return 'low';
  return effort;
}
