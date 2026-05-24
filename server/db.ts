import { drizzle } from 'drizzle-orm/postgres-js';
import { Pool } from 'pg';
import * as schema from '../shared/schema';

// Database connection — fail fast if DATABASE_URL is set but connection fails
let pool: Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;
let dbPromise: Promise<void> | null = null;

function initDb(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️  DATABASE_URL not set — database features disabled');
    return Promise.resolve();
  }
  if (dbPromise) return dbPromise;
  dbPromise = (async () => {
    try {
      pool = new Pool({ connectionString: process.env.DATABASE_URL });
      await pool.query('SELECT 1');
      db = drizzle(pool, { schema });
      console.log('✅ Database connected successfully');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  })();
  return dbPromise;
}

if (process.env.DATABASE_URL) {
  initDb().catch(() => {});
}

export { pool, db, initDb };
export const isDbAvailable = () => pool !== null && db !== null;
export const waitForDb = () => initDb();