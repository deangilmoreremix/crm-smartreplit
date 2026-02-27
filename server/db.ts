import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from '../shared/schema';

neonConfig.webSocketConstructor = ws;

// Database is optional - will be initialized when DATABASE_URL is available
export const pool = process.env.DATABASE_URL 
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : null;
export const db = pool 
  ? drizzle({ client: pool, schema })
  : null;

// Helper to check if database is available
export const isDbAvailable = (): boolean => pool !== null && db !== null;
