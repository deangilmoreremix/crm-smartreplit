import { AIRequest, AIResponse, AIProvider, ProviderConfig } from '../types';
import { BaseProviderAdapter } from './base-adapter';
import { CustomProvider } from './custom-provider-manager';

export class CustomProviderAdapter extends BaseProviderAdapter {
  private customProvider: CustomProvider;

  constructor(provider: AIProvider, config: ProviderConfig) {
    super(provider, config);
    this.customProvider = provider as CustomProvider;
  }

  async chat(request: AIRequest): Promise<AIResponse> {
    this.validateRequest(request);

    const data = this.buildRequestData(request);
    const endpoint = this.customProvider.customConfig.chatEndpoint;

    const response = await this.makeRequest(endpoint, data);
    return this.parseResponse(response);
  }

  async listModels(): Promise<string[]> {
    if (!this.customProvider.customConfig.modelsEndpoint) {
      return this.customProvider.models.map((m) => m.id);
    }

    try {
      const response = await this.makeRequest(this.customProvider.customConfig.modelsEndpoint, {});
      return this.parseModelsResponse(response);
    } catch {
      return this.customProvider.models.map((m) => m.id);
    }
  }

  private buildRequestData(request: AIRequest): any {
    const config = this.customProvider.customConfig;

    switch (config.responseFormat) {
      case 'openai':
        return {
          model: this.normalizeModelId(request.model),
          messages: request.messages,
          temperature: request.temperature ?? 0.7,
          max_tokens: request.maxTokens,
          stream: request.stream ?? false,
        };

      case 'anthropic':
        return {
          model: this.normalizeModelId(request.model),
          max_tokens: request.maxTokens || 4096,
          temperature: request.temperature ?? 0.7,
          messages: request.messages,
          stream: request.stream ?? false,
        };

      case 'custom':
        // For custom formats, use OpenAI as default
        return {
          model: this.normalizeModelId(request.model),
          messages: request.messages,
          temperature: request.temperature ?? 0.7,
          max_tokens: request.maxTokens,
          stream: request.stream ?? false,
        };

      default:
        throw new Error(`Unsupported response format: ${config.responseFormat}`);
    }
  }

  private parseResponse(response: any): AIResponse {
    const config = this.customProvider.customConfig;

    switch (config.responseFormat) {
      case 'openai':
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
            promptTokens: response.usage?.prompt_tokens || 0,
            completionTokens: response.usage?.completion_tokens || 0,
            totalTokens: response.usage?.total_tokens || 0,
          },
          finishReason: response.choices[0]?.finish_reason || 'stop',
        };

      case 'anthropic':
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

      case 'custom':
        // For custom formats, try to parse as OpenAI format
        return this.parseResponse({ ...response, responseFormat: 'openai' });

      default:
        throw new Error(`Unsupported response format: ${config.responseFormat}`);
    }
  }

  private parseModelsResponse(response: any): string[] {
    // Try common response formats
    if (response.data && Array.isArray(response.data)) {
      return response.data.map((model: any) => model.id || model.name || model);
    }

    if (response.models && Array.isArray(response.models)) {
      return response.models.map((model: any) => model.id || model.name || model);
    }

    if (Array.isArray(response)) {
      return response.map((model: any) => model.id || model.name || model);
    }

    return [];
  }

  protected getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const config = this.customProvider.customConfig;

    if (this.config.apiKey) {
      switch (config.authType) {
        case 'bearer':
          headers['Authorization'] = `Bearer ${this.config.apiKey}`;
          break;
        case 'api-key':
          headers[config.authHeader || 'X-API-Key'] = this.config.apiKey;
          break;
        case 'basic':
          headers['Authorization'] = `Basic ${btoa(this.config.apiKey)}`;
          break;
        case 'custom':
          // Custom auth headers would be handled in customHeaders
          break;
      }
    }

    // Add custom headers
    if (config.customHeaders) {
      Object.assign(headers, config.customHeaders);
    }

    return headers;
  }
}
