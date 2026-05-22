#!/usr/bin/env node
// List all applied migrations

import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
const pool = new Pool({ connectionString: DATABASE_URL });

(async () => {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT version, name 
      FROM supabase_migrations.schema_migrations
      ORDER BY version
    `);
    console.log(`Applied migrations (${res.rowCount}):`);
    res.rows.forEach(r => console.log(`  ${r.version} — ${r.name}`));
  } catch (err) {
    console.error(err.message);
  } finally {
    client.release();
    await pool.end();
  }
})();