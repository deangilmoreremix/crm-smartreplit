import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(async () => ({ data: { session: { access_token: 'user-jwt' } } })),
    },
  },
}));

describe('installApiAuthFetch', () => {
  let inner: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    inner = vi.fn(async () => new Response('{}'));
    window.fetch = inner as any;
    const { installApiAuthFetch } = await import('../apiAuthFetch');
    installApiAuthFetch();
  });

  const authOf = (call: any[]) => new Headers(call[1]?.headers).get('Authorization');

  it('adds the Supabase token to same-origin /api calls', async () => {
    await window.fetch('/api/ai/email/compose', { method: 'POST' });
    expect(authOf(inner.mock.calls[0])).toBe('Bearer user-jwt');
  });

  it('keeps an explicit Authorization header', async () => {
    await window.fetch('/api/openclaw/chat', { headers: { Authorization: 'Bearer mine' } });
    expect(authOf(inner.mock.calls[0])).toBe('Bearer mine');
  });

  it('leaves non-API and cross-origin requests untouched', async () => {
    await window.fetch('/assets/app.js');
    await window.fetch('https://api.openai.com/api/x');
    expect(inner.mock.calls[0][1]).toBeUndefined();
    expect(inner.mock.calls[1][1]).toBeUndefined();
  });
});
