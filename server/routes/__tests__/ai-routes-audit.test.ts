import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

const { getUserOpenAIClient } = vi.hoisted(() => ({ getUserOpenAIClient: vi.fn() }));

vi.mock('../auth', () => ({
  requireAuth: () => (req: any, _res: any, next: any) => {
    req.userId = 'user-1';
    next();
  },
}));
vi.mock('../../middleware/entitlements', () => ({
  requireEntitlement: () => (_req: any, _res: any, next: any) => next(),
}));
vi.mock('../../services/userOpenAI', () => ({
  NO_KEY_MESSAGE: 'Add your OpenAI API key',
  getUserOpenAIClient,
}));

import { registerAIRoutes } from '../ai';

describe('AI routes (audit fixes)', () => {
  let app: express.Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    registerAIRoutes(app);
  });
  beforeEach(() => getUserOpenAIClient.mockReset());

  it('status checks the key with a free model lookup instead of a paid completion', async () => {
    const retrieve = vi.fn().mockResolvedValue({ id: 'gpt-6.2-sol' });
    const create = vi.fn();
    getUserOpenAIClient.mockResolvedValue({
      model: 'gpt-6.2-sol',
      client: { models: { retrieve }, chat: { completions: { create } } },
    });
    const res = await request(app).get('/api/openai/status');
    expect(res.status).toBe(200);
    expect(res.body.openai).toMatchObject({ available: true, model: 'gpt-6.2-sol' });
    expect(retrieve).toHaveBeenCalledWith('gpt-6.2-sol');
    expect(create).not.toHaveBeenCalled();
  });

  it('smart-greeting asks for a key instead of returning canned insights', async () => {
    getUserOpenAIClient.mockResolvedValue(null);
    const res = await request(app).post('/api/openai/smart-greeting').send({ timeOfDay: 'morning', userMetrics: { totalDeals: 3 } });
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ needsApiKey: true });
    expect(res.body.greeting).toBeUndefined();
  });

  it('smart-greeting reports AI failures instead of a canned greeting', async () => {
    getUserOpenAIClient.mockResolvedValue({
      model: 'gpt-6.2-sol',
      client: { chat: { completions: { create: vi.fn().mockRejectedValue(new Error('upstream down')) } } },
    });
    const res = await request(app).post('/api/openai/smart-greeting').send({ timeOfDay: 'morning' });
    expect(res.status).toBe(502);
    expect(res.body).toMatchObject({ success: false, error: 'upstream down' });
    expect(JSON.stringify(res.body)).not.toMatch(/pipeline is growing/i);
  });

  it('image route uses GPT Image 2.6 options and returns data URLs with the right MIME type', async () => {
    const post = vi.fn().mockResolvedValue({ data: [{ b64_json: 'R0lG' }], output_format: 'gif' });
    getUserOpenAIClient.mockResolvedValue({ model: 'gpt-6.2-sol', client: { post } });
    const res = await request(app)
      .post('/api/ai/image')
      .send({ prompt: 'spinner', output_format: 'gif', frame_count: 6, model: 'gpt-image-2.6-sunburst' });
    expect(res.status).toBe(200);
    expect(post).toHaveBeenCalledWith('/images/generations', {
      body: { model: 'gpt-image-2.6-sunburst', prompt: 'spinner', output_format: 'gif', frame_count: 6 },
    });
    expect(res.body).toMatchObject({ success: true, model: 'gpt-image-2.6-sunburst', outputFormat: 'gif' });
    expect(res.body.images[0]).toBe('data:image/gif;base64,R0lG');
  });
});
