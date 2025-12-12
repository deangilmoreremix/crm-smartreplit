import type { Express } from "express";
import { registerAuthRoutes } from './auth';
import { registerCRMRoutes } from './crm';
// Import other route modules as they are created
// import { registerAdminRoutes } from './admin';
// import { registerAPIRoutes } from './api';
// import { registerMessagingRoutes } from './messaging';
// import { registerAnalyticsRoutes } from './analytics';

export async function registerRoutes(app: Express): Promise<any> {
  // Register all route modules
  registerAuthRoutes(app);
  registerCRMRoutes(app);

  // TODO: Add other route modules as they are implemented
  // registerAdminRoutes(app);
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