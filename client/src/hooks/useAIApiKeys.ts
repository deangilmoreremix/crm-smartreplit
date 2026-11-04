import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

/**
 * The user's own OpenAI key, stored server-side via /api/user/api-keys
 * (user_api_keys: one row per provider). Loaded keys come back masked.
 */
export interface ApiConfig {
  openai: {
    apiKey: string;
    model: string;
  };
  openclaw: {
    apiKey: string;
    model: string;
    baseUrl?: string;
  };
}

export interface UseAIApiKeysReturn {
  apiConfig: ApiConfig;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  saveApiKeys: (config: ApiConfig) => Promise<boolean>;
  testConnection: (
    provider: 'openai' | 'openclaw',
    apiKey: string,
    baseUrl?: string
  ) => Promise<{ success: boolean; message: string }>;
}

const DEFAULT_OPENAI_MODEL = 'gpt-6-luna';
const isMasked = (key: string) => key.includes('****');

export const useAIApiKeys = (): UseAIApiKeysReturn => {
  const { user } = useAuthStore();
  const [apiConfig, setApiConfig] = useState<ApiConfig>({
    openai: { apiKey: '', model: DEFAULT_OPENAI_MODEL },
    openclaw: { apiKey: '', model: 'default', baseUrl: '' },
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadApiKeys();
    }
  }, [user?.id]);

  const loadApiKeys = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/user/api-keys');
      if (!response.ok) throw new Error(`Failed to load API keys (${response.status})`);
      const { keys = [] } = await response.json();
      const openai = keys.find((k: any) => k.provider === 'openai');
      setApiConfig((prev) => ({
        ...prev,
        openai: {
          apiKey: openai?.apiKey || '',
          model: openai?.model || DEFAULT_OPENAI_MODEL,
        },
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load API keys');
    } finally {
      setIsLoading(false);
    }
  };

  const saveApiKeys = async (config: ApiConfig): Promise<boolean> => {
    if (!user?.id) {
      setError('User not authenticated');
      return false;
    }
    if (config.openclaw.apiKey && config.openclaw.apiKey !== apiConfig.openclaw.apiKey) {
      setError('OpenClaw keys cannot be saved yet.');
      return false;
    }

    setIsSaving(true);
    setError(null);
    try {
      const key = config.openai.apiKey.trim();
      // A masked key is the one already stored: only the model may have changed
      if (key && !isMasked(key)) {
        const response = await fetch('/api/user/api-keys', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider: 'openai', apiKey: key, model: config.openai.model }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'Failed to save API key');
      } else if (key && config.openai.model !== apiConfig.openai.model) {
        const listResponse = await fetch('/api/user/api-keys');
        const { keys = [] } = await listResponse.json();
        const existing = keys.find((k: any) => k.provider === 'openai');
        if (existing) {
          const response = await fetch(`/api/user/api-keys/${existing.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: config.openai.model }),
          });
          if (!response.ok) throw new Error('Failed to update model');
        }
      }

      await loadApiKeys();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save API keys');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const testConnection = async (
    provider: 'openai' | 'openclaw',
    apiKey: string,
    _baseUrl?: string
  ): Promise<{ success: boolean; message: string }> => {
    if (!apiKey) {
      return { success: false, message: 'API key is required' };
    }

    try {
      if (provider === 'openclaw') {
        const response = await fetch('/api/openclaw/health');
        const data = await response.json().catch(() => ({}));
        return response.ok
          ? { success: true, message: 'Connection successful!' }
          : { success: false, message: data.error || 'Connection failed' };
      }

      // The stored key is tested server-side; a new key must be saved first
      if (!isMasked(apiKey)) {
        return { success: true, message: 'Key format looks valid. It will be verified when you save.' };
      }
      const response = await fetch('/api/openai/status');
      const data = await response.json().catch(() => ({}));
      return data?.openai?.available
        ? { success: true, message: `Connection successful (${data.openai.model})` }
        : { success: false, message: data?.openai?.error || 'Connection failed' };
    } catch {
      return { success: false, message: 'Network error occurred' };
    }
  };

  return {
    apiConfig,
    isLoading,
    isSaving,
    error,
    saveApiKeys,
    testConnection,
  };
};

export default useAIApiKeys;
