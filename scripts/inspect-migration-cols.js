#!/usr/bin/env node
// Get columns of supabase_migrations.schema_migrations

import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
const pool = new Pool({ connectionString: DATABASE_URL });

(async () => {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'supabase_migrations'
        AND table_name = 'schema_migrations'
      ORDER BY ordinal_position
    `);
    console.log('Columns in supabase_migrations.schema_migrations:');
    res.rows.forEach(c => console.log(`  ${c.column_name} (${c.data_type})`));
  } catch (err) {
    console.error(err.message);
  } finally {
    client.release();
    await pool.end();
  }
})();