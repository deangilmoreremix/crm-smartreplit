import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../shared/schema';

// Database is optional - will be initialized when DATABASE_URL is available
export const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : null;
export const db = pool ? drizzle(pool, { schema }) : null;

// Helper to check if database is available
export const isDbAvailable = (): boolean => pool !== null && db !== null;
