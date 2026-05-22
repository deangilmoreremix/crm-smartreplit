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

export function registerAIAutomationRoutes(app: Express): void {
  const requireAutomation = [requireAuth, requireEntitlement(FeatureKey.LEAD_AUTOMATION)];

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
        res.json({ success: false, workflow: { workflow_name: 'Default Workflow', trigger: 'new_lead', steps: [{ action: 'send_welcome_email', condition: 'always', delay: '0' }], expected_outcome: 'Configure OpenAI API key.', optimization_tips: [] }, source: 'fallback' });
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
        res.json({ success: false, automation: { subject: '', message: 'Configure OpenAI API key.', timing: '1 day', channel: 'email', urgency: 'medium', personalization_tips: [] }, source: 'fallback' });
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
        res.json({ success: false, automation: { subject: '', body: 'Configure OpenAI API key.', calendar_note: '', reminder_text: '' }, source: 'fallback' });
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
      if (!deals) return res.status(400).json({ error: 'Deals data required' });

      const result = await aiService.analyzePipelineHealth(deals);
      if (result.success) {
        res.json({
          success: true,
          automation: {
            ...result.data,
            stage_recommendations: deals.map((d: any) => ({
              dealId: d.id,
              currentStage: d.stage,
              recommendedStage: d.probability > 70 ? 'negotiation' : d.probability > 40 ? 'qualification' : 'prospecting',
              auto_actions: ['Send follow-up email', 'Update CRM', 'Notify sales rep'],
            })),
          },
          source: result.source,
        });
      } else {
        res.json({ success: false, automation: { stage_recommendations: [], overall_health_score: 0 }, source: 'fallback' });
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

      const result = await aiService.generateRecommendations({
        type: 'form_submission',
        data: { formData, formType: formType || 'contact' },
        preferences: {},
      });

      if (result.success) {
        res.json({
          success: true,
          automation: {
            lead_score: result.data.recommendations?.[0]?.score || 50,
            auto_response: 'Thank you for your submission! We will be in touch shortly.',
            follow_up_sequence: ['Send welcome email', 'Assign to sales rep', 'Schedule follow-up call'],
            segmentation: result.data,
          },
          source: result.source,
        });
      } else {
        res.json({ success: false, automation: { lead_score: 50, auto_response: 'Configure OpenAI API key.', follow_up_sequence: [], segmentation: {} }, source: 'fallback' });
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
        res.json({ success: false, segments: { segments: [], unsegmented_count: contacts.length, recommendations: ['Configure OpenAI API key'] }, source: 'fallback' });
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
        res.json({ success: false, saved: { suggestions: [], auto_save_recommendations: ['Configure OpenAI API key'] }, source: 'fallback' });
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
        res.json({ success: false, rules: { rules: [], optimization_suggestions: ['Configure OpenAI API key'], estimated_time_saved: '0 hours/week' }, source: 'fallback' });
      }
    }
  );

  console.log('✅ Automation Tools routes registered');
}
