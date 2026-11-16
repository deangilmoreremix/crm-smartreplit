/**
 * AI Routes - All AI/OpenAI related endpoints
 * Uses user-provided API keys from the database instead of global keys
 */

import express, { type Express, type Request, type Response } from 'express';
import { toFile } from 'openai';
import { getUserOpenAIClient, NO_KEY_MESSAGE } from '../services/userOpenAI';
import { respond, toResult, generateImage, webSearchTool, type RespondResult } from '../services/openaiResponses';
import { ADVANCED_MODEL, IMAGE_MODEL, EMBEDDING_MODEL, TRANSCRIBE_MODEL } from '../services/openaiModels';
import { requireAuth } from './auth';
import { requireEntitlement } from '../middleware/entitlements';
import { FeatureKey } from '../types/entitlements';

// Per-user OpenAI clients (user's own key; no server fallback)
const createUserOpenAIClient = (userId: string) => getUserOpenAIClient(userId);

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
        const modelsToTry = [openaiData.model];
        let success = false;
        for (const model of modelsToTry) {
          try {
            await openaiData.client.chat.completions.create({
              model,
              messages: [{ role: 'user', content: 'test' }],
              max_tokens: 1,
            });
            results.openai = {
              available: true,
              model,
              error: null,
              version: model,
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

  // ---- OpenAI Responses API routes (all on the user's own key) ----

  const noKey = (res: Response) =>
    res.status(400).json({ error: 'No OpenAI API key configured', message: NO_KEY_MESSAGE, needsApiKey: true });

  const sendResult = (res: Response, result: RespondResult, model: string) =>
    res.json({
      success: true,
      content: result.text,
      data: result.data,
      sources: result.sources,
      responseId: result.id,
      status: result.status,
      model,
      usage: result.usage,
    });

  /** Prompt plus optional images (URLs / data URLs) and files ({ url } or { filename, data } base64 data URL). */
  const buildInput = (prompt: string, images?: string[], files?: Array<{ url?: string; filename?: string; data?: string }>) =>
    images?.length || files?.length
      ? [
          {
            role: 'user',
            content: [
              { type: 'input_text', text: prompt },
              ...(images || []).map((url) => ({ type: 'input_image', image_url: url })),
              ...(files || []).map((f) =>
                f.url ? { type: 'input_file', file_url: f.url } : { type: 'input_file', filename: f.filename, file_data: f.data }
              ),
            ],
          },
        ]
      : prompt;

  /** Shared body handling for /generate and /research. */
  const runRespond = async (req: Request, res: Response, research: boolean) => {
    const userId = (req as any).userId;
    try {
      const {
        prompt,
        system,
        json = false,
        schema,
        schemaName = 'result',
        tier = research ? 'advanced' : 'default',
        maxTokens = research ? 4000 : 2000,
        images,
        files,
        background = false,
      } = req.body || {};
      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: 'prompt is required' });
      }

      const openaiData = await createUserOpenAIClient(userId);
      if (!openaiData) return noKey(res);

      const model = tier === 'advanced' ? ADVANCED_MODEL : openaiData.model;
      const result = await respond(openaiData.client, {
        model,
        instructions: system ? String(system) : undefined,
        input: buildInput(prompt, images, files),
        json: schema ? { name: String(schemaName), schema } : Boolean(json),
        maxOutputTokens: maxTokens,
        // Web search is limited to research features (POST /api/ai/research)
        ...(research ? { tools: [webSearchTool()], include: ['web_search_call.action.sources'] } : {}),
        background: Boolean(background),
      });
      sendResult(res, result, model);
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message || 'AI request failed' });
    }
  };

  // Text / JSON / JSON Schema generation with optional image and file input (no web access)
  app.post('/api/ai/generate', ...requireAITools, (req: Request, res: Response) => runRespond(req, res, false));

  // Research with live web search and citations (social/contact research, enrichment, competitors, markets)
  app.post('/api/ai/research', ...requireAITools, (req: Request, res: Response) => runRespond(req, res, true));

  // Poll a background response (long research jobs exceed the function time limit)
  app.get('/api/ai/responses/:id', ...requireAITools, async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    try {
      const openaiData = await createUserOpenAIClient(userId);
      if (!openaiData) return noKey(res);
      const response = await (openaiData.client.responses as any).retrieve(req.params.id);
      sendResult(res, toResult(response, Boolean(response?.text?.format && response.text.format.type !== 'text')), response.model);
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message || 'Failed to fetch response' });
    }
  });

  // Image generation and editing with the image_generation tool
  app.post('/api/ai/image', ...requireAITools, async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    try {
      const { prompt, size, quality, images } = req.body || {};
      if (!prompt) return res.status(400).json({ error: 'prompt is required' });
      const openaiData = await createUserOpenAIClient(userId);
      if (!openaiData) return noKey(res);
      const { b64, responseId } = await generateImage(openaiData.client, {
        model: openaiData.model,
        prompt: String(prompt),
        size,
        quality,
        inputImages: Array.isArray(images) ? images : undefined,
      });
      res.json({ success: true, images: b64.map((b) => `data:image/png;base64,${b}`), responseId, model: IMAGE_MODEL });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message || 'Image generation failed' });
    }
  });

  // Speech to text (Audio API transcription). The body is the raw audio file (application/octet-stream,
  // up to 25 MB per OpenAI; Netlify functions accept about 6 MB), with ?filename=recording.webm.
  app.post(
    '/api/ai/transcribe',
    ...requireAITools,
    express.raw({ type: () => true, limit: '25mb' }),
    async (req: Request, res: Response) => {
      const userId = (req as any).userId;
      try {
        const audio = req.body;
        if (!Buffer.isBuffer(audio) || audio.length === 0) {
          return res.status(400).json({ error: 'Send the audio file as the request body' });
        }
        const filename = String(req.query.filename || 'audio.webm').replace(/[^\w.-]/g, '_');
        const openaiData = await createUserOpenAIClient(userId);
        if (!openaiData) return noKey(res);

        const transcription: any = await openaiData.client.audio.transcriptions.create({
          file: await toFile(audio, filename),
          model: TRANSCRIBE_MODEL,
          ...(req.query.prompt ? { prompt: String(req.query.prompt) } : {}),
        });
        res.json({ success: true, text: transcription.text || '', model: TRANSCRIBE_MODEL });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error?.message || 'Transcription failed' });
      }
    }
  );

  // Conversations (replace the retired Assistants API threads); turns are stored so context carries over
  app.post('/api/ai/conversations', ...requireAITools, async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    try {
      const openaiData = await createUserOpenAIClient(userId);
      if (!openaiData) return noKey(res);
      const conversation = await (openaiData.client as any).conversations.create({
        metadata: { app: 'smartcrm', ...(req.body?.title ? { title: String(req.body.title).slice(0, 512) } : {}) },
      });
      res.json({ success: true, conversationId: conversation.id });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message || 'Failed to create conversation' });
    }
  });

  app.post('/api/ai/conversations/:id/messages', ...requireAITools, async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    try {
      const { message, system, tier = 'default' } = req.body || {};
      if (!message) return res.status(400).json({ error: 'message is required' });
      const openaiData = await createUserOpenAIClient(userId);
      if (!openaiData) return noKey(res);
      const model = tier === 'advanced' ? ADVANCED_MODEL : openaiData.model;
      const result = await respond(openaiData.client, {
        model,
        instructions: system ? String(system) : undefined,
        input: String(message),
        conversation: req.params.id,
      });
      sendResult(res, result, model);
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message || 'Conversation request failed' });
    }
  });

  app.get('/api/ai/conversations/:id/messages', ...requireAITools, async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    try {
      const openaiData = await createUserOpenAIClient(userId);
      if (!openaiData) return noKey(res);
      const page = await (openaiData.client as any).conversations.items.list(req.params.id, { order: 'asc', limit: 100 });
      const messages = (page.data || [])
        .filter((item: any) => item.type === 'message')
        .map((item: any) => ({
          id: item.id,
          role: item.role,
          text: (item.content || []).map((c: any) => c.text || '').join(''),
        }));
      res.json({ success: true, messages });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message || 'Failed to load conversation' });
    }
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
        const response = await openaiData.client.chat.completions.create({
          model: openaiData.model,
          messages: [{ role: 'user', content: 'Generate a business insight' }],
          max_tokens: 50,
        });
        res.json({
          success: true,
          model: openaiData.model,
          output: response.choices[0].message.content,
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
        const { text, model = EMBEDDING_MODEL } = req.body;
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

  // Image Generation
  app.post(
    '/api/openai/images/generate',
    ...requireAITools,
    async (req: Request, res: Response) => {
      const userId = (req as any).userId;
      try {
        const { prompt, model = IMAGE_MODEL, size = '1024x1024' } = req.body;
        if (!prompt) return res.status(400).json({ error: 'Prompt required' });

        const openaiData = await createUserOpenAIClient(userId);
        if (!openaiData) {
          return res.status(400).json({
            error: 'No OpenAI API key configured',
            message: 'Please add your OpenAI API key in Settings > API Keys',
          });
        }

        const response = await openaiData.client.images.generate({ model, prompt, size, n: 1 });
        res.json({ success: true, data: response.data, model });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    }
  );

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
        const response = await openaiData.client.chat.completions.create({
          model: openaiData.model,
          messages: [
            {
              role: 'system',
              content:
                'You are an expert business advisor. Generate personalized, strategic greetings that provide actionable insights based on user data.',
            },
            {
              role: 'user',
              content: `Generate a smart greeting for ${timeOfDay}. User metrics: ${JSON.stringify(userMetrics)}. Provide both a greeting and a strategic insight in JSON format.`,
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.7,
          max_tokens: 300,
        });
        res.json({
          ...JSON.parse(response.choices[0].message.content || '{}'),
          source: openaiData.model,
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
        return res.status(400).json({ error: 'No OpenAI API key configured', message: NO_KEY_MESSAGE, needsApiKey: true });
      }

      try {
        const response = await openaiData.client.chat.completions.create({
          model: openaiData.model,
          messages: [
            {
              role: 'system',
              content:
                'You are an expert business analyst. Analyze KPI trends and provide strategic insights with actionable recommendations.',
            },
            {
              role: 'user',
              content: `Analyze these KPI trends: Historical: ${JSON.stringify(historicalData)}, Current: ${JSON.stringify(currentMetrics)}. Provide summary, trends, predictions, and recommendations in JSON format.`,
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3,
          max_tokens: 800,
        });
        res.json(JSON.parse(response.choices[0].message.content || '{}'));
      } catch (error) {
        res.status(500).json({ error: (error as any)?.message || 'KPI analysis failed' });
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
        return res.status(400).json({ error: 'No OpenAI API key configured', message: NO_KEY_MESSAGE, needsApiKey: true });
      }

      try {
        const response = await openaiData.client.chat.completions.create({
          model: openaiData.model,
          messages: [
            {
              role: 'system',
              content:
                'You are an expert sales strategist. Provide comprehensive deal intelligence including win probability, risk factors, and strategic recommendations.',
            },
            {
              role: 'user',
              content: `Analyze this deal: ${JSON.stringify(dealData)}. Contact history: ${JSON.stringify(contactHistory)}. Market context: ${JSON.stringify(marketContext)}. Provide probability_score, risk_level, key_factors, recommendations, confidence_level, estimated_close_days, and value_optimization in JSON format.`,
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2,
          max_tokens: 600,
        });
        res.json(JSON.parse(response.choices[0].message.content || '{}'));
      } catch (error) {
        res.status(500).json({ error: (error as any)?.message || 'Deal analysis failed' });
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
        return res.status(400).json({ error: 'No OpenAI API key configured', message: NO_KEY_MESSAGE, needsApiKey: true });
      }

      try {
        const response = await openaiData.client.chat.completions.create({
          model: openaiData.model,
          messages: [
            {
              role: 'system',
              content:
                'You are a senior business consultant. Generate strategic business intelligence including market insights, competitive advantages, risk factors, growth opportunities, and strategic recommendations.',
            },
            {
              role: 'user',
              content: `Generate business intelligence for: ${JSON.stringify(businessData)}. Market context: ${JSON.stringify(marketContext)}. Objectives: ${JSON.stringify(objectives)}. Provide market_insights, competitive_advantages, risk_factors, growth_opportunities, and strategic_recommendations in JSON format.`,
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.4,
          max_tokens: 1000,
        });
        res.json(JSON.parse(response.choices[0].message.content || '{}'));
      } catch (error) {
        res.status(500).json({ error: (error as any)?.message || 'Business intelligence failed' });
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
        } = req.body;

        const openaiData = await createUserOpenAIClient(userId);
        if (!openaiData) {
          return res.status(400).json({
            error: 'No OpenAI API key configured',
            message: NO_KEY_MESSAGE,
            needsApiKey: true,
          });
        }

        const messages: any[] = [
          {
            role: 'system',
            content: 'You are a helpful sales + ops assistant for white-label CRM applications.',
          },
          {
            role: 'user',
            // JSON mode requires the word "json" in the messages
            content:
              (imageUrl ? `${prompt}\n\nImage URL: ${imageUrl}` : prompt) +
              (schema ? `\n\nRespond with valid JSON matching this schema: ${JSON.stringify(schema)}` : ''),
          },
        ];

        const response = await openaiData.client.chat.completions.create({
          model: openaiData.model,
          messages,
          temperature,
          max_tokens: max_output_tokens,
          response_format: schema ? { type: 'json_object' } : undefined,
        });

        res.json({
          output_text: response.choices[0].message.content,
          output: [
            {
              content: [
                {
                  type: 'output_text',
                  text: response.choices[0].message.content,
                },
              ],
            },
          ],
          model: response.model,
          usage: response.usage,
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
        const { prompt, temperature = 0.4, max_output_tokens = 2048 } = req.body;

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

        const stream = await openaiData.client.chat.completions.create({
          model: openaiData.model,
          messages: [{ role: 'user', content: prompt }],
          temperature,
          max_tokens: max_output_tokens,
          stream: true,
        });

        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            res.write(`data: ${JSON.stringify({ content })}\n\n`);
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

  console.log('✅ AI routes registered (user API key mode)');
}
