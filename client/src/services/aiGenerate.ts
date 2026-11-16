/**
 * Client helpers for the server's OpenAI Responses API routes. All requests use the signed-in user's own
 * OpenAI key; errors carry the server's message (e.g. "Add your OpenAI API key in Settings").
 *
 * - generateAI:   POST /api/ai/generate  (text, JSON, JSON Schema; optional image/file input; no web access)
 * - researchAI:   POST /api/ai/research  (live web search with citations — research features only)
 * - generateImageAI: POST /api/ai/image  (generate, or edit when images are passed)
 * - conversations: /api/ai/conversations (multi-turn chat; replaces the retired Assistants API)
 */
export interface FileInput {
  /** A public URL to the file, or */
  url?: string;
  /** a file name plus its content as a base64 data URL. */
  filename?: string;
  data?: string;
}

export interface GenerateOptions {
  prompt: string;
  system?: string;
  json?: boolean;
  /** Strict JSON Schema for Structured Outputs (all properties required, additionalProperties: false). */
  schema?: Record<string, unknown>;
  schemaName?: string;
  tier?: 'default' | 'advanced';
  maxTokens?: number;
  /** Image URLs or data URLs to send with the prompt. */
  images?: string[];
  files?: FileInput[];
  background?: boolean;
}

export interface UrlSource {
  url: string;
  title?: string;
}

export interface GenerateResult {
  content: string;
  /** Parsed JSON when json/schema was requested. */
  data?: any;
  sources: UrlSource[];
  model: string;
  responseId?: string;
  status?: string;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

async function postJSON(url: string, body: unknown): Promise<any> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false) {
    throw new Error(data.message || data.error || `AI request failed (${response.status})`);
  }
  return data;
}

async function getJSON(url: string): Promise<any> {
  const response = await fetch(url);
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false) {
    throw new Error(data.message || data.error || `AI request failed (${response.status})`);
  }
  return data;
}

const toResult = (data: any): GenerateResult => ({
  content: data.content || '',
  data: data.data,
  sources: Array.isArray(data.sources) ? data.sources : [],
  model: data.model,
  responseId: data.responseId,
  status: data.status,
  usage: data.usage,
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Poll a background response until it finishes. */
export async function waitForResponse(
  responseId: string,
  { intervalMs = 2000, timeoutMs = 180_000 }: { intervalMs?: number; timeoutMs?: number } = {}
): Promise<GenerateResult> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const data = await getJSON(`/api/ai/responses/${encodeURIComponent(responseId)}`);
    if (data.status === 'completed') return toResult(data);
    if (data.status === 'failed' || data.status === 'cancelled' || data.status === 'incomplete') {
      throw new Error(`AI request ${data.status}`);
    }
    await sleep(intervalMs);
  }
  throw new Error('AI request timed out');
}

export async function generateAI(options: GenerateOptions): Promise<GenerateResult> {
  const result = toResult(await postJSON('/api/ai/generate', options));
  if (options.background && result.responseId && result.status !== 'completed') {
    return waitForResponse(result.responseId);
  }
  return result;
}

/**
 * Research with live web search and citations. Runs as a background response and polls, so long
 * searches don't hit the server function time limit. Only for research features.
 */
export async function researchAI(
  options: Omit<GenerateOptions, 'background'>,
  pollOptions?: { intervalMs?: number; timeoutMs?: number }
): Promise<GenerateResult> {
  const result = toResult(await postJSON('/api/ai/research', { ...options, background: true }));
  if (result.responseId && result.status !== 'completed') {
    return waitForResponse(result.responseId, pollOptions);
  }
  return result;
}

/** Generate an image, or edit / vary one when `images` (URLs or data URLs) are passed. Returns data URLs. */
export async function generateImageAI(options: {
  prompt: string;
  size?: string;
  quality?: string;
  images?: string[];
}): Promise<string[]> {
  const data = await postJSON('/api/ai/image', options);
  return Array.isArray(data.images) ? data.images : [];
}

/** Image analysis through the Responses API (image input). */
export async function analyzeImageAI(imageUrl: string, prompt?: string): Promise<string> {
  const { content } = await generateAI({
    prompt: prompt || "Analyze this image in detail. Describe what you see, extract any text, and give insights.",
    images: [imageUrl],
  });
  return content;
}

/** Read a browser File as a base64 data URL (for `files` / `images` inputs). */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error || new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}

// ---- Conversations (stored server-side by OpenAI so context carries between turns) ----

export async function createConversation(title?: string): Promise<string> {
  const data = await postJSON('/api/ai/conversations', title ? { title } : {});
  return data.conversationId;
}

export async function sendConversationMessage(
  conversationId: string,
  message: string,
  options: { system?: string; tier?: 'default' | 'advanced' } = {}
): Promise<GenerateResult> {
  return toResult(
    await postJSON(`/api/ai/conversations/${encodeURIComponent(conversationId)}/messages`, { message, ...options })
  );
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | string;
  text: string;
}

export async function listConversationMessages(conversationId: string): Promise<ConversationMessage[]> {
  const data = await getJSON(`/api/ai/conversations/${encodeURIComponent(conversationId)}/messages`);
  return Array.isArray(data.messages) ? data.messages : [];
}
