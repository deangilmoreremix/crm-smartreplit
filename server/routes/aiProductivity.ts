/**
 * Meeting & Productivity Tools API Routes
 * Endpoints for Meeting Summarizer, Speech to Text, Calendar Appointments,
 * Task Creation, Meeting Notes, Follow-Up Task Suggestions
 */

import type { Express, Request, Response } from 'express';
import { requireAuth } from './auth';
import { requireEntitlement } from '../middleware/entitlements';
import { FeatureKey } from '../types/entitlements';
import * as aiService from '../services/aiToolsService';
import { sendAIError } from '../services/aiToolsService';
import { memoryService } from '../memory';

export function registerAIProductivityRoutes(app: Express): void {
  const requireAI = [requireAuth(), requireEntitlement(FeatureKey.AI_TOOLS)];

   // Meeting Summarizer
   app.post(
     '/api/ai/meeting/summarize',
     ...requireAI,
     async (req: Request, res: Response) => {
       const userId = (req as any).userId;
       const sessionId = req.body.sessionId || `session-${Date.now()}`;
       memoryService.recordObservation(userId, 'user_prompt', JSON.stringify(req.body), { endpoint: req.path }).catch(() => {});

       if (!aiService.checkAIRateLimit(userId)) {
         memoryService.recordObservation(userId, 'error', 'Rate limit exceeded', { endpoint: req.path }).catch(() => {});
         return res.status(429).json({ error: 'Rate limit exceeded' });
       }

       const { transcript } = req.body;
       if (!transcript) {
         memoryService.recordObservation(userId, 'error', 'Meeting transcript required', { endpoint: req.path }).catch(() => {});
         return res.status(400).json({ error: 'Meeting transcript required' });
       }

       try {
         const result = await aiService.summarizeMeeting(transcript);
         if (result.success) {
           memoryService.recordChatInteraction(userId, sessionId, JSON.stringify(req.body), JSON.stringify(result.data), { endpoint: req.path }).catch(() => {});
           res.json({ success: true, summary: result.data, source: result.source });
         } else {
           sendAIError(res, result.error);
         }
       } catch (err: any) {
         memoryService.recordObservation(userId, 'error', err.message, { endpoint: req.path }).catch(() => {});
         sendAIError(res, err);
       }
     }
   );

   // Speech to Text (process spoken/text input into structured notes)
   app.post(
     '/api/ai/speech/to-text',
     ...requireAI,
     async (req: Request, res: Response) => {
       const userId = (req as any).userId;
       const sessionId = req.body.sessionId || `session-${Date.now()}`;
       memoryService.recordObservation(userId, 'user_prompt', JSON.stringify(req.body), { endpoint: req.path }).catch(() => {});

       if (!aiService.checkAIRateLimit(userId)) {
         memoryService.recordObservation(userId, 'error', 'Rate limit exceeded', { endpoint: req.path }).catch(() => {});
         return res.status(429).json({ error: 'Rate limit exceeded' });
       }

       const { audioContext } = req.body;
       if (!audioContext) {
         memoryService.recordObservation(userId, 'error', 'Audio context/transcript required', { endpoint: req.path }).catch(() => {});
         return res.status(400).json({ error: 'Audio context/transcript required' });
       }

       try {
         const result = await aiService.speechToTextNote(audioContext);
         if (result.success) {
           memoryService.recordChatInteraction(userId, sessionId, JSON.stringify(req.body), JSON.stringify(result.data), { endpoint: req.path }).catch(() => {});
           res.json({ success: true, notes: result.data, source: result.source });
         } else {
           sendAIError(res, result.error);
         }
       } catch (err: any) {
         memoryService.recordObservation(userId, 'error', err.message, { endpoint: req.path }).catch(() => {});
         sendAIError(res, err);
       }
     }
   );

   // Task Creation with AI
   app.post(
     '/api/ai/task/create',
     ...requireAI,
     async (req: Request, res: Response) => {
       const userId = (req as any).userId;
       const sessionId = req.body.sessionId || `session-${Date.now()}`;
       memoryService.recordObservation(userId, 'user_prompt', JSON.stringify(req.body), { endpoint: req.path }).catch(() => {});

       if (!aiService.checkAIRateLimit(userId)) {
         memoryService.recordObservation(userId, 'error', 'Rate limit exceeded', { endpoint: req.path }).catch(() => {});
         return res.status(429).json({ error: 'Rate limit exceeded' });
       }

       const { description, context } = req.body;
       if (!description) {
         memoryService.recordObservation(userId, 'error', 'Task description required', { endpoint: req.path }).catch(() => {});
         return res.status(400).json({ error: 'Task description required' });
       }

       try {
         const result = await aiService.createTaskFromDescription(description, context);
         if (result.success) {
           memoryService.recordChatInteraction(userId, sessionId, JSON.stringify(req.body), JSON.stringify(result.data), { endpoint: req.path }).catch(() => {});
           res.json({ success: true, task: result.data, source: result.source });
         } else {
           sendAIError(res, result.error);
         }
       } catch (err: any) {
         memoryService.recordObservation(userId, 'error', err.message, { endpoint: req.path }).catch(() => {});
         sendAIError(res, err);
       }
     }
   );

   // Meeting Notes Generator
   app.post(
     '/api/ai/meeting/notes',
     ...requireAI,
     async (req: Request, res: Response) => {
       const userId = (req as any).userId;
       const sessionId = req.body.sessionId || `session-${Date.now()}`;
       memoryService.recordObservation(userId, 'user_prompt', JSON.stringify(req.body), { endpoint: req.path }).catch(() => {});

       if (!aiService.checkAIRateLimit(userId)) {
         memoryService.recordObservation(userId, 'error', 'Rate limit exceeded', { endpoint: req.path }).catch(() => {});
         return res.status(429).json({ error: 'Rate limit exceeded' });
       }

       const { meetingData } = req.body;
       if (!meetingData) {
         memoryService.recordObservation(userId, 'error', 'Meeting data required', { endpoint: req.path }).catch(() => {});
         return res.status(400).json({ error: 'Meeting data required' });
       }

       try {
         const result = await aiService.generateMeetingNotes(meetingData);
         if (result.success) {
           memoryService.recordChatInteraction(userId, sessionId, JSON.stringify(req.body), JSON.stringify(result.data), { endpoint: req.path }).catch(() => {});
           res.json({ success: true, notes: result.data, source: result.source });
         } else {
           sendAIError(res, result.error);
         }
       } catch (err: any) {
         memoryService.recordObservation(userId, 'error', err.message, { endpoint: req.path }).catch(() => {});
         sendAIError(res, err);
       }
     }
   );

   // Follow-Up Task Suggestions
   app.post(
     '/api/ai/task/follow-up-suggestions',
     ...requireAI,
     async (req: Request, res: Response) => {
       const userId = (req as any).userId;
       const sessionId = req.body.sessionId || `session-${Date.now()}`;
       memoryService.recordObservation(userId, 'user_prompt', JSON.stringify(req.body), { endpoint: req.path }).catch(() => {});

       if (!aiService.checkAIRateLimit(userId)) {
         memoryService.recordObservation(userId, 'error', 'Rate limit exceeded', { endpoint: req.path }).catch(() => {});
         return res.status(429).json({ error: 'Rate limit exceeded' });
       }

       const { completedTask, context } = req.body;
       if (!completedTask) {
         memoryService.recordObservation(userId, 'error', 'Completed task description required', { endpoint: req.path }).catch(() => {});
         return res.status(400).json({ error: 'Completed task description required' });
       }

       try {
         const result = await aiService.suggestFollowUpTasks(completedTask, context);
         if (result.success) {
           memoryService.recordChatInteraction(userId, sessionId, JSON.stringify(req.body), JSON.stringify(result.data), { endpoint: req.path }).catch(() => {});
           res.json({ success: true, suggestions: result.data, source: result.source });
         } else {
           sendAIError(res, result.error);
         }
       } catch (err: any) {
         memoryService.recordObservation(userId, 'error', err.message, { endpoint: req.path }).catch(() => {});
         sendAIError(res, err);
       }
     }
   );

   // Calendar Appointments - AI scheduling suggestions
   app.post(
     '/api/ai/calendar/suggest',
     ...requireAI,
     async (req: Request, res: Response) => {
       const userId = (req as any).userId;
       const sessionId = req.body.sessionId || `session-${Date.now()}`;
       memoryService.recordObservation(userId, 'user_prompt', JSON.stringify(req.body), { endpoint: req.path }).catch(() => {});

       if (!aiService.checkAIRateLimit(userId)) {
         memoryService.recordObservation(userId, 'error', 'Rate limit exceeded', { endpoint: req.path }).catch(() => {});
         return res.status(429).json({ error: 'Rate limit exceeded' });
       }

       const { appointments, preferences } = req.body;

       try {
         const result = await aiService.suggestCalendarTimes(appointments, preferences);
         if (result.success) {
           memoryService.recordChatInteraction(userId, sessionId, JSON.stringify(req.body), JSON.stringify(result.data), { endpoint: req.path }).catch(() => {});
           res.json({ success: true, suggestions: result.data, source: result.source });
         } else {
           sendAIError(res, result.error);
         }
       } catch (err: any) {
         sendAIError(res, err);
       }
     }
   );

  console.log('✅ Meeting & Productivity Tools routes registered');
}
