import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import express, { type Request, Response, NextFunction } from 'express';
import { registerRoutes } from './routes';
import { createServer } from 'http';
import { setupVite, serveStatic, log } from './vite';

export const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseServiceKey =
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin =
  supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

app.use('/api', async (req, res, next) => {
  const userId = (req.session as any)?.userId;
  if (!userId) return next();

  if (!supabaseAdmin) return next();

  try {
    const { data } = await supabaseAdmin
      .from('user_entitlements')
      .select('package')
      .eq('user_id', userId)
      .single();

    if (data?.package === 'no_access') {
      return res.status(403).json({
        error: 'Forbidden - No subscription',
        message: 'Your account has no active subscription. Please upgrade to access this feature.',
      });
    }
  } catch (err) {
    // On error, allow request to proceed (fail open)
    console.debug('Entitlement global check error:', err);
  }

  next();
});

(async () => {
  try {
    log('🚀 Starting server...');

    const server = await registerRoutes(app);
    log('✅ Routes registered successfully');

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || 'Internal Server Error';

      log(`❌ Server error: ${status} - ${message}`);
      res.status(status).json({ message });
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get('env') === 'development') {
      log('🔧 Setting up Vite in development mode...');
      await setupVite(app, server);
      log('✅ Vite setup complete');
    } else {
      log('📦 Serving static files in production mode...');
      serveStatic(app);
    }

    // Create HTTP server and listen
    const httpServer = createServer(app);
    const requestedPort = process.env.PORT || 3000;
    httpServer.listen(
      {
        port: requestedPort,
        host: '127.0.0.1',
        reusePort: true,
      },
      () => {
        const actualPort = (httpServer.address() as any)?.port || requestedPort;
        log(`🎉 Server running on port ${actualPort}`);
        log(`🌐 Access your app at: http://localhost:${actualPort}`);
      }
    );
  } catch (error) {
    console.error('💥 Failed to start server:', error);
    process.exit(1);
  }
})();
