import 'dotenv/config';
import { type Request, type Response, type NextFunction } from 'express';
import { buildApp } from './app';
import { registerRoutes } from './routes';
import { createServer } from 'http';
import { setupVite, serveStatic, log } from './vite';
import { memoryService } from './memory';
import { healthCheckMiddleware } from './health';

export const app = buildApp();

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

// Health endpoint (public, no auth required)
app.get('/health', (req, res) => {
  // Delegate to healthCheckMiddleware as a route handler
  healthCheckMiddleware(req, res);
});

// Record server startup in memory
memoryService.recordSystemEvent('server_startup', 'SmartCRM server started', {
  port: process.env.PORT || 5000,
  environment: process.env.NODE_ENV || 'development',
  timestamp: new Date().toISOString(),
}).catch(() => {}); // Fire and forget, don't block startup

// Export for testing
