import { db } from '../db';
import { getUserOpenAIKey } from './openaiUserKey';
import { SELECTABLE_MODELS, tierModel } from '../../shared/aiModels';

export interface ResponsesModel {
  id: string;
  name: string;
  description: string;
  pricing: string;
  contextLength: string;
}

const RESPONSES_API_MODELS: ResponsesModel[] = SELECTABLE_MODELS.map((m) => ({
  id: m.id,
  name: m.label,
  description: m.description,
  pricing: '',
  contextLength: '',
}));

function extractResponseText(response: any): string {
  try {
    if (!response?.output || !Array.isArray(response.output)) {
      return JSON.stringify(response);
    }

    const textParts: string[] = [];
    for (const item of response.output) {
      if (item.type === 'message' && Array.isArray(item.content)) {
        for (const content of item.content) {
          if (content.type === 'output_text' && typeof content.text === 'string') {
            textParts.push(content.text);
          }
        }
      }
      if (item.type === 'output_text' && typeof item.text === 'string') {
        textParts.push(item.text);
      }
    }

    if (textParts.length > 0) return textParts.join('\n');
    return JSON.stringify(response.output);
  } catch {
    return JSON.stringify(response);
  }
}

export class OpenAIResponsesService {
  static async createResponse(userId: string, input: string, model?: string): Promise<any> {
    if (!db) {
      throw new Error('Database not available');
    }

    const keyRecord = await getUserOpenAIKey(userId);

    if (!keyRecord) {
      throw new Error('No active OpenAI API key configured. Add your key in Settings > API Keys.');
    }

    const selectedModel = model || keyRecord.model || tierModel('default');
    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({ apiKey: keyRecord.apiKey });

    try {
      const response = await openai.responses.create({
        model: selectedModel,
        input,
      });

      return {
        id: response.id,
        model: response.model || selectedModel,
        output: response.output,
        text: extractResponseText(response),
        usage: response.usage,
        status: response.status,
      };
    } catch (error: any) {
      console.error('OpenAI Responses API error:', error);
      throw new Error(error?.message || 'Failed to create OpenAI Responses API response');
    }
  }

  static async getAvailableModels(): Promise<ResponsesModel[]> {
    return RESPONSES_API_MODELS;
  }
}
