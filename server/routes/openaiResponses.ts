import { Router, Request, Response } from 'express';
import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { userApiKeys } from '../../shared/schema';
import { requireAuth } from './auth';

const router = Router();

interface ResponsesModel {
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

async function getUserOpenAIResponses(userId: string): Promise<{ apiKey: string; model: string } | null> {
  if (!db) return null;

  const keyRecord = await db.query.userApiKeys.findFirst({
    where: and(
      eq(userApiKeys.userId, userId),
      eq(userApiKeys.provider, 'openai'),
      eq(userApiKeys.isActive, true)
    ),
    orderBy: (userApiKeys, { desc }) => [desc(userApiKeys.isDefault)],
  });

  if (!keyRecord || !keyRecord.apiKey) return null;

  return {
    apiKey: keyRecord.apiKey,
    model: keyRecord.model || 'gpt-4.1',
  };
}

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

export async function createResponse(userId: string, input: string, model?: string): Promise<any> {
  const userKeyData = await getUserOpenAIResponses(userId);
  if (!userKeyData) {
    throw new Error('No active OpenAI API key configured. Add your key in Settings > API Keys.');
  }

  const selectedModel = model || userKeyData.model || 'gpt-4.1';
  const OpenAI = (await import('openai')).default;
  const openai = new OpenAI({ apiKey: userKeyData.apiKey });

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

export async function getAvailableModels(): Promise<ResponsesModel[]> {
  return RESPONSES_API_MODELS;
}

router.post('/api/openai/responses', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { input, model } = req.body;

    if (!input || typeof input !== 'string' || input.trim().length === 0) {
      return res.status(400).json({ error: 'Input string is required' });
    }

    const response = await createResponse(userId, input, model);
    res.json(response);
  } catch (error: any) {
    console.error('Responses API endpoint error:', error);
    res.status(500).json({
      error: 'Failed to generate response',
      message: error?.message || 'Unknown error',
    });
  }
});

router.get('/api/openai/models', requireAuth, async (req: Request, res: Response) => {
  try {
    const models = await getAvailableModels();
    res.json({ models });
  } catch (error) {
    console.error('Models endpoint error:', error);
    res.status(500).json({ error: 'Failed to fetch available models', models: RESPONSES_API_MODELS });
  }
});

router.post('/api/openai/responses/stream', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { input, model } = req.body;

    if (!input || typeof input !== 'string' || input.trim().length === 0) {
      return res.status(400).json({ error: 'Input string is required' });
    }

    const userKeyData = await getUserOpenAIResponses(userId);
    if (!userKeyData) {
      return res.status(400).json({
        error: 'No active OpenAI API key configured. Add your key in Settings > API Keys.',
      });
    }

    const selectedModel = model || userKeyData.model || 'gpt-4.1';
    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({ apiKey: userKeyData.apiKey });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      const stream = await openai.responses.create({
        model: selectedModel,
        input,
        stream: true,
      });

      for await (const event of stream) {
        if (res.writable) {
          res.write(`data: ${JSON.stringify(event)}\n\n`);
        }
      }
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (streamError: any) {
      res.write(`data: ${JSON.stringify({ error: streamError?.message || 'Stream error' })}\n\n`);
      res.end();
    }
  } catch (error: any) {
    console.error('Streaming responses endpoint error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Failed to stream response',
        message: error?.message || 'Unknown error',
      });
    } else {
      res.end();
    }
  }
});

export default router;
