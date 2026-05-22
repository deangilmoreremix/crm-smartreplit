/**
 * AI Communication Tools API Routes
 * Endpoints for AI Email Composer, Email Reply Generator, Follow-Up Generator,
 * Objection Response Generator, Proposal Message Generator,
 * Appointment Message Generator, Video Email Scripts, SMS, Voice Scripts
 */

import type { Express, Request, Response } from 'express';
import { requireAuth } from './auth';
import { requireEntitlement } from '../middleware/entitlements';
import { FeatureKey } from '../types/entitlements';
import * as aiService from '../services/aiToolsService';
import { memoryService } from '../memory';

export function registerAICommunicationRoutes(app: Express): void {
  const requireAI = [requireAuth, requireEntitlement(FeatureKey.AI_TOOLS)];

  // AI Email Composer
   app.post(
     '/api/ai/email/compose',
     ...requireAI,
     async (req: Request, res: Response) => {
       const userId = (req as any).userId;
       const sessionId = req.body.sessionId || `session-${Date.now()}`;
       memoryService.recordObservation(userId, 'user_prompt', JSON.stringify(req.body), { endpoint: req.path }).catch(() => {});

       if (!aiService.checkAIRateLimit(userId)) {
         memoryService.recordObservation(userId, 'error', 'Rate limit exceeded', { endpoint: req.path }).catch(() => {});
         return res.status(429).json({ error: 'Rate limit exceeded' });
       }

       const { recipientName, recipientCompany, purpose, tone, keyPoints, callToAction } = req.body;
       if (!purpose) {
         memoryService.recordObservation(userId, 'error', 'Purpose required', { endpoint: req.path }).catch(() => {});
         return res.status(400).json({ error: 'Purpose required' });
       }

       const result = await aiService.composeEmail({
         recipientName: recipientName || 'there',
         recipientCompany: recipientCompany || '',
         purpose,
         tone: tone || 'professional',
         keyPoints,
         callToAction,
       });

       memoryService.recordChatInteraction(userId, sessionId, JSON.stringify(req.body), JSON.stringify(result.data), { endpoint: req.path }).catch(() => {});

       if (result.success) {
         res.json({ success: true, email: result.data, source: result.source });
       } else {
         res.json({ success: false, email: { subject: '', body: 'Configure OpenAI API key for email composition.' }, source: 'fallback' });
       }
     }
   );

  // Email Reply Generator
   app.post(
     '/api/ai/email/reply',
     ...requireAI,
     async (req: Request, res: Response) => {
       const userId = (req as any).userId;
       const sessionId = req.body.sessionId || `session-${Date.now()}`;
       memoryService.recordObservation(userId, 'user_prompt', JSON.stringify(req.body), { endpoint: req.path }).catch(() => {});

       if (!aiService.checkAIRateLimit(userId)) {
         memoryService.recordObservation(userId, 'error', 'Rate limit exceeded', { endpoint: req.path }).catch(() => {});
         return res.status(429).json({ error: 'Rate limit exceeded' });
       }

       const { originalEmail, context, tone } = req.body;
       if (!originalEmail) {
         memoryService.recordObservation(userId, 'error', 'Original email required', { endpoint: req.path }).catch(() => {});
         return res.status(400).json({ error: 'Original email required' });
       }

       const result = await aiService.generateEmailReply(originalEmail, context || '', tone);
       memoryService.recordChatInteraction(userId, sessionId, JSON.stringify(req.body), JSON.stringify(result.data), { endpoint: req.path }).catch(() => {});

       if (result.success) {
         res.json({ success: true, reply: result.data, source: result.source });
       } else {
         res.json({ success: false, reply: { subject: 'Re:', body: 'Configure OpenAI API key for email replies.' }, source: 'fallback' });
       }
     }
   );

  // Follow-Up Generator
   app.post(
     '/api/ai/follow-up/generate',
     ...requireAI,
     async (req: Request, res: Response) => {
       const userId = (req as any).userId;
       const sessionId = req.body.sessionId || `session-${Date.now()}`;
       memoryService.recordObservation(userId, 'user_prompt', JSON.stringify(req.body), { endpoint: req.path }).catch(() => {});

       if (!aiService.checkAIRateLimit(userId)) {
         memoryService.recordObservation(userId, 'error', 'Rate limit exceeded', { endpoint: req.path }).catch(() => {});
         return res.status(429).json({ error: 'Rate limit exceeded' });
       }

       const { contactData, lastInteraction, purpose } = req.body;
       if (!purpose) {
         memoryService.recordObservation(userId, 'error', 'Purpose required', { endpoint: req.path }).catch(() => {});
         return res.status(400).json({ error: 'Purpose required' });
       }

       const result = await aiService.generateFollowUp(contactData || {}, lastInteraction || 'No recent interaction', purpose);
       memoryService.recordChatInteraction(userId, sessionId, JSON.stringify(req.body), JSON.stringify(result.data), { endpoint: req.path }).catch(() => {});

       if (result.success) {
         res.json({ success: true, followUp: result.data, source: result.source });
       } else {
         res.json({ success: false, followUp: { subject: '', message: 'Configure OpenAI API key.', timing: '1 day', channel: 'email', urgency: 'medium', personalization_tips: [] }, source: 'fallback' });
       }
     }
   );

  // Objection Response Generator
   app.post(
     '/api/ai/objection/handle',
     ...requireAI,
     async (req: Request, res: Response) => {
       const userId = (req as any).userId;
       const sessionId = req.body.sessionId || `session-${Date.now()}`;
       memoryService.recordObservation(userId, 'user_prompt', JSON.stringify(req.body), { endpoint: req.path }).catch(() => {});

       if (!aiService.checkAIRateLimit(userId)) {
         memoryService.recordObservation(userId, 'error', 'Rate limit exceeded', { endpoint: req.path }).catch(() => {});
         return res.status(429).json({ error: 'Rate limit exceeded' });
       }

       const { objection, productInfo, contactData } = req.body;
       if (!objection) {
         memoryService.recordObservation(userId, 'error', 'Objection text required', { endpoint: req.path }).catch(() => {});
         return res.status(400).json({ error: 'Objection text required' });
       }

       const result = await aiService.handleObjection(objection, productInfo || 'our product', contactData);
       memoryService.recordChatInteraction(userId, sessionId, JSON.stringify(req.body), JSON.stringify(result.data), { endpoint: req.path }).catch(() => {});

       if (result.success) {
         res.json({ success: true, response: result.data, source: result.source });
       } else {
         res.json({ success: false, response: { understanding_statement: '', reframing_strategy: '', response_options: ['Configure OpenAI API key'], evidence_to_use: '', next_step: '', confidence_score: 0 }, source: 'fallback' });
       }
     }
   );

  // Proposal Message Generator
   app.post(
     '/api/ai/proposal/generate',
     ...requireAI,
     async (req: Request, res: Response) => {
       const userId = (req as any).userId;
       const sessionId = req.body.sessionId || `session-${Date.now()}`;
       memoryService.recordObservation(userId, 'user_prompt', JSON.stringify(req.body), { endpoint: req.path }).catch(() => {});

       if (!aiService.checkAIRateLimit(userId)) {
         memoryService.recordObservation(userId, 'error', 'Rate limit exceeded', { endpoint: req.path }).catch(() => {});
         return res.status(429).json({ error: 'Rate limit exceeded' });
       }

       const { clientName, projectDescription, budget, timeline, deliverables } = req.body;
       if (!clientName || !projectDescription) {
         memoryService.recordObservation(userId, 'error', 'Client name and project description required', { endpoint: req.path }).catch(() => {});
         return res.status(400).json({ error: 'Client name and project description required' });
       }

       const result = await aiService.generateProposal({ clientName, projectDescription, budget, timeline, deliverables });
       memoryService.recordChatInteraction(userId, sessionId, JSON.stringify(req.body), JSON.stringify(result.data), { endpoint: req.path }).catch(() => {});

       if (result.success) {
         res.json({ success: true, proposal: result.data, source: result.source });
       } else {
         res.json({ success: false, proposal: { title: '', executive_summary: 'Configure OpenAI API key.', scope_of_work: '', timeline: '', pricing_structure: '', terms: '', next_steps: '' }, source: 'fallback' });
       }
     }
   );

  // Appointment Message Generator
   app.post(
     '/api/ai/appointment/message',
     ...requireAI,
     async (req: Request, res: Response) => {
       const userId = (req as any).userId;
       const sessionId = req.body.sessionId || `session-${Date.now()}`;
       memoryService.recordObservation(userId, 'user_prompt', JSON.stringify(req.body), { endpoint: req.path }).catch(() => {});

       if (!aiService.checkAIRateLimit(userId)) {
         memoryService.recordObservation(userId, 'error', 'Rate limit exceeded', { endpoint: req.path }).catch(() => {});
         return res.status(429).json({ error: 'Rate limit exceeded' });
       }

       const { appointmentData, messageType } = req.body;
       if (!appointmentData) {
         memoryService.recordObservation(userId, 'error', 'Appointment data required', { endpoint: req.path }).catch(() => {});
         return res.status(400).json({ error: 'Appointment data required' });
       }

       const result = await aiService.generateAppointmentMessage(appointmentData, messageType || 'confirmation');
       memoryService.recordChatInteraction(userId, sessionId, JSON.stringify(req.body), JSON.stringify(result.data), { endpoint: req.path }).catch(() => {});

       if (result.success) {
         res.json({ success: true, message: result.data, source: result.source });
       } else {
         res.json({ success: false, message: { subject: '', body: 'Configure OpenAI API key.', calendar_note: '', reminder_text: '' }, source: 'fallback' });
       }
     }
   );

  // Video Email Scripts
   app.post(
     '/api/ai/video/script',
     ...requireAI,
     async (req: Request, res: Response) => {
       const userId = (req as any).userId;
       const sessionId = req.body.sessionId || `session-${Date.now()}`;
       memoryService.recordObservation(userId, 'user_prompt', JSON.stringify(req.body), { endpoint: req.path }).catch(() => {});

       if (!aiService.checkAIRateLimit(userId)) {
         memoryService.recordObservation(userId, 'error', 'Rate limit exceeded', { endpoint: req.path }).catch(() => {});
         return res.status(429).json({ error: 'Rate limit exceeded' });
       }

       const { recipientName, productName, keyMessage, duration } = req.body;
       if (!productName || !keyMessage) {
         memoryService.recordObservation(userId, 'error', 'Product name and key message required', { endpoint: req.path }).catch(() => {});
         return res.status(400).json({ error: 'Product name and key message required' });
       }

       const result = await aiService.generateVideoEmailScript({
         recipientName: recipientName || 'there',
         productName,
         keyMessage,
         duration: duration || '60 seconds',
       });
       memoryService.recordChatInteraction(userId, sessionId, JSON.stringify(req.body), JSON.stringify(result.data), { endpoint: req.path }).catch(() => {});

       if (result.success) {
         res.json({ success: true, script: result.data, source: result.source });
       } else {
         res.json({ success: false, script: { hook: '', intro: '', main_content: 'Configure OpenAI API key.', call_to_action: '', closing: '', estimated_duration: '', tips: [] }, source: 'fallback' });
       }
     }
   );

  // SMS Message Generator
   app.post(
     '/api/ai/sms/generate',
     ...requireAI,
     async (req: Request, res: Response) => {
       const userId = (req as any).userId;
       const sessionId = req.body.sessionId || `session-${Date.now()}`;
       memoryService.recordObservation(userId, 'user_prompt', JSON.stringify(req.body), { endpoint: req.path }).catch(() => {});

       if (!aiService.checkAIRateLimit(userId)) {
         memoryService.recordObservation(userId, 'error', 'Rate limit exceeded', { endpoint: req.path }).catch(() => {});
         return res.status(429).json({ error: 'Rate limit exceeded' });
       }

       const { purpose, contactName, context } = req.body;
       if (!purpose) {
         memoryService.recordObservation(userId, 'error', 'Purpose required', { endpoint: req.path }).catch(() => {});
         return res.status(400).json({ error: 'Purpose required' });
       }

       const result = await aiService.generateSMSMessage(purpose, contactName || '', context || '');
       memoryService.recordChatInteraction(userId, sessionId, JSON.stringify(req.body), JSON.stringify(result.data), { endpoint: req.path }).catch(() => {});

       if (result.success) {
         res.json({ success: true, sms: result.data, source: result.source });
       } else {
         res.json({ success: false, sms: { message: 'Configure OpenAI API key.', character_count: 0, follow_up_suggestion: '' }, source: 'fallback' });
       }
     }
   );

  // Voice Message Scripts
   app.post(
     '/api/ai/voice/script',
     ...requireAI,
     async (req: Request, res: Response) => {
       const userId = (req as any).userId;
       const sessionId = req.body.sessionId || `session-${Date.now()}`;
       memoryService.recordObservation(userId, 'user_prompt', JSON.stringify(req.body), { endpoint: req.path }).catch(() => {});

       if (!aiService.checkAIRateLimit(userId)) {
         memoryService.recordObservation(userId, 'error', 'Rate limit exceeded', { endpoint: req.path }).catch(() => {});
         return res.status(429).json({ error: 'Rate limit exceeded' });
       }

       const { purpose, contactName, keyPoints, duration } = req.body;
       if (!purpose) {
         memoryService.recordObservation(userId, 'error', 'Purpose required', { endpoint: req.path }).catch(() => {});
         return res.status(400).json({ error: 'Purpose required' });
       }

       const result = await aiService.generateVoiceScript({
         purpose,
         contactName: contactName || '',
         keyPoints: keyPoints || [],
         duration: duration || '30 seconds',
       });
       memoryService.recordChatInteraction(userId, sessionId, JSON.stringify(req.body), JSON.stringify(result.data), { endpoint: req.path }).catch(() => {});

       if (result.success) {
         res.json({ success: true, voiceScript: result.data, source: result.source });
       } else {
         res.json({ success: false, voiceScript: { script: 'Configure OpenAI API key.', talking_points: [], estimated_duration: '', tone_guidance: '' }, source: 'fallback' });
       }
     }
   );

  console.log('✅ AI Communication Tools routes registered');
}
