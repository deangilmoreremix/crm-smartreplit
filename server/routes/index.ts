import type { Express } from 'express';
import { registerAuthRoutes } from './auth';
import { registerCRMRoutes } from './crm';
import { registerAdminRoutes } from './admin';
import { billingRoutes } from './billing';
import openclawRoutes from './openclaw';
import analyticsRoutes from './analytics';
import authRoutes from './auth';
import companiesRoutes from './companies';
import openaiRoutes from './openai';
import domainsRoutes from './domains';
import themesRoutes from './themes';
import provisioningRoutes from './provisioning';
import assetsRoutes from './assets';
import contactsRoutes from './api/v1/contacts';
import dealsRoutes from './api/v1/deals';

// Import register functions
import { registerMessagingRoutes } from './messaging';
import { registerPhoneRoutes } from './phone';
import { registerVideoRoutes } from './videos';
import { registerAppointmentRoutes } from './appointments';
import { registerAIPricingRoutes } from './aiPricing';
import { registerAIRoutes } from './ai';

export async function registerRoutes(app: Express): Promise<any> {
  // Register authentication routes
  console.log('Registering auth routes at /api/auth');
  app.use('/api/auth', authRoutes);

  // Register CRM routes
  registerCRMRoutes(app);

  // Register admin routes
  registerAdminRoutes(app);

  // Register billing routes
  console.log('Registering billing routes at /api/billing');
  app.use('/api/billing', billingRoutes);

  // Register OpenClaw routes
  console.log('Registering OpenClaw routes at /api/openclaw');
  app.use('/api/openclaw', openclawRoutes);

  // Register analytics routes
  console.log('Registering analytics routes at /api/analytics');
  app.use('/api/analytics', analyticsRoutes);

  // Register messaging routes
  console.log('Registering messaging routes');
  registerMessagingRoutes(app);

  // Register phone routes
  console.log('Registering phone routes');
  registerPhoneRoutes(app);

  // Register video routes
  console.log('Registering video routes');
  registerVideoRoutes(app);

  // Register appointment routes
  console.log('Registering appointment routes');
  registerAppointmentRoutes(app);

  // Register AI routes
  console.log('Registering AI routes');
  registerAIRoutes(app);

  // Register AI pricing routes
  console.log('Registering AI pricing routes');
  registerAIPricingRoutes(app);

  // Register companies routes
  console.log('Registering companies routes at /api/companies');
  app.use('/api/companies', companiesRoutes);

  // Register OpenAI routes
  console.log('Registering OpenAI routes at /api/openai');
  app.use('/api/openai', openaiRoutes);

  // Register domains routes
  console.log('Registering domains routes at /api/domains');
  app.use('/api/domains', domainsRoutes);

  // Register themes routes
  console.log('Registering themes routes at /api/themes');
  app.use('/api/themes', themesRoutes);

  // Register provisioning routes
  console.log('Registering provisioning routes at /api/provisioning');
  app.use('/api/provisioning', provisioningRoutes);

  // Register assets routes
  console.log('Registering assets routes at /api/assets');
  app.use('/api/assets', assetsRoutes);

  // Register API v1 routes
  console.log('Registering API v1 contacts routes at /api/v1/contacts');
  app.use('/api/v1/contacts', contactsRoutes);

  console.log('Registering API v1 deals routes at /api/v1/deals');
  app.use('/api/v1/deals', dealsRoutes);

  // Return a dummy server for compatibility
  return {
    listen: (port: number, callback?: () => void) => {
      console.log(`Server listening on port ${port}`);
      if (callback) callback();
      return {
        close: (callback?: () => void) => {
          console.log('Server closed');
          if (callback) callback();
        },
      };
    },
  };
}
