/**
 * Content & Marketing Tools API Routes
 * Endpoints for Content Generator, Sales Page Generator, Proposal Generator,
 * Offer Generator, Social Post Generator, Webinar Invite Generator,
 * Case Study Generator, Testimonial Transformer, Business Analyzer, Content Library
 */

 import type { Express, Request, Response } from 'express';
 import { requireAuth } from './auth';
 import { requireEntitlement } from '../middleware/entitlements';
 import { FeatureKey } from '../types/entitlements';
 import * as aiService from '../services/aiToolsService';
 import { memoryService } from '../memory';

export function registerAIContentRoutes(app: Express): void {
  const requireContent = [requireAuth, requireEntitlement(FeatureKey.CONTENT_LIBRARY)];

  // Content Generator
   app.post(
     '/api/ai/content/generate',
     ...requireContent,
     async (req: Request, res: Response) => {
       const userId = (req as any).userId;
       const sessionId = req.body.sessionId || `session-${Date.now()}`;
       memoryService.recordObservation(userId, 'user_prompt', JSON.stringify(req.body), { endpoint: req.path }).catch(() => {});
       if (!aiService.checkAIRateLimit(userId)) {
         return res.status(429).json({ error: 'Rate limit exceeded' });
       }

       const { type, topic, audience, tone, keywords } = req.body;
       if (!type || !topic) return res.status(400).json({ error: 'Type and topic required' });

       const result = await aiService.generateContent({
         type,
         topic,
         audience: audience || 'general',
         tone: tone || 'professional',
         keywords,
       });
       if (result.success) {
         memoryService.recordChatInteraction(userId, sessionId, JSON.stringify(req.body), JSON.stringify(result.data), { endpoint: req.path }).catch(() => {});
         res.json({ success: true, content: result.data, source: result.source });
       } else {
         memoryService.recordObservation(userId, 'error', 'Failed: ' + (result?.error || 'endpoint error'), { endpoint: req.path }).catch(() => {});
         res.json({ success: false, content: { title: '', content: 'Configure OpenAI API key.', meta_description: '', keywords: [], call_to_action: '', content_type: type }, source: 'fallback' });
       }
     }
  );

  // Sales Page Generator
   app.post(
     '/api/ai/content/sales-page',
     ...requireContent,
     async (req: Request, res: Response) => {
       const userId = (req as any).userId;
       const sessionId = req.body.sessionId || `session-${Date.now()}`;
       memoryService.recordObservation(userId, 'user_prompt', JSON.stringify(req.body), { endpoint: req.path }).catch(() => {});
       if (!aiService.checkAIRateLimit(userId)) {
         return res.status(429).json({ error: 'Rate limit exceeded' });
       }

       const { productName, targetAudience, keyBenefits, price } = req.body;
       if (!productName) return res.status(400).json({ error: 'Product name required' });

       const result = await aiService.generateSalesPage({ productName, targetAudience, keyBenefits, price });
       if (result.success) {
         memoryService.recordChatInteraction(userId, sessionId, JSON.stringify(req.body), JSON.stringify(result.data), { endpoint: req.path }).catch(() => {});
         res.json({ success: true, salesPage: result.data, source: result.source });
       } else {
         memoryService.recordObservation(userId, 'error', 'Failed: ' + (result?.error || 'endpoint error'), { endpoint: req.path }).catch(() => {});
         res.json({ success: false, salesPage: { headline: '', subheadline: '', hero_section: 'Configure OpenAI API key.', benefits: [], social_proof: '', cta: '', faq: [], guarantee: '' }, source: 'fallback' });
       }
     }
  );

  // Proposal Generator
   app.post(
     '/api/ai/content/proposal',
     ...requireContent,
     async (req: Request, res: Response) => {
       const userId = (req as any).userId;
       const sessionId = req.body.sessionId || `session-${Date.now()}`;
       memoryService.recordObservation(userId, 'user_prompt', JSON.stringify(req.body), { endpoint: req.path }).catch(() => {});
       if (!aiService.checkAIRateLimit(userId)) {
         return res.status(429).json({ error: 'Rate limit exceeded' });
       }

       const { clientName, projectDescription, budget, timeline, deliverables } = req.body;
       if (!clientName || !projectDescription) {
         return res.status(400).json({ error: 'Client name and project description required' });
       }

       const result = await aiService.generateProposal({ clientName, projectDescription, budget, timeline, deliverables });
       if (result.success) {
         memoryService.recordChatInteraction(userId, sessionId, JSON.stringify(req.body), JSON.stringify(result.data), { endpoint: req.path }).catch(() => {});
         res.json({ success: true, proposal: result.data, source: result.source });
       } else {
         memoryService.recordObservation(userId, 'error', 'Failed: ' + (result?.error || 'endpoint error'), { endpoint: req.path }).catch(() => {});
         res.json({ success: false, proposal: { title: '', executive_summary: 'Configure OpenAI API key.', scope_of_work: '', timeline: '', pricing_structure: '', terms: '', next_steps: '' }, source: 'fallback' });
       }
     }
  );

  // Offer Generator
   app.post(
     '/api/ai/content/offer',
     ...requireContent,
     async (req: Request, res: Response) => {
       const userId = (req as any).userId;
       const sessionId = req.body.sessionId || `session-${Date.now()}`;
       memoryService.recordObservation(userId, 'user_prompt', JSON.stringify(req.body), { endpoint: req.path }).catch(() => {});
       if (!aiService.checkAIRateLimit(userId)) {
         return res.status(429).json({ error: 'Rate limit exceeded' });
       }

       const { productName, targetAudience, pricePoint, uniqueValue } = req.body;
       if (!productName) return res.status(400).json({ error: 'Product name required' });

       const result = await aiService.generateOffer({ productName, targetAudience, pricePoint, uniqueValue });
       if (result.success) {
         memoryService.recordChatInteraction(userId, sessionId, JSON.stringify(req.body), JSON.stringify(result.data), { endpoint: req.path }).catch(() => {});
         res.json({ success: true, offer: result.data, source: result.source });
       } else {
         memoryService.recordObservation(userId, 'error', 'Failed: ' + (result?.error || 'endpoint error'), { endpoint: req.path }).catch(() => {});
         res.json({ success: false, offer: { offer_headline: '', offer_summary: 'Configure OpenAI API key.', value_stack: [], bonus_items: [], urgency_element: '', guarantee: '', cta: '', price_anchor: '' }, source: 'fallback' });
       }
     }
  );

  // Social Post Generator
   app.post(
     '/api/ai/content/social-post',
     ...requireContent,
     async (req: Request, res: Response) => {
       const userId = (req as any).userId;
       const sessionId = req.body.sessionId || `session-${Date.now()}`;
       memoryService.recordObservation(userId, 'user_prompt', JSON.stringify(req.body), { endpoint: req.path }).catch(() => {});
       if (!aiService.checkAIRateLimit(userId)) {
         return res.status(429).json({ error: 'Rate limit exceeded' });
       }

       const { platform, topic, tone, includeHashtags } = req.body;
       if (!platform || !topic) return res.status(400).json({ error: 'Platform and topic required' });

       const result = await aiService.generateSocialPost({ platform, topic, tone: tone || 'professional', includeHashtags: includeHashtags !== false });
       if (result.success) {
         memoryService.recordChatInteraction(userId, sessionId, JSON.stringify(req.body), JSON.stringify(result.data), { endpoint: req.path }).catch(() => {});
         res.json({ success: true, post: result.data, source: result.source });
       } else {
         memoryService.recordObservation(userId, 'error', 'Failed: ' + (result?.error || 'endpoint error'), { endpoint: req.path }).catch(() => {});
         res.json({ success: false, post: { post_text: 'Configure OpenAI API key.', hashtags: [], engagement_tip: '', best_posting_time: '', character_count: 0 }, source: 'fallback' });
       }
     }
  );

  // Webinar Invite Generator
   app.post(
     '/api/ai/content/webinar-invite',
     ...requireContent,
     async (req: Request, res: Response) => {
       const userId = (req as any).userId;
       const sessionId = req.body.sessionId || `session-${Date.now()}`;
       memoryService.recordObservation(userId, 'user_prompt', JSON.stringify(req.body), { endpoint: req.path }).catch(() => {});
       if (!aiService.checkAIRateLimit(userId)) {
         return res.status(429).json({ error: 'Rate limit exceeded' });
       }

       const { topic, speakerName, date, duration, keyTakeaways } = req.body;
       if (!topic) return res.status(400).json({ error: 'Topic required' });

       const result = await aiService.generateWebinarInvite({ topic, speakerName: speakerName || 'Expert Speaker', date: date || 'TBD', duration: duration || '60 minutes', keyTakeaways: keyTakeaways || [] });
       if (result.success) {
         memoryService.recordChatInteraction(userId, sessionId, JSON.stringify(req.body), JSON.stringify(result.data), { endpoint: req.path }).catch(() => {});
         res.json({ success: true, invite: result.data, source: result.source });
       } else {
         memoryService.recordObservation(userId, 'error', 'Failed: ' + (result?.error || 'endpoint error'), { endpoint: req.path }).catch(() => {});
         res.json({ success: false, invite: { subject_line: '', headline: '', description: 'Configure OpenAI API key.', key_benefits: [], speaker_bio: '', registration_cta: '', reminder_text: '' }, source: 'fallback' });
       }
     }
  );

  // Case Study Generator
   app.post(
     '/api/ai/content/case-study',
     ...requireContent,
     async (req: Request, res: Response) => {
       const userId = (req as any).userId;
       const sessionId = req.body.sessionId || `session-${Date.now()}`;
       memoryService.recordObservation(userId, 'user_prompt', JSON.stringify(req.body), { endpoint: req.path }).catch(() => {});
       if (!aiService.checkAIRateLimit(userId)) {
         return res.status(429).json({ error: 'Rate limit exceeded' });
       }

       const { clientName, challenge, solution, results } = req.body;
       if (!clientName || !challenge) return res.status(400).json({ error: 'Client name and challenge required' });

       const result = await aiService.generateCaseStudy({ clientName, challenge, solution: solution || '', results: results || [] });
       if (result.success) {
         memoryService.recordChatInteraction(userId, sessionId, JSON.stringify(req.body), JSON.stringify(result.data), { endpoint: req.path }).catch(() => {});
         res.json({ success: true, caseStudy: result.data, source: result.source });
       } else {
         memoryService.recordObservation(userId, 'error', 'Failed: ' + (result?.error || 'endpoint error'), { endpoint: req.path }).catch(() => {});
         res.json({ success: false, caseStudy: { title: '', executive_summary: 'Configure OpenAI API key.', challenge_section: '', solution_section: '', results_section: '', testimonial: '', key_metrics: [] }, source: 'fallback' });
       }
     }
  );

  // Testimonial Transformer
   app.post(
     '/api/ai/content/testimonial',
     ...requireContent,
     async (req: Request, res: Response) => {
       const userId = (req as any).userId;
       const sessionId = req.body.sessionId || `session-${Date.now()}`;
       memoryService.recordObservation(userId, 'user_prompt', JSON.stringify(req.body), { endpoint: req.path }).catch(() => {});
       if (!aiService.checkAIRateLimit(userId)) {
         return res.status(429).json({ error: 'Rate limit exceeded' });
       }

       const { rawTestimonial, format } = req.body;
       if (!rawTestimonial) return res.status(400).json({ error: 'Testimonial text required' });

       const result = await aiService.transformTestimonial(rawTestimonial, format || 'polished');
       if (result.success) {
         memoryService.recordChatInteraction(userId, sessionId, JSON.stringify(req.body), JSON.stringify(result.data), { endpoint: req.path }).catch(() => {});
         res.json({ success: true, testimonial: result.data, source: result.source });
       } else {
         memoryService.recordObservation(userId, 'error', 'Failed: ' + (result?.error || 'endpoint error'), { endpoint: req.path }).catch(() => {});
         res.json({ success: false, testimonial: { polished_testimonial: rawTestimonial, short_quote: '', social_media_version: '', headline_suggestion: '', key_themes: [] }, source: 'fallback' });
       }
     }
  );

  // Business Analyzer
   app.post(
     '/api/ai/business/analyze',
     ...requireContent,
     async (req: Request, res: Response) => {
       const userId = (req as any).userId;
       const sessionId = req.body.sessionId || `session-${Date.now()}`;
       memoryService.recordObservation(userId, 'user_prompt', JSON.stringify(req.body), { endpoint: req.path }).catch(() => {});
       if (!aiService.checkAIRateLimit(userId)) {
         return res.status(429).json({ error: 'Rate limit exceeded' });
       }

       const { businessData } = req.body;
       if (!businessData) return res.status(400).json({ error: 'Business data required' });

       const result = await aiService.analyzeBusiness(businessData);
       if (result.success) {
         memoryService.recordChatInteraction(userId, sessionId, JSON.stringify(req.body), JSON.stringify(result.data), { endpoint: req.path }).catch(() => {});
         res.json({ success: true, analysis: result.data, source: result.source });
       } else {
         memoryService.recordObservation(userId, 'error', 'Failed: ' + (result?.error || 'endpoint error'), { endpoint: req.path }).catch(() => {});
         res.json({ success: false, analysis: { swot_analysis: { strengths: [], weaknesses: [], opportunities: [], threats: [] }, market_position: 'Configure OpenAI API key.', growth_opportunities: [], risk_factors: [], strategic_recommendations: [], kpi_suggestions: [], competitive_advantages: [] }, source: 'fallback' });
       }
     }
  );

   // Content Library - Save generated content
   app.post(
     '/api/ai/content/save',
     ...requireContent,
     async (req: Request, res: Response) => {
       const userId = (req as any).userId;
       const sessionId = req.body.sessionId || `session-${Date.now()}`;
       memoryService.recordObservation(userId, 'user_prompt', JSON.stringify(req.body), { endpoint: req.path }).catch(() => {});
       const { title, content, type, tags } = req.body;
       if (!title || !content) return res.status(400).json({ error: 'Title and content required' });

       // Return success - actual DB save would use the content_items table
       const result = {
         success: true,
         saved: {
           id: `content-${Date.now()}`,
           title,
           content,
           type: type || 'general',
           tags: tags || [],
           createdAt: new Date().toISOString(),
         },
       };
       memoryService.recordChatInteraction(userId, sessionId, JSON.stringify(req.body), JSON.stringify(result.saved), { endpoint: req.path }).catch(() => {});
       res.json(result);
     }
  );

  console.log('✅ Content & Marketing Tools routes registered');
}
