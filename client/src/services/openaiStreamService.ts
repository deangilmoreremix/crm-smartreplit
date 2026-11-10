/**
 * Streaming chat via the server (POST /api/stream, SSE).
 * The server holds the user's API key and chooses the model tier; no keys are handled in the browser.
 * Events: `data: {"content": "..."}` per delta, `data: {"error": "..."}` on failure, then `data: [DONE]`.
 */

type ChatMessage = { role: 'user' | 'assistant' | 'system'; content: string };

const messagesToPrompt = (messages: ChatMessage[]): string =>
  messages
    .map((m) => (m.role === 'system' ? m.content : `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`))
    .join('\n\n');

// Streams from /api/stream, calling onToken per delta. Returns the full text.
const streamPrompt = async (prompt: string, onToken: (token: string) => void, model?: string): Promise<string> => {
  const response = await fetch('/api/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, ...(model ? { model } : {}), max_output_tokens: 2000 }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || error.error || `API error: ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Failed to get response reader');
  }

  const decoder = new TextDecoder();
  const fullContent: string[] = [];
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') return fullContent.join('');

      let parsed: any;
      try {
        parsed = JSON.parse(data);
      } catch {
        continue; // ignore malformed chunks
      }
      if (parsed.error) throw new Error(parsed.error);
      if (parsed.content) {
        fullContent.push(parsed.content);
        onToken(parsed.content);
      }
    }
  }

  return fullContent.join('');
};

export const useOpenAIStream = () => {
  const streamChat = async (
    messages: ChatMessage[],
    onChunk: (chunk: string) => void,
    onComplete: () => void,
    onError: (error: Error) => void,
    model?: string
  ) => {
    try {
      await streamPrompt(messagesToPrompt(messages), onChunk, model);
      onComplete();
    } catch (error) {
      onError(error as Error);
    }
  };

  const streamChatCompletion = async (
    userMessage: string,
    systemPrompt: string,
    onToken: (token: string) => void,
    model?: string
  ): Promise<string> =>
    streamPrompt(messagesToPrompt([{ role: 'system', content: systemPrompt }, { role: 'user', content: userMessage }]), onToken, model);

  return { streamChat, streamChatCompletion };
};

// Response format for AI results
export interface AIResult {
  id: string;
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: string;
  timestamp: Date;
}

// Copy text to clipboard with feedback
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
};

// Save content to file
export const saveToFile = (content: string, filename: string, mimeType: string = 'text/plain'): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Format timestamp for display
export const formatTimestamp = (date: Date): string => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Generate filename for saving AI results
export const generateFilename = (prefix: string, extension: string = 'txt'): string => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `${prefix}-${timestamp}.${extension}`;
};
