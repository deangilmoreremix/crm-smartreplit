/**
 * Automation Tools API Routes
 * Endpoints for Lead Automation Workflows, Follow-Up Automation,
 * Appointment Automation, Pipeline Stage Automation,
 * Form Submission Automation, Contact Segmentation, AI Suggestions Auto-Save
 */

import type { Express, Request, Response } from 'express';
import { requireAuth } from './auth';
import { requireEntitlement } from '../middleware/entitlements';
import { FeatureKey } from '../types/entitlements';
import * as aiService from '../services/aiToolsService';
import { sendAIError } from '../services/aiToolsService';

export function registerAIAutomationRoutes(app: Express): void {
  const requireAutomation = [requireAuth(), requireEntitlement(FeatureKey.LEAD_AUTOMATION)];

  // Lead Automation Workflows
  app.post(
    '/api/ai/automation/workflow',
    ...requireAutomation,
    async (req: Request, res: Response) => {
      const userId = (req as any).userId;
      if (!aiService.checkAIRateLimit(userId)) {
        return res.status(429).json({ error: 'Rate limit exceeded' });
      }

      const { workflowData } = req.body;
      if (!workflowData) return res.status(400).json({ error: 'Workflow data required' });

      const result = await aiService.generateWorkflow(workflowData);
      if (result.success) {
        res.json({ success: true, workflow: result.data, source: result.source });
      } else {
        sendAIError(res, result.error);
      }
    }
  );

  // Follow-Up Automation
  app.post(
    '/api/ai/automation/follow-up',
    ...requireAutomation,
    async (req: Request, res: Response) => {
      const userId = (req as any).userId;
      if (!aiService.checkAIRateLimit(userId)) {
        return res.status(429).json({ error: 'Rate limit exceeded' });
      }

      const { contactData, lastInteraction, purpose } = req.body;
      if (!contactData) return res.status(400).json({ error: 'Contact data required' });

      const result = await aiService.generateFollowUp(contactData, lastInteraction || '', purpose || 'follow-up');
      if (result.success) {
        res.json({ success: true, automation: result.data, source: result.source });
      } else {
        sendAIError(res, result.error);
      }
    }
  );

  // Appointment Automation
  app.post(
    '/api/ai/automation/appointment',
    ...requireAutomation,
    async (req: Request, res: Response) => {
      const userId = (req as any).userId;
      if (!aiService.checkAIRateLimit(userId)) {
        return res.status(429).json({ error: 'Rate limit exceeded' });
      }

      const { appointmentData, messageType } = req.body;
      if (!appointmentData) return res.status(400).json({ error: 'Appointment data required' });

      const result = await aiService.generateAppointmentMessage(appointmentData, messageType || 'confirmation');
      if (result.success) {
        res.json({ success: true, automation: result.data, source: result.source });
      } else {
        sendAIError(res, result.error);
      }
    }
  );

  // Pipeline Stage Automation
  app.post(
    '/api/ai/automation/pipeline-stage',
    ...requireAutomation,
    async (req: Request, res: Response) => {
      const userId = (req as any).userId;
      if (!aiService.checkAIRateLimit(userId)) {
        return res.status(429).json({ error: 'Rate limit exceeded' });
      }

      const { deals, targetStage } = req.body;
      if (!Array.isArray(deals) || deals.length === 0) {
        return res.status(400).json({ error: 'deals must be a non-empty array' });
      }

      const result = await aiService.recommendPipelineStages(deals, targetStage);
      if (result.success) {
        res.json({ success: true, automation: result.data, source: result.source });
      } else {
        sendAIError(res, result.error);
      }
    }
  );

  // Form Submission Automation
  app.post(
    '/api/ai/automation/form-submission',
    ...requireAutomation,
    async (req: Request, res: Response) => {
      const userId = (req as any).userId;
      if (!aiService.checkAIRateLimit(userId)) {
        return res.status(429).json({ error: 'Rate limit exceeded' });
      }

      const { formData, formType } = req.body;
      if (!formData) return res.status(400).json({ error: 'Form data required' });

      const result = await aiService.processFormSubmission(formData, formType || 'contact');
      if (result.success) {
        res.json({ success: true, automation: result.data, source: result.source });
      } else {
        sendAIError(res, result.error);
      }
    }
  );

  // Contact Segmentation
  app.post(
    '/api/ai/automation/segment',
    ...requireAutomation,
    async (req: Request, res: Response) => {
      const userId = (req as any).userId;
      if (!aiService.checkAIRateLimit(userId)) {
        return res.status(429).json({ error: 'Rate limit exceeded' });
      }

      const { contacts, criteria } = req.body;
      if (!contacts) return res.status(400).json({ error: 'Contacts data required' });

      const result = await aiService.segmentContacts(contacts, criteria || 'engagement');
      if (result.success) {
        res.json({ success: true, segments: result.data, source: result.source });
      } else {
        sendAIError(res, result.error);
      }
    }
  );

  // AI Suggestions Auto-Save
  app.post(
    '/api/ai/automation/auto-save',
    ...requireAutomation,
    async (req: Request, res: Response) => {
      const userId = (req as any).userId;
      if (!aiService.checkAIRateLimit(userId)) {
        return res.status(429).json({ error: 'Rate limit exceeded' });
      }

      const { data, type } = req.body;
      if (!data || !type) return res.status(400).json({ error: 'Data and type required' });

      const result = await aiService.autoSaveSuggestions(data, type);
      if (result.success) {
        res.json({ success: true, saved: result.data, source: result.source });
      } else {
        sendAIError(res, result.error);
      }
    }
  );

  // Generate Automation Rules
  app.post(
    '/api/ai/automation/rules',
    ...requireAutomation,
    async (req: Request, res: Response) => {
      const userId = (req as any).userId;
      if (!aiService.checkAIRateLimit(userId)) {
        return res.status(429).json({ error: 'Rate limit exceeded' });
      }

      const { context } = req.body;

      const result = await aiService.generateAutomationRules(context || {});
      if (result.success) {
        res.json({ success: true, rules: result.data, source: result.source });
      } else {
        sendAIError(res, result.error);
      }
    }
  );

  console.log('✅ Automation Tools routes registered');
}
