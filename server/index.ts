import { createServer } from 'http';
import { app, appReady } from './app';
import { setupVite, serveStatic, log } from './vite';
import { memoryService } from './memory';

(async () => {
  try {
    log('🚀 Starting server...');

    await appReady;

    const httpServer = createServer(app);

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get('env') === 'development') {
      log('🔧 Setting up Vite in development mode...');
      await setupVite(app, httpServer);
      log('✅ Vite setup complete');
    } else {
      log('📦 Serving static files in production mode...');
      serveStatic(app);
    }

    // Listen
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

// Record server startup in memory
memoryService.recordSystemEvent('server_startup', 'SmartCRM server started', {
  port: process.env.PORT || 5000,
  environment: process.env.NODE_ENV || 'development',
  timestamp: new Date().toISOString(),
}).catch(() => {}); // Fire and forget, don't block startup

// Export for testing
export { app };
