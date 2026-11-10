/**
 * Shared OpenAI Responses API helper for Supabase Edge Functions (Deno).
 * Mirrors server/services/openaiClient.ts using raw fetch (no SDK), and shares the
 * tier defaults from shared/aiModels.ts. Override with OPENAI_MODEL_FAST/_DEFAULT/_DEEP/_MAX.
 */

export type ModelTier = 'fast' | 'default' | 'deep' | 'max';
export type ReasoningEffort = 'none' | 'minimal' | 'low' | 'medium' | 'high';

const TIERS: Record<ModelTier, string> = {
  fast: 'gpt-6-luna',
  default: 'gpt-6.1-terra',
  deep: 'gpt-6.1-sol',
  max: 'gpt-6-astra',
};

const REASONING_HEADROOM = 1024;
const MIN_OUTPUT_TOKENS = 16;

export function tierModel(tier: ModelTier = 'default'): string {
  return Deno.env.get(`OPENAI_MODEL_${tier.toUpperCase()}`)?.trim() || TIERS[tier];
}

export function resolveModel(tierOrModel?: string | null): string {
  if (!tierOrModel) return tierModel('default');
  return tierOrModel in TIERS ? tierModel(tierOrModel as ModelTier) : tierOrModel;
}

function normalizeEffort(model: string, effort?: ReasoningEffort): ReasoningEffort | undefined {
  if (!effort) return undefined;
  if (effort === 'minimal') return 'low';
  // Astra and 6.1 Sol reject "none".
  if (effort === 'none' && /^gpt-6(\.1)?-(astra|sol)/.test(model) && model !== 'gpt-6-sol') return 'low';
  return effort;
}

export interface RespondOptions {
  model?: string; // tier name or concrete model id
  instructions?: string;
  input: string | unknown[];
  maxOutputTokens?: number;
  effort?: ReasoningEffort;
  temperature?: number; // only sent when effort === 'none'
  json?: boolean | { name: string; schema: Record<string, unknown>; strict?: boolean };
  tools?: unknown[];
  toolChoice?: unknown;
  apiKey?: string; // per-user key; defaults to OPENAI_API_KEY
}

export function buildRequest(opts: RespondOptions): Record<string, unknown> {
  const model = resolveModel(opts.model);
  const effort = normalizeEffort(model, opts.effort);
  const body: Record<string, unknown> = { model, input: opts.input, store: false };
  if (opts.instructions) body.instructions = opts.instructions;
  if (effort) body.reasoning = { effort };
  if (opts.maxOutputTokens) {
    const n = effort && effort !== 'none' ? opts.maxOutputTokens + REASONING_HEADROOM : opts.maxOutputTokens;
    body.max_output_tokens = Math.max(MIN_OUTPUT_TOKENS, n);
  }
  if (effort === 'none' && opts.temperature !== undefined) body.temperature = opts.temperature;
  if (opts.json === true) body.text = { format: { type: 'json_object' } };
  else if (opts.json) {
    body.text = { format: { type: 'json_schema', name: opts.json.name, schema: opts.json.schema, strict: opts.json.strict ?? true } };
  }
  if (opts.tools?.length) {
    body.tools = opts.tools;
    if (opts.toolChoice !== undefined) body.tool_choice = opts.toolChoice;
  }
  return body;
}

export function outputText(response: any): string {
  if (typeof response?.output_text === 'string') return response.output_text;
  const parts: string[] = [];
  for (const item of response?.output ?? []) {
    if (item?.type !== 'message') continue;
    for (const c of item.content ?? []) if (c?.type === 'output_text') parts.push(c.text);
  }
  return parts.join('');
}

export function usageOf(response: any) {
  const u = response?.usage ?? {};
  const inputTokens = u.input_tokens ?? 0;
  const outputTokens = u.output_tokens ?? 0;
  return { inputTokens, outputTokens, totalTokens: u.total_tokens ?? inputTokens + outputTokens };
}

function authHeaders(apiKey?: string): Record<string, string> {
  const key = apiKey || Deno.env.get('OPENAI_API_KEY');
  if (!key) throw new Error('OpenAI API key not configured');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` };
}

export async function respond(opts: RespondOptions, extra: Record<string, unknown> = {}): Promise<Response> {
  return fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: authHeaders(opts.apiKey),
    body: JSON.stringify({ ...buildRequest(opts), ...extra }),
  });
}

async function respondJsonRaw(opts: RespondOptions): Promise<any> {
  const res = await respond(opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || `OpenAI error ${res.status}`);
  return data;
}

export async function respondText(opts: RespondOptions) {
  const response = await respondJsonRaw(opts);
  return { text: outputText(response), usage: usageOf(response), response };
}

export async function respondJson<T = any>(opts: RespondOptions) {
  const { text, usage, response } = await respondText({ ...opts, json: opts.json ?? true });
  return { data: JSON.parse(text || '{}') as T, usage, response };
}

/** Yields text deltas parsed from `response.output_text.delta` server-sent events. */
export async function* respondStream(opts: RespondOptions): AsyncGenerator<string> {
  const res = await respond(opts, { stream: true });
  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error?.message || `OpenAI error ${res.status}`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const payload = line.slice(6).trim();
      if (!payload || payload === '[DONE]') continue;
      try {
        const event = JSON.parse(payload);
        if (event.type === 'response.output_text.delta') yield event.delta;
        else if (event.type === 'error') throw new Error(event.message || 'OpenAI stream error');
      } catch (e) {
        if (e instanceof SyntaxError) continue;
        throw e;
      }
    }
  }
}

export async function embed(input: string, model = 'text-embedding-3-small', apiKey?: string): Promise<number[]> {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: authHeaders(apiKey),
    body: JSON.stringify({ model, input }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || `OpenAI error ${res.status}`);
  return data.data[0].embedding;
}

/**
 * Per-user key from the canonical `user_api_keys_openai` view (user_id, api_key, model;
 * see supabase/migrations/20261113300000_user_api_keys_unify.sql), falling back to the
 * OPENAI_API_KEY env var. `supabase` is a supabase-js client.
 */
export async function getUserOpenAIKey(
  supabase: any,
  userId?: string | null
): Promise<{ apiKey?: string; model?: string }> {
  if (userId) {
    const { data } = await supabase
      .from('user_api_keys_openai')
      .select('api_key, model')
      .eq('user_id', userId)
      .maybeSingle();
    if (data?.api_key) return { apiKey: data.api_key, model: data.model || undefined };
  }
  return { apiKey: Deno.env.get('OPENAI_API_KEY') || undefined };
}
