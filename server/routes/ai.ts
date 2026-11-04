/**
 * AI Routes - All AI/OpenAI related endpoints
 * Uses user-provided API keys from the database instead of global keys
 */

import type { Express, Request, Response } from 'express';
import { getUserOpenAIClient, NO_KEY_MESSAGE } from '../services/userOpenAI';
import { ADVANCED_MODEL, IMAGE_MODEL, EMBEDDING_MODEL } from '../services/openaiModels';
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

  // Generic text/JSON generation used by the client AI tools (replaces the former Gemini services)
  app.post(
    '/api/ai/generate',
    ...requireAITools,
    async (req: Request, res: Response) => {
      const userId = (req as any).userId;
      try {
        const { prompt, system, json = false, tier = 'default', maxTokens = 2000 } = req.body || {};
        if (!prompt || typeof prompt !== 'string') {
          return res.status(400).json({ error: 'prompt is required' });
        }

        const openaiData = await createUserOpenAIClient(userId);
        if (!openaiData) {
          return res.status(400).json({ error: 'No OpenAI API key configured', message: NO_KEY_MESSAGE, needsApiKey: true });
        }

        const model = tier === 'advanced' ? ADVANCED_MODEL : openaiData.model;
        const response = await openaiData.client.chat.completions.create({
          model,
          messages: [
            ...(system ? [{ role: 'system' as const, content: String(system) }] : []),
            // json_object mode requires the word "json" in the messages
            { role: 'user' as const, content: json ? `${prompt}\n\nRespond with valid JSON only.` : prompt },
          ],
          max_tokens: maxTokens,
          ...(json ? { response_format: { type: 'json_object' as const } } : {}),
        });

        res.json({ success: true, content: response.choices[0]?.message?.content || '', model, usage: response.usage });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error?.message || 'AI request failed' });
      }
    }
  );

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
        return res.json({
          summary: 'Configure your OpenAI API key in Settings > API Keys for KPI analysis',
          recommendations: ['Add OpenAI API key in Settings'],
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

        const messages: any[] = [
          {
            role: 'system',
            content: 'You are a helpful sales + ops assistant for white-label CRM applications.',
          },
          {
            role: 'user',
            content: imageUrl ? `${prompt}\n\nImage URL: ${imageUrl}` : prompt,
          },
        ];

        const response = await openaiData.client.chat.completions.create({
          model: openaiData.model,
          messages,
          temperature,
          max_tokens: max_output_tokens,
          response_format: schema ? { type: 'json_object' } : undefined,
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
          tool_choice: forceToolName
            ? { type: 'function', function: { name: forceToolName } }
            : 'auto',
        });

        // Handle tool calls
        const toolCalls = response.choices[0].message.tool_calls;
        if (toolCalls && toolCalls.length > 0) {
          const toolOutputs = await Promise.all(
            toolCalls.map(async (tc: any) => ({
              tool_call_id: tc.id,
              output: await executeWLTool(tc),
            }))
          );

          const continuedMessages = [
            ...messages,
            response.choices[0].message,
            ...toolOutputs.map((o) => ({
              role: 'tool' as const,
              content: o.output,
              tool_call_id: o.tool_call_id,
            })),
          ];

          const continuedResponse = await openaiData.client.chat.completions.create({
            model: openaiData.model,
            messages: continuedMessages,
            temperature,
            max_tokens: max_output_tokens,
            response_format: schema ? { type: 'json_object' } : undefined,
          });

          return res.json({
            output_text: continuedResponse.choices[0].message.content,
            output: [
              {
                content: [
                  {
                    type: 'output_text',
                    text: continuedResponse.choices[0].message.content,
                  },
                ],
              },
            ],
            tool_calls: toolCalls,
            continued: true,
          });
        }

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
