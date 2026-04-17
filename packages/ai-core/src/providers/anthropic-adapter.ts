import { AIRequest, AIResponse } from '../types';
import { BaseProviderAdapter } from './base-adapter';

export class AnthropicAdapter extends BaseProviderAdapter {
  async chat(request: AIRequest): Promise<AIResponse> {
    this.validateRequest(request);

    const data = {
      model: this.normalizeModelId(request.model),
      max_tokens: request.maxTokens || 4096,
      temperature: request.temperature ?? 0.7,
      messages: request.messages,
      stream: request.stream ?? false,
    };

    const response = await this.makeRequest('/messages', data);

    return {
      id: response.id,
      model: response.model,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: response.content?.[0]?.text || '',
          },
          finishReason: response.stop_reason || 'stop',
        },
      ],
      usage: {
        promptTokens: response.usage?.input_tokens || 0,
        completionTokens: response.usage?.output_tokens || 0,
        totalTokens: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0),
      },
      finishReason: response.stop_reason || 'stop',
    };
  }

  async listModels(): Promise<string[]> {
    const response = await this.makeRequest('/models', {});
    return response.data?.map((model: any) => model.id) || [];
  }
}
