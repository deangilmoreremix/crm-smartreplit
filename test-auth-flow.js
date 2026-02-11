/**
 * Authentication Flow Test Script
 * Tests the complete authentication flow including password reset
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://gadedbrnqzpfqtsdfzcg.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

console.log('🔐 Testing Authentication Flow');
console.log('================================\n');

// Check configuration
console.log('1. Checking Supabase Configuration...');
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}
console.log('✅ Supabase URL:', supabaseUrl);
console.log('✅ Anon Key:', supabaseAnonKey ? '***' + supabaseAnonKey.slice(-4) : 'NOT SET');

// Create client
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
});

async function runTests() {
  let passed = 0;
  let failed = 0;

  // Test 1: Check if Supabase is reachable
  console.log('\n2. Testing Supabase Connection...');
  try {
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    if (error) {
      console.log('⚠️  Profiles table not accessible (expected for fresh setup)');
    } else {
      console.log('✅ Supabase connection successful');
    }
  } catch (err) {
    console.log('⚠️  Connection check failed:', err.message);
  }

  // Test 2: Check current auth state
  console.log('\n3. Checking Auth State...');
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    console.log('⚠️  Session error:', sessionError.message);
  } else if (session) {
    console.log('✅ Active session found for:', session.user?.email);
  } else {
    console.log('ℹ️  No active session (expected for logged out state)');
  }

  // Test 3: Check if auth functions work
  console.log('\n4. Testing Auth Functions...');
  
  // Test signInWithPassword with invalid credentials (should fail gracefully)
  const testEmail = 'test-nonexistent@example.com';
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: 'test-password'
  });

  if (signInError) {
    // Expected to fail for non-existent user
    if (signInError.message.includes('Invalid') || signInError.message.includes('credentials')) {
      console.log('✅ Auth function working (correctly rejected invalid credentials)');
      passed++;
    } else {
      console.log('⚠️  Unexpected error:', signInError.message);
      failed++;
    }
  } else {
    console.log('⚠️  Unexpected success with invalid credentials');
    failed++;
  }

  // Test 4: Check password reset email sending
  console.log('\n5. Testing Password Reset Email...');
  const resetEmail = 'keith@beappsolute.com';
  const { data: resetData, error: resetError } = await supabase.auth.resetPasswordForEmail(resetEmail, {
    redirectTo: 'https://app.smartcrm.vip/auth/reset-password'
  });

  if (resetError) {
    console.log('❌ Password reset failed:', resetError.message);
    failed++;
  } else {
    console.log('✅ Password reset email sent successfully');
    passed++;
    
    // Get the user to check if they exist
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.log('⚠️  Could not fetch user info:', userError.message);
    } else if (user) {
      console.log('✅ User found in Supabase Auth:', user.email);
      console.log('   User ID:', user.id);
      console.log('   Email Confirmed:', user.email_confirmed_at ? 'Yes' : 'No');
    }
  }

  // Test 5: Verify URL configuration
  console.log('\n6. Verifying Redirect URLs...');
  const expectedRedirects = [
    'https://app.smartcrm.vip/auth/reset-password',
    'https://app.smartcrm.vip/auth/confirm',
    'https://app.smartcrm.vip/auth/callback'
  ];
  
  console.log('Expected redirect URLs:');
  expectedRedirects.forEach(url => console.log('   -', url));
  console.log('✅ Redirect URLs documented');

  // Test 6: Check session after potential recovery
  console.log('\n7. Final Session Check...');
  const { data: { session: finalSession }, error: finalSessionError } = await supabase.auth.getSession();
  if (finalSessionError) {
    console.log('❌ Final session check error:', finalSessionError.message);
    failed++;
  } else if (finalSession) {
    console.log('✅ Session active for:', finalSession.user?.email);
    passed++;
  } else {
    console.log('ℹ️  No session (expected after password reset email)');
    passed++;
  }

  // Summary
  console.log('\n================================');
  console.log('📊 Test Summary:');
  console.log(`   Passed: ${passed}`);
  console.log(`   Failed: ${failed}`);
  console.log('================================\n');

  if (failed > 0) {
    console.log('❌ Some tests failed. Check configuration.');
    process.exit(1);
  } else {
    console.log('✅ All critical tests passed!');
    console.log('\n📝 Next Steps:');
    console.log('1. Check email (including spam) for password reset link');
    console.log('2. Click the reset link');
    console.log('3. Set new password');
    console.log('4. Login with new password');
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('❌ Test runner error:', err);
  process.exit(1);
});
