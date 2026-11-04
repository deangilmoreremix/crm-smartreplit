/**
 * Text/JSON generation through the server (POST /api/ai/generate), which uses the
 * signed-in user's own OpenAI key. Throws with the server's message (e.g. "add your key").
 */
export interface GenerateOptions {
  prompt: string;
  system?: string;
  json?: boolean;
  tier?: 'default' | 'advanced';
  maxTokens?: number;
}

export interface GenerateResult {
  content: string;
  model: string;
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
}

export async function generateAI(options: GenerateOptions): Promise<GenerateResult> {
  const response = await fetch('/api/ai/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false) {
    throw new Error(data.message || data.error || `AI request failed (${response.status})`);
  }
  return { content: data.content || '', model: data.model, usage: data.usage };
}
