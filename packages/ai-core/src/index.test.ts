import { describe, it, expect, vi } from 'vitest';
import { AIClient } from '../src/client';
import { KeyManager } from '../src/utils/key-manager';

// Mock fetch for testing
global.fetch = vi.fn();

describe('AI Core', () => {
  beforeEach(() => {
    // Clear any stored keys
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('KeyManager', () => {
    it('should encrypt and decrypt API keys', () => {
      const testKey = 'test-api-key-123';
      KeyManager.setKey('openai', testKey);

      const retrievedKey = KeyManager.getKey('openai');
      expect(retrievedKey).toBe(testKey);
    });

    it('should return null for non-existent keys', () => {
      const key = KeyManager.getKey('nonexistent');
      expect(key).toBeNull();
    });
  });

  describe('AIClient', () => {
    it('should initialize with no providers when no keys are set', () => {
      const client = new AIClient();
      expect(client.getAvailableProviders()).toHaveLength(0);
    });

    it('should detect available providers when keys are set', () => {
      KeyManager.setKey('openai', 'test-key');

      const client = new AIClient();
      expect(client.getAvailableProviders()).toContain('openai');
    });
  });
});
