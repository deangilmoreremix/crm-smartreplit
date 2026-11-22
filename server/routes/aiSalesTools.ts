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
import { sendAIError } from '../services/aiToolsService';
import { memoryService } from '../memory';

export function registerAISalesToolsRoutes(app: Express): void {
  const requireSalesIntelligence = [
    requireAuth(),
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
         sendAIError(res, result.error);
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
         sendAIError(res, result.error);
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
         sendAIError(res, result.error);
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
         sendAIError(res, result.error);
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
        sendAIError(res, result.error);
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
        sendAIError(res, result.error);
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
        sendAIError(res, result.error);
      }
    }
  );

  // AI Sales Forecast
  app.post(
    '/api/ai/sales-forecast',
    ...requireSalesIntelligence,
    async (req: Request, res: Response) => {
      const userId = (req as any).userId;
      if (!req.body?.responseId && !aiService.checkAIRateLimit(userId)) {
        return res.status(429).json({ error: 'Rate limit exceeded' });
      }

      const { deals, period, responseId } = req.body;
      if (!deals) return res.status(400).json({ error: 'Deals data required' });

      const result = await aiService.generateSalesForecast(deals, period || 'quarter', responseId);
      if (result.pending) {
        // Background job still running: the client repeats the request with this responseId
        return res.json({ success: true, pending: true, responseId: result.responseId });
      }
      if (result.success) {
        res.json({ success: true, forecast: result.data, source: result.source });
      } else {
        sendAIError(res, result.error);
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
        sendAIError(res, result.error);
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
        sendAIError(res, result.error);
      }
    }
  );

  console.log('✅ AI Sales Tools routes registered');
}
