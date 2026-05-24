/**
 * OpenAI Responses API Service
 * Uses the newer OpenAI Responses API for structured outputs
 * https://platform.openai.com/docs/guides/responses-api
 */

import { useApiStore } from '../store/apiStore';

export interface ResponseInput {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenAIResponseOptions {
  model?: string;
  input?: string | ResponseInput[];
  temperature?: number;
  maxOutputTokens?: number;
  stream?: boolean;
  structuredOutput?: Record<string, any>;
  tools?: Array<{
    type: 'function';
    name: string;
    description?: string;
    parameters?: Record<string, any>;
  }>;
}

export interface OpenAIResponse {
  id: string;
  model: string;
  content: string;
 finishReason: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  toolCalls?: Array<{
    id: string;
    name: string;
    arguments: string;
  }>;
  error?: string;
}

class OpenAIResponsesService {
  private baseUrl = 'https://api.openai.com/v1';
  private defaultModel = 'gpt-4o-mini';

  private getApiKey(): string | null {
    const apiStore = useApiStore.getState();
    return apiStore.apiKeys.openai || null;
  }

  /**
   * Create a response using OpenAI Responses API
   */
  async createResponse(options: OpenAIResponseOptions): Promise<OpenAIResponse> {
    const apiKey = this.getApiKey();
    
    if (!apiKey) {
      return {
        id: '',
        model: options.model || this.defaultModel,
        content: '',
        finishReason: 'error',
        error: 'OpenAI API key not configured. Please add your API key in Settings.',
      };
    }

    const model = options.model || this.defaultModel;
    let endpoint = `${this.baseUrl}/responses`;

    const requestBody: any = {
      model,
      input: typeof options.input === 'string' ? options.input : options.input,
      temperature: options.temperature ?? 0.7,
    };

    if (options.maxOutputTokens) {
      requestBody.max_output_tokens = options.maxOutputTokens;
    }

    if (options.structuredOutput) {
      requestBody.text = {
        format: {
          type: 'json_object',
          schema: options.structuredOutput,
        },
      };
    }

    if (options.tools && options.tools.length > 0) {
      requestBody.tools = options.tools;
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API error: ${response.status}`);
      }

      const data = await response.json();

      const content = data.output_text || 
                      data.output?.[0]?.content?.[0]?.text || 
                      JSON.stringify(data.output?.[0]?.content || data);

      return {
        id: data.id || '',
        model: data.model || model,
        content,
        finishReason: data.status || 'completed',
        usage: data.usage ? {
          inputTokens: data.usage.input_tokens || 0,
          outputTokens: data.usage.output_tokens || 0,
          totalTokens: data.usage.total_tokens || 0,
        } : undefined,
        toolCalls: data.output?.[0]?.content?.[0]?.tool_calls?.map((tc: any) => ({
          id: tc.id,
          name: tc.name || tc.function?.name,
          arguments: typeof tc.input === 'string' ? tc.input : JSON.stringify(tc.input),
        })),
      };
    } catch (error) {
      console.error('OpenAI Responses API error:', error);
      return {
        id: '',
        model,
        content: '',
        finishReason: 'error',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Create a streaming response
   */
  async *streamResponse(options: OpenAIResponseOptions): AsyncGenerator<string, void, unknown> {
    const apiKey = this.getApiKey();
    
    if (!apiKey) {
      yield 'Error: OpenAI API key not configured. Please add your API key in Settings.';
      return;
    }

    const model = options.model || this.defaultModel;
    const endpoint = `${this.baseUrl}/responses`;

    const requestBody: any = {
      model,
      input: typeof options.input === 'string' ? options.input : options.input,
      temperature: options.temperature ?? 0.7,
      stream: true,
    };

    if (options.maxOutputTokens) {
      requestBody.max_output_tokens = options.maxOutputTokens;
    }

    if (options.structuredOutput) {
      requestBody.text = {
        format: {
          type: 'json_object',
          schema: options.structuredOutput,
        },
      };
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to get response reader');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const textChunk = parsed.output_text || 
                               parsed.choices?.[0]?.delta?.content ||
                               parsed.data?.[0]?.content?.[0]?.text;
              if (textChunk) {
                yield textChunk;
              }
            } catch (e) {
              // Ignore incomplete chunks
            }
          }
        }
      }
    } catch (error) {
      console.error('OpenAI Responses streaming error:', error);
      yield `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  /**
   * Generate structured JSON output using Responses API
   */
  async generateStructured<T = any>(
    prompt: string,
    schema: Record<string, any>,
    options?: {
      model?: string;
      temperature?: number;
      systemPrompt?: string;
    }
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    const messages: ResponseInput[] = [];
    
    if (options?.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const response = await this.createResponse({
      model: options?.model,
      input: messages,
      temperature: options?.temperature ?? 0.3,
      maxOutputTokens: 2048,
      structuredOutput: schema,
    });

    if (response.error) {
      return { success: false, error: response.error };
    }

    try {
      const parsed = JSON.parse(response.content);
      return { success: true, data: parsed };
    } catch (e) {
      return { success: false, error: 'Failed to parse JSON response' };
    }
  }
}

export const openAIResponsesService = new OpenAIResponsesService();
export default openAIResponsesService;