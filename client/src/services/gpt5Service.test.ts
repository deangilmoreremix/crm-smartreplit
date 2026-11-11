import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GPT5Service, AIServiceError, isNeedsApiKey } from './gpt5Service';

const jsonRes = (body: unknown, status = 200) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  }) as unknown as Response;

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const catchErr = async (p: Promise<unknown>) => {
  try {
    await p;
  } catch (e) {
    return e as AIServiceError;
  }
  throw new Error('expected rejection');
};

describe('GPT5Service error kinds', () => {
  it('maps HTTP statuses to typed errors', async () => {
    const svc = new GPT5Service();
    fetchMock.mockResolvedValueOnce(jsonRes({ error: 'nope' }, 403));
    let e = await catchErr(svc.analyzeKPITrends({}, { a: 1 }));
    expect(e).toBeInstanceOf(AIServiceError);
    expect([e.kind, e.status]).toEqual(['forbidden', 403]);

    fetchMock.mockResolvedValueOnce(jsonRes({ error: 'slow down' }, 429));
    e = await catchErr(svc.analyzeKPITrends({}, { a: 2 }));
    expect(e.kind).toBe('rate_limited');

    fetchMock.mockResolvedValueOnce(jsonRes({ error: 'boom' }, 500));
    e = await catchErr(svc.analyzeKPITrends({}, { a: 3 }));
    expect(e.kind).toBe('server');

    fetchMock.mockResolvedValueOnce(jsonRes({ error: 'bad' }, 400));
    e = await catchErr(svc.analyzeKPITrends({}, { a: 4 }));
    expect(e.kind).toBe('invalid');
  });

  it('maps fetch rejection to network and non-JSON to invalid', async () => {
    const svc = new GPT5Service();
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    expect((await catchErr(svc.analyzeKPITrends({}, { a: 1 }))).kind).toBe('network');
    fetchMock.mockResolvedValueOnce(jsonRes('<!DOCTYPE html><html></html>'));
    expect((await catchErr(svc.analyzeKPITrends({}, { a: 2 }))).kind).toBe('invalid');
  });

  it('detects needsApiKey / source:fallback on HTTP 200 responses', async () => {
    const svc = new GPT5Service();
    fetchMock.mockResolvedValueOnce(
      jsonRes({ probability_score: 65, risk_level: 'medium', needsApiKey: true })
    );
    const e = await catchErr(svc.analyzeDealIntelligence({ id: 1 }, {}, {}));
    expect(e.kind).toBe('needs_api_key');
    expect(isNeedsApiKey(e)).toBe(true);

    fetchMock.mockResolvedValueOnce(
      jsonRes({ greeting: 'Good morning!', insight: 'x', source: 'fallback' })
    );
    expect((await catchErr(svc.generateSmartGreeting({}, 'morning', {}))).kind).toBe('server');

    fetchMock.mockResolvedValueOnce(jsonRes({ summary: 'Analysis unavailable', recommendations: ['Retry'] }));
    expect((await catchErr(svc.analyzeKPITrends({}, { z: 1 }))).kind).toBe('server');
  });

  it('returns real data untouched and never invents defaults', async () => {
    const svc = new GPT5Service();
    fetchMock.mockResolvedValueOnce(jsonRes({ probability_score: 42, risk_level: 'low' }));
    const data = await svc.analyzeDealIntelligence({ id: 1 }, {}, {});
    expect(data).toEqual({ probability_score: 42, risk_level: 'low' });
    expect(isNeedsApiKey(new Error('x'))).toBe(false);
  });

  it('requires a greeting string for smart greetings', async () => {
    const svc = new GPT5Service();
    fetchMock.mockResolvedValueOnce(jsonRes({ insight: 'only' }));
    expect((await catchErr(svc.generateSmartGreeting({}, 'morning', {}))).kind).toBe('invalid');
  });
});

describe('GPT5Service cache, de-duplication and concurrency', () => {
  it('de-duplicates in-flight identical requests', async () => {
    const svc = new GPT5Service();
    fetchMock.mockResolvedValue(jsonRes({ summary: 's' }));
    const [a, b] = await Promise.all([
      svc.analyzeKPITrends({}, { x: 1 }),
      svc.analyzeKPITrends({}, { x: 1 }),
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(a).toBe(b);
  });

  it('caches successes for 60s then refetches; different bodies are separate', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    const svc = new GPT5Service();
    fetchMock.mockResolvedValue(jsonRes({ summary: 's' }));
    await svc.analyzeKPITrends({}, { x: 1 });
    await svc.analyzeKPITrends({}, { x: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await svc.analyzeKPITrends({}, { x: 2 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    vi.setSystemTime(new Date('2026-01-01T00:01:01Z'));
    await svc.analyzeKPITrends({}, { x: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('does not cache failures', async () => {
    const svc = new GPT5Service();
    fetchMock.mockResolvedValueOnce(jsonRes({ error: 'x' }, 500));
    await catchErr(svc.analyzeKPITrends({}, { x: 1 }));
    fetchMock.mockResolvedValueOnce(jsonRes({ summary: 'ok' }));
    await expect(svc.analyzeKPITrends({}, { x: 1 })).resolves.toEqual({ summary: 'ok' });
  });

  it('runs at most 3 requests concurrently and queues the rest', async () => {
    const svc = new GPT5Service();
    let inFlight = 0;
    let peak = 0;
    const resolvers: Array<() => void> = [];
    fetchMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          inFlight++;
          peak = Math.max(peak, inFlight);
          resolvers.push(() => {
            inFlight--;
            resolve(jsonRes({ summary: 's' }));
          });
        })
    );
    const all = Promise.all(
      [1, 2, 3, 4, 5, 6].map((n) => svc.analyzeKPITrends({}, { n }))
    );
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    expect(peak).toBe(3);
    while (resolvers.length) {
      resolvers.shift()!();
      await new Promise((r) => setTimeout(r, 0));
    }
    await all;
    expect(fetchMock).toHaveBeenCalledTimes(6);
    expect(peak).toBe(3);
  });
});
