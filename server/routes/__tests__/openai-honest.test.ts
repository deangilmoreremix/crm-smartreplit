import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

const getClient = vi.fn();

vi.mock('../auth', () => ({
  requireAuth: () => (req: any, _res: any, next: any) => {
    req.userId = 'user-1';
    next();
  },
}));
vi.mock('../../services/userOpenAI', () => ({
  getUserOpenAIClient: (...args: any[]) => getClient(...args),
  NO_KEY_MESSAGE: 'Add your OpenAI API key in Settings → API Keys to use AI features.',
}));
vi.mock('../../memory', () => ({
  memoryService: { recordChatInteraction: vi.fn(async () => {}), recordObservation: vi.fn(async () => {}) },
}));

import openaiRouter from '../openai';

const app = express();
app.use(express.json());
app.use(openaiRouter);

const ROUTES = ['smart-greeting', 'kpi-analysis', 'deal-intelligence', 'business-intelligence'];
const CANNED = /probability_score|risk_level|Digital transformation|steady performance|strong momentum|Schedule decision-maker/i;

describe('OpenAI dashboard routes never return canned AI output', () => {
  beforeEach(() => getClient.mockReset());

  it.each(ROUTES)('%s asks for an API key when the user has none', async (route) => {
    getClient.mockResolvedValue(null);
    const res = await request(app).post(`/api/openai/${route}`).send({ timeOfDay: 'morning' });
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ success: false, needsApiKey: true });
    expect(res.body.message).toMatch(/OpenAI API key/);
    expect(JSON.stringify(res.body)).not.toMatch(CANNED);
  });

  it.each(ROUTES)('%s reports the failure instead of inventing scores or advice', async (route) => {
    getClient.mockResolvedValue({
      model: 'gpt-6-luna',
      client: { chat: { completions: { create: vi.fn().mockRejectedValue(new Error('upstream exploded')) } } },
    });
    const res = await request(app).post(`/api/openai/${route}`).send({ timeOfDay: 'morning' });
    expect(res.status).toBe(500);
    expect(res.body).toMatchObject({ success: false, message: 'upstream exploded' });
    expect(JSON.stringify(res.body)).not.toMatch(CANNED);
  });

  it('returns the model output unchanged when the call works', async () => {
    getClient.mockResolvedValue({
      model: 'gpt-6-luna',
      client: {
        chat: { completions: { create: vi.fn().mockResolvedValue({ choices: [{ message: { content: JSON.stringify({ probability_score: 41, risk_level: 'high' }) } }] }) } },
      },
    });
    const res = await request(app).post('/api/openai/deal-intelligence').send({ dealData: { title: 'X' } });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ probability_score: 41, risk_level: 'high' });
  });
});
