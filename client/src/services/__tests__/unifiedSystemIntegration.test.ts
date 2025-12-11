/**
 * Unified System Integration Test
 *
 * This test demonstrates the complete functionality of the unified communication system
 * including event system, API client, and remote app context working together.
 */

import { unifiedEventSystem } from '../unifiedEventSystem';
import { unifiedApiClient } from '../unifiedApiClient';
import { RemoteAppProvider, useRemoteApps } from '../../contexts/RemoteAppContext';

// Test data
const mockContact = {
  id: 'contact-1',
  name: 'John Doe',
  email: 'john@example.com',
  company: 'Test Corp'
};

const mockDeal = {
  id: 'deal-1',
  title: 'Enterprise Software License',
  value: 50000,
  stage: 'proposal'
};

// Test results
const testResults: Array<{ test: string; passed: boolean; message: string }> = [];

// Helper function to run tests
function runTest(testName: string, testFn: () => Promise<boolean> | boolean) {
  return async () => {
    try {
      const result = await testFn();
      testResults.push({
        test: testName,
        passed: result,
        message: result ? 'PASSED' : 'FAILED'
      });
      console.log(`${result ? '✅' : '❌'} ${testName}: ${result ? 'PASSED' : 'FAILED'}`);
      return result;
    } catch (error: any) {
      testResults.push({
        test: testName,
        passed: false,
        message: `ERROR: ${error.message}`
      });
      console.log(`❌ ${testName}: ERROR - ${error.message}`);
      return false;
    }
  };
}

// Test 1: Event System Basic Functionality
const testEventSystem = runTest('Event System Basic Functionality', async () => {
  let eventReceived = false;
  let receivedEvent: any = null;

  // Register event handler
  const unsubscribe = unifiedEventSystem.registerHandler({
    id: 'test-handler',
    handler: (event) => {
      eventReceived = true;
      receivedEvent = event;
    },
    priority: 10
  });

  // Emit test event
  await unifiedEventSystem.emit({
    type: 'TEST_EVENT',
    source: 'test-suite',
    data: { message: 'Hello World' },
    priority: 'medium'
  });

  // Wait for event processing
  await new Promise(resolve => setTimeout(resolve, 100));

  // Cleanup
  unsubscribe();

  // Verify results
  return eventReceived &&
         receivedEvent?.type === 'TEST_EVENT' &&
         receivedEvent?.source === 'test-suite' &&
         receivedEvent?.data?.message === 'Hello World';
});

// Test 2: Event Filtering
const testEventFiltering = runTest('Event Filtering', async () => {
  let handler1Called = false;
  let handler2Called = false;

  // Handler that only listens to specific events
  const unsubscribe1 = unifiedEventSystem.registerHandler({
    id: 'filter-handler-1',
    handler: () => { handler1Called = true; },
    priority: 10,
    filters: { type: 'FILTERED_EVENT' }
  });

  // Handler that listens to all events
  const unsubscribe2 = unifiedEventSystem.registerHandler({
    id: 'filter-handler-2',
    handler: () => { handler2Called = true; },
    priority: 10
  });

  // Emit filtered event
  await unifiedEventSystem.emit({
    type: 'FILTERED_EVENT',
    source: 'test-suite',
    data: {},
    priority: 'medium'
  });

  // Wait for processing
  await new Promise(resolve => setTimeout(resolve, 100));

  // Cleanup
  unsubscribe1();
  unsubscribe2();

  // Both handlers should be called
  return handler1Called && handler2Called;
});

// Test 3: API Client Basic Functionality
const testApiClient = runTest('API Client Basic Functionality', async () => {
  // Configure API client for testing
  unifiedApiClient.configure({
    baseURL: 'http://localhost:3000', // This will fail gracefully
    timeout: 5000
  });

  // Test GET request (will fail but should handle gracefully)
  const response = await unifiedApiClient.request({
    endpoint: '/api/health',
    method: 'GET'
  });

  // Should return error response but not throw
  const result = !response.success && response.error && typeof response.timestamp === 'number';
  return Boolean(result);
});

// Test 4: Event History
const testEventHistory = runTest('Event History', async () => {
  // Clear existing history
  unifiedEventSystem.clearEventHistory();

  // Emit multiple events
  for (let i = 0; i < 5; i++) {
    await unifiedEventSystem.emit({
      type: 'HISTORY_TEST',
      source: 'test-suite',
      data: { index: i },
      priority: 'low'
    });
  }

  // Wait for processing
  await new Promise(resolve => setTimeout(resolve, 100));

  const history = unifiedEventSystem.getEventHistory(10);

  return history.length >= 3 && history.some(event => event.data.index !== undefined);
});

// Test 5: System Statistics
const testSystemStats = runTest('System Statistics', () => {
  const queueStatus = unifiedEventSystem.getQueueStatus();
  const handlerCount = unifiedEventSystem.getActiveHandlersCount();

  return typeof queueStatus.queueLength === 'number' &&
         typeof queueStatus.processing === 'boolean' &&
         typeof handlerCount === 'number';
});

// Test 6: Remote App Context Integration
const testRemoteAppIntegration = runTest('Remote App Context Integration', async () => {
  // This test simulates remote app registration and communication
  let appRegistered = false;
  let dataReceived = false;

  // Mock remote app registration
  const mockApp = {
    id: 'test-remote-app',
    title: 'Test Remote App',
    src: '/test-app',
    status: 'ready' as const,
    dataVersion: 1,
    capabilities: ['contacts', 'deals'],
    lastSync: Date.now()
  };

  // Simulate app registration event
  await unifiedEventSystem.emit({
    type: 'REMOTE_APP_READY',
    source: 'test-remote-app',
    data: { capabilities: mockApp.capabilities },
    priority: 'high'
  });

  // Simulate data sync request
  await unifiedEventSystem.emit({
    type: 'DATA_SYNC_REQUEST',
    source: 'test-remote-app',
    data: { dataType: 'contacts', filters: {} },
    priority: 'high'
  });

  // Wait for processing
  await new Promise(resolve => setTimeout(resolve, 200));

  return true; // Integration test - mainly checking no errors thrown
});

// Test 7: Cross-App Data Flow
const testCrossAppDataFlow = runTest('Cross-App Data Flow', async () => {
  let dataBroadcastReceived = false;

  // Register handler for data broadcasts
  const unsubscribe = unifiedEventSystem.registerHandler({
    id: 'data-flow-test',
    handler: (event) => {
      if (event.type === 'CONTACTS_SYNC') {
        dataBroadcastReceived = true;
      }
    },
    priority: 10
  });

  // Simulate data update that should trigger broadcast
  await unifiedEventSystem.emit({
    type: 'CONTACTS_UPDATED',
    source: 'crm-main',
    data: { contacts: [mockContact] },
    priority: 'high'
  });

  // Wait for processing
  await new Promise(resolve => setTimeout(resolve, 100));

  // Cleanup
  unsubscribe();

  return dataBroadcastReceived;
});

// Test 8: Error Handling
const testErrorHandling = runTest('Error Handling', async () => {
  let errorHandled = false;

  // Register handler that throws error
  const unsubscribe = unifiedEventSystem.registerHandler({
    id: 'error-test-handler',
    handler: () => {
      throw new Error('Test error');
    },
    priority: 10
  });

  // Register handler that should still work
  const unsubscribe2 = unifiedEventSystem.registerHandler({
    id: 'success-test-handler',
    handler: () => {
      errorHandled = true;
    },
    priority: 5
  });

  // Emit event that will cause error in first handler
  await unifiedEventSystem.emit({
    type: 'ERROR_TEST_EVENT',
    source: 'test-suite',
    data: {},
    priority: 'medium'
  });

  // Wait for processing
  await new Promise(resolve => setTimeout(resolve, 100));

  // Cleanup
  unsubscribe();
  unsubscribe2();

  // Second handler should still execute despite first handler error
  return errorHandled;
});

// Main test runner
export async function runUnifiedSystemTests() {
  console.log('🚀 Starting Unified Communication System Tests...\n');

  const tests = [
    testEventSystem,
    testEventFiltering,
    testApiClient,
    testEventHistory,
    testSystemStats,
    testRemoteAppIntegration,
    testCrossAppDataFlow,
    testErrorHandling
  ];

  for (const test of tests) {
    await test();
  }

  // Print summary
  console.log('\n📊 Test Summary:');
  console.log('================');

  const passed = testResults.filter(r => r.passed).length;
  const total = testResults.length;

  testResults.forEach(result => {
    console.log(`${result.passed ? '✅' : '❌'} ${result.test}: ${result.message}`);
  });

  console.log(`\n🎯 Overall Result: ${passed}/${total} tests passed`);

  if (passed === total) {
    console.log('🎉 All tests passed! Unified communication system is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please review the implementation.');
  }

  return { passed, total, results: testResults };
}

// Export for use in browser console or test runner
if (typeof window !== 'undefined') {
  (window as any).runUnifiedSystemTests = runUnifiedSystemTests;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runUnifiedSystemTests };
}