/**
 * Advanced AI Tools API Routes
 * Endpoints for Vision Analyzer, Image Generator, Semantic Search,
 * Function Assistant, Reasoning Generators, AI Research Tools, Smart Recommendations
 */

import type { Express, Request, Response } from 'express';
import { requireAuth } from './auth';
import { requireEntitlement } from '../middleware/entitlements';
import { FeatureKey } from '../types/entitlements';
import * as aiService from '../services/aiToolsService';
import { memoryService } from '../memory';

export function registerAIAdvancedRoutes(app: Express): void {
  const requireAI = [requireAuth, requireEntitlement(FeatureKey.AI_TOOLS)];

   // Vision Analyzer
   app.post(
     '/api/ai/vision/analyze',
     ...requireAI,
     async (req: Request, res: Response) => {
       const userId = (req as any).userId;
       const sessionId = req.body.sessionId || `session-${Date.now()}`;
       memoryService.recordObservation(userId, 'user_prompt', JSON.stringify(req.body), { endpoint: req.path }).catch(() => {});

       if (!aiService.checkAIRateLimit(userId)) {
         memoryService.recordObservation(userId, 'error', 'Error in ' + req.path + ': Rate limit exceeded', { endpoint: req.path }).catch(() => {});
         return res.status(429).json({ error: 'Rate limit exceeded' });
       }

       const { imageUrl, prompt } = req.body;
       if (!imageUrl) {
         memoryService.recordObservation(userId, 'error', 'Error in ' + req.path + ': Image URL required', { endpoint: req.path }).catch(() => {});
         return res.status(400).json({ error: 'Image URL required' });
       }

       const result = await aiService.analyzeImage(imageUrl, prompt);
       if (result.success) {
         memoryService.recordChatInteraction(userId, sessionId, JSON.stringify(req.body), JSON.stringify(result.data), { endpoint: req.path }).catch(() => {});
         res.json({ success: true, analysis: result.data, source: result.source });
       } else {
         memoryService.recordObservation(userId, 'error', 'Error in ' + req.path + ': ' + (result.error?.message || 'unknown'), { endpoint: req.path }).catch(() => {});
         res.json({ success: false, analysis: { analysis: 'Configure OpenAI API key for vision analysis. Ensure the image URL is publicly accessible.' }, source: 'fallback' });
       }
     }
   );

   // Semantic Search
   app.post(
     '/api/ai/search/semantic',
     ...requireAI,
     async (req: Request, res: Response) => {
       const userId = (req as any).userId;
       const sessionId = req.body.sessionId || `session-${Date.now()}`;
       memoryService.recordObservation(userId, 'user_prompt', JSON.stringify(req.body), { endpoint: req.path }).catch(() => {});

       if (!aiService.checkAIRateLimit(userId)) {
         memoryService.recordObservation(userId, 'error', 'Error in ' + req.path + ': Rate limit exceeded', { endpoint: req.path }).catch(() => {});
         return res.status(429).json({ error: 'Rate limit exceeded' });
       }

       const { query, items } = req.body;
       if (!query) {
         memoryService.recordObservation(userId, 'error', 'Error in ' + req.path + ': Search query required', { endpoint: req.path }).catch(() => {});
         return res.status(400).json({ error: 'Search query required' });
       }

       const result = await aiService.semanticSearch(query, items || []);
       if (result.success) {
         memoryService.recordChatInteraction(userId, sessionId, JSON.stringify(req.body), JSON.stringify(result.data), { endpoint: req.path }).catch(() => {});
         res.json({ success: true, results: result.data, source: result.source });
       } else {
         memoryService.recordObservation(userId, 'error', 'Error in ' + req.path + ': ' + (result.error?.message || 'unknown'), { endpoint: req.path }).catch(() => {});
         res.json({ success: false, results: { results: [], query_understanding: query, suggested_refinements: ['Configure OpenAI API key'] }, source: 'fallback' });
       }
     }
   );

   // Function Assistant - AI that can perform CRM actions
   app.post(
     '/api/ai/function/assistant',
     ...requireAI,
     async (req: Request, res: Response) => {
       const userId = (req as any).userId;
       const sessionId = req.body.sessionId || `session-${Date.now()}`;
       memoryService.recordObservation(userId, 'user_prompt', JSON.stringify(req.body), { endpoint: req.path }).catch(() => {});

       if (!aiService.checkAIRateLimit(userId)) {
         memoryService.recordObservation(userId, 'error', 'Error in ' + req.path + ': Rate limit exceeded', { endpoint: req.path }).catch(() => {});
         return res.status(429).json({ error: 'Rate limit exceeded' });
       }

       const { request, context } = req.body;
       if (!request) {
         memoryService.recordObservation(userId, 'error', 'Error in ' + req.path + ': Request required', { endpoint: req.path }).catch(() => {});
         return res.status(400).json({ error: 'Request required' });
       }

       const result = await aiService.generateReasoning(request, context || {});
       if (result.success) {
         memoryService.recordChatInteraction(userId, sessionId, JSON.stringify(req.body), JSON.stringify(result.data), { endpoint: req.path }).catch(() => {});
         res.json({ success: true, response: result.data, source: result.source });
       } else {
         memoryService.recordObservation(userId, 'error', 'Error in ' + req.path + ': ' + (result.error?.message || 'unknown'), { endpoint: req.path }).catch(() => {});
         res.json({ success: false, response: { reasoning_steps: ['Configure OpenAI API key for function assistant.'], conclusion: 'API key required.', confidence: 0, assumptions: [], alternative_approaches: [] }, source: 'fallback' });
       }
     }
   );

   // Reasoning Generators
   app.post(
     '/api/ai/reasoning/generate',
     ...requireAI,
     async (req: Request, res: Response) => {
       const userId = (req as any).userId;
       const sessionId = req.body.sessionId || `session-${Date.now()}`;
       memoryService.recordObservation(userId, 'user_prompt', JSON.stringify(req.body), { endpoint: req.path }).catch(() => {});

       if (!aiService.checkAIRateLimit(userId)) {
         memoryService.recordObservation(userId, 'error', 'Error in ' + req.path + ': Rate limit exceeded', { endpoint: req.path }).catch(() => {});
         return res.status(429).json({ error: 'Rate limit exceeded' });
       }

       const { task, data } = req.body;
       if (!task) {
         memoryService.recordObservation(userId, 'error', 'Error in ' + req.path + ': Task description required', { endpoint: req.path }).catch(() => {});
         return res.status(400).json({ error: 'Task description required' });
       }

       const result = await aiService.generateReasoning(task, data || {});
       if (result.success) {
         memoryService.recordChatInteraction(userId, sessionId, JSON.stringify(req.body), JSON.stringify(result.data), { endpoint: req.path }).catch(() => {});
         res.json({ success: true, reasoning: result.data, source: result.source });
       } else {
         memoryService.recordObservation(userId, 'error', 'Error in ' + req.path + ': ' + (result.error?.message || 'unknown'), { endpoint: req.path }).catch(() => {});
         res.json({ success: false, reasoning: { reasoning_steps: ['Configure OpenAI API key.'], conclusion: 'API key required.', confidence: 0, assumptions: [], alternative_approaches: [] }, source: 'fallback' });
       }
     }
   );

   // AI Research Tools
   app.post(
     '/api/ai/research/topic',
     ...requireAI,
     async (req: Request, res: Response) => {
       const userId = (req as any).userId;
       const sessionId = req.body.sessionId || `session-${Date.now()}`;
       memoryService.recordObservation(userId, 'user_prompt', JSON.stringify(req.body), { endpoint: req.path }).catch(() => {});

       if (!aiService.checkAIRateLimit(userId)) {
         memoryService.recordObservation(userId, 'error', 'Error in ' + req.path + ': Rate limit exceeded', { endpoint: req.path }).catch(() => {});
         return res.status(429).json({ error: 'Rate limit exceeded' });
       }

       const { topic, depth } = req.body;
       if (!topic) {
         memoryService.recordObservation(userId, 'error', 'Error in ' + req.path + ': Topic required', { endpoint: req.path }).catch(() => {});
         return res.status(400).json({ error: 'Topic required' });
       }

       const result = await aiService.researchTopic(topic, depth || 'comprehensive');
       if (result.success) {
         memoryService.recordChatInteraction(userId, sessionId, JSON.stringify(req.body), JSON.stringify(result.data), { endpoint: req.path }).catch(() => {});
         res.json({ success: true, research: result.data, source: result.source });
       } else {
         memoryService.recordObservation(userId, 'error', 'Error in ' + req.path + ': ' + (result.error?.message || 'unknown'), { endpoint: req.path }).catch(() => {});
         res.json({ success: false, research: { summary: 'Configure OpenAI API key.', key_findings: [], sources_suggested: [], related_topics: [], market_implications: [], action_items: '' }, source: 'fallback' });
       }
     }
   );

   // Smart Recommendations
   app.post(
     '/api/ai/recommendations',
     ...requireAI,
     async (req: Request, res: Response) => {
       const userId = (req as any).userId;
       const sessionId = req.body.sessionId || `session-${Date.now()}`;
       memoryService.recordObservation(userId, 'user_prompt', JSON.stringify(req.body), { endpoint: req.path }).catch(() => {});

       if (!aiService.checkAIRateLimit(userId)) {
         memoryService.recordObservation(userId, 'error', 'Error in ' + req.path + ': Rate limit exceeded', { endpoint: req.path }).catch(() => {});
         return res.status(429).json({ error: 'Rate limit exceeded' });
       }

       const { type, data, preferences } = req.body;
       if (!type) {
         memoryService.recordObservation(userId, 'error', 'Error in ' + req.path + ': Recommendation type required', { endpoint: req.path }).catch(() => {});
         return res.status(400).json({ error: 'Recommendation type required' });
       }

       const result = await aiService.generateRecommendations({ type, data: data || {}, preferences });
       if (result.success) {
         memoryService.recordChatInteraction(userId, sessionId, JSON.stringify(req.body), JSON.stringify(result.data), { endpoint: req.path }).catch(() => {});
         res.json({ success: true, recommendations: result.data, source: result.source });
       } else {
         memoryService.recordObservation(userId, 'error', 'Error in ' + req.path + ': ' + (result.error?.message || 'unknown'), { endpoint: req.path }).catch(() => {});
         res.json({ success: false, recommendations: { recommendations: [], insights: ['Configure OpenAI API key'], confidence: 0 }, source: 'fallback' });
       }
     }
   );

  console.log('✅ Advanced AI Tools routes registered');
}
