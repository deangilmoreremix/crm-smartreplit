import { drizzle } from 'drizzle-orm/postgres-js';
import { Pool } from 'pg';
import * as schema from '../shared/schema';

// Database connection — fail fast if DATABASE_URL is set but connection fails
let pool: Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;

if (process.env.DATABASE_URL) {
  try {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    // Test connection — this will throw if DB is unreachable or credentials invalid
    await pool.query('SELECT 1');
    db = drizzle(pool, { schema });
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error; // Fail fast — don't continue without DB
  }
} else {
  console.warn('⚠️  DATABASE_URL not set — database features disabled');
}

export { pool, db };
export const isDbAvailable = () => pool !== null && db !== null;