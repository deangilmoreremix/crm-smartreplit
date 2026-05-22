/**
 * OpenAI Routes - User API key based
 * All endpoints use the authenticated user's own API keys from the database
 */

import { Router, Request, Response } from 'express';
import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { userApiKeys } from '../../shared/schema';
import { memoryService } from '../memory';
import { requireAuth } from './auth';

const router = Router();

// Helper: Get user's OpenAI client
async function getUserOpenAI(userId: string): Promise<{ client: any; model: string } | null> {
  if (!db) return null;

  const keyRecord = await db.query.userApiKeys.findFirst({
    where: and(
      eq(userApiKeys.userId, userId),
      eq(userApiKeys.provider, 'openai'),
      eq(userApiKeys.isActive, true)
    ),
    orderBy: (userApiKeys, { desc }) => [desc(userApiKeys.isDefault)],
  });

  if (!keyRecord) return null;

  const OpenAI = (await import('openai')).default;
  return {
    client: new OpenAI({ apiKey: keyRecord.apiKey }),
    model: keyRecord.model || 'gpt-4o-mini',
  };
}

// Check API key status - uses user's key
router.get('/api/openai/status', requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const openaiData = await getUserOpenAI(userId);

  if (!openaiData) {
    return res.json({
      configured: false,
      model: 'none',
      status: 'needs_api_key',
      message: 'No OpenAI API key configured. Add your key in Settings > API Keys.',
    });
  }

  try {
    await openaiData.client.chat.completions.create({
      model: openaiData.model,
      messages: [{ role: 'user', content: 'test' }],
      max_tokens: 1,
    });
    res.json({
      configured: true,
      model: openaiData.model,
      status: 'ready',
    });
  } catch (error: any) {
    res.json({
      configured: false,
      model: openaiData.model,
      status: 'api_key_invalid',
      error: error?.message || 'API key validation failed',
    });
  }
});

// Smart Greeting Generation
router.post('/api/openai/smart-greeting', requireAuth, async (req: Request, res: Response) => {
  const authReq = req as any;
  const userId = authReq.userId;
  const sessionId = req.body.sessionId || `session-${Date.now()}`;

  try {
    const { userMetrics, timeOfDay, recentActivity } = req.body;
    const openaiData = await getUserOpenAI(userId);

    if (!openaiData) {
      return res.json({
        greeting: `Good ${timeOfDay}! You have ${userMetrics?.totalDeals || 0} deals.`,
        insight: userMetrics?.totalValue > 50000 ? 'Strong momentum' : 'Growing steadily',
        source: 'fallback',
        needsApiKey: true,
      });
    }

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
          content: `Generate a smart greeting for ${timeOfDay}. User metrics: ${JSON.stringify(userMetrics)}. Recent activity: ${JSON.stringify(recentActivity)}. Provide both a greeting and a strategic insight in JSON format.`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 300,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');

    await memoryService.recordChatInteraction(
      userId,
      sessionId,
      `Smart greeting request - time: ${timeOfDay}`,
      `Generated greeting: ${result.greeting || 'N/A'}, Insight: ${result.insight || 'N/A'}`,
      { endpoint: 'smart-greeting', userMetrics, recentActivity }
    );

    res.json(result);
  } catch (error) {
    console.error('Smart greeting error:', error);

    await memoryService.recordObservation(
      userId,
      'error',
      `Smart greeting generation failed: ${error instanceof Error ? error.message : String(error)}`,
      { endpoint: 'smart-greeting', sessionId }
    );

    res.status(500).json({
      error: 'Failed to generate smart greeting',
      greeting: `Good ${req.body.timeOfDay}! Your pipeline shows strong momentum.`,
      insight: 'Focus on your highest-value opportunities for maximum impact.',
    });
  }
});

// KPI Analysis
router.post('/api/openai/kpi-analysis', requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const sessionId = req.body.sessionId || `session-${Date.now()}`;

  try {
    const { historicalData, currentMetrics } = req.body;
    const openaiData = await getUserOpenAI(userId);

    if (!openaiData) {
      return res.json({
        summary: 'Configure your OpenAI API key in Settings > API Keys',
        recommendations: ['Add OpenAI API key in Settings'],
        needsApiKey: true,
      });
    }

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

    const result = JSON.parse(response.choices[0].message.content || '{}');

    await memoryService.recordChatInteraction(
      userId,
      sessionId,
      `KPI analysis request - historical: ${JSON.stringify(historicalData).slice(0, 200)}...`,
      `Analysis result: summary=${result.summary?.slice(0, 100) || 'N/A'}`,
      { endpoint: 'kpi-analysis', historicalData, currentMetrics }
    );

    res.json(result);
  } catch (error) {
    console.error('KPI analysis error:', error);

    await memoryService.recordObservation(
      userId,
      'error',
      `KPI analysis failed: ${error instanceof Error ? error.message : String(error)}`,
      { endpoint: 'kpi-analysis', sessionId }
    );

    res.status(500).json({
      error: 'Failed to analyze KPIs',
      summary: 'Your KPI trends show steady performance with opportunities for optimization.',
      recommendations: [
        'Focus on pipeline velocity',
        'Optimize conversion rates',
        'Scale successful strategies',
      ],
    });
  }
});

// Deal Intelligence
router.post('/api/openai/deal-intelligence', requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const sessionId = req.body.sessionId || `session-${Date.now()}`;

  try {
    const { dealData, contactHistory, marketContext } = req.body;
    const openaiData = await getUserOpenAI(userId);

    if (!openaiData) {
      return res.json({
        probability_score: 65,
        risk_level: 'medium',
        recommendations: ['Configure OpenAI API key in Settings'],
        needsApiKey: true,
      });
    }

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

    const result = JSON.parse(response.choices[0].message.content || '{}');

    await memoryService.recordChatInteraction(
      userId,
      sessionId,
      `Deal intelligence request - deal: ${JSON.stringify(dealData).slice(0, 150)}...`,
      `Probability: ${result.probability_score || 'N/A'}, Risk: ${result.risk_level || 'N/A'}`,
      { endpoint: 'deal-intelligence', dealData, contactHistory, marketContext }
    );

    res.json(result);
  } catch (error) {
    console.error('Deal intelligence error:', error);

    await memoryService.recordObservation(
      userId,
      'error',
      `Deal intelligence analysis failed: ${error instanceof Error ? error.message : String(error)}`,
      { endpoint: 'deal-intelligence', sessionId }
    );

    res.status(500).json({
      error: 'Failed to analyze deal',
      probability_score: 65,
      risk_level: 'medium',
      key_factors: ['Follow-up frequency', 'Decision timeline', 'Budget confirmation'],
      recommendations: [
        'Schedule decision-maker meeting',
        'Confirm budget authority',
        'Present clear ROI',
      ],
      confidence_level: 'medium',
      estimated_close_days: 30,
      value_optimization: 0,
    });
  }
});

// Business Intelligence Generation
router.post('/api/openai/business-intelligence', requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const sessionId = req.body.sessionId || `session-${Date.now()}`;

  try {
    const { businessData, marketContext, objectives } = req.body;
    const openaiData = await getUserOpenAI(userId);

    if (!openaiData) {
      return res.json({
        market_insights: ['Configure OpenAI API key in Settings'],
        strategic_recommendations: ['Add your API key in Settings > API Keys'],
        needsApiKey: true,
      });
    }

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

    const result = JSON.parse(response.choices[0].message.content || '{}');

    await memoryService.recordChatInteraction(
      userId,
      sessionId,
      `Business intelligence request - objectives: ${JSON.stringify(objectives).slice(0, 150)}...`,
      `Generated insights: ${result.market_insights?.slice(0, 100) || 'N/A'}`,
      { endpoint: 'business-intelligence', businessData, marketContext, objectives }
    );

    res.json(result);
  } catch (error) {
    console.error('Business intelligence error:', error);

    await memoryService.recordObservation(
      userId,
      'error',
      `Business intelligence generation failed: ${error instanceof Error ? error.message : String(error)}`,
      { endpoint: 'business-intelligence', sessionId }
    );

    res.status(500).json({
      error: 'Failed to generate business intelligence',
      market_insights: ['Digital transformation accelerating', 'Customer expectations rising'],
      competitive_advantages: ['AI integration', 'Customer-centric approach'],
      risk_factors: ['Market competition', 'Economic uncertainty'],
      growth_opportunities: ['Market expansion', 'Product diversification'],
      strategic_recommendations: ['Invest in AI capabilities', 'Strengthen customer relationships'],
    });
  }
});

export default router;
