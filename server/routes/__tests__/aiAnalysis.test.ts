import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

vi.mock('../auth', () => ({
  requireAuth: () => (req: any, _res: any, next: any) => {
    req.userId = '11111111-1111-4111-8111-111111111111';
    next();
  },
}));
vi.mock('../../middleware/entitlements', () => ({
  requireEntitlement: () => (_req: any, _res: any, next: any) => next(),
}));

const { getKey, respondJson } = vi.hoisted(() => ({ getKey: vi.fn(), respondJson: vi.fn() }));
vi.mock('../../services/openaiUserKey', () => ({ getUserOpenAIKey: getKey }));
vi.mock('../../services/openaiClient', () => ({
  createUserClient: () => ({}),
  respondJson,
  respondStream: vi.fn(),
  respondText: vi.fn(),
  respondWithTools: vi.fn(),
}));

import { registerAIRoutes } from '../ai';

const app = express();
app.use(express.json());
registerAIRoutes(app);

const cases = [
  {
    route: '/api/openai/kpi-analysis',
    ok: { summary: 'Revenue up', recommendations: ['Hire'] },
    noKey: { summary: expect.stringContaining('Configure') },
    failure: { summary: 'Analysis unavailable', recommendations: ['Retry'] },
  },
  {
    route: '/api/openai/deal-intelligence',
    ok: { probability_score: 80, risk_level: 'low', recommendations: ['Close'] },
    noKey: { probability_score: 65, recommendations: ['Configure OpenAI API key in Settings'] },
    failure: { probability_score: 65, recommendations: ['Retry'] },
  },
  {
    route: '/api/openai/business-intelligence',
    ok: { market_insights: ['Growing'] },
    noKey: { market_insights: ['Configure OpenAI API key in Settings'] },
    failure: { market_insights: ['Retry analysis'] },
  },
  {
    route: '/api/openai/smart-greeting',
    ok: { greeting: 'Hi', insight: 'Nice' },
    noKey: { greeting: expect.stringContaining('Good') },
    failure: { greeting: expect.stringContaining('Good') },
  },
];

describe.each(cases)('$route', ({ route, ok, noKey, failure }) => {
  beforeEach(() => {
    getKey.mockReset();
    respondJson.mockReset();
  });

  it('success returns the AI data with source "openai"', async () => {
    getKey.mockResolvedValue({ apiKey: 'sk-test', model: null });
    respondJson.mockResolvedValue({ data: ok, model: 'gpt-test' });
    const res = await request(app).post(route).send({ timeOfDay: 'morning' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ ...ok, source: 'openai', model: 'gpt-test' });
    expect(res.body.needsApiKey).toBeUndefined();
  });

  it('no key returns 200 with source "fallback" and needsApiKey true', async () => {
    getKey.mockResolvedValue(null);
    const res = await request(app).post(route).send({ timeOfDay: 'morning' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ ...noKey, source: 'fallback', needsApiKey: true });
    expect(respondJson).not.toHaveBeenCalled();
  });

  it('AI failure returns 200 with source "fallback", needsApiKey false and an error', async () => {
    getKey.mockResolvedValue({ apiKey: 'sk-test', model: null });
    respondJson.mockRejectedValue(new Error('boom: sk-secret'));
    const res = await request(app).post(route).send({ timeOfDay: 'morning' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ ...failure, source: 'fallback', needsApiKey: false, error: 'AI request failed' });
    expect(JSON.stringify(res.body)).not.toContain('sk-secret');
  });

  it('a key lookup error is also a fallback, not a 500', async () => {
    getKey.mockRejectedValue(new Error('db down'));
    const res = await request(app).post(route).send({ timeOfDay: 'morning' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ source: 'fallback', needsApiKey: false });
  });
});
