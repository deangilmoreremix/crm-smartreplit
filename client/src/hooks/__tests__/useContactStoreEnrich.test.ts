import { describe, it, expect, vi, afterEach } from 'vitest';
import { useContactStore } from '../useContactStore';

describe('useContactStore.enrichContact (background job)', () => {
  afterEach(() => vi.useRealTimers());

  it('keeps checking with responseId while the server returns 202, then saves the data', async () => {
    vi.useFakeTimers();
    useContactStore.setState({ contacts: { c1: { id: 'c1', name: 'Jane' } as any } } as any);
    const bodies: any[] = [];
    globalThis.fetch = vi.fn(async (_url: string, init: any) => {
      bodies.push(init.body ? JSON.parse(init.body) : undefined);
      if (bodies.length < 3) {
        return new Response(JSON.stringify({ pending: true, responseId: 'resp_e' }), { status: 202, headers: { 'Content-Type': 'application/json' } });
      }
      return new Response(JSON.stringify({ enriched: true, data: { industry: 'SaaS' } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }) as any;

    const promise = useContactStore.getState().enrichContact('c1');
    await vi.advanceTimersByTimeAsync(5000);
    await promise;

    expect(bodies).toEqual([undefined, { responseId: 'resp_e' }, { responseId: 'resp_e' }]);
    expect(useContactStore.getState().contacts.c1).toMatchObject({ name: 'Jane', industry: 'SaaS' });
  });
});
