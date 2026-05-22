#!/usr/bin/env node
// Apply pending migrations to Supabase remote database

import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
const MIGRATIONS_DIR = path.join(process.cwd(), 'supabase/migrations');

const pool = new Pool({ connectionString: DATABASE_URL });

function getVersion(filename) {
  const match = filename.match(/^(\d+)_.*\.sql$/);
  return match ? match[1] : null;
}

async function getAppliedVersions(client) {
  const res = await client.query(`SELECT version FROM supabase_migrations.schema_migrations`);
  return res.rows.map(r => r.version);
}

async function applyMigration(client, filepath, version, name) {
  const sql = fs.readFileSync(filepath, 'utf-8');
  // Split by statement delimiter
  const statements = sql.split(/--\s*statement-breakpoint/).filter(s => s.trim());

  await client.query('BEGIN');
  try {
    for (const stmt of statements) {
      const trimmed = stmt.trim();
      if (!trimmed) continue;
      try {
        await client.query(trimmed);
      } catch (err) {
        console.error(`   Statement error: ${err.message}`);
        console.error(`   SQL (first 200 chars): ${trimmed.slice(0, 200)}`);
        throw err;
      }
    }

    // Record in supabase_migrations
    await client.query(
      `INSERT INTO supabase_migrations.schema_migrations (version, name, statements) VALUES ($1, $2, $3)`,
      [version, name, statements]
    );

    await client.query('COMMIT');
    console.log(`   ✅ ${name}`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  }
}

async function main() {
  const client = await pool.connect();
  try {
    console.log('🔍 Loading migrations...\n');
    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort();

    console.log(`Found ${files.length} migration files\n`);

    const appliedVersions = await getAppliedVersions(client);
    console.log(`Already applied: ${appliedVersions.length} migrations\n`);

    let toApply = 0;
    for (const filename of files) {
      const version = getVersion(filename);
      if (!version) continue;
      if (appliedVersions.includes(version)) continue;
      toApply++;
    }

    if (toApply === 0) {
      console.log('✅ All migrations already applied');
      return;
    }

    console.log(`🚀 Applying ${toApply} migrations...\n`);

    for (const filename of files) {
      const version = getVersion(filename);
      if (!version) continue;
      if (appliedVersions.includes(version)) continue;

      const filepath = path.join(MIGRATIONS_DIR, filename);
      const name = filename.replace(/^\d+_/, '').replace('.sql', '');

      try {
        await applyMigration(client, filepath, version, filename);
      } catch (err) {
        console.error(`\n❌ Migration ${filename} failed: ${err.message}\n`);
        console.error('Run the script again to retry remaining migrations after fixing.\n');
        process.exit(1);
      }
    }

    console.log(`\n✅ Applied ${toApply} migrations successfully\n`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});