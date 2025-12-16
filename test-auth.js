// Quick authentication verification script
console.log('🔍 Authentication Verification Script');
console.log('=====================================\n');

// Test password validation
console.log('1. Testing Password Validation:');
try {
  // Import the password validation function
  const { validatePassword } = await import('./client/src/utils/passwordValidation.ts');

  const testPasswords = [
    { password: 'password', expected: 'weak' },
    { password: 'Password123', expected: 'medium' },
    { password: 'MySecureP@ssw0rd2024!', expected: 'strong' },
    { password: 'weak', expected: 'weak' }
  ];

  testPasswords.forEach(({ password, expected }) => {
    const result = validatePassword(password);
    const status = result.strength === expected ? '✅' : '❌';
    console.log(`  ${status} "${password}" → ${result.strength} (${result.score}/100)`);
    if (!result.valid && result.errors.length > 0) {
      console.log(`    Errors: ${result.errors.join(', ')}`);
    }
  });
} catch (error) {
  console.log('  ❌ Password validation test failed:', error.message);
}

console.log('\n2. Checking localStorage state:');
try {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    const authTokens = {
      supabase: !!localStorage.getItem('supabase.auth.token'),
      smartcrm: !!localStorage.getItem('smartcrm-auth-token'),
      devSession: !!localStorage.getItem('dev-user-session'),
      onboarding: Object.keys(localStorage).filter(key => key.startsWith('onboarding-')).length > 0
    };

    console.log('  Auth tokens present:', authTokens);
  } else {
    console.log('  ℹ️  Running in Node.js environment - localStorage not available');
  }
} catch (error) {
  console.log('  ❌ localStorage check failed:', error.message);
}

console.log('\n3. Testing import availability:');
const modulesToTest = [
  './client/src/utils/passwordValidation.ts',
  './client/src/hooks/useOnboarding.ts',
  './client/src/components/UpgradePrompt.tsx',
  './client/src/components/AccessGate.tsx'
];

for (const modulePath of modulesToTest) {
  try {
    await import(modulePath);
    console.log(`  ✅ ${modulePath} - Import successful`);
  } catch (error) {
    console.log(`  ❌ ${modulePath} - Import failed: ${error.message}`);
  }
}

console.log('\n4. Configuration check:');
try {
  const { featureTiers } = await import('./client/src/config/featureTiers.ts');
  console.log(`  ✅ Feature tiers loaded: ${Object.keys(featureTiers).length} features configured`);

  // Check if tiers are properly structured
  const sampleFeature = 'aiTools';
  if (featureTiers[sampleFeature]) {
    console.log(`  ✅ Sample feature "${sampleFeature}" has ${featureTiers[sampleFeature].length} allowed tiers`);
  }
} catch (error) {
  console.log('  ❌ Feature tiers check failed:', error.message);
}

console.log('\n5. Role-based access check:');
try {
  // This would require a full React context, so we'll just check the file exists
  await import('./client/src/components/RoleBasedAccess.tsx');
  console.log('  ✅ RoleBasedAccess component available');
} catch (error) {
  console.log('  ❌ RoleBasedAccess check failed:', error.message);
}

console.log('\n=====================================');
console.log('🎉 Authentication verification complete!');
console.log('\nNext steps:');
console.log('1. Start the dev server: npm run dev');
console.log('2. Test signup at /signup - check password strength indicator');
console.log('3. Login and check dashboard for onboarding widget');
console.log('4. Test feature access with different user tiers');