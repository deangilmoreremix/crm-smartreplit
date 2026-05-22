#!/usr/bin/env node
// Supabase Schema Audit — Verifies database health

import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not set');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

async function audit() {
  const client = await pool.connect();
  try {
    console.log('🔍 Auditing Supabase database schema...\n');

    // Tables
    console.log('=== Tables ===');
    const tables = await client.query(`
      SELECT schemaname, tablename
      FROM pg_tables
      WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
      ORDER BY schemaname, tablename
    `);
    console.log(`Found ${tables.rowCount} tables:`);
    for (const t of tables.rows) {
      const count = await client.query(`SELECT COUNT(*) as cnt FROM ${t.schemaname}.${t.tablename}`);
      console.log(`  ✅ ${t.schemaname}.${t.tablename} — ${count.rows[0].cnt} rows`);
    }
    console.log('');

    // Indexes
    console.log('=== Indexes ===');
    const indexes = await client.query(`
      SELECT schemaname, tablename, indexname
      FROM pg_indexes
      WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
      ORDER BY schemaname, tablename
    `);
    indexes.rows.forEach(i => {
      console.log(`  ${i.schemaname}.${i.tablename} → ${i.indexname}`);
    });
    console.log(`  (${indexes.rowCount} total)`);
    console.log('');

    // Functions
    console.log('=== Functions ===');
    const funcs = await client.query(`
      SELECT routine_name, routine_type
      FROM information_schema.routines
      WHERE routine_schema = 'public'
      ORDER BY routine_name
    `);
    const critical = ['check_rate_limit', 'log_admin_action', 'generate_tenant_id', 'update_updated_at', 'handle_new_user', 'update_contact_score'];
    funcs.rows.forEach(f => {
      const mark = critical.includes(f.routine_name) ? '★' : ' ';
      console.log(`  ${mark} ${f.routine_name} (${f.routine_type})`);
    });
    console.log(`  (${funcs.rowCount} total)`);
    console.log('');

    // Triggers
    console.log('=== Triggers ===');
    const trgs = await client.query(`
      SELECT event_object_table, trigger_name, event_manipulation
      FROM information_schema.triggers
      WHERE trigger_schema = 'public'
      ORDER BY event_object_table
    `);
    trgs.rows.forEach(t => {
      console.log(`  ${t.event_object_table} → ${t.trigger_name} (${t.event_manipulation})`);
    });
    console.log(`  (${trgs.rowCount} total)`);
    console.log('');

    // RLS
    console.log('=== RLS Policies ===');
    const policies = await client.query(`
      SELECT tablename, policyname, cmd
      FROM pg_policies
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);
    policies.rows.forEach(p => {
      console.log(`  ${p.tablename}: ${p.policyname} (${p.cmd})`);
    });
    console.log(`  (${policies.rowCount} total)`);
    console.log('');

    // Extensions
    console.log('=== Extensions ===');
    const exts = await client.query(`
      SELECT name, installed_version
      FROM pg_available_extensions
      WHERE name IN ('uuid-ossp', 'pgcrypto', 'pg_trgm', 'vector')
      ORDER BY name
    `);
    exts.rows.forEach(e => {
      console.log(`  ${e.name} — v${e.installed_version}`);
    });
    console.log('');

    console.log('✅ Schema audit complete\n');
  } catch (err) {
    console.error('❌ Audit failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

audit().catch(console.error);