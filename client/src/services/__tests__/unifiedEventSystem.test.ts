import { unifiedEventSystem, UnifiedEvent } from '../unifiedEventSystem';
import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';

// The event processor runs on a real setInterval created when the module is imported, so these
// tests use real timers and wait (vi.waitFor) for the queue to drain instead of faking time.

// Simple test framework for demonstration
class TestRunner {
  private tests: Array<{ name: string; fn: () => Promise<void> }> = [];
  private results: Array<{ name: string; passed: boolean; error?: string }> = [];

  test(name: string, fn: () => Promise<void>) {
    this.tests.push({ name, fn });
  }

  async run() {
    console.log('🧪 Running Unified Event System Tests...\n');

    for (const test of this.tests) {
      try {
        await test.fn();
        this.results.push({ name: test.name, passed: true });
        console.log(`✅ ${test.name}`);
      } catch (error: any) {
        this.results.push({ name: test.name, passed: false, error: error.message });
        console.log(`❌ ${test.name}: ${error.message}`);
      }
    }

    this.printSummary();
  }

  private printSummary() {
    const passed = this.results.filter((r) => r.passed).length;
    const total = this.results.length;

    console.log(`\n📊 Test Results: ${passed}/${total} tests passed`);

    if (passed === total) {
      console.log('🎉 All tests passed!');
    } else {
      console.log('⚠️  Some tests failed. Check the output above.');
    }
  }
}

const testRunner = new TestRunner();

describe('UnifiedEventSystem', () => {
  let mockHandler: (event: UnifiedEvent) => void;
  let handlerCalls: UnifiedEvent[] = [];
  let unsubscribe: () => void;

  beforeEach(() => {
    vi.useRealTimers();
    handlerCalls = [];
    mockHandler = (event: UnifiedEvent) => {
      handlerCalls.push(event);
    };
    // Clear any existing handlers
    (unifiedEventSystem as any)['eventHandlers'].clear();
    (unifiedEventSystem as any)['eventQueue'] = [];
    (unifiedEventSystem as any)['eventHistory'] = [];
  });

  afterEach(() => {
    if (unsubscribe) {
      unsubscribe();
    }
  });

  describe('Event Registration and Emission', () => {
    test('should register and handle events correctly', async () => {
      // Register event handler
      unsubscribe = unifiedEventSystem.registerHandler({
        id: 'test-handler',
        handler: mockHandler,
        priority: 10,
      });

      // Emit event
      await unifiedEventSystem.emit({
        type: 'TEST_EVENT',
        source: 'test-source',
        data: { message: 'test data' },
        priority: 'medium',
      });

      // Wait for event processing
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Verify handler was called
      if (handlerCalls.length !== 1) {
        throw new Error(`Expected 1 handler call, got ${handlerCalls.length}`);
      }

      const event = handlerCalls[0];
      if (event.type !== 'TEST_EVENT') {
        throw new Error(`Expected event type 'TEST_EVENT', got '${event.type}'`);
      }
      if (event.source !== 'test-source') {
        throw new Error(`Expected source 'test-source', got '${event.source}'`);
      }
      if (!event.id || typeof event.id !== 'string') {
        throw new Error('Event should have a valid ID');
      }
      if (!event.timestamp || typeof event.timestamp !== 'number') {
        throw new Error('Event should have a valid timestamp');
      }
    });

    test('should handle event filters correctly', async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      // Register handlers with different filters
      unifiedEventSystem.registerHandler({
        id: 'handler1',
        handler: handler1,
        priority: 10,
        filters: { type: 'FILTERED_EVENT' },
      });

      unifiedEventSystem.registerHandler({
        id: 'handler2',
        handler: handler2,
        priority: 10,
        filters: { source: 'other-source' },
      });

      // Emit event that should only match handler1
      await unifiedEventSystem.emit({
        type: 'FILTERED_EVENT',
        source: 'test-source',
        data: {},
      });

      await vi.waitFor(() => expect(handler1).toHaveBeenCalledTimes(1));
      expect(handler2).toHaveBeenCalledTimes(0);
    });

    test('should handle event priorities correctly', async () => {
      const callOrder: string[] = [];

      const handler1 = vi.fn(() => callOrder.push('low'));
      const handler2 = vi.fn(() => callOrder.push('high'));

      unifiedEventSystem.registerHandler({
        id: 'low-priority',
        handler: handler1,
        priority: 5,
      });

      unifiedEventSystem.registerHandler({
        id: 'high-priority',
        handler: handler2,
        priority: 15,
      });

      await unifiedEventSystem.emit({
        type: 'PRIORITY_TEST',
        source: 'test',
        data: {},
      });

      // High priority should be called first
      await vi.waitFor(() => expect(callOrder).toEqual(['high', 'low']));
    });
  });

  describe('Event Targeting', () => {
    test('should emit events to specific targets', async () => {
      const mockTargetHandler = vi.fn();

      unifiedEventSystem.registerHandler({
        id: 'target-handler',
        handler: mockTargetHandler,
        priority: 10,
        filters: { target: 'specific-target' },
      });

      await unifiedEventSystem.emitTo('specific-target', {
        type: 'TARGETED_EVENT',
        source: 'test',
        data: { targeted: true },
      });

      await vi.waitFor(() => expect(mockTargetHandler).toHaveBeenCalledTimes(1));
      expect(mockTargetHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          target: 'specific-target',
          type: 'TARGETED_EVENT',
        })
      );
    });
  });

  describe('Event History and TTL', () => {
    test('should maintain event history with size limits', async () => {
      // Set max history to 3 for testing
      unifiedEventSystem['maxHistorySize'] = 3;

      // Emit 5 events
      for (let i = 0; i < 5; i++) {
        await unifiedEventSystem.emit({
          type: 'HISTORY_TEST',
          source: 'test',
          data: { index: i },
        });
      }

      const history = unifiedEventSystem.getEventHistory();
      expect(history).toHaveLength(3);
      // History is chronological (oldest first)
      expect(history[0].data.index).toBe(2); // Oldest remaining
      expect(history[2].data.index).toBe(4); // Most recent
    });

    test('should respect TTL for events', async () => {
      const handler = vi.fn();

      unifiedEventSystem.registerHandler({
        id: 'ttl-handler',
        handler,
        priority: 10,
      });

      // Only fake Date: the processor's real interval keeps running, but sees a clock that
      // has moved past the event's TTL by the time it dequeues the event.
      vi.useFakeTimers({ toFake: ['Date'] });
      try {
        await unifiedEventSystem.emit({
          type: 'TTL_TEST',
          source: 'test',
          data: {},
          ttl: 1000, // 1 second
        });

        vi.setSystemTime(Date.now() + 1500);

        // A follow-up event without TTL is processed after the expired one (FIFO queue)
        const followUp = vi.fn();
        unifiedEventSystem.registerHandler({
          id: 'ttl-follow-up',
          handler: followUp,
          priority: 1,
          filters: { type: 'TTL_FOLLOW_UP' },
        });
        await unifiedEventSystem.emit({
          type: 'TTL_FOLLOW_UP',
          source: 'test',
          data: {},
          priority: 'medium',
        });
        await vi.waitFor(() => expect(followUp).toHaveBeenCalledTimes(1));

        // Handler should not be called due to expired TTL
        expect(handler).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'TTL_TEST' }));
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle handler errors gracefully', async () => {
      const errorHandler = vi.fn(() => {
        throw new Error('Handler error');
      });
      const successHandler = vi.fn();

      unifiedEventSystem.registerHandler({
        id: 'error-handler',
        handler: errorHandler,
        priority: 10,
      });

      unifiedEventSystem.registerHandler({
        id: 'success-handler',
        handler: successHandler,
        priority: 5,
      });

      await unifiedEventSystem.emit({
        type: 'ERROR_TEST',
        source: 'test',
        data: {},
      });

      // Success handler should still be called despite the error
      await vi.waitFor(() => expect(successHandler).toHaveBeenCalledTimes(1));
      // Error handler should have been called and failed
      expect(errorHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe('System Statistics', () => {
    test('should provide accurate system statistics', async () => {
      unifiedEventSystem.registerHandler({
        id: 'stats-handler',
        handler: () => {},
        priority: 10,
      });

      await unifiedEventSystem.emit({
        type: 'STATS_TEST',
        source: 'test',
        data: {},
      });

      const queueStatus = unifiedEventSystem.getQueueStatus();
      const handlerCount = unifiedEventSystem.getActiveHandlersCount();

      expect(queueStatus).toHaveProperty('queueLength');
      expect(queueStatus).toHaveProperty('processing');
      expect(typeof handlerCount).toBe('number');
      expect(handlerCount).toBeGreaterThan(0);
    });
  });
});
