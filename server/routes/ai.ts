/**
 * AI Routes - All AI/OpenAI related endpoints
 * Uses user-provided API keys from the database instead of global keys
 */

import type { Express, Request, Response } from 'express';
import { requireAuth } from './auth';
import { requireEntitlement } from '../middleware/entitlements';
import { FeatureKey } from '../types/entitlements';
import {
  createUserClient,
  respondJson,
  respondStream,
  respondText,
  respondWithTools,
} from '../services/openaiClient';
import { tierModel, SELECTABLE_MODELS, imageModel, ImageQuality, ImageComplexity } from '../../shared/aiModels';
import { generateImages, editImage, toDataUrl, type GeneratedImage } from '../services/openaiImages';
import { getUserOpenAIKey } from '../services/openaiUserKey';
import multer from 'multer';

// Helper: Get user's OpenAI key via the canonical user_api_keys_openai view
async function getUserApiKey(userId: string, _provider: 'openai'): Promise<{ apiKey: string; model: string | null } | null> {
  return getUserOpenAIKey(userId);
}

// Helper: Create OpenAI client from user's key (model is the user's saved override, if any)
export async function createUserOpenAIClient(userId: string): Promise<{ client: any; model: string | null } | null> {
  const keyData = await getUserApiKey(userId, 'openai');
  if (!keyData) return null;

  return { client: createUserClient(keyData.apiKey), model: keyData.model || null };
}

export function registerAIRoutes(app: Express) {
  // Middleware to protect AI endpoints - require auth + ai_tools entitlement
  const requireAITools = [requireAuth(), requireEntitlement(FeatureKey.AI_TOOLS)];

  // AI API Status Check - uses user's own API keys
  app.get('/api/openai/status', requireAuth(), async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const results = {
      openai: {
        available: false,
        model: 'none',
        error: null as string | null,
        version: null as string | null,
      },
    };

    // Test OpenAI with user's key
    try {
      const openaiData = await createUserOpenAIClient(userId);
      if (!openaiData) {
        results.openai = {
          available: false,
          model: 'none',
          error: 'No OpenAI API key configured. Add your key in Settings > API Keys.',
          version: null,
        };
      } else {
        // Try user's preferred model first, then fallback
        const modelsToTry = [openaiData.model, tierModel('fast'), tierModel('default')].filter(
          (m): m is string => !!m
        );
        let success = false;
        for (const model of modelsToTry) {
          try {
            await respondText({
              client: openaiData.client,
              model,
              input: 'test',
              maxOutputTokens: 16,
              effort: 'none',
            });
            results.openai = {
              available: true,
              model,
              error: null,
              version: model.match(/^gpt-(\d+(?:\.\d+)?[a-z]*)/i)?.[1] ?? model,
            };
            success = true;
            break;
          } catch {
            continue;
          }
        }
        if (!success) {
          results.openai = {
            available: false,
            model: 'none',
            error: 'OpenAI API key is invalid or model unavailable',
            version: null,
          };
        }
      }
    } catch (error: any) {
      results.openai = {
        available: false,
        model: 'none',
        error: error?.message || 'OpenAI check failed',
        version: null,
      };
    }

    const anyWorking = results.openai.available;

    const capabilities: string[] = [];
    if (results.openai.available) {
      capabilities.push(`OpenAI (${results.openai.model})`);
    }
    if (!anyWorking) {
      capabilities.push('Configure your API keys in Settings to enable AI features');
    }

    res.json({
      configured: anyWorking,
      model: results.openai.model,
      status: anyWorking ? 'ready' : 'needs_api_keys',
      openai: results.openai,
      capabilities,
    });
  });

  // OpenAI Test
  app.post(
    '/api/openai/test',
    ...requireAITools,
    async (req: Request, res: Response) => {
      const userId = (req as any).userId;
      try {
        const openaiData = await createUserOpenAIClient(userId);
        if (!openaiData) {
          return res.status(400).json({
            error: 'No OpenAI API key configured',
            message: 'Please add your OpenAI API key in Settings > API Keys',
          });
        }
        const response = await respondText({
          client: openaiData.client,
          model: openaiData.model ?? undefined,
          tier: 'fast',
          input: 'Generate a business insight',
          maxOutputTokens: 50,
          effort: 'none',
        });
        res.json({
          success: true,
          model: response.model,
          output: response.text,
        });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    }
  );

  // Embeddings
  app.post(
    '/api/openai/embeddings',
    ...requireAITools,
    async (req: Request, res: Response) => {
      const userId = (req as any).userId;
      try {
        const { text, model = 'text-embedding-3-small' } = req.body;
        if (!text) return res.status(400).json({ error: 'Text required' });

        const openaiData = await createUserOpenAIClient(userId);
        if (!openaiData) {
          return res.status(400).json({
            error: 'No OpenAI API key configured',
            message: 'Please add your OpenAI API key in Settings > API Keys',
          });
        }

        const response = await openaiData.client.embeddings.create({
          model,
          input: text,
          encoding_format: 'float',
        });
        res.json({ success: true, embedding: response.data[0].embedding, model });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    }
  );

  // Image Generation (GPT Image 2.6, Image API). Returns base64 data URLs; there is no hosted url.
  const imageUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });
  const imageResponse = (images: GeneratedImage[], model: string) => {
    const list = images.map((img) => ({ url: toDataUrl(img), b64_json: img.b64 }));
    return { success: true, images: list, url: list[0].url, data: list, model };
  };
  const imageParams = (body: any) => ({
    model: typeof body.model === 'string' && body.model.startsWith('gpt-image-') ? body.model : undefined,
    size: typeof body.size === 'string' ? body.size : undefined,
    quality: typeof body.quality === 'string' ? (body.quality as ImageQuality) : undefined,
    complexity: typeof body.complexity === 'string' ? (body.complexity as ImageComplexity) : undefined,
    background: body.background as any,
    outputFormat: ['png', 'jpeg', 'webp', 'svg', 'gif'].includes(body.output_format) ? body.output_format : undefined,
    n: body.n !== undefined ? Number(body.n) : undefined,
  });

  app.post(
    '/api/openai/images/generate',
    ...requireAITools,
    async (req: Request, res: Response) => {
      const userId = (req as any).userId;
      try {
        const { prompt } = req.body;
        if (!prompt) return res.status(400).json({ error: 'Prompt required' });

        const openaiData = await createUserOpenAIClient(userId);
        if (!openaiData) {
          return res.status(400).json({
            error: 'No OpenAI API key configured',
            message: 'Please add your OpenAI API key in Settings > API Keys',
          });
        }

        const params = imageParams(req.body);
        const images = await generateImages({ prompt, ...params, userId, client: openaiData.client });
        res.json(imageResponse(images, imageModel(params.model)));
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    }
  );

  // Image edit / variation (multipart: image[, mask | markup], prompt)
  for (const route of ['edit', 'variation'] as const) {
    app.post(
      `/api/openai/images/${route}`,
      ...requireAITools,
      imageUpload.fields([
        { name: 'image', maxCount: 4 },
        { name: 'mask', maxCount: 1 },
        { name: 'markup', maxCount: 1 },
      ]),
      async (req: Request, res: Response) => {
        const userId = (req as any).userId;
        try {
          const files = (req.files || {}) as Record<string, Express.Multer.File[]>;
          if (!files.image?.length) return res.status(400).json({ error: 'Image required' });
          const prompt =
            req.body.prompt ||
            (route === 'variation' ? 'Create a variation of this image, keeping the same subject and style.' : '');
          if (!prompt) return res.status(400).json({ error: 'Prompt required' });

          const openaiData = await createUserOpenAIClient(userId);
          if (!openaiData) {
            return res.status(400).json({
              error: 'No OpenAI API key configured',
              message: 'Please add your OpenAI API key in Settings > API Keys',
            });
          }

          const toBuf = (f: Express.Multer.File) => ({
            buffer: f.buffer,
            mimeType: f.mimetype,
            filename: f.originalname,
          });
          const params = imageParams(req.body);
          const images = await editImage({
            prompt,
            ...params,
            images: files.image.map(toBuf),
            mask: files.mask?.[0] ? toBuf(files.mask[0]) : undefined,
            markup: files.markup?.[0] ? toBuf(files.markup[0]) : undefined,
            userId,
            client: openaiData.client,
          });
          res.json(imageResponse(images, imageModel(params.model)));
        } catch (error: any) {
          res.status(500).json({ error: error.message });
        }
      }
    );
  }

  // Smart Greeting
  app.post(
    '/api/openai/smart-greeting',
    ...requireAITools,
    async (req: Request, res: Response) => {
      const userId = (req as any).userId;
      const { userMetrics, timeOfDay } = req.body;

      const openaiData = await createUserOpenAIClient(userId);
      if (!openaiData) {
        return res.json({
          greeting: `Good ${timeOfDay}! You have ${userMetrics?.totalDeals || 0} deals.`,
          insight: userMetrics?.totalValue > 50000 ? 'Strong momentum' : 'Growing steadily',
          source: 'fallback',
          needsApiKey: true,
        });
      }

      try {
        const response = await respondJson({
          client: openaiData.client,
          model: openaiData.model ?? undefined,
          tier: 'fast',
          instructions:
            'You are an expert business advisor. Generate personalized, strategic greetings that provide actionable insights based on user data.',
          input: `Generate a smart greeting for ${timeOfDay}. User metrics: ${JSON.stringify(userMetrics)}. Provide both a greeting and a strategic insight in JSON format.`,
          json: true,
          effort: 'none',
          temperature: 0.7,
          maxOutputTokens: 300,
        });
        res.json({
          ...response.data,
          source: response.model,
        });
      } catch (error) {
        res.json({
          greeting: `Good ${timeOfDay}!`,
          insight: 'Your pipeline is growing',
          source: 'fallback',
        });
      }
    }
  );

  // KPI Analysis
  app.post(
    '/api/openai/kpi-analysis',
    ...requireAITools,
    async (req: Request, res: Response) => {
      const userId = (req as any).userId;
      const { historicalData, currentMetrics } = req.body;

      const openaiData = await createUserOpenAIClient(userId);
      if (!openaiData) {
        return res.json({
          summary: 'Configure your OpenAI API key in Settings > API Keys for KPI analysis',
          recommendations: ['Add OpenAI API key in Settings'],
          needsApiKey: true,
        });
      }

      try {
        const response = await respondJson({
          client: openaiData.client,
          model: openaiData.model ?? undefined,
          tier: 'default',
          instructions:
            'You are an expert business analyst. Analyze KPI trends and provide strategic insights with actionable recommendations.',
          input: `Analyze these KPI trends: Historical: ${JSON.stringify(historicalData)}, Current: ${JSON.stringify(currentMetrics)}. Provide summary, trends, predictions, and recommendations in JSON format.`,
          json: true,
          effort: 'none',
          temperature: 0.3,
          maxOutputTokens: 800,
        });
        res.json(response.data);
      } catch (error) {
        res.json({ summary: 'Analysis unavailable', recommendations: ['Retry'] });
      }
    }
  );

  // Deal Intelligence
  app.post(
    '/api/openai/deal-intelligence',
    ...requireAITools,
    async (req: Request, res: Response) => {
      const userId = (req as any).userId;
      const { dealData, contactHistory, marketContext } = req.body;

      const openaiData = await createUserOpenAIClient(userId);
      if (!openaiData) {
        return res.json({
          probability_score: 65,
          risk_level: 'medium',
          recommendations: ['Configure OpenAI API key in Settings'],
          needsApiKey: true,
        });
      }

      try {
        const response = await respondJson({
          client: openaiData.client,
          model: openaiData.model ?? undefined,
          tier: 'default',
          instructions:
            'You are an expert sales strategist. Provide comprehensive deal intelligence including win probability, risk factors, and strategic recommendations.',
          input: `Analyze this deal: ${JSON.stringify(dealData)}. Contact history: ${JSON.stringify(contactHistory)}. Market context: ${JSON.stringify(marketContext)}. Provide probability_score, risk_level, key_factors, recommendations, confidence_level, estimated_close_days, and value_optimization in JSON format.`,
          json: true,
          effort: 'none',
          temperature: 0.2,
          maxOutputTokens: 600,
        });
        res.json(response.data);
      } catch (error) {
        res.json({ probability_score: 65, risk_level: 'medium', recommendations: ['Retry'] });
      }
    }
  );

  // Business Intelligence
  app.post(
    '/api/openai/business-intelligence',
    ...requireAITools,
    async (req: Request, res: Response) => {
      const userId = (req as any).userId;
      const { businessData, marketContext, objectives } = req.body;

      const openaiData = await createUserOpenAIClient(userId);
      if (!openaiData) {
        return res.json({
          market_insights: ['Configure OpenAI API key in Settings'],
          strategic_recommendations: ['Add your API key in Settings > API Keys'],
          needsApiKey: true,
        });
      }

      try {
        const response = await respondJson({
          client: openaiData.client,
          model: openaiData.model ?? undefined,
          tier: 'default',
          instructions:
            'You are a senior business consultant. Generate strategic business intelligence including market insights, competitive advantages, risk factors, growth opportunities, and strategic recommendations.',
          input: `Generate business intelligence for: ${JSON.stringify(businessData)}. Market context: ${JSON.stringify(marketContext)}. Objectives: ${JSON.stringify(objectives)}. Provide market_insights, competitive_advantages, risk_factors, growth_opportunities, and strategic_recommendations in JSON format.`,
          json: true,
          effort: 'none',
          temperature: 0.4,
          maxOutputTokens: 1000,
        });
        res.json(response.data);
      } catch (error) {
        res.json({ market_insights: ['Retry analysis'] });
      }
    }
  );

  // AI Respond endpoint
  app.post(
    '/api/respond',
    ...requireAITools,
    async (req: Request, res: Response) => {
      const userId = (req as any).userId;
      try {
        const {
          prompt,
          imageUrl,
          schema,
          temperature = 0.4,
          max_output_tokens = 2048,
          forceToolName,
        } = req.body;

        const openaiData = await createUserOpenAIClient(userId);
        if (!openaiData) {
          return res.status(400).json({
            error: 'No OpenAI API key configured',
            message: 'Please add your OpenAI API key in Settings > AI Keys to use AI features.',
            needsApiKey: true,
          });
        }

        const userPrompt = imageUrl ? `${prompt}\n\nImage URL: ${imageUrl}` : prompt;

        const result = await respondWithTools({
          client: openaiData.client,
          model: openaiData.model ?? undefined,
          tier: 'deep',
          instructions: 'You are a helpful sales + ops assistant for white-label CRM applications.',
          input: userPrompt,
          effort: 'none',
          temperature,
          maxOutputTokens: max_output_tokens,
          json: schema ? true : undefined,
          tools: [
            {
              type: 'function',
              function: {
                name: 'analyzeBusinessData',
                description: 'Analyze business data and provide insights',
                parameters: {
                  type: 'object',
                  properties: {
                    dataType: { type: 'string' },
                    analysisType: { type: 'string' },
                    timeRange: { type: 'string' },
                  },
                  required: ['dataType'],
                },
              },
            },
            {
              type: 'function',
              function: {
                name: 'generateRecommendations',
                description: 'Generate business recommendations based on data',
                parameters: {
                  type: 'object',
                  properties: {
                    context: { type: 'string' },
                    goals: { type: 'array', items: { type: 'string' } },
                    constraints: { type: 'array', items: { type: 'string' } },
                  },
                },
              },
            },
          ],
          toolChoice: forceToolName
            ? { type: 'function', function: { name: forceToolName } }
            : 'auto',
          handlers: {
            analyzeBusinessData: (args) =>
              executeWLTool({ function: { name: 'analyzeBusinessData', arguments: args } }),
            generateRecommendations: (args) =>
              executeWLTool({ function: { name: 'generateRecommendations', arguments: args } }),
          },
        });

        const outputPayload = [
          {
            content: [
              {
                type: 'output_text',
                text: result.text,
              },
            ],
          },
        ];

        // Handle tool calls
        if (result.toolCalls.length > 0) {
          return res.json({
            output_text: result.text,
            output: outputPayload,
            tool_calls: result.toolCalls.map((tc) => ({
              type: 'function',
              function: { name: tc.name, arguments: tc.arguments },
            })),
            continued: true,
          });
        }

        res.json({
          output_text: result.text,
          output: outputPayload,
          model: result.response?.model,
          usage: result.usage,
        });
      } catch (error: any) {
        console.error('AI API error:', error);
        res.status(500).json({
          error: 'Failed to process AI request',
          message: error.message,
        });
      }
    }
  );

  // Streaming endpoint
  app.post(
    '/api/stream',
    ...requireAITools,
    async (req: Request, res: Response) => {
      const userId = (req as any).userId;
      try {
        const { prompt, model: requestedModel, temperature = 0.4, max_output_tokens = 2048 } = req.body;
        // Only allow known models from the selector; otherwise use the user's saved model / default tier.
        const selectedModel = SELECTABLE_MODELS.find((m) => m.id === requestedModel)?.id;

        const openaiData = await createUserOpenAIClient(userId);
        if (!openaiData) {
          return res.status(400).json({
            error: 'No OpenAI API key configured',
            message: 'Please add your OpenAI API key in Settings > AI Keys to use streaming features.',
            needsApiKey: true,
          });
        }

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        for await (const ev of respondStream({
          client: openaiData.client,
          model: selectedModel ?? openaiData.model ?? undefined,
          tier: 'default',
          input: prompt,
          effort: 'none',
          temperature,
          maxOutputTokens: max_output_tokens,
        })) {
          if (ev.type === 'delta') {
            res.write(`data: ${JSON.stringify({ content: ev.text })}\n\n`);
          } else if (ev.type === 'error') {
            res.write(`data: ${JSON.stringify({ error: ev.message })}\n\n`);
          }
        }

        res.write('data: [DONE]\n\n');
        res.end();
      } catch (error: any) {
        console.error('Streaming error:', error);
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
      }
    }
  );

  // Tool execution function for WL apps
  async function executeWLTool(tc: any): Promise<string> {
    const { name, arguments: args } = tc.function;
    try {
      if (name === 'analyzeBusinessData') {
        const { dataType, analysisType, timeRange } = args || {};
        return JSON.stringify({
          ok: true,
          analysis: `Analysis of ${dataType} for ${timeRange}`,
          insights: [`Key insight 1 for ${analysisType}`, `Key insight 2 for ${analysisType}`],
          recommendations: [`Recommendation 1`, `Recommendation 2`],
        });
      }
      if (name === 'generateRecommendations') {
        const { context, goals, constraints } = args || {};
        return JSON.stringify({
          ok: true,
          recommendations:
            goals?.map(
              (goal: string, i: number) =>
                `For ${goal}: Action ${i + 1} considering ${constraints?.[i] || 'no constraints'}`
            ) || [],
          context: context,
        });
      }
      return JSON.stringify({ ok: false, error: `Unknown tool: ${name}` });
    } catch (e: any) {
      return JSON.stringify({ ok: false, error: e?.message || 'Tool error' });
    }
  }

  console.log('✅ AI routes registered (user API key mode)');
}
