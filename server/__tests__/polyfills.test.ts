import { describe, it, expect, vi, afterEach } from 'vitest';

describe('server polyfills (Node 20 has no global WebSocket)', () => {
  const original = (globalThis as any).WebSocket;
  afterEach(() => {
    (globalThis as any).WebSocket = original;
    vi.resetModules();
  });

  it('defines a WebSocket stand-in when the runtime has none, so the Supabase client can be created', async () => {
    delete (globalThis as any).WebSocket;
    expect((globalThis as any).WebSocket).toBeUndefined();
    await import('../polyfills');
    expect(typeof (globalThis as any).WebSocket).toBe('function');
    expect(() => new (globalThis as any).WebSocket('wss://example.test')).toThrow(/not available in this runtime/);
  });

  it('leaves a real WebSocket alone', async () => {
    const real = class RealWebSocket {};
    (globalThis as any).WebSocket = real;
    await import('../polyfills');
    expect((globalThis as any).WebSocket).toBe(real);
  });

  it('lets @supabase/supabase-js create a client without a native WebSocket', async () => {
    delete (globalThis as any).WebSocket;
    await import('../polyfills');
    const { createClient } = await import('@supabase/supabase-js');
    expect(() => createClient('https://x.supabase.co', 'dummy-key', { auth: { persistSession: false } })).not.toThrow();
  });
});
