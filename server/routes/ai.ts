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

  // AI API Status Check
  app.get('/api/openai/status', async (req, res) => {
    const results = {
      openai: { available: false, model: 'none', error: null as string | null },
      googleai: { available: false, model: 'none', error: null as string | null },
    };

    // Test OpenAI
    try {
      if (!openai) throw new Error('OpenAI client not initialized');
      await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 1,
      });
      results.openai = { available: true, model: 'gpt-4o-mini', error: null };
    } catch (error: any) {
      results.openai = { available: false, model: 'none', error: error.message };
    }

    // Test Google AI
    try {
      await callGoogleAI('test', 'gemini-1.5-flash');
      results.googleai = { available: true, model: 'gemini-1.5-flash', error: null };
    } catch (error: any) {
      results.googleai = { available: false, model: 'none', error: error.message };
    }

    const anyWorking = results.openai.available || results.googleai.available;
    res.json({
      configured: anyWorking,
      model: anyWorking ? (results.openai.available ? 'gpt-4' : 'gemini') : 'none',
      status: anyWorking ? 'ready' : 'api_keys_invalid',
      openai: results.openai,
      googleai: results.googleai,
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

  // AI Respond endpoint
  app.post('/api/respond', async (req, res) => {
    try {
      const { prompt, schema, temperature = 0.4 } = req.body;
      if (!openai) return res.status(400).json({ error: 'OpenAI not configured' });

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature,
        response_format: schema ? { type: 'json_object' } : undefined,
        max_tokens: 2048,
      });

      res.json({
        output_text: response.choices[0].message.content,
        output: [{ content: [{ type: 'output_text', text: response.choices[0].message.content }] }],
        model: response.model,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Streaming endpoint
  app.post('/api/stream', async (req, res) => {
    try {
      const { prompt, temperature = 0.4 } = req.body;
      if (!openai) return res.status(400).json({ error: 'OpenAI not configured' });

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');

      const stream = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error: any) {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  });

  console.log('✅ AI routes registered');
}
