#!/usr/bin/env node
// Inspect supabase_migrations table structure

import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
const pool = new Pool({ connectionString: DATABASE_URL });

async function inspect() {
  const client = await pool.connect();
  try {
    // Describe table
    const cols = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'supabase_migrations' AND table_name = 'schema_migrations'
      ORDER BY ordinal_position
    `);
    console.log('supabase_migrations.schema_migrations columns:');
    cols.rows.forEach(c => console.log(`  ${c.column_name} (${c.data_type})`));

    console.log('\nActual data:');
    const data = await client.query('SELECT * FROM supabase_migrations.schema_migrations LIMIT 5');
    console.log(data.rows);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

inspect().catch(console.error);