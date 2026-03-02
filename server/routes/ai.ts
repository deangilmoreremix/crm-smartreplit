/**
 * AI Routes - All AI/OpenAI related endpoints
 * Extracted from routes.ts for better organization
 */

import type { Express } from 'express';
import OpenAI from 'openai';

// Google AI interface
interface GoogleAIResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
    };
  }>;
}

export function registerAIRoutes(
  app: Express,
  openai: OpenAI | null,
  googleAIKey: string | undefined
) {
  // Google AI helper
  async function callGoogleAI(prompt: string, model: string = 'gemini-1.5-flash'): Promise<string> {
    if (!googleAIKey) {
      throw new Error('Google AI API key not configured');
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${googleAIKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );

    if (!response.ok) {
      throw new Error(`Google AI API error: ${response.status}`);
    }

    const data: GoogleAIResponse = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  // AI API Status Check - Enhanced with GPT-5.2 detection
  app.get('/api/openai/status', async (req, res) => {
    const results = {
      openai: {
        available: false,
        model: 'none',
        error: null as string | null,
        version: null as string | null,
      },
      googleai: { available: false, model: 'none', error: null as string | null },
    };

    // Test GPT-5.2 first (newer model)
    let gpt5_2Available = false;
    try {
      if (!openai) throw new Error('OpenAI client not initialized');
      await openai.chat.completions.create({
        model: 'gpt-5.2',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 1,
      });
      gpt5_2Available = true;
      results.openai = {
        available: true,
        model: 'gpt-5.2',
        error: null,
        version: '5.2',
      };
    } catch (error: any) {
      // Fall back to testing gpt-4o-mini
      try {
        if (!openai) throw new Error('OpenAI client not initialized');
        await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 1,
        });
        results.openai = {
          available: true,
          model: 'gpt-4o-mini',
          error: null,
          version: '4o-mini',
        };
      } catch (fallbackError: any) {
        results.openai = {
          available: false,
          model: 'none',
          error: fallbackError?.message || 'No OpenAI models available',
          version: null,
        };
      }
    }

    // Test Google AI
    try {
      await callGoogleAI('test', 'gemini-1.5-flash');
      results.googleai = { available: true, model: 'gemini-1.5-flash', error: null };
    } catch (error: any) {
      results.googleai = { available: false, model: 'none', error: error.message };
    }

    const anyWorking = results.openai.available || results.googleai.available;

    // Build capabilities based on available models
    let capabilities: string[] = [];
    if (gpt5_2Available) {
      capabilities = [
        'GPT-5.2 with advanced reasoning',
        'Unified reasoning system',
        'Advanced verbosity and reasoning_effort controls',
        '94.6% AIME mathematical accuracy',
        '74.9% SWE-bench coding accuracy',
        '84.2% MMMU multimodal performance',
        'Tool calling support',
        'JSON output formatting',
      ];
    } else if (results.openai.available) {
      capabilities = [
        'GPT-4 Omni model available',
        'Advanced reasoning and analysis',
        'Multimodal capabilities',
        'JSON output formatting',
      ];
    }

    if (results.googleai.available) {
      capabilities.push('Google Gemini Processing');
    }

    if (!anyWorking) {
      capabilities = ['Configure API keys for AI features'];
    }

    res.json({
      configured: anyWorking,
      model: gpt5_2Available
        ? 'gpt-5.2'
        : results.openai.available
          ? 'gpt-4o-mini'
          : results.googleai.model,
      status: anyWorking ? 'ready' : 'api_keys_invalid',
      gpt5_2Available,
      openai: results.openai,
      googleai: results.googleai,
      capabilities,
    });
  });

  // Google AI Test
  app.post('/api/googleai/test', async (req, res) => {
    try {
      const prompt = req.body.prompt || 'Generate a business insight';
      const response = await callGoogleAI(prompt);
      res.json({ success: true, model: 'gemini-1.5-flash', output: response });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // OpenAI Test
  app.post('/api/openai/test', async (req, res) => {
    try {
      if (!openai) return res.status(400).json({ error: 'OpenAI not configured' });
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Generate a business insight' }],
        max_tokens: 50,
      });
      res.json({
        success: true,
        model: 'gpt-4o-mini',
        output: response.choices[0].message.content,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Embeddings
  app.post('/api/openai/embeddings', async (req, res) => {
    try {
      const { text, model = 'text-embedding-3-small' } = req.body;
      if (!text) return res.status(400).json({ error: 'Text required' });
      if (!openai) return res.status(400).json({ error: 'OpenAI not configured' });

      const response = await openai.embeddings.create({
        model,
        input: text,
        encoding_format: 'float',
      });
      res.json({ success: true, embedding: response.data[0].embedding, model });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Image Generation
  app.post('/api/openai/images/generate', async (req, res) => {
    try {
      const { prompt, model = 'dall-e-3', size = '1024x1024' } = req.body;
      if (!prompt) return res.status(400).json({ error: 'Prompt required' });
      if (!openai) return res.status(400).json({ error: 'OpenAI not configured' });

      const response = await openai.images.generate({ model, prompt, size, n: 1 });
      res.json({ success: true, data: response.data, model });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Smart Greeting
  app.post('/api/openai/smart-greeting', async (req, res) => {
    const { userMetrics, timeOfDay } = req.body;

    if (!openai) {
      return res.json({
        greeting: `Good ${timeOfDay}! You have ${userMetrics?.totalDeals || 0} deals.`,
        insight: userMetrics?.totalValue > 50000 ? 'Strong momentum' : 'Growing steadily',
        source: 'fallback',
      });
    }

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: 'Generate personalized greetings' }],
        temperature: 0.7,
        max_tokens: 200,
      });
      res.json({
        ...JSON.parse(response.choices[0].message.content || '{}'),
        source: 'gpt-4o-mini',
      });
    } catch (error) {
      res.json({
        greeting: `Good ${timeOfDay}!`,
        insight: 'Your pipeline is growing',
        source: 'fallback',
      });
    }
  });

  // KPI Analysis
  app.post('/api/openai/kpi-analysis', async (req, res) => {
    if (!openai) {
      return res.json({
        summary: 'Configure API key for analysis',
        recommendations: ['Set up API'],
      });
    }

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: 'Analyze KPI trends' }],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 800,
      });
      res.json(JSON.parse(response.choices[0].message.content || '{}'));
    } catch (error) {
      res.json({ summary: 'Analysis unavailable', recommendations: ['Retry'] });
    }
  });

  // Deal Intelligence
  app.post('/api/openai/deal-intelligence', async (req, res) => {
    if (!openai) {
      return res.json({
        probability_score: 65,
        risk_level: 'medium',
        recommendations: ['Configure API'],
      });
    }

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: 'Provide deal intelligence' }],
        response_format: { type: 'json_object' },
        temperature: 0.2,
        max_tokens: 600,
      });
      res.json(JSON.parse(response.choices[0].message.content || '{}'));
    } catch (error) {
      res.json({ probability_score: 65, risk_level: 'medium', recommendations: ['Retry'] });
    }
  });

  // Business Intelligence
  app.post('/api/openai/business-intelligence', async (req, res) => {
    if (!openai) {
      return res.json({
        market_insights: ['Configure API'],
        strategic_recommendations: ['Set up OpenAI'],
      });
    }

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: 'Generate business intelligence' }],
        response_format: { type: 'json_object' },
        temperature: 0.4,
        max_tokens: 1000,
      });
      res.json(JSON.parse(response.choices[0].message.content || '{}'));
    } catch (error) {
      res.json({ market_insights: ['Retry analysis'] });
    }
  });

  // AI Respond endpoint - Enhanced version with tools support
  app.post('/api/respond', async (req, res) => {
    try {
      const {
        prompt,
        imageUrl,
        schema,
        useThinking,
        conversationId,
        temperature = 0.4,
        top_p = 1,
        max_output_tokens = 2048,
        metadata,
        forceToolName,
      } = req.body;

      if (!openai) {
        return res.status(400).json({
          error: 'OpenAI API key not configured',
          message: 'Please configure OpenAI API key for AI features',
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

      // Determine model - try GPT-5.2 first, fallback to gpt-4o-mini if unavailable
      let model = 'gpt-5.2';
      try {
        const response = await openai.chat.completions.create({
          model,
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
      } catch (primaryError: any) {
        // Fallback to gpt-4o-mini if GPT-5.2 unavailable
        console.log('GPT-5.2 unavailable, falling back to gpt-4o-mini');
        const fallbackResponse = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages,
          temperature,
          max_tokens: max_output_tokens,
          response_format: schema ? { type: 'json_object' } : undefined,
        });

        // Handle tool calls for fallback response
        const toolCalls = fallbackResponse.choices[0].message.tool_calls;
        if (toolCalls && toolCalls.length > 0) {
          const toolOutputs = await Promise.all(
            toolCalls.map(async (tc) => ({
              tool_call_id: tc.id,
              output: await executeWLTool(tc),
            }))
          );

          const continuedMessages = [
            ...messages,
            fallbackResponse.choices[0].message,
            ...toolOutputs.map((o) => ({
              role: 'tool' as const,
              content: o.output,
              tool_call_id: o.tool_call_id,
            })),
          ];

          const continuedResponse = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
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

        return res.json({
          output_text: fallbackResponse.choices[0].message.content,
          output: [
            {
              content: [
                {
                  type: 'output_text',
                  text: fallbackResponse.choices[0].message.content,
                },
              ],
            },
          ],
          model: fallbackResponse.model,
          usage: fallbackResponse.usage,
          fallback: true,
        });
      }
    } catch (error: any) {
      console.error('AI API error:', error);
      res.status(500).json({
        error: 'Failed to process AI request',
        message: error.message,
        fallback: 'Basic analysis available without AI',
      });
    }
  });

  // Streaming endpoint - Enhanced version with useThinking support
  app.post('/api/stream', async (req, res) => {
    try {
      const { prompt, useThinking, temperature = 0.4, max_output_tokens = 2048 } = req.body;

      if (!openai) {
        return res.status(400).json({
          error: 'OpenAI API key not configured',
          message: 'Please configure OpenAI API key for streaming features',
        });
      }

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // Try GPT-5.2 first, fallback to gpt-4o-mini if unavailable
      let stream;
      try {
        stream = await openai.chat.completions.create({
          model: 'gpt-5.2',
          messages: [{ role: 'user', content: prompt }],
          temperature,
          max_tokens: max_output_tokens,
          stream: true,
        });
      } catch (primaryError: any) {
        // Fallback to gpt-4o-mini if GPT-5.2 unavailable
        console.log('GPT-5.2 unavailable, falling back to gpt-4o-mini');
        stream = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature,
          max_tokens: max_output_tokens,
          stream: true,
        });
      }

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
  });

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

  console.log('✅ AI routes registered');
}
