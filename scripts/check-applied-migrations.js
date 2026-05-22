#!/usr/bin/env node
// Check which migrations have been applied

import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
const pool = new Pool({ connectionString: DATABASE_URL });

async function check() {
  const client = await pool.connect();
  try {
    console.log('\n=== Applied Migrations ===\n');
    const res = await client.query(`
      SELECT id, name, version, applied_at
      FROM supabase_migrations.schema_migrations
      ORDER BY applied_at DESC
    `);
    console.log(`Total applied: ${res.rowCount}\n`);
    for (const row of res.rows) {
      console.log(`  ✅ ${row.name} — v${row.version} at ${row.applied_at}`);
    }
    console.log('');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

check().catch(console.error);