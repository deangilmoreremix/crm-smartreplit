/**
 * Memory Service Stub
 * Dummy implementation for testing when AgentMemory is not available
 */

class MemoryService {
  async recordObservation(
    _userId: string,
    _type: string,
    _content: string,
    _metadata?: Record<string, any>
  ): Promise<void> {
    // no-op stub
  }

  isEnabled(): boolean {
    return false;
  }

  async recordChatInteraction(
    _userId: string,
    _sessionId: string,
    _input: string,
    _output: string,
    _metadata?: Record<string, any>
  ): Promise<void> {
    // no-op stub
  }

  async recordSystemEvent(
    _eventType: string,
    _content: string,
    _metadata?: Record<string, any>
  ): Promise<void> {
    // no-op stub
  }
}

export const memoryService = new MemoryService();
