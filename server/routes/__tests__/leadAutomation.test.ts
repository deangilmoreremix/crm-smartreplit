import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

const contact = { id: 7, firstName: 'Jane', lastName: 'Doe', email: 'j@x.co', status: 'lead', updatedAt: new Date() };
const state = { db: null as any };

vi.mock('../auth', () => ({
  requireAuth: () => (req: any, res: any, next: any) => {
    if (req.headers['x-test-no-user']) return res.status(401).json({ error: 'Unauthorized' });
    req.userId = 'user-1';
    next();
  },
}));
vi.mock('../../middleware/entitlements', () => ({
  requireEntitlement: () => (_req: any, _res: any, next: any) => next(),
}));
vi.mock('../../db', () => ({
  get db() {
    return state.db;
  },
}));
vi.mock('../../services/aiToolsService', () => ({
  analyzeLeadScore: vi.fn(),
  checkAIRateLimit: () => true,
  sendAIError: (res: any, error: string) =>
    error.includes('OpenAI API key')
      ? res.status(400).json({ needsApiKey: true, message: error })
      : res.status(500).json({ error }),
}));
vi.mock('../../services/leadAutomation', async (importOriginal) => ({
  ...(await importOriginal<any>()),
  getSettings: vi.fn(),
  saveSettings: vi.fn(async (_id: string, s: any) => s),
  countDeals: vi.fn(async () => 1),
  persistScore: vi.fn(async (_id: string, _c: any, r: any, method: string, threshold: number) => ({
    ...r,
    method,
    qualified: r.score >= threshold,
  })),
  createCampaign: vi.fn(async () => ({ campaign: { id: 'c1' }, enrolled: 2, tasksCreated: 2 })),
  listCampaigns: vi.fn(async () => [{ id: 'c1', name: 'Welcome', leads: 2, converted: 1, conversionRate: 0.5 }]),
  getCampaign: vi.fn(async (_u: string, id: string) => (id === 'c1' ? { campaign: { id }, enrollments: [] } : null)),
  updateCampaign: vi.fn(async (_u: string, id: string, body: any) => ({ campaign: id === 'c1' ? { id, ...body } : null })),
  deleteCampaign: vi.fn(async (_u: string, id: string) => id === 'c1'),
  processDueSteps: vi.fn(async () => 3),
}));

import { registerLeadAutomationRoutes } from '../leadAutomation';
import * as leads from '../../services/leadAutomation';
import * as ai from '../../services/aiToolsService';

const app = express();
app.use(express.json());
registerLeadAutomationRoutes(app);

const dbWithContact = (rows: any[] = [contact]) => ({
  select: () => ({ from: () => ({ where: async () => rows }) }),
});
const settings = (over: any = {}) => ({ scoringModel: 'ai-powered', qualificationThreshold: 70, createFollowupTasks: true, ...over });
const goodStep = { day: 0, channel: 'email', title: 'Intro', message: 'Hello' };

describe('lead automation routes', () => {
  beforeEach(() => {
    state.db = dbWithContact();
    vi.mocked(leads.getSettings).mockResolvedValue(settings() as any);
    vi.mocked(ai.analyzeLeadScore).mockReset();
    vi.mocked(leads.persistScore).mockClear();
  });

  it('requires a signed-in user', async () => {
    const res = await request(app).get('/api/lead-automation/settings').set('x-test-no-user', '1');
    expect(res.status).toBe(401);
  });

  it('returns 503 rather than made-up data when there is no database', async () => {
    state.db = null;
    for (const path of ['settings', 'campaigns']) {
      expect((await request(app).get(`/api/lead-automation/${path}`)).status).toBe(503);
    }
    expect((await request(app).post('/api/lead-automation/score/7')).status).toBe(503);
  });

  describe('settings', () => {
    it('returns the saved settings', async () => {
      const res = await request(app).get('/api/lead-automation/settings');
      expect(res.body).toEqual(settings());
    });
    it('saves valid changes merged over the current settings', async () => {
      const res = await request(app).put('/api/lead-automation/settings').send({ qualificationThreshold: 80 });
      expect(res.status).toBe(200);
      expect(leads.saveSettings).toHaveBeenCalledWith('user-1', settings({ qualificationThreshold: 80 }));
    });
    it('rejects invalid values', async () => {
      const res = await request(app).put('/api/lead-automation/settings').send({ scoringModel: 'magic' });
      expect(res.status).toBe(400);
    });
  });

  describe('scoring', () => {
    it('scores with AI, saves the result and reports qualification', async () => {
      vi.mocked(ai.analyzeLeadScore).mockResolvedValue({ success: true, source: 'openai', data: { score: 85, rationale: 'Strong fit', priority: 'hot' } });
      const res = await request(app).post('/api/lead-automation/score/7');
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ contactId: 7, score: 85, priority: 'hot', rationale: 'Strong fit', method: 'ai-powered', qualified: true });
      expect(leads.persistScore).toHaveBeenCalled();
    });
    it('asks for an OpenAI key instead of faking a score', async () => {
      vi.mocked(ai.analyzeLeadScore).mockResolvedValue({ success: false, source: 'fallback', error: 'Add your OpenAI API key in Settings' });
      const res = await request(app).post('/api/lead-automation/score/7');
      expect(res.status).toBe(400);
      expect(res.body.needsApiKey).toBe(true);
      expect(leads.persistScore).not.toHaveBeenCalled();
    });
    it('rule-based scoring never calls the AI', async () => {
      vi.mocked(leads.getSettings).mockResolvedValue(settings({ scoringModel: 'rule-based' }) as any);
      const res = await request(app).post('/api/lead-automation/score/7');
      expect(res.status).toBe(200);
      expect(res.body.method).toBe('rule-based');
      expect(ai.analyzeLeadScore).not.toHaveBeenCalled();
    });
    it('hybrid averages the rule-based and AI scores', async () => {
      vi.mocked(leads.getSettings).mockResolvedValue(settings({ scoringModel: 'hybrid' }) as any);
      vi.mocked(ai.analyzeLeadScore).mockResolvedValue({ success: true, source: 'openai', data: { score: 100, rationale: 'x' } });
      const res = await request(app).post('/api/lead-automation/score/7');
      const rule = leads.ruleBasedScore(contact, 1).score;
      expect(res.body.score).toBe(Math.round((rule + 100) / 2));
    });
    it('rejects an AI response without a score', async () => {
      vi.mocked(ai.analyzeLeadScore).mockResolvedValue({ success: true, source: 'openai', data: { rationale: 'no number' } });
      expect((await request(app).post('/api/lead-automation/score/7')).status).toBe(502);
    });
    it('404s for a contact the user does not own and 400s for a bad id', async () => {
      state.db = dbWithContact([]);
      expect((await request(app).post('/api/lead-automation/score/7')).status).toBe(404);
      expect((await request(app).post('/api/lead-automation/score/abc')).status).toBe(400);
    });
  });

  describe('campaigns', () => {
    it('lists campaigns with computed stats', async () => {
      const res = await request(app).get('/api/lead-automation/campaigns');
      expect(res.body[0]).toMatchObject({ leads: 2, converted: 1, conversionRate: 0.5 });
    });
    it('creates a campaign from valid input', async () => {
      const res = await request(app).post('/api/lead-automation/campaigns').send({ name: 'Welcome', steps: [goodStep] });
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ enrolled: 2, tasksCreated: 2 });
      expect(leads.createCampaign).toHaveBeenCalledWith('user-1', expect.objectContaining({ name: 'Welcome' }));
    });
    it('rejects a campaign with no steps', async () => {
      expect((await request(app).post('/api/lead-automation/campaigns').send({ name: 'Empty', steps: [] })).status).toBe(400);
    });
    it('pauses and resumes, rejects other statuses, 404s unknown ids', async () => {
      vi.mocked(leads.updateCampaign).mockImplementationOnce(async () => ({ error: 'status must be active or paused' }) as any);
      expect((await request(app).put('/api/lead-automation/campaigns/c1').send({ status: 'bogus' })).status).toBe(400);
      expect((await request(app).put('/api/lead-automation/campaigns/c1').send({ status: 'paused' })).body.status).toBe('paused');
      expect((await request(app).put('/api/lead-automation/campaigns/nope').send({ status: 'paused' })).status).toBe(404);
    });
    it('returns campaign details, 404 when missing', async () => {
      expect((await request(app).get('/api/lead-automation/campaigns/c1')).status).toBe(200);
      expect((await request(app).get('/api/lead-automation/campaigns/zzz')).status).toBe(404);
    });
    it('deletes an existing campaign, 404 otherwise', async () => {
      expect((await request(app).delete('/api/lead-automation/campaigns/c1')).status).toBe(200);
      expect((await request(app).delete('/api/lead-automation/campaigns/zzz')).status).toBe(404);
    });
    it('processes due steps and reports how many tasks were created', async () => {
      const res = await request(app).post('/api/lead-automation/process');
      expect(res.body).toEqual({ tasksCreated: 3 });
    });
  });
});
