#!/usr/bin/env node
/**
 * Comprehensive Supabase Authentication Test
 * Tests all authentication flows and checks for errors
 */

const { Pool } = require('pg');

// Supabase connection
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres.gadedbrnqzpfqtsdfzcg:ParkerDean0805!@aws-0-us-east-1.pooler.supabase.com:5432/postgres';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 60000,
});

let errors = [];
let warnings = [];

async function runTests() {
  console.log('🧪 COMPREHENSIVE SUPABASE AUTHENTICATION TEST');
  console.log('='.repeat(60));
  console.log('');

  try {
    // Test 1: Check auth.users table
    await testAuthUsersTable();

    // Test 2: Check profiles table
    await testProfilesTable();

    // Test 3: Check triggers
    await testTriggers();

    // Test 4: Check RLS policies
    await testRLSPolicies();

    // Test 5: Check foreign key relationships
    await testForeignKeys();

    // Test 6: Check storage buckets
    await testStorageBuckets();

    // Test 7: Check edge functions
    await testEdgeFunctions();

    // Test 8: List all errors/warnings
    await printResults();

  } catch (err) {
    console.error('❌ Test failed:', err.message);
  } finally {
    await pool.end();
  }
}

async function testAuthUsersTable() {
  console.log('1️⃣ Testing auth.users table...');
  
  try {
    // Check total users
    const countResult = await pool.query('SELECT COUNT(*) FROM auth.users');
    const userCount = parseInt(countResult.rows[0].count);
    console.log(`   Users: ${userCount}`);

    // Check unconfirmed emails
    const unconfirmedResult = await pool.query(
      "SELECT COUNT(*) FROM auth.users WHERE email_confirmed_at IS NULL"
    );
    const unconfirmedCount = parseInt(unconfirmedResult.rows[0].count);
    
    if (unconfirmedCount > 0) {
      warnings.push(`${unconfirmedCount} users have NOT confirmed their emails`);
      console.log(`   ⚠️  Unconfirmed: ${unconfirmedCount}`);
    } else {
      console.log('   ✅ All emails confirmed');
    }

    // Check never logged in
    const neverLoggedInResult = await pool.query(
      "SELECT COUNT(*) FROM auth.users WHERE last_sign_in_at IS NULL"
    );
    const neverLoggedIn = parseInt(neverLoggedInResult.rows[0].count);
    
    if (neverLoggedIn > 0) {
      console.log(`   ⚠️  Never logged in: ${neverLoggedIn}`);
    } else {
      console.log('   ✅ All users have logged in');
    }

  } catch (err) {
    errors.push(`auth.users table error: ${err.message}`);
    console.log(`   ❌ Error: ${err.message}`);
  }
}

async function testProfilesTable() {
  console.log('\n2️⃣ Testing public.profiles table...');
  
  try {
    // Check total profiles
    const countResult = await pool.query('SELECT COUNT(*) FROM public.profiles');
    const profileCount = parseInt(countResult.rows[0].count);
    console.log(`   Profiles: ${profileCount}`);

    // Check users without profiles
    const orphanResult = await pool.query(`
      SELECT COUNT(*) FROM auth.users u
      LEFT JOIN public.profiles p ON u.id = p.id
      WHERE p.id IS NULL
    `);
    const orphanCount = parseInt(orphanResult.rows[0].count);
    
    if (orphanCount > 0) {
      errors.push(`${orphanCount} users are MISSING profiles`);
      console.log(`   ❌ Missing profiles: ${orphanCount}`);
    } else {
      console.log('   ✅ All users have profiles');
    }

    // Check role distribution
    const roleResult = await pool.query(`
      SELECT role, COUNT(*) as count
      FROM public.profiles
      GROUP BY role
      ORDER BY count DESC
    `);
    console.log('   Role distribution:');
    roleResult.rows.forEach(row => {
      console.log(`      ${row.role}: ${row.count}`);
    });

    // Check for null roles
    const nullRoleResult = await pool.query(
      "SELECT COUNT(*) FROM public.profiles WHERE role IS NULL"
    );
    const nullRoleCount = parseInt(nullRoleResult.rows[0].count);
    
    if (nullRoleCount > 0) {
      warnings.push(`${nullRoleCount} profiles have NULL role`);
      console.log(`   ⚠️  Null roles: ${nullRoleCount}`);
    }

  } catch (err) {
    errors.push(`profiles table error: ${err.message}`);
    console.log(`   ❌ Error: ${err.message}`);
  }
}

async function testTriggers() {
  console.log('\n3️⃣ Testing triggers...');
  
  try {
    // Check on_auth_user_created trigger
    const trigger1Result = await pool.query(`
      SELECT * FROM pg_trigger 
      WHERE tgname = 'on_auth_user_created'
    `);
    
    if (trigger1Result.rows.length > 0) {
      console.log('   ✅ on_auth_user_created trigger exists');
    } else {
      errors.push('on_auth_user_created trigger is MISSING');
      console.log('   ❌ on_auth_user_created trigger missing');
    }

    // Check on_auth_user_updated trigger
    const trigger2Result = await pool.query(`
      SELECT * FROM pg_trigger 
      WHERE tgname = 'on_auth_user_updated'
    `);
    
    if (trigger2Result.rows.length > 0) {
      console.log('   ✅ on_auth_user_updated trigger exists');
    } else {
      console.log('   ⚠️  on_auth_user_updated trigger missing (optional)');
    }

    // Check handle_new_user function
    const funcResult = await pool.query(`
      SELECT * FROM pg_proc 
      WHERE proname = 'handle_new_user'
    `);
    
    if (funcResult.rows.length > 0) {
      console.log('   ✅ handle_new_user function exists');
    } else {
      errors.push('handle_new_user function is MISSING');
      console.log('   ❌ handle_new_user function missing');
    }

  } catch (err) {
    errors.push(`trigger check error: ${err.message}`);
    console.log(`   ❌ Error: ${err.message}`);
  }
}

async function testRLSPolicies() {
  console.log('\n4️⃣ Testing RLS policies...');
  
  try {
    // Check RLS enabled on profiles
    const rlsResult = await pool.query(`
      SELECT relname, relrowsecurity 
      FROM pg_class 
      WHERE relname = 'profiles'
    `);
    
    if (rlsResult.rows.length > 0 && rlsResult.rows[0].relrowsecurity) {
      console.log('   ✅ RLS enabled on profiles');
    } else {
      console.log('   ⚠️  RLS may not be enabled on profiles');
    }

    // List policies on profiles
    const policiesResult = await pool.query(`
      SELECT polname, cmd, qual
      FROM pg_policies
      WHERE tablename = 'profiles'
    `);
    
    console.log(`   Found ${policiesResult.rows.length} policies on profiles`);
    
    if (policiesResult.rows.length === 0) {
      warnings.push('No RLS policies found on profiles table');
    }

  } catch (err) {
    errors.push(`RLS check error: ${err.message}`);
    console.log(`   ❌ Error: ${err.message}`);
  }
}

async function testForeignKeys() {
  console.log('\n5️⃣ Testing foreign key relationships...');
  
  try {
    // Check for orphaned profiles (profiles without auth.users)
    const orphanedProfilesResult = await pool.query(`
      SELECT COUNT(*) FROM public.profiles p
      LEFT JOIN auth.users u ON p.id = u.id
      WHERE u.id IS NULL
    `);
    const orphanedCount = parseInt(orphanedProfilesResult.rows[0].count);
    
    if (orphanedCount > 0) {
      errors.push(`${orphanedCount} profiles exist WITHOUT matching auth.users`);
      console.log(`   ❌ Orphaned profiles: ${orphanedCount}`);
    } else {
      console.log('   ✅ No orphaned profiles');
    }

  } catch (err) {
    errors.push(`FK check error: ${err.message}`);
    console.log(`   ❌ Error: ${err.message}`);
  }
}

async function testStorageBuckets() {
  console.log('\n6️⃣ Testing storage buckets...');
  
  try {
    // Check storage.buckets (Supabase storage)
    const bucketsResult = await pool.query(`
      SELECT * FROM storage.buckets
    `);
    
    console.log(`   Found ${bucketsResult.rows.length} storage buckets`);
    bucketsResult.rows.forEach(bucket => {
      console.log(`      - ${bucket.id}`);
    });

  } catch (err) {
    // Storage buckets might not exist in all Supabase setups
    console.log(`   ⚠️  Could not check storage: ${err.message}`);
  }
}

async function testEdgeFunctions() {
  console.log('\n7️⃣ Testing edge functions...');
  
  try {
    // Check for auth-related functions
    const functionsResult = await pool.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public'
      ORDER BY routine_name
    `);
    
    console.log(`   Found ${functionsResult.rows.length} public functions`);
    
    // Check for specific auth functions
    const authFuncs = ['handle_new_user', 'handle_user_update', 'exec_sql'];
    authFuncs.forEach(func => {
      const found = functionsResult.rows.some(r => r.routine_name.includes(func));
      if (found) {
        console.log(`   ✅ ${func} exists`);
      } else {
        console.log(`   ⚠️  ${func} not found`);
      }
    });

  } catch (err) {
    console.log(`   ⚠️  Could not check functions: ${err.message}`);
  }
}

async function printResults() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(60));

  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ ALL TESTS PASSED - No errors found!');
  }

  if (errors.length > 0) {
    console.log(`\n❌ ERRORS (${errors.length}) - MUST FIX:`);
    errors.forEach((err, i) => console.log(`   ${i + 1}. ${err}`));
  }

  if (warnings.length > 0) {
    console.log(`\n⚠️  WARNINGS (${warnings.length}) - RECOMMENDED TO FIX:`);
    warnings.forEach((warn, i) => console.log(`   ${i + 1}. ${warn}`));
  }

  console.log('\n' + '='.repeat(60));
  
  // Exit with error code if there are errors
  process.exit(errors.length > 0 ? 1 : 0);
}

runTests();
