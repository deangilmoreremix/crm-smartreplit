import { generateAI } from './aiGenerate';

// Chat goes through the server (POST /api/ai/generate) with the user's own OpenAI key. It previously
// streamed from api.openai.com in the browser with a key nothing ever set. The server response is not
// streamed: the full reply is delivered as a single chunk/token.
const tierFor = (model: string): 'default' | 'advanced' =>
  /sol|^gpt-4o$|^gpt-4$|^gpt-4\.1$|^o3$/.test(model) ? 'advanced' : 'default';

export const useOpenAIStream = () => {
  const streamChat = async (
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    onChunk: (chunk: string) => void,
    onComplete: () => void,
    onError: (error: Error) => void,
    model: string = 'gpt-6-luna'
  ) => {
    try {
      const system = messages
        .filter((m) => m.role === 'system')
        .map((m) => m.content)
        .join('\n\n');
      const prompt = messages
        .filter((m) => m.role !== 'system')
        .map((m) => `${m.role}: ${m.content}`)
        .join('\n\n');
      const { content } = await generateAI({ prompt, system: system || undefined, tier: tierFor(model), maxTokens: 1000 });
      if (content) onChunk(content);
      onComplete();
    } catch (error) {
      onError(error as Error);
    }
  };

  const streamChatCompletion = async (
    userMessage: string,
    systemPrompt: string,
    onToken: (token: string) => void,
    model: string = 'gpt-6-luna'
  ): Promise<string> => {
    const { content } = await generateAI({
      prompt: userMessage,
      system: systemPrompt,
      tier: tierFor(model),
      maxTokens: 2000,
    });
    if (content) onToken(content);
    return content;
  };

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
