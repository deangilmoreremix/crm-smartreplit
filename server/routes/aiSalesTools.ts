/**
 * AI Sales Tools API Routes
 * Endpoints for AI Sales Assistant, Lead Scoring, Deal Intelligence,
 * Pipeline Intelligence, Deal Risk Monitor, Conversion Optimization,
 * Win Rate Intelligence, AI Sales Forecast, Live Deal Analysis, Pipeline Health
 */

import type { Express, Request, Response } from 'express';
import { requireAuth } from './auth';
import { requireEntitlement } from '../middleware/entitlements';
import { FeatureKey } from '../types/entitlements';
import * as aiService from '../services/aiToolsService';
import { memoryService } from '../memory';

export function registerAISalesToolsRoutes(app: Express): void {
  const requireSalesIntelligence = [
    requireAuth,
    requireEntitlement(FeatureKey.SALES_INTELLIGENCE),
  ];

   // AI Sales Assistant - General sales advice
   app.post(
     '/api/ai/sales-assistant',
     ...requireSalesIntelligence,
     async (req: Request, res: Response) => {
       const userId = (req as any).userId;
       const sessionId = req.body.sessionId || `session-${Date.now()}`;
       memoryService.recordObservation(userId, 'user_prompt', JSON.stringify(req.body), { endpoint: req.path }).catch(() => {});

       if (!aiService.checkAIRateLimit(userId)) {
         memoryService.recordObservation(userId, 'error', 'Rate limit exceeded', { endpoint: req.path }).catch(() => {});
         return res.status(429).json({ error: 'Rate limit exceeded. Try again in 60 seconds.' });
       }

       const { question, context } = req.body;
       if (!question) {
         memoryService.recordObservation(userId, 'error', 'Missing question', { endpoint: req.path }).catch(() => {});
         return res.status(400).json({ error: 'Question required' });
       }

       const result = await aiService.generateReasoning(question, context || {});
       if (result.success) {
         memoryService.recordChatInteraction(userId, sessionId, JSON.stringify(req.body), JSON.stringify(result.data), { endpoint: req.path }).catch(() => {});
         res.json({ success: true, response: result.data, source: result.source });
       } else {
         memoryService.recordObservation(userId, 'error', 'Failed: ' + (result?.error || 'endpoint error'), { endpoint: req.path }).catch(() => {});
         res.json({
           success: false,
           response: { reasoning_steps: ['Consider reviewing your pipeline data'], conclusion: 'Please configure OpenAI API key for AI sales assistant.' },
           source: 'fallback',
           error: result.error,
         });
       }
     }
   );

   // AI Lead Scoring
   app.post(
     '/api/ai/lead-score',
     ...requireSalesIntelligence,
     async (req: Request, res: Response) => {
       const userId = (req as any).userId;
       const sessionId = req.body.sessionId || `session-${Date.now()}`;
       memoryService.recordObservation(userId, 'user_prompt', JSON.stringify(req.body), { endpoint: req.path }).catch(() => {});

       if (!aiService.checkAIRateLimit(userId)) {
         memoryService.recordObservation(userId, 'error', 'Rate limit exceeded', { endpoint: req.path }).catch(() => {});
         return res.status(429).json({ error: 'Rate limit exceeded' });
       }

       const { contactData } = req.body;
       if (!contactData) {
         memoryService.recordObservation(userId, 'error', 'Missing contactData', { endpoint: req.path }).catch(() => {});
         return res.status(400).json({ error: 'Contact data required' });
       }

       const result = await aiService.analyzeLeadScore(contactData);
       if (result.success) {
         memoryService.recordChatInteraction(userId, sessionId, JSON.stringify(req.body), JSON.stringify(result.data), { endpoint: req.path }).catch(() => {});
         res.json({ success: true, scoring: result.data, source: result.source });
       } else {
         memoryService.recordObservation(userId, 'error', 'Failed: ' + (result?.error || 'endpoint error'), { endpoint: req.path }).catch(() => {});
         res.json({
           success: false,
           scoring: { score: 50, rationale: 'Configure OpenAI API key for AI lead scoring', buyingSignals: [], riskFactors: [], recommendedActions: ['Add OpenAI API key'], priority: 'warm' },
           source: 'fallback',
         });
       }
     }
   );

   // Deal Intelligence
   app.post(
     '/api/ai/deal-intelligence',
     ...requireSalesIntelligence,
     async (req: Request, res: Response) => {
       const userId = (req as any).userId;
       const sessionId = req.body.sessionId || `session-${Date.now()}`;
       memoryService.recordObservation(userId, 'user_prompt', JSON.stringify(req.body), { endpoint: req.path }).catch(() => {});

       if (!aiService.checkAIRateLimit(userId)) {
         memoryService.recordObservation(userId, 'error', 'Rate limit exceeded', { endpoint: req.path }).catch(() => {});
         return res.status(429).json({ error: 'Rate limit exceeded' });
       }

       const { dealData, contactHistory, marketContext } = req.body;
       if (!dealData) {
         memoryService.recordObservation(userId, 'error', 'Missing dealData', { endpoint: req.path }).catch(() => {});
         return res.status(400).json({ error: 'Deal data required' });
       }

       const result = await aiService.generateDealIntelligence(
         dealData,
         contactHistory || [],
         marketContext
       );
       if (result.success) {
         memoryService.recordChatInteraction(userId, sessionId, JSON.stringify(req.body), JSON.stringify(result.data), { endpoint: req.path }).catch(() => {});
         res.json({ success: true, intelligence: result.data, source: result.source });
       } else {
         memoryService.recordObservation(userId, 'error', 'Failed: ' + (result?.error || 'endpoint error'), { endpoint: req.path }).catch(() => {});
         res.json({
           success: false,
           intelligence: { probability_score: 50, risk_level: 'medium', key_factors: ['Configure OpenAI API key'], recommendations: ['Add OpenAI API key in Settings'] },
           source: 'fallback',
         });
       }
     }
   );

   // Pipeline Intelligence
   app.post(
     '/api/ai/pipeline-intelligence',
     ...requireSalesIntelligence,
     async (req: Request, res: Response) => {
       const userId = (req as any).userId;
       const sessionId = req.body.sessionId || `session-${Date.now()}`;
       memoryService.recordObservation(userId, 'user_prompt', JSON.stringify(req.body), { endpoint: req.path }).catch(() => {});

       if (!aiService.checkAIRateLimit(userId)) {
         memoryService.recordObservation(userId, 'error', 'Rate limit exceeded', { endpoint: req.path }).catch(() => {});
         return res.status(429).json({ error: 'Rate limit exceeded' });
       }

       const { deals } = req.body;
       if (!deals) {
         memoryService.recordObservation(userId, 'error', 'Missing deals data', { endpoint: req.path }).catch(() => {});
         return res.status(400).json({ error: 'Deals data required' });
       }

       const result = await aiService.analyzePipelineHealth(deals);
       if (result.success) {
         memoryService.recordChatInteraction(userId, sessionId, JSON.stringify(req.body), JSON.stringify(result.data), { endpoint: req.path }).catch(() => {});
         res.json({ success: true, analysis: result.data, source: result.source });
       } else {
         memoryService.recordObservation(userId, 'error', 'Failed: ' + (result?.error || 'endpoint error'), { endpoint: req.path }).catch(() => {});
         res.json({
           success: false,
           analysis: { overall_health_score: 50, healthy_deals: 0, at_risk_deals: 0, critical_deals: 0, bottlenecks: ['Configure OpenAI API key'], recommendations: ['Add OpenAI API key'] },
           source: 'fallback',
         });
       }
     }
   );

  // Deal Risk Monitor
  app.post(
    '/api/ai/deal-risk-monitor',
    ...requireSalesIntelligence,
    async (req: Request, res: Response) => {
      const userId = (req as any).userId;
      if (!aiService.checkAIRateLimit(userId)) {
        return res.status(429).json({ error: 'Rate limit exceeded' });
      }

      const { deals } = req.body;
      if (!deals) return res.status(400).json({ error: 'Deals data required' });

      const result = await aiService.monitorDealRisk(deals);
      if (result.success) {
        res.json({ success: true, riskAnalysis: result.data, source: result.source });
      } else {
        res.json({
          success: false,
          riskAnalysis: { high_risk: [], medium_risk: [], low_risk: [], total_at_risk_value: 0, summary: 'Configure OpenAI API key for risk analysis' },
          source: 'fallback',
        });
      }
    }
  );

  // Conversion Optimization
  app.post(
    '/api/ai/conversion-optimization',
    ...requireSalesIntelligence,
    async (req: Request, res: Response) => {
      const userId = (req as any).userId;
      if (!aiService.checkAIRateLimit(userId)) {
        return res.status(429).json({ error: 'Rate limit exceeded' });
      }

      const { deals, contacts } = req.body;

      const result = await aiService.optimizeConversion(deals || [], contacts || []);
      if (result.success) {
        res.json({ success: true, optimization: result.data, source: result.source });
      } else {
        res.json({
          success: false,
          optimization: { conversion_rate: 0, stage_conversion: {}, drop_off_points: [], optimization_opportunities: ['Configure OpenAI API key'], a_b_test_suggestions: [], projected_improvement: 0 },
          source: 'fallback',
        });
      }
    }
  );

  // Win Rate Intelligence
  app.post(
    '/api/ai/win-rate-intelligence',
    ...requireSalesIntelligence,
    async (req: Request, res: Response) => {
      const userId = (req as any).userId;
      if (!aiService.checkAIRateLimit(userId)) {
        return res.status(429).json({ error: 'Rate limit exceeded' });
      }

      const { deals } = req.body;
      if (!deals) return res.status(400).json({ error: 'Deals data required' });

      const result = await aiService.analyzeWinRate(deals);
      if (result.success) {
        res.json({ success: true, winRate: result.data, source: result.source });
      } else {
        res.json({
          success: false,
          winRate: { overall_win_rate: 0, win_rate_by_stage: {}, win_rate_by_deal_size: {}, key_win_factors: ['Configure OpenAI API key'], key_loss_factors: [], recommendations: [], benchmark_comparison: 'N/A' },
          source: 'fallback',
        });
      }
    }
  );

  // AI Sales Forecast
  app.post(
    '/api/ai/sales-forecast',
    ...requireSalesIntelligence,
    async (req: Request, res: Response) => {
      const userId = (req as any).userId;
      if (!aiService.checkAIRateLimit(userId)) {
        return res.status(429).json({ error: 'Rate limit exceeded' });
      }

      const { deals, period } = req.body;
      if (!deals) return res.status(400).json({ error: 'Deals data required' });

      const result = await aiService.generateSalesForecast(deals, period || 'quarter');
      if (result.success) {
        res.json({ success: true, forecast: result.data, source: result.source });
      } else {
        res.json({
          success: false,
          forecast: { weighted_forecast: 0, best_case: 0, worst_case: 0, confidence_level: 0, period: period || 'quarter', monthly_breakdown: [], key_drivers: ['Configure OpenAI API key'], risk_factors: [], recommendations: [] },
          source: 'fallback',
        });
      }
    }
  );

  // Live Deal Analysis
  app.post(
    '/api/ai/live-deal-analysis',
    ...requireSalesIntelligence,
    async (req: Request, res: Response) => {
      const userId = (req as any).userId;
      if (!aiService.checkAIRateLimit(userId)) {
        return res.status(429).json({ error: 'Rate limit exceeded' });
      }

      const { deals } = req.body;
      if (!deals) return res.status(400).json({ error: 'Deals data required' });

      const result = await aiService.analyzeLiveDeals(deals);
      if (result.success) {
        res.json({ success: true, liveAnalysis: result.data, source: result.source });
      } else {
        res.json({
          success: false,
          liveAnalysis: { hot_deals: [], warm_deals: [], cold_deals: [], immediate_actions: ['Configure OpenAI API key'], engagement_insights: {}, temperature_analysis: {}, activity_feed: [] },
          source: 'fallback',
        });
      }
    }
  );

  // Pipeline Health Dashboard
  app.post(
    '/api/ai/pipeline-health',
    ...requireSalesIntelligence,
    async (req: Request, res: Response) => {
      const userId = (req as any).userId;
      if (!aiService.checkAIRateLimit(userId)) {
        return res.status(429).json({ error: 'Rate limit exceeded' });
      }

      const { deals } = req.body;
      if (!deals) return res.status(400).json({ error: 'Deals data required' });

      const result = await aiService.analyzePipelineHealth(deals);
      if (result.success) {
        res.json({ success: true, health: result.data, source: result.source });
      } else {
        res.json({
          success: false,
          health: { overall_health_score: 50, healthy_deals: 0, at_risk_deals: 0, critical_deals: 0, bottlenecks: ['Configure OpenAI API key'], recommendations: ['Add OpenAI API key'], velocity_trend: 'stable', forecast_accuracy: 0 },
          source: 'fallback',
        });
      }
    }
  );

  console.log('✅ AI Sales Tools routes registered');
}
