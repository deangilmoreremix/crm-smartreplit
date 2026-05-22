// Tests for EventBus
import { eventBus } from '../federation/EventBus';

describe('EventBus', () => {
  beforeEach(() => {
    // Clear all listeners before each test
    (eventBus as any).listeners.clear();
  });

  afterEach(() => {
    (eventBus as any).listeners.clear();
  });

  describe('subscribe and publish', () => {
    it('calls subscriber when event is published', () => {
      const handler = jest.fn();
      eventBus.subscribe('test-event', handler);
      
      eventBus.publish({
        type: 'test-event',
        payload: { value: 42 },
        source: 'test'
      });

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'test-event',
          payload: { value: 42 },
          source: 'test'
        })
      );
    });

    it('adds timestamp to published event', () => {
      const handler = jest.fn();
      eventBus.subscribe('timed-event', handler);
      
      const before = Date.now();
      eventBus.publish({
        type: 'timed-event',
        payload: {},
        source: 'test'
      });
      const after = Date.now();

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          timestamp: expect.any(Number)
        })
      );
      
      const call = handler.mock.calls[0][0];
      expect(call.timestamp).toBeGreaterThanOrEqual(before);
      expect(call.timestamp).toBeLessThanOrEqual(after);
    });

    it('supports multiple subscribers', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      
      eventBus.subscribe('multi', handler1);
      eventBus.subscribe('multi', handler2);
      
      eventBus.publish({ type: 'multi', payload: {}, source: 'test' });

      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });

    it('returns unsubscribe function', () => {
      const handler = jest.fn();
      const unsubscribe = eventBus.subscribe('unsub', handler);
      
      eventBus.publish({ type: 'unsub', payload: {}, source: 'test' });
      expect(handler).toHaveBeenCalledTimes(1);
      
      unsubscribe();
      
      eventBus.publish({ type: 'unsub', payload: {}, source: 'test' });
      expect(handler).toHaveBeenCalledTimes(1); // Still 1, not called again
    });
  });

  describe('publish different event types', () => {
    it('only calls subscribers for matching event type', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      
      eventBus.subscribe('event-a', handler1);
      eventBus.subscribe('event-b', handler2);
      
      eventBus.publish({ type: 'event-a', payload: {}, source: 'test' });

      expect(handler1).toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });
  });
});

describe('EventBus request/response', () => {
  it('can make request and receive response', async () => {
    // Setup handler for the request
    eventBus.onRequest('test-app', async (action) => {
      if (action === 'getData') return { items: [1, 2, 3] };
      throw new Error('Unknown action');
    });

    const result = await eventBus.request('test-app', 'getData');
    
    expect(result).toEqual({ items: [1, 2, 3] });
  });

  it('rejects on timeout', async () => {
    await expect(
      eventBus.request('nonexistent-app', 'test')
    ).rejects.toThrow('timed out');
  });
});