import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../shared/schema';

// Database is optional - will be initialized when DATABASE_URL is available
const client = process.env.DATABASE_URL ? postgres(process.env.DATABASE_URL) : null;
export const db = client ? drizzle({ client, schema }) : null;
export const pool = null; // Keep for compatibility if needed

// Helper to check if database is available
export const isDbAvailable = (): boolean => client !== null && db !== null;
