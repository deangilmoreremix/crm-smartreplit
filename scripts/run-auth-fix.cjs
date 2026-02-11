#!/usr/bin/env node
/**
 * Run auth trigger fix SQL on Supabase
 */

const { Pool } = require('pg');

// Use the DATABASE_URL from environment
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres.gadedbrnqzpfqtsdfzcg:ParkerDean0805!@aws-0-us-east-1.pooler.supabase.com:5432/postgres';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 60000,
  idleTimeoutMillis: 60000,
});

const authFixSQL = `
-- AUTH TRIGGER FIX
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE user_email text; user_role text;
BEGIN
  user_email := NEW.email;
  IF user_email IN ('dean@videoremix.io', 'victor@videoremix.io', 'samuel@videoremix.io', 'jvzoo@gmail.com') THEN
    user_role := 'super_admin';
  ELSE
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'regular_user');
  END IF;
  INSERT INTO public.profiles (id, username, first_name, last_name, role, app_context, email_template_set, created_at, updated_at)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
          NEW.raw_user_meta_data->>'first_name', NEW.raw_user_meta_data->>'last_name', user_role,
          COALESCE(NEW.raw_user_meta_data->>'app_context', 'smartcrm'),
          COALESCE(NEW.raw_user_meta_data->>'email_template_set', 'smartcrm'), NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.profiles (id, username, first_name, last_name, role, app_context, email_template_set, created_at, updated_at)
SELECT u.id, COALESCE(u.raw_user_meta_data->>'username', split_part(u.email, '@', 1)),
       u.raw_user_meta_data->>'first_name', u.raw_user_meta_data->>'last_name',
       CASE WHEN u.email IN ('dean@videoremix.io', 'victor@videoremix.io', 'samuel@videoremix.io') THEN 'super_admin'
            ELSE COALESCE(u.raw_user_meta_data->>'role', 'regular_user') END,
       COALESCE(u.raw_user_meta_data->>'app_context', 'smartcrm'),
       COALESCE(u.raw_user_meta_data->>'email_template_set', 'smartcrm'),
       COALESCE(u.created_at, NOW()), NOW()
FROM auth.users u LEFT JOIN public.profiles p ON u.id = p.id WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;
`;

async function runAuthFix() {
  console.log('Connecting to Supabase database...');
  let client;
  try {
    client = await pool.connect();
    console.log('Connected! Running auth fix...');

    await client.query(authFixSQL);
    console.log('✅ Auth fix applied!');

    const result = await client.query("SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created'");
    if (result.rows.length > 0) {
      console.log('✅ Trigger "on_auth_user_created" exists');
    }

    const count = await client.query('SELECT COUNT(*) as count FROM public.profiles');
    console.log(`Total profiles: ${count.rows[0].count}`);

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

runAuthFix();
