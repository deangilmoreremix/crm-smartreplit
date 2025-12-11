import { Express } from 'express';
import openaiRouter from './openai';

export function registerRoutes(app: Express) {
  // Register API routes
  app.use(openaiRouter);

  return app;
}