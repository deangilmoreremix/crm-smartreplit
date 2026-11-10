/**
 * OpenAI Routes - User API key based
 * All endpoints use the authenticated user's own API keys from the database
 */

import { Router, Request, Response } from 'express';
import { memoryService } from '../memory';
import { requireAuth } from './auth';
import { createUserOpenAIClient as getUserOpenAI } from './ai';
import { respondJson, respondText } from '../services/openaiClient';
import { tierModel } from '../../shared/aiModels';

const router = Router();

// Check API key status - uses user's key
router.get('/api/openai/status', requireAuth(), async (req: Request, res: Response) => {
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
    const ping = await respondText({
      client: openaiData.client,
      model: openaiData.model ?? undefined,
      tier: 'fast',
      input: 'test',
      maxOutputTokens: 16,
      effort: 'none',
    });
    res.json({
      configured: true,
      model: ping.model,
      status: 'ready',
    });
  } catch (error: any) {
    res.json({
      configured: false,
      model: openaiData.model ?? tierModel('fast'),
      status: 'api_key_invalid',
      error: error?.message || 'API key validation failed',
    });
  }
});

// Smart Greeting Generation
router.post('/api/openai/smart-greeting', requireAuth(), async (req: Request, res: Response) => {
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

    const response = await respondJson({
      client: openaiData.client,
      model: openaiData.model ?? undefined,
      tier: 'fast',
      instructions:
        'You are an expert business advisor. Generate personalized, strategic greetings that provide actionable insights based on user data.',
      input: `Generate a smart greeting for ${timeOfDay}. User metrics: ${JSON.stringify(userMetrics)}. Recent activity: ${JSON.stringify(recentActivity)}. Provide both a greeting and a strategic insight in JSON format.`,
      json: true,
      effort: 'none',
      temperature: 0.7,
      maxOutputTokens: 300,
    });

    const result = response.data;

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
router.post('/api/openai/kpi-analysis', requireAuth(), async (req: Request, res: Response) => {
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

    const result = response.data;

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
router.post('/api/openai/deal-intelligence', requireAuth(), async (req: Request, res: Response) => {
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

    const result = response.data;

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
router.post('/api/openai/business-intelligence', requireAuth(), async (req: Request, res: Response) => {
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

    const result = response.data;

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
