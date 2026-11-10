import type { Express } from 'express';
import { registerAuthRoutes } from './auth';
import { registerCRMRoutes } from './crm';
import { registerAdminRoutes } from './admin';
import { registerWorkflowRoutes } from './workflows';
import { registerAutomationRoutes } from './automation';
import { registerPublicApiRoutes } from './publicApi';
import { registerDataModelRoutes } from './dataModel';
import { billingRoutes } from './billing';
import openclawRoutes from './openclaw';
import analyticsRoutes from './analytics';
import authRoutes from './auth';
import companiesRoutes from './companies';
import openaiRoutes from './openai';
import openaiResponsesRoutes from './openaiResponses';
import assistantsRoutes from './assistants';
import whitelabelRoutes from './whitelabel';

// Import register functions
import { registerMessagingRoutes } from './messaging';
import { registerPhoneRoutes } from './phone';
import { registerVideoRoutes } from './videos';
import { registerAppointmentRoutes } from './appointments';
import { registerAIPricingRoutes } from './aiPricing';
import { registerAIRoutes } from './ai';
import { registerApiKeyRoutes } from './apiKeys';
import { registerAISalesToolsRoutes } from './aiSalesTools';
import { registerAICommunicationRoutes } from './aiCommunication';
import { registerAIContentRoutes } from './aiContent';
import { registerAIProductivityRoutes } from './aiProductivity';
import { registerAIAdvancedRoutes } from './aiAdvanced';
import { registerAIAutomationRoutes } from './aiAutomation';
import { registerPartnersRoutes } from './partners';
import { registerAIJobRoutes } from './aiJobs';

export async function registerRoutes(app: Express): Promise<void> {
  // Register authentication routes
  console.log('Registering auth routes at /api/auth');
  app.use('/api/auth', authRoutes);

  // Register CRM routes
  registerCRMRoutes(app);

  // Register workflow routes
  registerWorkflowRoutes(app);
  registerAutomationRoutes(app);
  registerDataModelRoutes(app);

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

  // Register OpenAI Responses API routes
  console.log('Registering OpenAI Responses API routes at /api/openai');
  app.use('/api/openai', openaiResponsesRoutes);

  // Assistants (Responses API: saved configs + chained threads)
  app.use('/api/assistants', assistantsRoutes);

  // Register white-label settings propagation routes
  console.log('Registering white-label routes at /api/whitelabel');
  app.use('/api/whitelabel', whitelabelRoutes);

  // Register API key routes
  console.log('Registering API key routes');
  registerApiKeyRoutes(app);

  // Register AI Sales Tools routes
  console.log('Registering AI Sales Tools routes');
  registerAISalesToolsRoutes(app);

  // Register AI Communication Tools routes
  console.log('Registering AI Communication Tools routes');
  registerAICommunicationRoutes(app);

  // Register Content & Marketing Tools routes
  console.log('Registering Content & Marketing Tools routes');
  registerAIContentRoutes(app);

  // Register Meeting & Productivity Tools routes
  console.log('Registering Meeting & Productivity Tools routes');
  registerAIProductivityRoutes(app);

  // Register Advanced AI Tools routes
  console.log('Registering Advanced AI Tools routes');
  registerAIAdvancedRoutes(app);

  // Register Automation Tools routes
  console.log('Registering Automation Tools routes');
  registerAIAutomationRoutes(app);

  // Register AI jobs routes (Netlify background function backed)
  registerAIJobRoutes(app);

  // Register partners routes
  console.log('Registering partners routes');
  registerPartnersRoutes(app);
}
