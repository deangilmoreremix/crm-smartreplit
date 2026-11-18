// Per-request OpenAI client built from the caller's own key (user_api_keys, provider 'openai').
// There is no server-wide key. Chat-completion calls are translated to the Responses API
// (/v1/responses, store:false): legacy model IDs mapped, temperature dropped, JSON mode kept.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://esm.sh/openai@4'

export const DEFAULT_MODEL = 'gpt-6-luna'
export const ADVANCED_MODEL = 'gpt-6.1-sol'
export const NO_KEY_MESSAGE = 'Add your OpenAI API key in Settings → API Keys to use AI features.'

const LEGACY: Record<string, string> = {
  'gpt-4o-mini': DEFAULT_MODEL,
  'gpt-3.5-turbo': DEFAULT_MODEL,
  'gpt-4.1-mini': DEFAULT_MODEL,
  'gpt-4.1-nano': DEFAULT_MODEL,
  'o4-mini': DEFAULT_MODEL,
  'gpt-4o': ADVANCED_MODEL,
  'gpt-4': ADVANCED_MODEL,
  'gpt-4-turbo': ADVANCED_MODEL,
  'gpt-4.1': ADVANCED_MODEL,
  'o3': ADVANCED_MODEL,
  'gpt-5': ADVANCED_MODEL,
}

export async function getUserOpenAI(userId: string): Promise<OpenAI | null> {
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const { data } = await admin
    .from('user_api_keys')
    .select('api_key')
    .eq('user_id', userId)
    .eq('provider', 'openai')
    .eq('is_active', true)
    .order('is_default', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!data?.api_key) return null

  const client = new OpenAI({ apiKey: data.api_key })
  // Chat-completion calls run on the Responses API (/v1/responses), store:false
  // deno-lint-ignore no-explicit-any
  ;(client.chat.completions as any).create = async (params: any, options?: any) => {
    const request = chatToResponses(params)
    // deno-lint-ignore no-explicit-any
    const response: any = await (client.responses as any).create(request, options)
    return request.stream ? streamAsChatChunks(response) : responseToChat(response)
  }
  return client
}

// deno-lint-ignore no-explicit-any
function chatToResponses(params: any): any {
  // deno-lint-ignore no-explicit-any
  const messages: any[] = params.messages || []
  const instructions = messages
    .filter((m) => m.role === 'system' || m.role === 'developer')
    .map((m) => (typeof m.content === 'string' ? m.content : ''))
    .join('\n\n')
  const input = messages
    .filter((m) => m.role !== 'system' && m.role !== 'developer')
    .map((m) => ({
      role: m.role,
      content:
        typeof m.content === 'string'
          ? m.content
          // deno-lint-ignore no-explicit-any
          : (m.content || []).map((p: any) =>
              p.type === 'text'
                ? { type: 'input_text', text: p.text }
                : p.type === 'image_url'
                ? { type: 'input_image', image_url: typeof p.image_url === 'string' ? p.image_url : p.image_url?.url }
                : p
            ),
    }))
  const json = params.response_format?.type === 'json_object'
  const needsHint = json && !/json/i.test(`${instructions} ${JSON.stringify(input)}`)
  const maxTokens = params.max_completion_tokens ?? params.max_tokens
  return {
    model: LEGACY[params.model] || params.model || DEFAULT_MODEL,
    input,
    ...(instructions || needsHint ? { instructions: `${instructions}${needsHint ? '\nRespond with valid JSON.' : ''}`.trim() } : {}),
    ...(json ? { text: { format: { type: 'json_object' } } } : {}),
    ...(maxTokens ? { max_output_tokens: maxTokens } : {}),
    ...(params.stream ? { stream: true } : {}),
    store: false,
  }
}

// deno-lint-ignore no-explicit-any
function responseText(response: any): string {
  if (typeof response.output_text === 'string' && response.output_text) return response.output_text
  // deno-lint-ignore no-explicit-any
  return (response.output || [])
    // deno-lint-ignore no-explicit-any
    .flatMap((item: any) => (item.type === 'message' ? item.content || [] : []))
    // deno-lint-ignore no-explicit-any
    .filter((c: any) => c.type === 'output_text')
    // deno-lint-ignore no-explicit-any
    .map((c: any) => c.text)
    .join('')
}

// deno-lint-ignore no-explicit-any
function responseToChat(response: any): any {
  return {
    id: response.id,
    model: response.model,
    choices: [{ index: 0, message: { role: 'assistant', content: responseText(response) }, finish_reason: 'stop' }],
    usage: response.usage
      ? {
          prompt_tokens: response.usage.input_tokens,
          completion_tokens: response.usage.output_tokens,
          total_tokens: response.usage.total_tokens,
        }
      : undefined,
  }
}

// deno-lint-ignore no-explicit-any
async function* streamAsChatChunks(stream: AsyncIterable<any>) {
  for await (const event of stream) {
    if (event.type === 'response.output_text.delta') yield { choices: [{ index: 0, delta: { content: event.delta } }] }
    else if (event.type === 'error' || event.type === 'response.failed') throw new Error(event.message || 'OpenAI stream failed')
  }
}
