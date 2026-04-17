import { AIRequest, AIResponse } from '../types';
import { BaseProviderAdapter } from './base-adapter';

export class OpenAIAdapter extends BaseProviderAdapter {
  async chat(request: AIRequest): Promise<AIResponse> {
    this.validateRequest(request);

    const data = {
      model: this.normalizeModelId(request.model),
      messages: request.messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens,
      stream: request.stream ?? false,
    };

    const response = await this.makeRequest('/chat/completions', data);

    return {
      id: response.id,
      model: response.model,
      choices: response.choices.map((choice: any) => ({
        index: choice.index,
        message: {
          role: choice.message.role,
          content: choice.message.content,
        },
        finishReason: choice.finish_reason,
      })),
      usage: {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens,
      },
      finishReason: response.choices[0]?.finish_reason || 'stop',
    };
  }

  async listModels(): Promise<string[]> {
    const response = await this.makeRequest('/models', {});
    return response.data.map((model: any) => model.id);
  }
}
