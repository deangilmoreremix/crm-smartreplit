import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

const { generateSalesForecast, checkAIRateLimit } = vi.hoisted(() => ({
  generateSalesForecast: vi.fn(),
  checkAIRateLimit: vi.fn(() => true),
}));

vi.mock('../auth', () => ({
  requireAuth: () => (req: any, _res: any, next: any) => {
    req.userId = 'user-1';
    next();
  },
}));
vi.mock('../../middleware/entitlements', () => ({
  requireEntitlement: () => (_req: any, _res: any, next: any) => next(),
}));
vi.mock('../../memory', () => ({
  memoryService: { recordObservation: vi.fn(async () => {}), recordChatInteraction: vi.fn(async () => {}) },
}));
vi.mock('../../services/aiToolsService', async (importOriginal) => ({
  ...(await importOriginal<any>()),
  generateSalesForecast,
  checkAIRateLimit,
}));

import { registerAISalesToolsRoutes } from '../aiSalesTools';

describe('POST /api/ai/sales-forecast (background job)', () => {
  let app: express.Express;
  beforeAll(() => {
    app = express();
    app.use(express.json());
    registerAISalesToolsRoutes(app);
  });
  beforeEach(() => {
    generateSalesForecast.mockReset();
    checkAIRateLimit.mockClear();
  });

  it('returns pending while running, then the forecast when checked with responseId', async () => {
    generateSalesForecast.mockResolvedValueOnce({ success: true, pending: true, responseId: 'resp_1', source: 'openai' });
    const first = await request(app).post('/api/ai/sales-forecast').send({ deals: [{ value: 1 }] });
    expect(first.status).toBe(200);
    expect(first.body).toEqual({ success: true, pending: true, responseId: 'resp_1' });

    generateSalesForecast.mockResolvedValueOnce({ success: true, data: { weighted_forecast: 5 }, source: 'openai' });
    const second = await request(app).post('/api/ai/sales-forecast').send({ deals: [{ value: 1 }], responseId: 'resp_1' });
    expect(generateSalesForecast).toHaveBeenLastCalledWith([{ value: 1 }], 'quarter', 'resp_1');
    expect(second.body).toEqual({ success: true, forecast: { weighted_forecast: 5 }, source: 'openai' });
    // Follow-up checks don't count against the AI rate limit
    expect(checkAIRateLimit).toHaveBeenCalledTimes(1);
  });
});
