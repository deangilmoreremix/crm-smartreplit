import type { NextFunction, Request, Response } from 'express';

type VerifiedUser = { id: string; email?: string | null };
type GetUser = (token: string) => Promise<VerifiedUser | null>;

const CACHE_TTL_MS = 30_000;
const CACHE_MAX = 500;

/**
 * Stateless auth for serverless hosting (Netlify Functions): verifies the Supabase
 * access token in `Authorization: Bearer <jwt>` and exposes the user as
 * `req.session.{userId,userEmail}`, which the existing auth middleware
 * (requireAuth / requireAdmin / entitlements) already reads. No session store needed.
 *
 * - dev-bypass tokens are left alone (handled by requireAuth in development only)
 * - results are cached briefly so a burst of requests costs one Supabase call
 */
export function createJwtSession(getUser: GetUser | null) {
  const cache = new Map<string, { user: VerifiedUser; expires: number }>();

  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const header = req.headers.authorization;
      if (!getUser || !header?.startsWith('Bearer ')) return next();
      const token = header.slice(7).trim();
      // dev-bypass tokens are handled by requireAuth; sk_live_ tokens are public-API keys, not JWTs
      if (!token || token.startsWith('dev-bypass-token-') || token.startsWith('sk_live_')) return next();
      if ((req as any).session?.userId) return next();

      const now = Date.now();
      let user = cache.get(token);
      if (!user || user.expires < now) {
        const verified = await getUser(token);
        if (!verified) return next();
        if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value as string);
        user = { user: verified, expires: now + CACHE_TTL_MS };
        cache.set(token, user);
      }

      const session = ((req as any).session ??= {});
      session.userId = user.user.id;
      if (user.user.email) session.userEmail = user.user.email;
    } catch (error) {
      console.error('JWT session error:', error);
    }
    next();
  };
}
