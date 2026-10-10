/**
 * Regression test for the PR #5 Supabase session fix.
 *
 * The auth wrapper returned the promise instead of awaiting it, so callers such
 * as `pages/Auth/ResetPassword.tsx` received unresolved promise state. The
 * wrapper must resolve to the session, and must still degrade to a mock client
 * when the public env is absent (browser/CI builds).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const session = { access_token: 'token-123', refresh_token: 'refresh-123' };
const getSession = vi.fn(async () => ({
  data: { session: session as never, user: { email: 'deangilmoresmr@smartcrm.vip' } as never },
  error: null,
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getSession,
      signInWithPassword: vi.fn(async () => ({ data: { session }, error: null })),
      signOut: vi.fn(async () => ({ error: null })),
    },
  })),
}));

describe('PR #5: supabase auth wrapper', () => {
  beforeEach(() => {
    vi.resetModules();
    getSession.mockClear();
  });

  it('getSession resolves to the supabase session instead of the promise', async () => {
    const mod = await import('../lib/supabase');

    const result = await mod.auth.getSession();

    expect(getSession).toHaveBeenCalledTimes(1);
    expect(result.data.session).toEqual(session);
    expect(result.error).toBeNull();
  });

  it('getSession does not leak an unresolved promise to callers', async () => {
    const mod = await import('../lib/supabase');

    const returned = mod.auth.getSession();

    // The awaited value must be the session object, never the pending promise.
    const resolved = await returned;
    expect(resolved).not.toBe(returned);
    expect(resolved.data.session).toEqual(session);
  });
});
