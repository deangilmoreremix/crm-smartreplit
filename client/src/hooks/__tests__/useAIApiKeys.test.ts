import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

vi.mock('../../store/authStore', () => ({
  useAuthStore: () => ({ user: { id: 'user-1' } }),
}));

import { useAIApiKeys } from '../useAIApiKeys';

const jsonResponse = (body: any, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('useAIApiKeys', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn(async () =>
      jsonResponse({ keys: [{ id: 'k1', provider: 'openai', apiKey: 'sk-a****wxyz', model: 'gpt-6-luna' }] })
    );
    global.fetch = fetchMock as any;
  });

  it('loads the stored OpenAI key from /api/user/api-keys', async () => {
    const { result } = renderHook(() => useAIApiKeys());
    await waitFor(() => expect(result.current.apiConfig.openai.apiKey).toBe('sk-a****wxyz'));
    expect(fetchMock).toHaveBeenCalledWith('/api/user/api-keys');
  });

  it('POSTs a new key to /api/user/api-keys', async () => {
    const { result } = renderHook(() => useAIApiKeys());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let ok = false;
    await act(async () => {
      ok = await result.current.saveApiKeys({
        openai: { apiKey: 'sk-newkey1234567890', model: 'gpt-6.1-sol' },
        openclaw: { apiKey: '', model: 'default', baseUrl: '' },
      });
    });

    expect(ok).toBe(true);
    const post = fetchMock.mock.calls.find(([, init]: any[]) => init?.method === 'POST');
    expect(post?.[0]).toBe('/api/user/api-keys');
    expect(JSON.parse(post?.[1].body)).toEqual({ provider: 'openai', apiKey: 'sk-newkey1234567890', model: 'gpt-6.1-sol' });
  });

  it('does not re-send a masked key', async () => {
    const { result } = renderHook(() => useAIApiKeys());
    await waitFor(() => expect(result.current.apiConfig.openai.apiKey).toBe('sk-a****wxyz'));

    await act(async () => {
      await result.current.saveApiKeys({
        openai: { apiKey: 'sk-a****wxyz', model: 'gpt-6-luna' },
        openclaw: { apiKey: '', model: 'default', baseUrl: '' },
      });
    });

    expect(fetchMock.mock.calls.some(([, init]: any[]) => init?.method === 'POST')).toBe(false);
  });
});
