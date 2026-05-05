import { drizzle } from 'drizzle-orm/postgres-js';
import { Pool } from 'pg';
import * as schema from '../shared/schema';

// Database is optional - will be initialized when DATABASE_URL is available
let pool: Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;

if (process.env.DATABASE_URL) {
  try {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle(pool, { schema });
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.warn('Database initialization failed, continuing without database:', error);
  }
}

export { pool, db };
export const isDbAvailable = () => pool !== null && db !== null;
