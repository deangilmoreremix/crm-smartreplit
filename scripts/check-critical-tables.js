#!/usr/bin/env node
// Check for critical CRM tables in the database

import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
const pool = new Pool({ connectionString: DATABASE_URL });

async function check() {
  const client = await pool.connect();
  try {
    const tables = [
      'contacts', 'contact_activities', 'deals', 'tasks', 'appointments',
      'messages', 'notes', 'documents', 'user_entitlements', 'enrichment_cache',
      'contact_custom_fields', 'custom_field_definitions'
    ];

    console.log('Checking for critical CRM tables...\n');
    for (const t of tables) {
      const res = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = '${t}'
        ) as exists
      `);
      const exists = res.rows[0].exists;
      console.log(`  ${exists ? '✅' : '❌'} public.${t}`);
    }

    // Also check functions
    console.log('\nChecking for critical functions...');
    const funcs = ['check_rate_limit', 'log_admin_action', 'handle_new_user', 'update_contact_score'];
    for (const f of funcs) {
      const res = await client.query(`
        SELECT EXISTS (
          SELECT FROM pg_proc p 
          JOIN pg_namespace n ON p.pronamespace = n.oid
          WHERE n.nspname = 'public' AND p.proname = '${f}'
        ) as exists
      `);
      const exists = res.rows[0].exists;
      console.log(`  ${exists ? '✅' : '❌'} ${f}()`);
    }

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

check().catch(console.error);