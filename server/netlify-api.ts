/**
 * Netlify Function entry: runs the Express API (everything under /api/*) as one
 * serverless function. Same stack, no extra host. Auth is stateless: the Supabase
 * access token in the Authorization header is verified per request (see
 * server/middleware/jwtSession.ts).
 *
 * Notes:
 * - Netlify buffers function responses, so SSE routes (/api/stream) deliver their
 *   chunks when the stream completes rather than incrementally.
 * - Netlify enforces its own function timeout (default 10s, up to 26s on paid plans).
 */
import serverless from 'serverless-http';
import express, { type NextFunction, type Request, type Response } from 'express';
import { buildApp } from './app';
import { registerRoutes } from './routes';

const FUNCTION_PREFIX = '/.netlify/functions/api';

let cachedHandler: ReturnType<typeof serverless> | null = null;

async function createHandler() {
  const api = buildApp();
  await registerRoutes(api);
  api.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    console.error(`API error ${status}:`, err.message);
    res.status(status).json({ message: err.message || 'Internal Server Error' });
  });

  // Normalise the path: Netlify may deliver either /api/... (rewrite) or
  // /.netlify/functions/api/... (direct call). Express routes live under /api.
  const outer = express();
  outer.use((req: Request, _res: Response, next: NextFunction) => {
    let url = req.url.startsWith(FUNCTION_PREFIX) ? req.url.slice(FUNCTION_PREFIX.length) : req.url;
    if (!url.startsWith('/')) url = `/${url}`;
    if (!url.startsWith('/api') && !url.startsWith('/health')) url = `/api${url}`;
    req.url = url;
    next();
  });
  outer.use(api);
  return serverless(outer);
}

export const handler = async (event: unknown, context: unknown) => {
  if (!cachedHandler) cachedHandler = await createHandler();
  return (cachedHandler as any)(event, context);
};
