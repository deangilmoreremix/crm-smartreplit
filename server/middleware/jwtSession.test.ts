import { describe, it, expect, vi } from 'vitest';
import { createJwtSession } from './jwtSession';

const run = async (mw: any, headers: Record<string, string> = {}, session?: any) => {
  const req: any = { headers };
  if (session) req.session = session;
  const next = vi.fn();
  await mw(req, {} as any, next);
  return { req, next };
};

describe('createJwtSession', () => {
  it('maps a verified bearer token to req.session', async () => {
    const getUser = vi.fn(async () => ({ id: 'u1', email: 'a@b.co' }));
    const { req, next } = await run(createJwtSession(getUser), { authorization: 'Bearer tok' });
    expect(req.session).toEqual({ userId: 'u1', userEmail: 'a@b.co' });
    expect(next).toHaveBeenCalledOnce();
  });

  it('does nothing without a token or when getUser is unavailable', async () => {
    const getUser = vi.fn();
    expect((await run(createJwtSession(getUser))).req.session).toBeUndefined();
    expect(getUser).not.toHaveBeenCalled();
    expect((await run(createJwtSession(null), { authorization: 'Bearer t' })).req.session).toBeUndefined();
  });

  it('ignores invalid tokens and dev-bypass tokens', async () => {
    const getUser = vi.fn(async () => null);
    expect((await run(createJwtSession(getUser), { authorization: 'Bearer bad' })).req.session).toBeUndefined();
    const getUser2 = vi.fn();
    await run(createJwtSession(getUser2), { authorization: 'Bearer dev-bypass-token-1' });
    expect(getUser2).not.toHaveBeenCalled();
  });

  it('caches verification and never overrides an existing session user', async () => {
    const getUser = vi.fn(async () => ({ id: 'u1' }));
    const mw = createJwtSession(getUser);
    await run(mw, { authorization: 'Bearer tok' });
    await run(mw, { authorization: 'Bearer tok' });
    expect(getUser).toHaveBeenCalledTimes(1);
    const { req } = await run(createJwtSession(getUser), { authorization: 'Bearer other' }, { userId: 'existing' });
    expect(req.session.userId).toBe('existing');
  });

  it('continues when verification throws', async () => {
    const getUser = vi.fn(async () => {
      throw new Error('boom');
    });
    const { next } = await run(createJwtSession(getUser), { authorization: 'Bearer tok' });
    expect(next).toHaveBeenCalledOnce();
  });
});
