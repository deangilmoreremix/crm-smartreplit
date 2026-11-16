import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

const { transcriptionsCreate, getUserOpenAIClient } = vi.hoisted(() => {
  const transcriptionsCreate = vi.fn();
  return {
    transcriptionsCreate,
    getUserOpenAIClient: vi.fn(async () => ({
      client: { audio: { transcriptions: { create: transcriptionsCreate } } },
      model: 'gpt-6-luna',
    })),
  };
});

// Auth and entitlement pass through with a signed-in user
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
import { TRANSCRIBE_MODEL } from '../../services/openaiModels';

describe('POST /api/ai/transcribe', () => {
  let app: express.Express;

  beforeAll(() => {
    app = express();
    app.use(express.json()); // like the real app: JSON parser runs before the route
    registerAIRoutes(app);
  });

  beforeEach(() => {
    transcriptionsCreate.mockReset();
    getUserOpenAIClient.mockClear();
  });

  it('transcribes the raw audio body with the transcription model', async () => {
    transcriptionsCreate.mockResolvedValue({ text: 'hello world' });
    const res = await request(app)
      .post('/api/ai/transcribe?filename=call.mp3')
      .set('Content-Type', 'application/octet-stream')
      .send(Buffer.from('fake-audio-bytes'));

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, text: 'hello world', model: TRANSCRIBE_MODEL });
    const params = transcriptionsCreate.mock.calls[0][0];
    expect(params.model).toBe(TRANSCRIBE_MODEL);
    expect(params.file.name).toBe('call.mp3');
  });

  it('rejects an empty body', async () => {
    const res = await request(app)
      .post('/api/ai/transcribe')
      .set('Content-Type', 'application/octet-stream')
      .send(Buffer.alloc(0));
    expect(res.status).toBe(400);
    expect(transcriptionsCreate).not.toHaveBeenCalled();
  });

  it('asks for an API key when the user has none', async () => {
    getUserOpenAIClient.mockResolvedValueOnce(null as any);
    const res = await request(app)
      .post('/api/ai/transcribe')
      .set('Content-Type', 'application/octet-stream')
      .send(Buffer.from('x'));
    expect(res.status).toBe(400);
    expect(res.body.needsApiKey).toBe(true);
  });
});
