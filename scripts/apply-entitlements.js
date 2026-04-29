import pg from 'pg';
import { readFileSync } from 'fs';

const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:VideoRemix2026@db.bzxohkrxcwodllketcpz.supabase.co:5432/postgres',
  family: 4, // Force IPv4
  ssl: { rejectUnauthorized: false },
});

async function run() {
  try {
    console.log('Connecting to Supabase...');
    await client.connect();
    console.log('✅ Connected');

    const sql = readFileSync('./supabase-seed.sql', 'utf-8');
    console.log('📝 Executing SQL (size:', sql.length, 'chars)...');
    await client.query(sql);
    console.log('✅ SQL executed');

    const res = await client.query('SELECT COUNT(*) as c FROM public.user_entitlements');
    console.log(`📊 Total entitlements: ${res.rows[0].c}`);

    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('❌', err.message);
    process.exit(1);
  }
}

run();
