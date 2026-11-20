/**
 * OpenAI Responses API (/v1/responses) — the OpenAI text/vision interface the app uses.
 * Images use the Images API with GPT Image 2.6 (see generateImage).
 *
 * - `respond()` is the high-level helper for features (instructions, multimodal input, JSON / JSON Schema output,
 *   built-in tools such as web_search / code_interpreter / image_generation, conversations, background mode).
 * - `chatToResponsesParams()` / `responseToChatCompletion()` / `responsesStreamAsChatChunks()` let older code that
 *   still calls `client.chat.completions.create()` run on the Responses API unchanged (see userOpenAI.ts).
 *
 * Data retention: requests default to store:false; only conversation features pass store:true.
 */
import type OpenAI from 'openai';
import { mapLegacyModel, IMAGE_MODEL, IMAGE_EDIT_MODEL, IMAGE_MODELS } from './openaiModels';

export interface UrlSource {
  url: string;
  title?: string;
}

export interface RespondOptions {
  model: string;
  instructions?: string;
  /** A string prompt, or Responses input items (messages with input_text / input_image / input_file parts). */
  input: string | any[];
  /** true → JSON object output; {name, schema} → strict JSON Schema (Structured Outputs). */
  json?: boolean | { name: string; schema: Record<string, unknown> };
  tools?: any[];
  toolChoice?: any;
  maxOutputTokens?: number;
  store?: boolean;
  previousResponseId?: string;
  conversation?: string;
  background?: boolean;
  include?: string[];
}

export interface RespondResult {
  id: string;
  status: string;
  text: string;
  /** Parsed JSON when `json` was requested and the text parsed. */
  data?: any;
  /** URL citations from web_search. */
  sources: UrlSource[];
  /** Base64 images from image_generation. */
  images: string[];
  usage?: { input_tokens: number; output_tokens: number; total_tokens: number };
  raw: any;
}

/** Text of all output_text parts (the SDK's `output_text` is only set on non-streamed create()). */
export function outputText(response: any): string {
  if (typeof response?.output_text === 'string' && response.output_text) return response.output_text;
  const parts: string[] = [];
  for (const item of response?.output || []) {
    if (item.type === 'message') {
      for (const c of item.content || []) if (c.type === 'output_text') parts.push(c.text);
    }
  }
  return parts.join('');
}

export function extractSources(response: any): UrlSource[] {
  const seen = new Map<string, UrlSource>();
  for (const item of response?.output || []) {
    if (item.type !== 'message') continue;
    for (const c of item.content || []) {
      for (const a of c.annotations || []) {
        if (a.type === 'url_citation' && a.url && !seen.has(a.url)) seen.set(a.url, { url: a.url, title: a.title });
      }
    }
  }
  return [...seen.values()];
}

export function extractImages(response: any): string[] {
  return (response?.output || [])
    .filter((item: any) => item.type === 'image_generation_call' && item.result)
    .map((item: any) => item.result as string);
}

function textFormat(json: RespondOptions['json']) {
  if (!json) return undefined;
  if (json === true) return { format: { type: 'json_object' } };
  return { format: { type: 'json_schema', name: json.name, schema: json.schema, strict: true } };
}

/** Parse a model's JSON reply, tolerating ```json fences or text around the object; undefined if unparseable. */
export function parseJSONText(text: string): any {
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        /* fall through */
      }
    }
    return undefined;
  }
}

export function toResult(response: any, wantJson: boolean): RespondResult {
  const text = outputText(response);
  const data = wantJson ? parseJSONText(text) : undefined;
  return {
    id: response.id,
    status: response.status,
    text,
    data,
    sources: extractSources(response),
    images: extractImages(response),
    usage: response.usage,
    raw: response,
  };
}

export async function respond(client: OpenAI, options: RespondOptions): Promise<RespondResult> {
  // json_object mode requires the word "JSON" in the input or instructions
  const instructions =
    options.json === true && !/json/i.test(`${options.instructions || ''} ${JSON.stringify(options.input)}`)
      ? `${options.instructions ? options.instructions + '\n' : ''}Respond with valid JSON.`
      : options.instructions;

  const response = await (client.responses as any).create({
    model: mapLegacyModel(options.model),
    input: options.input,
    ...(instructions ? { instructions } : {}),
    ...(options.json ? { text: textFormat(options.json) } : {}),
    ...(options.tools?.length ? { tools: options.tools } : {}),
    ...(options.toolChoice ? { tool_choice: options.toolChoice } : {}),
    ...(options.maxOutputTokens ? { max_output_tokens: options.maxOutputTokens } : {}),
    ...(options.previousResponseId ? { previous_response_id: options.previousResponseId } : {}),
    ...(options.conversation ? { conversation: options.conversation } : {}),
    ...(options.background ? { background: true } : {}),
    ...(options.include?.length ? { include: options.include } : {}),
    // Background mode and conversations need stored responses; everything else is not retained
    store: options.store ?? Boolean(options.background || options.conversation || options.previousResponseId),
  });
  return toResult(response, Boolean(options.json));
}

/** Built-in web search (research features only). */
export const webSearchTool = (userLocation?: { country?: string; city?: string; region?: string }) => ({
  type: 'web_search',
  search_context_size: 'medium',
  ...(userLocation ? { user_location: { type: 'approximate', ...userLocation } } : {}),
});

/** Generate (or edit, when inputImages are given) an image with the image_generation tool. */
export interface ImageOptions {
  prompt: string;
  /** gpt-image-2.6-flare (default for generation) or gpt-image-2.6-sunburst (default for edits). */
  imageModel?: string;
  size?: string;
  quality?: string;
  n?: number;
  background?: 'auto' | 'opaque' | 'transparent';
  output_format?: 'png' | 'jpeg' | 'webp' | 'gif' | 'svg';
  output_compression?: number;
  complexity?: 'low' | 'medium' | 'high';
  frame_count?: number;
  frame_duration_ms?: number;
  /** Images to edit or combine (URLs or data URLs, up to 16). When set, the edits endpoint is used. */
  inputImages?: string[];
  /** PNG mask (transparent = area to change); cannot be combined with markup. */
  mask?: string;
  /** Transparent PNG overlay with marks drawn over the first image. */
  markup?: string;
  /** Kept for older callers; the image model is chosen by imageModel. */
  model?: string;
}

const MIME: Record<string, string> = { png: 'image/png', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', svg: 'image/svg+xml' };
const QUALITY = ['auto', 'low', 'medium', 'high', 'xhigh', 'max'];

/**
 * Generate or edit images with GPT Image 2.6 on the Images API (/v1/images/generations, /v1/images/edits).
 * Returns base64 images plus their data-URL MIME type.
 */
export async function generateImage(
  client: OpenAI,
  options: ImageOptions
): Promise<{ b64: string[]; responseId?: string; model: string; outputFormat: string; mime: string }> {
  const editing = Boolean(options.inputImages?.length);
  const model = options.imageModel && IMAGE_MODELS.includes(options.imageModel)
    ? options.imageModel
    : editing ? IMAGE_EDIT_MODEL : IMAGE_MODEL;
  // Older UI values (DALL-E): hd/standard quality
  const quality = options.quality === 'hd' ? 'high' : options.quality === 'standard' ? 'medium' : options.quality;
  let format = options.output_format;
  if (options.background === 'transparent' && (!format || format === 'jpeg')) format = 'png';

  const body: Record<string, unknown> = { model, prompt: options.prompt };
  if (options.size) body.size = options.size;
  if (quality && QUALITY.includes(quality)) body.quality = quality;
  if (options.n) body.n = Math.min(Math.max(options.n, 1), format === 'svg' ? 1 : 4);
  if (options.background) body.background = options.background;
  if (format) body.output_format = format;
  if (options.complexity) body.complexity = options.complexity;
  if (options.output_compression !== undefined && (format === 'jpeg' || format === 'webp')) {
    body.output_compression = options.output_compression;
  }
  if (format === 'gif') {
    if (options.frame_count) body.frame_count = Math.min(Math.max(options.frame_count, 2), 16);
    if (options.frame_duration_ms) body.frame_duration_ms = Math.max(options.frame_duration_ms, 20);
  }
  if (editing) {
    if (options.mask && options.markup) throw new Error('Use either a mask or a markup overlay, not both');
    body.images = options.inputImages!.slice(0, 16).map((image_url) => ({ image_url }));
    if (options.mask) body.mask = { image_url: options.mask };
    if (options.markup) body.markup = { image_url: options.markup };
  }

  // client.post sends the JSON body as-is (the SDK's typed images.* methods predate the 2.6 parameters).
  const data: any = await (client as any).post(editing ? '/images/edits' : '/images/generations', { body });
  const b64 = (data?.data || []).map((d: any) => d.b64_json).filter(Boolean);
  if (!b64.length) throw new Error('No image was generated');
  const outputFormat = data?.output_format || format || 'png';
  return { b64, model, outputFormat, mime: MIME[outputFormat] || 'image/png' };
}

// ---------------------------------------------------------------------------------------------
// Chat Completions compatibility: older call sites keep their request/response shapes.
// ---------------------------------------------------------------------------------------------

function contentToResponses(content: any): any {
  if (typeof content === 'string' || content == null) return content ?? '';
  return content.map((part: any) => {
    if (part.type === 'text') return { type: 'input_text', text: part.text };
    if (part.type === 'image_url') {
      const url = typeof part.image_url === 'string' ? part.image_url : part.image_url?.url;
      return { type: 'input_image', image_url: url, ...(part.image_url?.detail ? { detail: part.image_url.detail } : {}) };
    }
    return part;
  });
}

export function chatToResponsesParams(params: any): any {
  const {
    model,
    messages = [],
    response_format,
    max_tokens,
    max_completion_tokens,
    tools,
    tool_choice,
    stream,
  } = params;

  const instructions = messages
    .filter((m: any) => m.role === 'system' || m.role === 'developer')
    .map((m: any) => (typeof m.content === 'string' ? m.content : (m.content || []).map((p: any) => p.text).join('\n')))
    .join('\n\n');

  const input = messages
    .filter((m: any) => m.role !== 'system' && m.role !== 'developer')
    .map((m: any) =>
      m.role === 'tool'
        ? { type: 'function_call_output', call_id: m.tool_call_id, output: String(m.content ?? '') }
        : { role: m.role, content: contentToResponses(m.content) }
    );

  let text: any;
  if (response_format?.type === 'json_object') text = { format: { type: 'json_object' } };
  if (response_format?.type === 'json_schema') {
    const s = response_format.json_schema || {};
    text = { format: { type: 'json_schema', name: s.name || 'output', schema: s.schema, strict: s.strict ?? true } };
  }
  // json_object mode requires the word "JSON" in the context
  const needsJsonHint = text?.format?.type === 'json_object' && !/json/i.test(`${instructions} ${JSON.stringify(input)}`);

  const maxTokens = max_completion_tokens ?? max_tokens;
  return {
    model: mapLegacyModel(model),
    input: input.length ? input : '',
    ...(instructions || needsJsonHint
      ? { instructions: `${instructions}${needsJsonHint ? '\nRespond with valid JSON.' : ''}`.trim() }
      : {}),
    ...(text ? { text } : {}),
    ...(maxTokens ? { max_output_tokens: maxTokens } : {}),
    ...(tools?.length
      ? {
          tools: tools.map((t: any) =>
            t.type === 'function' && t.function
              ? {
                  type: 'function',
                  name: t.function.name,
                  description: t.function.description,
                  parameters: t.function.parameters ?? { type: 'object', properties: {} },
                  strict: t.function.strict ?? false,
                }
              : t
          ),
        }
      : {}),
    ...(tool_choice
      ? { tool_choice: typeof tool_choice === 'object' && tool_choice.function ? { type: 'function', name: tool_choice.function.name } : tool_choice }
      : {}),
    ...(stream ? { stream: true } : {}),
    store: false,
  };
}

export function responseToChatCompletion(response: any): any {
  const calls = (response.output || []).filter((item: any) => item.type === 'function_call');
  const content = outputText(response);
  return {
    id: response.id,
    object: 'chat.completion',
    created: response.created_at,
    model: response.model,
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content: content || null,
          ...(calls.length
            ? {
                tool_calls: calls.map((c: any) => ({
                  id: c.call_id,
                  type: 'function',
                  function: { name: c.name, arguments: c.arguments },
                })),
              }
            : {}),
        },
        finish_reason: calls.length ? 'tool_calls' : response.status === 'incomplete' ? 'length' : 'stop',
      },
    ],
    usage: response.usage
      ? {
          prompt_tokens: response.usage.input_tokens,
          completion_tokens: response.usage.output_tokens,
          total_tokens: response.usage.total_tokens,
        }
      : undefined,
  };
}

/** Adapt a Responses event stream to Chat Completions chunks ({choices:[{delta:{content}}]}). */
export async function* responsesStreamAsChatChunks(stream: AsyncIterable<any>): AsyncGenerator<any> {
  for await (const event of stream) {
    if (event.type === 'response.output_text.delta') {
      yield { object: 'chat.completion.chunk', choices: [{ index: 0, delta: { content: event.delta } }] };
    } else if (event.type === 'response.completed') {
      yield { object: 'chat.completion.chunk', choices: [{ index: 0, delta: {}, finish_reason: 'stop' }] };
    } else if (event.type === 'error' || event.type === 'response.failed') {
      throw new Error(event.message || event.response?.error?.message || 'OpenAI stream failed');
    }
  }
}
