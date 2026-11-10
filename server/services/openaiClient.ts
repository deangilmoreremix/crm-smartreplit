/**
 * Central OpenAI Responses API helper.
 * Every server-side AI call should go through here so migration rules live in one place:
 *  - Responses API (instructions + input, output_text, typed stream events)
 *  - max_tokens -> max_output_tokens, response_format -> text.format
 *  - temperature / top_p are sent only when reasoning effort is explicitly "none"
 *  - "minimal" effort -> "low"; "none" -> "low" on models that reject it (Astra, 6.1 Sol)
 *  - chat-shaped tools are flattened to Responses function tools
 */
import OpenAI from 'openai';
import {
  ModelTier,
  ReasoningEffort,
  normalizeEffort,
  resolveModel,
  tierModel,
} from '../../shared/aiModels';

export type { ModelTier, ReasoningEffort };

/** Extra output tokens granted when reasoning is enabled. */
export const REASONING_HEADROOM = 1024;

type JsonSchemaFormat = { name: string; schema: Record<string, unknown>; strict?: boolean };

export interface RespondOptions {
  /** Tier name or concrete model id. Defaults to the "default" tier. */
  model?: string;
  tier?: ModelTier;
  instructions?: string;
  input: string | unknown[];
  maxOutputTokens?: number;
  effort?: ReasoningEffort;
  /** Only sent when effort === 'none' (reasoning models reject it otherwise). */
  temperature?: number;
  topP?: number;
  /** true => json_object; object => strict json_schema. */
  json?: boolean | JsonSchemaFormat;
  tools?: unknown[];
  toolChoice?: unknown;
  previousResponseId?: string;
  store?: boolean;
  /** Inject a client (tests) or a per-user client. */
  client?: OpenAI;
}

export interface Usage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------
let cachedClient: OpenAI | null = null;

/** Shared env-key client (OPENAI_API_KEY, then OPENAI_API_KEY_FALLBACK), or null. */
export function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_FALLBACK;
  if (!apiKey) return null;
  if (!cachedClient) cachedClient = new OpenAI({ apiKey });
  return cachedClient;
}

/** Client for a user-supplied key (not cached). */
export function createUserClient(apiKey: string): OpenAI {
  return new OpenAI({ apiKey });
}

function requireClient(opts: { client?: OpenAI }): OpenAI {
  const client = opts.client ?? getOpenAIClient();
  if (!client) throw new Error('OpenAI not configured');
  return client;
}

// ---------------------------------------------------------------------------
// Request building (pure; unit-tested)
// ---------------------------------------------------------------------------

/** Flatten `{type:'function', function:{name,...}}` (chat shape) to the Responses shape. */
export function toResponsesTool(tool: any): any {
  if (tool?.type === 'function' && tool.function) {
    const { name, description, parameters, strict } = tool.function;
    return {
      type: 'function',
      name,
      description,
      parameters,
      ...(strict !== undefined ? { strict } : {}),
    };
  }
  return tool;
}

function toResponsesToolChoice(choice: any): any {
  if (choice && typeof choice === 'object' && choice.type === 'function' && choice.function?.name) {
    return { type: 'function', name: choice.function.name };
  }
  return choice;
}

export function buildRequest(opts: RespondOptions): Record<string, unknown> {
  const model = opts.model
    ? resolveModel(opts.model)
    : tierModel(opts.tier ?? 'default');
  const effort = normalizeEffort(model, opts.effort);

  const body: Record<string, unknown> = { model, input: opts.input };
  if (opts.instructions) body.instructions = opts.instructions;
  if (effort) body.reasoning = { effort };
  if (opts.maxOutputTokens) {
    // max_output_tokens also counts reasoning tokens, so leave headroom when reasoning is on.
    body.max_output_tokens =
      effort && effort !== 'none' ? opts.maxOutputTokens + REASONING_HEADROOM : opts.maxOutputTokens;
  }

  // Sampling params are only valid when reasoning is explicitly off.
  if (effort === 'none') {
    if (opts.temperature !== undefined) body.temperature = opts.temperature;
    if (opts.topP !== undefined) body.top_p = opts.topP;
  }

  if (opts.json === true) {
    body.text = { format: { type: 'json_object' } };
  } else if (opts.json) {
    body.text = {
      format: {
        type: 'json_schema',
        name: opts.json.name,
        schema: opts.json.schema,
        strict: opts.json.strict ?? true,
      },
    };
  }

  if (opts.tools?.length) {
    body.tools = opts.tools.map(toResponsesTool);
    if (opts.toolChoice !== undefined) body.tool_choice = toResponsesToolChoice(opts.toolChoice);
  }

  if (opts.previousResponseId) body.previous_response_id = opts.previousResponseId;
  // Stateless by default; chained turns need stored responses.
  body.store = opts.store ?? !!opts.previousResponseId;
  return body;
}

// ---------------------------------------------------------------------------
// Response parsing (pure; unit-tested)
// ---------------------------------------------------------------------------

/** Text of a response: `output_text`, else concatenated output_text parts of message items. */
export function outputText(response: any): string {
  if (typeof response?.output_text === 'string') return response.output_text;
  const parts: string[] = [];
  for (const item of response?.output ?? []) {
    if (item?.type !== 'message') continue;
    for (const c of item.content ?? []) {
      if (c?.type === 'output_text' && typeof c.text === 'string') parts.push(c.text);
    }
  }
  return parts.join('');
}

export function usageOf(response: any): Usage {
  const u = response?.usage ?? {};
  const inputTokens = u.input_tokens ?? 0;
  const outputTokens = u.output_tokens ?? 0;
  return { inputTokens, outputTokens, totalTokens: u.total_tokens ?? inputTokens + outputTokens };
}

export function functionCalls(response: any): Array<{ call_id: string; name: string; arguments: string }> {
  return (response?.output ?? []).filter((i: any) => i?.type === 'function_call');
}

// ---------------------------------------------------------------------------
// Calls
// ---------------------------------------------------------------------------
export async function respond(opts: RespondOptions): Promise<any> {
  const client = requireClient(opts);
  return client.responses.create(buildRequest(opts) as any);
}

export async function respondText(opts: RespondOptions): Promise<{ text: string; usage: Usage; model: string }> {
  const response = await respond(opts);
  return { text: outputText(response), usage: usageOf(response), model: response.model ?? String(buildRequest(opts).model) };
}

export async function respondJson<T = any>(
  opts: RespondOptions
): Promise<{ data: T; usage: Usage; model: string }> {
  const { text, usage, model } = await respondText({ ...opts, json: opts.json ?? true });
  return { data: JSON.parse(text || '{}') as T, usage, model };
}

export type StreamEvent =
  | { type: 'delta'; text: string }
  | { type: 'done'; text: string; usage: Usage }
  | { type: 'error'; message: string };

/** Stream text deltas from `response.output_text.delta` events. */
export async function* respondStream(opts: RespondOptions): AsyncGenerator<StreamEvent> {
  const client = requireClient(opts);
  const stream: AsyncIterable<any> = (await client.responses.create({
    ...(buildRequest(opts) as any),
    stream: true,
  })) as any;
  let full = '';
  for await (const event of stream) {
    if (event.type === 'response.output_text.delta') {
      full += event.delta;
      yield { type: 'delta', text: event.delta };
    } else if (event.type === 'response.completed') {
      yield { type: 'done', text: full, usage: usageOf(event.response) };
    } else if (event.type === 'error') {
      yield { type: 'error', message: event.message ?? 'OpenAI stream error' };
    }
  }
}

export type ToolHandler = (args: any) => unknown | Promise<unknown>;

/**
 * Run the function-calling loop: call, execute `function_call` items, reply with
 * `function_call_output` (linked by call_id) until the model returns no more calls.
 */
export async function respondWithTools(
  opts: RespondOptions & { handlers: Record<string, ToolHandler>; maxTurns?: number }
): Promise<{ text: string; usage: Usage; response: any }> {
  const { handlers, maxTurns = 5, ...base } = opts;
  const client = requireClient(base);
  let context: unknown[] =
    typeof base.input === 'string' ? [{ role: 'user', content: base.input }] : [...base.input];
  const total: Usage = { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
  let response: any;

  for (let turn = 0; turn < maxTurns; turn++) {
    const request = buildRequest({ ...base, input: context });
    // Stateless mode needs encrypted reasoning items to be replayed between turns.
    if (request.store === false) request.include = ['reasoning.encrypted_content'];
    response = await client.responses.create(request as any);
    const u = usageOf(response);
    total.inputTokens += u.inputTokens;
    total.outputTokens += u.outputTokens;
    total.totalTokens += u.totalTokens;

    const calls = functionCalls(response);
    if (!calls.length) break;

    context = [...context, ...response.output];
    for (const call of calls) {
      let output: unknown;
      try {
        const handler = handlers[call.name];
        if (!handler) throw new Error(`No handler for tool "${call.name}"`);
        output = await handler(JSON.parse(call.arguments || '{}'));
      } catch (error: any) {
        output = { error: error?.message ?? 'Tool failed' };
      }
      context.push({
        type: 'function_call_output',
        call_id: call.call_id,
        output: typeof output === 'string' ? output : JSON.stringify(output),
      });
    }
  }
  return { text: outputText(response), usage: total, response };
}
