import { describe, it, expect } from 'vitest';
import { useApiStore } from '../apiStore';

describe('apiStore', () => {
  it('keeps keys in memory only and does not write them to localStorage', () => {
    useApiStore.getState().setApiKey('openai', 'sk-test');
    expect(useApiStore.getState().apiKeys.openai).toBe('sk-test');
    expect(localStorage.getItem('ai-tools-api-keys')).toBeNull();
  });
});
