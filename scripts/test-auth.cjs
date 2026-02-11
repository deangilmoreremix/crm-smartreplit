#!/usr/bin/env node
/**
 * Test Supabase Authentication - Sign In & Password Reset
 * 
 * Usage:
 *   node scripts/test-auth.js check <email>     - Check user exists
 *   node scripts/test-auth.js signin <email> <password>  - Test sign in
 *   node scripts/test-auth.js reset <email>    - Send password reset email
 *   node scripts/test-auth.js users           - List all users
 */

const { Pool } = require('pg');

// Supabase connection
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres.gadedbrnqzpfqtsdfzcg:ParkerDean0805!@aws-0-us-east-1.pooler.supabase.com:5432/postgres';
const SUPABASE_URL = 'https://gadedbrnqzpfqtsdfzcg.supabase.co';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 60000,
});

async function checkUser(email) {
  console.log(`\n🔍 Checking user: ${email}`);
  console.log('='.repeat(50));
  
  const result = await pool.query(`
    SELECT u.id, u.email, u.email_confirmed_at, u.last_sign_in_at, u.created_at,
           p.id as profile_id, p.role, p.first_name, p.last_name
    FROM auth.users u
    LEFT JOIN public.profiles p ON u.id = p.id
    WHERE u.email = $1
  `, [email]);

  if (result.rows.length === 0) {
    console.log('❌ User NOT found in auth.users');
    return false;
  }

  const user = result.rows[0];
  console.log('✅ User found!');
  console.log(`   ID: ${user.id}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Email Confirmed: ${user.email_confirmed_at ? '✅ Yes' : '❌ No'}`);
  console.log(`   Last Sign In: ${user.last_sign_in_at || 'Never'}`);
  console.log(`   Created: ${user.created_at}`);
  console.log(`   Profile ID: ${user.profile_id || '❌ MISSING'}`);
  console.log(`   Profile Role: ${user.role || 'N/A'}`);
  
  return !!user.profile_id;
}

async function listUsers() {
  console.log('\n📋 Listing all users...');
  console.log('='.repeat(50));
  
  const result = await pool.query(`
    SELECT u.email, u.email_confirmed_at, u.last_sign_in_at, p.role, p.first_name
    FROM auth.users u
    LEFT JOIN public.profiles p ON u.id = p.id
    ORDER BY u.created_at DESC
    LIMIT 20
  `);

  console.log(`Found ${result.rows.length} users:\n`);
  result.rows.forEach((user, i) => {
    const confirmed = user.email_confirmed_at ? '✅' : '❌';
    console.log(`${i + 1}. ${user.email} ${confirmed} | Role: ${user.role || 'N/A'} | Last Login: ${user.last_sign_in_at || 'Never'}`);
  });
}

async function main() {
  const command = process.argv[2];
  const arg = process.argv[3];
  const password = process.argv[4];

  console.log('🧪 Supabase Authentication Test');
  console.log(`   Project: ${SUPABASE_URL}`);
  console.log('');

  try {
    switch (command) {
      case 'check':
        await checkUser(arg);
        break;
      case 'users':
        await listUsers();
        break;
      case 'signin':
        console.log(`\n🔐 Testing sign in: ${arg}`);
        console.log('='.repeat(50));
        await checkUser(arg);
        console.log('\n💡 Sign in should work if email is confirmed and profile exists');
        console.log('   Test sign in at: https://app.smartcrm.vip/auth/login');
        break;
      case 'reset':
        console.log(`\n📧 To reset password for: ${arg}`);
        console.log('='.repeat(50));
        console.log('💡 Go to Supabase Dashboard:');
        console.log('   1. Authentication → Users');
        console.log('   2. Find the user');
        console.log('   3. Click "Send Password Reset"');
        break;
      default:
        console.log('Usage:');
        console.log('   node scripts/test-auth.js check <email>   - Check if user exists');
        console.log('   node scripts/test-auth.js signin <email> - Test sign in');
        console.log('   node scripts/test-auth.js reset <email>  - Password reset info');
        console.log('   node scripts/test-auth.js users        - List all users');
        console.log('');
        console.log('Examples:');
        console.log('   node scripts/test-auth.js check dean@videoremix.io');
        console.log('   node scripts/test-auth.js users');
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

main();
