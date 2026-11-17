import type { Express, Response } from 'express';
import { and, eq } from 'drizzle-orm';
import { requireAuth } from './auth';
import { requireEntitlement } from '../middleware/entitlements';
import { FeatureKey } from '../types/entitlements';
import { db } from '../db';
import { contacts } from '../../shared/schema';
import * as aiService from '../services/aiToolsService';
import { sendAIError } from '../services/aiToolsService';
import * as leads from '../services/leadAutomation';

// Lead Automation: per-user settings, contact scoring and campaigns. Campaign steps create CRM tasks.
const noDb = (res: Response) => res.status(503).json({ error: 'Database not configured' });

export function registerLeadAutomationRoutes(app: Express): void {
  app.use('/api/lead-automation', requireAuth(), requireEntitlement(FeatureKey.LEAD_AUTOMATION));

  // ---- Settings ----
  app.get('/api/lead-automation/settings', async (req, res) => {
    try {
      if (!db) return noDb(res);
      res.json(await leads.getSettings((req as any).userId));
    } catch (error) {
      console.error('Error loading lead automation settings:', error);
      res.status(500).json({ error: 'Failed to load settings' });
    }
  });

  app.put('/api/lead-automation/settings', async (req, res) => {
    try {
      if (!db) return noDb(res);
      const userId = (req as any).userId;
      const current = await leads.getSettings(userId);
      const parsed = leads.parseSettings({ ...current, ...req.body });
      if ('error' in parsed) return res.status(400).json({ error: parsed.error });
      res.json(await leads.saveSettings(userId, parsed.value));
    } catch (error) {
      console.error('Error saving lead automation settings:', error);
      res.status(500).json({ error: 'Failed to save settings' });
    }
  });

  // ---- Scoring ----
  app.post('/api/lead-automation/score/:contactId', async (req, res) => {
    try {
      if (!db) return noDb(res);
      const userId = (req as any).userId;
      const contactId = parseInt(req.params.contactId, 10);
      if (!Number.isInteger(contactId)) return res.status(400).json({ error: 'Invalid contact id' });

      const [contact] = await db
        .select()
        .from(contacts)
        .where(and(eq(contacts.id, contactId), eq(contacts.profileId, userId)));
      if (!contact) return res.status(404).json({ error: 'Contact not found' });

      const settings = await leads.getSettings(userId);
      const dealCount = await leads.countDeals(userId, contactId);
      const rule = leads.ruleBasedScore(contact, dealCount);

      let result = rule;
      if (settings.scoringModel !== 'rule-based') {
        if (!aiService.checkAIRateLimit(userId)) return res.status(429).json({ error: 'Rate limit exceeded' });
        const ai = await aiService.analyzeLeadScore({
          name: `${contact.firstName} ${contact.lastName}`.trim(),
          email: contact.email,
          company: contact.company,
          industry: contact.industry,
          status: contact.status,
          source: contact.source,
          tags: contact.tags,
          dealCount,
          lastUpdated: contact.updatedAt,
        });
        if (!ai.success) return sendAIError(res, ai.error);
        const score = Math.max(0, Math.min(100, Math.round(Number(ai.data?.score))));
        if (!Number.isFinite(score)) return res.status(502).json({ error: 'The AI response had no score' });
        const aiResult = {
          score,
          priority: (['hot', 'warm', 'cold'].includes(ai.data?.priority) ? ai.data.priority : leads.priorityFor(score)) as leads.ScoreResult['priority'],
          rationale: String(ai.data?.rationale || ''),
        };
        result = settings.scoringModel === 'hybrid' ? leads.blendScores(rule, aiResult) : aiResult;
      }

      const saved = await leads.persistScore(userId, contact, result, settings.scoringModel, settings.qualificationThreshold);
      res.json({ contactId, ...saved });
    } catch (error: any) {
      console.error('Error scoring lead:', error);
      res.status(500).json({ error: error?.message || 'Failed to score lead' });
    }
  });

  // ---- Campaigns ----
  app.get('/api/lead-automation/campaigns', async (req, res) => {
    try {
      if (!db) return noDb(res);
      res.json(await leads.listCampaigns((req as any).userId));
    } catch (error) {
      console.error('Error listing campaigns:', error);
      res.status(500).json({ error: 'Failed to load campaigns' });
    }
  });

  app.post('/api/lead-automation/campaigns', async (req, res) => {
    try {
      if (!db) return noDb(res);
      const parsed = leads.parseCampaign(req.body);
      if ('error' in parsed) return res.status(400).json({ error: parsed.error });
      res.status(201).json(await leads.createCampaign((req as any).userId, parsed.value));
    } catch (error) {
      console.error('Error creating campaign:', error);
      res.status(500).json({ error: 'Failed to create campaign' });
    }
  });

  app.get('/api/lead-automation/campaigns/:id', async (req, res) => {
    try {
      if (!db) return noDb(res);
      const found = await leads.getCampaign((req as any).userId, req.params.id);
      if (!found) return res.status(404).json({ error: 'Campaign not found' });
      res.json(found);
    } catch (error) {
      console.error('Error loading campaign:', error);
      res.status(500).json({ error: 'Failed to load campaign' });
    }
  });

  app.put('/api/lead-automation/campaigns/:id', async (req, res) => {
    try {
      if (!db) return noDb(res);
      const result = await leads.updateCampaign((req as any).userId, req.params.id, req.body);
      if ('error' in result) return res.status(400).json({ error: result.error });
      if (!result.campaign) return res.status(404).json({ error: 'Campaign not found' });
      res.json(result.campaign);
    } catch (error) {
      console.error('Error updating campaign:', error);
      res.status(500).json({ error: 'Failed to update campaign' });
    }
  });

  app.delete('/api/lead-automation/campaigns/:id', async (req, res) => {
    try {
      if (!db) return noDb(res);
      if (!(await leads.deleteCampaign((req as any).userId, req.params.id))) {
        return res.status(404).json({ error: 'Campaign not found' });
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting campaign:', error);
      res.status(500).json({ error: 'Failed to delete campaign' });
    }
  });

  // Create the tasks for every campaign step that is due (the page calls this when it opens)
  app.post('/api/lead-automation/process', async (req, res) => {
    try {
      if (!db) return noDb(res);
      res.json({ tasksCreated: await leads.processDueSteps((req as any).userId) });
    } catch (error) {
      console.error('Error processing campaign steps:', error);
      res.status(500).json({ error: 'Failed to process campaign steps' });
    }
  });
}
