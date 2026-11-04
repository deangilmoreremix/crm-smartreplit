/**
 * OpenAI model configuration — the single place to change which models the app uses.
 * Legacy IDs (stored in user_api_keys.model or hardcoded in older code) are mapped to these.
 */

export const DEFAULT_MODEL = 'gpt-6-luna'; // high-volume, low cost
export const ADVANCED_MODEL = 'gpt-6.1-sol'; // complex analysis
export const IMAGE_MODEL = 'gpt-image-2.5-flare';
export const EMBEDDING_MODEL = 'text-embedding-3-small';

const LEGACY_DEFAULT = new Set([
  'gpt-4o-mini',
  'gpt-3.5-turbo',
  'gpt-4.1-mini',
  'gpt-4.1-nano',
  'o4-mini',
  'o1-mini',
]);
const LEGACY_ADVANCED = new Set([
  'gpt-4o',
  'gpt-4',
  'gpt-4-turbo',
  'gpt-4.1',
  'o1',
  'o1-preview',
  'o3',
  'gpt-5',
]);

/** Map a retired or legacy OpenAI model ID to its current replacement; unknown IDs pass through. */
export function mapLegacyModel(model?: string | null): string {
  if (!model) return DEFAULT_MODEL;
  // Strip dated snapshot suffixes, e.g. gpt-4o-2024-08-06 -> gpt-4o
  const base = model.replace(/-\d{4}-\d{2}-\d{2}$/, '').replace(/-\d{4}$/, '');
  if (LEGACY_DEFAULT.has(base)) return DEFAULT_MODEL;
  if (LEGACY_ADVANCED.has(base)) return ADVANCED_MODEL;
  if (base.startsWith('dall-e') || base.includes('-image')) return IMAGE_MODEL;
  // Gemini/Gemma IDs from older client code: the app is OpenAI-only
  if (base.startsWith('gemini') || base.startsWith('gemma')) {
    return base.includes('pro') ? ADVANCED_MODEL : DEFAULT_MODEL;
  }
  return model;
}
