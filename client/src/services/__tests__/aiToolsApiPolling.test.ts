import { describe, it, expect, vi, afterEach } from 'vitest';
import { aiSalesTools } from '../aiToolsApiService';

describe('aiToolsApiService background jobs', () => {
  afterEach(() => vi.useRealTimers());

  it('repeats the request with responseId until the server returns the result', async () => {
    vi.useFakeTimers();
    const bodies: any[] = [];
    globalThis.fetch = vi.fn(async (_url: string, init: any) => {
      bodies.push(JSON.parse(init.body));
      const done = bodies.length === 3;
      return new Response(
        JSON.stringify(done ? { success: true, forecast: { weighted_forecast: 7 } } : { success: true, pending: true, responseId: 'resp_9' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }) as any;

    const promise = aiSalesTools.salesForecast([{ value: 1 }], 'quarter');
    await vi.advanceTimersByTimeAsync(5000);
    const result = await promise;

    expect(result).toEqual({ success: true, forecast: { weighted_forecast: 7 } });
    expect(bodies[0]).toEqual({ deals: [{ value: 1 }], period: 'quarter' });
    expect(bodies[1]).toEqual({ deals: [{ value: 1 }], period: 'quarter', responseId: 'resp_9' });
    expect(bodies).toHaveLength(3);
  });
});
