/**
 * Pure helpers for the /api/assistants routes (Responses API migration).
 * An assistant is a saved config; a thread chains responses via previous_response_id.
 */
import { buildRequest, outputText, respond, usageOf, type RespondOptions, type Usage } from './openaiClient';

export interface AssistantRow {
  id: string;
  user_id: string;
  name: string;
  instructions: string;
  model: string | null;
  tools: unknown[] | null;
}

export interface ThreadRow {
  id: string;
  last_response_id: string | null;
}

const TOOL_ALIASES: Record<string, string> = { code_interpreter: 'code_interpreter', web_search: 'web_search' };

/** Keep only hosted tools the Responses API supports here; accepts 'code_interpreter' or {type}. */
export function sanitizeTools(tools: unknown): unknown[] {
  if (!Array.isArray(tools)) return [];
  const out: unknown[] = [];
  const seen = new Set<string>();
  for (const t of tools) {
    const type = typeof t === 'string' ? t : (t as any)?.type;
    const canonical = TOOL_ALIASES[type];
    if (!canonical || seen.has(canonical)) continue;
    seen.add(canonical);
    out.push(canonical === 'code_interpreter' ? { type: 'code_interpreter', container: { type: 'auto' } } : { type: 'web_search' });
  }
  return out;
}

/** Instructions are resent every turn; history comes from previous_response_id. */
export function buildChatRequest(
  assistant: Pick<AssistantRow, 'instructions' | 'model' | 'tools'>,
  thread: Pick<ThreadRow, 'last_response_id'>,
  message: string,
  fallbackModel?: string | null
): RespondOptions {
  const tools = sanitizeTools(assistant.tools);
  return {
    model: assistant.model || fallbackModel || undefined,
    instructions: assistant.instructions || undefined,
    input: message,
    previousResponseId: thread.last_response_id || undefined,
    store: true,
    ...(tools.length ? { tools } : {}),
  };
}

export async function runChatTurn(args: {
  assistant: AssistantRow;
  thread: ThreadRow;
  message: string;
  client?: any;
  fallbackModel?: string | null;
}): Promise<{ text: string; responseId: string; usage: Usage; model: string }> {
  const opts = { ...buildChatRequest(args.assistant, args.thread, args.message, args.fallbackModel), client: args.client };
  const response = await respond(opts);
  return {
    text: outputText(response),
    responseId: response.id,
    usage: usageOf(response),
    model: response.model ?? String(buildRequest(opts).model),
  };
}
