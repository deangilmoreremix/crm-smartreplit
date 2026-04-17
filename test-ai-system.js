#!/usr/bin/env node

// Test script to verify AI provider system works correctly
// Run with: node test-ai-system.js

console.log('🧪 Testing AI Provider System...\n');

// Test 1: Check if LocalKeyManager works
console.log('1. Testing LocalKeyManager...');
try {
  const { LocalKeyManager } = await import('./client/src/components/AIProviderSettings.tsx');

  // Test setting a key
  LocalKeyManager.setKey('openrouter', 'test-key-123');
  const retrieved = LocalKeyManager.getConfiguredProviders();

  if (retrieved.includes('openrouter')) {
    console.log('✅ LocalKeyManager: Key storage and retrieval works');
  } else {
    console.log('❌ LocalKeyManager: Key storage failed');
  }

  // Clean up
  localStorage.removeItem('smartcrm_api_keys');
} catch (error) {
  console.log('❌ LocalKeyManager test failed:', error.message);
}

// Test 2: Check if CentralizedAIService properly detects no keys
console.log('\n2. Testing CentralizedAIService key detection...');
try {
  const { CentralizedAIService } =
    await import('./apps/contacts/src/services/centralizedAIService.ts');

  const hasKeys = CentralizedAIService.hasConfiguredKeys();
  const availableProviders = CentralizedAIService.getAvailableProviders();

  if (!hasKeys && availableProviders.length === 0) {
    console.log('✅ CentralizedAIService: Correctly detects no configured keys');
  } else {
    console.log('❌ CentralizedAIService: Incorrectly reports configured keys');
  }
} catch (error) {
  console.log('❌ CentralizedAIService test failed:', error.message);
}

// Test 3: Check if AI proxy function exists
console.log('\n3. Testing AI proxy function...');
try {
  const fs = await import('fs');
  const path = await import('path');

  const proxyPath = path.join(process.cwd(), 'netlify/functions/ai-proxy.js');
  if (fs.existsSync(proxyPath)) {
    console.log('✅ AI proxy function exists at:', proxyPath);
  } else {
    console.log('❌ AI proxy function not found');
  }
} catch (error) {
  console.log('❌ AI proxy function check failed:', error.message);
}

console.log('\n🎉 AI System test complete!');
console.log('\n📝 Next steps:');
console.log('1. Deploy to Netlify');
console.log('2. Configure environment variables in Netlify dashboard');
console.log('3. Test AI features in the contacts app');
console.log('4. Verify users are prompted to configure their own API keys');
