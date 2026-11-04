// Per-request OpenAI client built from the caller's own key (user_api_keys, provider 'openai').
// There is no server-wide key. Requests are normalised for current models: legacy model IDs are
// mapped, max_tokens -> max_completion_tokens, and temperature is dropped.
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
  const create = client.chat.completions.create.bind(client.chat.completions)
  // deno-lint-ignore no-explicit-any
  ;(client.chat.completions as any).create = (params: any, options?: any) => {
    const { temperature: _t, max_tokens, ...rest } = params
    return create(
      {
        ...rest,
        model: LEGACY[rest.model] || rest.model || DEFAULT_MODEL,
        ...(max_tokens != null && rest.max_completion_tokens == null ? { max_completion_tokens: max_tokens } : {}),
      },
      options
    )
  }
  return client
}
