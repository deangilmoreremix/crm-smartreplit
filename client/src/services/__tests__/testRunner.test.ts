import { describe, it, expect } from 'vitest';
import { unifiedEventSystem } from '../unifiedEventSystem';

// This file was an empty placeholder (it made the suite fail with "No test suite found").
// It now smoke-tests the public surface that the console scripts in this folder
// (manual-test.console.js, system-demo.console.js) rely on.
describe('unifiedEventSystem public API', () => {
  it('exposes the methods used by the console scripts', () => {
    for (const method of [
      'registerHandler',
      'emit',
      'getEventHistory',
      'clearEventHistory',
      'getQueueStatus',
      'getActiveHandlersCount',
    ]) {
      expect(typeof (unifiedEventSystem as any)[method]).toBe('function');
    }
  });
});
