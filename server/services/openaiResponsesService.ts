import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { userApiKeys } from '../../shared/schema';

export interface ResponsesModel {
  id: string;
  name: string;
  description: string;
  pricing: string;
  contextLength: string;
}

const RESPONSES_API_MODELS: ResponsesModel[] = [
  {
    id: 'gpt-4.1',
    name: 'GPT-4.1',
    description: 'Most capable GPT-4.1 model for complex reasoning, coding, and instruction-following',
    pricing: '$2.00 / $8.00 per 1M tokens',
    contextLength: '1M tokens',
  },
  {
    id: 'gpt-4.1-mini',
    name: 'GPT-4.1 Mini',
    description: 'Balanced GPT-4.1 model optimized for speed and cost-efficiency',
    pricing: '$0.40 / $1.60 per 1M tokens',
    contextLength: '1M tokens',
  },
  {
    id: 'gpt-4.1-nano',
    name: 'GPT-4.1 Nano',
    description: 'Fastest, most affordable GPT-4.1 model for lightweight tasks and high throughput',
    pricing: '$0.10 / $0.40 per 1M tokens',
    contextLength: '1M tokens',
  },
  {
    id: 'o3',
    name: 'o3',
    description: 'Advanced reasoning model with extended thinking for math, science, and complex problem-solving',
    pricing: '$2.00 / $8.00 per 1M tokens',
    contextLength: '200K tokens',
  },
  {
    id: 'o4-mini',
    name: 'o4-mini',
    description: 'Fast, cost-efficient reasoning model ideal for coding, math, and agentic tasks at scale',
    pricing: '$0.60 / $2.40 per 1M tokens',
    contextLength: '200K tokens',
  },
];

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

    const keyRecord = await db.query.userApiKeys.findFirst({
      where: and(
        eq(userApiKeys.userId, userId),
        eq(userApiKeys.provider, 'openai'),
        eq(userApiKeys.isActive, true)
      ),
      orderBy: (userApiKeys, { desc }) => [desc(userApiKeys.isDefault)],
    });

    if (!keyRecord || !keyRecord.apiKey) {
      throw new Error('No active OpenAI API key configured. Add your key in Settings > API Keys.');
    }

    const selectedModel = model || keyRecord.model || 'gpt-4.1';
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
