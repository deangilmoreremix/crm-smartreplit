import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

vi.mock('../auth', () => ({
  requireAuth: () => (req: any, _res: any, next: any) => {
    req.userId = 'user-1';
    next();
  },
}));
vi.mock('../../middleware/entitlements', () => ({
  requireEntitlement: () => (_req: any, _res: any, next: any) => next(),
}));
vi.mock('../../db', () => ({ db: null }));

import { registerPhoneRoutes } from '../phone';
import { registerMessagingRoutes } from '../messaging';

const app = express();
app.use(express.json());
registerPhoneRoutes(app);
registerMessagingRoutes(app);

describe('phone and messaging routes return no fake data', () => {
  beforeEach(() => {
    delete process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_AUTH_TOKEN;
    delete process.env.TWILIO_PHONE_NUMBER;
  });

  it('reports Twilio as inactive when it is not configured', async () => {
    const res = await request(app).get('/api/messaging/providers');
    expect(res.body).toEqual([expect.objectContaining({ id: 'twilio', status: 'inactive' })]);
  });

  it('refuses to "send" an SMS without a provider instead of faking success', async () => {
    const res = await request(app).post('/api/messaging/send').send({ content: 'Hi', recipient: '+15555550100' });
    expect(res.status).toBe(501);
  });

  it('does not pretend to place calls', async () => {
    const res = await request(app).post('/api/phone/calls/start').send({ number: '+15555550100' });
    expect(res.status).toBe(501);
  });

  it('returns 503 rather than sample records when there is no database', async () => {
    expect((await request(app).get('/api/phone/calls')).status).toBe(503);
    expect((await request(app).get('/api/messaging/messages')).status).toBe(503);
  });
});
