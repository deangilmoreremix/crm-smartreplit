import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import express, { type Request, type Response, type NextFunction } from 'express';
import { registerRoutes } from './routes';
import { log } from './log';
import { requestContext } from './services/requestContext';
import { corsConfig, securityHeaders } from './middleware/security';
import { healthCheckMiddleware } from './health';

export const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// Per-request context (lets AI helpers find the signed-in user's OpenAI key).
// Registered after the body parsers, whose stream callbacks would lose the context.
app.use((_req, _res, next) => requestContext.run({}, next));

// Security middleware
app.use(securityHeaders);
app.use(corsConfig);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on('finish', () => {
    const duration = Date.now() - start;
    if (path.startsWith('/api')) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;

      // Only log response data for non-sensitive endpoints and exclude sensitive fields
      if (
        capturedJsonResponse &&
        !path.includes('/auth') &&
        !path.includes('/admin') &&
        !path.includes('/users')
      ) {
        const sanitizedResponse = { ...capturedJsonResponse };
        // Remove sensitive fields
        delete sanitizedResponse.password;
        delete sanitizedResponse.token;
        delete sanitizedResponse.apiKey;
        delete sanitizedResponse.secret;
        delete sanitizedResponse.email; // Don't log emails in responses

        logLine += ` :: ${JSON.stringify(sanitizedResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + '…';
      }

      log(logLine);
    }
  });

  next();
});

// Global entitlement check: block no_access users from all API endpoints
// Uses cached entitlement from session when available
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseServiceKey =
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin =
  supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

app.use('/api', async (req, res, next) => {
  const userId = (req.session as any)?.userId;

  // Use cached entitlement from session if available
  const cachedEntitlement = (req.session as any)?.entitlement;
  if (cachedEntitlement) {
    if (cachedEntitlement.package === 'no_access') {
      return res.status(403).json({
        error: 'Forbidden - No subscription',
        message: 'Your account has no active subscription. Please upgrade to access this feature.',
      });
    }
    // Entitlement cached and valid — skip DB hit
    return next();
  }

  if (!userId) return next();
  if (!supabaseAdmin) return next();

  try {
    const { data } = await supabaseAdmin
      .from('user_entitlements')
      .select('package')
      .eq('user_id', userId)
      .single();

    // Cache entitlement in session for future requests
    if (req.session) {
      (req.session as any).entitlement = data || null;
    }

    if (data?.package === 'no_access') {
      return res.status(403).json({
        error: 'Forbidden - No subscription',
        message: 'Your account has no active subscription. Please upgrade to access this feature.',
      });
    }
  } catch (err) {
    console.error('Entitlement global check error:', err);
    return res.status(500).json({
      error: 'Entitlement verification failed',
      message: 'Unable to verify subscription status. Please try again later.',
    });
  }

  next();
});

// Health endpoint (public, no auth required)
app.get('/health', (req, res) => {
  // Delegate to healthCheckMiddleware as a route handler
  healthCheckMiddleware(req, res);
});

/**
 * Resolves once all API routes and the error handler are registered.
 * Shared by the long-running server (server/index.ts) and the Netlify function (server/netlify-api.ts).
 */
export const appReady: Promise<void> = (async () => {
  await registerRoutes(app);
  log('✅ Routes registered successfully');

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    log(`❌ Server error: ${status} - ${message}`);
    res.status(status).json({ message });
  });
})();

