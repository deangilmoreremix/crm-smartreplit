import { AIProvider, AIRequest, AIResponse, ProviderConfig } from '../types';

export abstract class BaseProviderAdapter {
  protected provider: AIProvider;
  protected config: ProviderConfig;

  constructor(provider: AIProvider, config: ProviderConfig) {
    this.provider = provider;
    this.config = config;
  }

  abstract chat(request: AIRequest): Promise<AIResponse>;
  abstract listModels(): Promise<string[]>;

  protected getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    return headers;
  }

  protected async makeRequest(endpoint: string, data: any): Promise<any> {
    const url = `${this.provider.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(this.config.timeout || 30000),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  protected normalizeModelId(modelId: string): string {
    // Handle provider-specific model ID formatting
    if (this.provider.type === 'aggregator') {
      // For aggregators like OpenRouter, the model ID might include provider prefix
      return modelId;
    }
    return modelId;
  }

  protected validateRequest(request: AIRequest): void {
    if (!request.model) {
      throw new Error('Model is required');
    }

    if (!request.messages || request.messages.length === 0) {
      throw new Error('Messages are required');
    }

    // Validate model is supported by this provider
    const supportedModel = this.provider.models.find((m) => m.id === request.model);
    if (!supportedModel) {
      throw new Error(`Model ${request.model} is not supported by ${this.provider.name}`);
    }
  }
}
