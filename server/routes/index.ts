import type { Express } from "express";
import { registerAuthRoutes } from './auth';
import { registerCRMRoutes } from './crm';
// Import other route modules as they are created
import { registerAdminRoutes } from './admin';
import { billingRoutes } from './billing';
// import { registerAPIRoutes } from './api';
// import { registerMessagingRoutes } from './messaging';
// import { registerAnalyticsRoutes } from './analytics';

export async function registerRoutes(app: Express): Promise<any> {
  // Register all route modules
  registerAuthRoutes(app);
  registerCRMRoutes(app);

  // Register admin routes
  registerAdminRoutes(app);

  // Register billing routes
  console.log('Registering billing routes at /api/billing');
  app.use('/api/billing', billingRoutes);

  // TODO: Add other route modules as they are implemented
  // registerAPIRoutes(app);
  // registerMessagingRoutes(app);
  // registerAnalyticsRoutes(app);

  // Return a dummy server for compatibility
  return {
    listen: (port: number, callback?: () => void) => {
      console.log(`Server listening on port ${port}`);
      if (callback) callback();
      return {
        close: (callback?: () => void) => {
          console.log('Server closed');
          if (callback) callback();
        }
      };
    }
  };
}