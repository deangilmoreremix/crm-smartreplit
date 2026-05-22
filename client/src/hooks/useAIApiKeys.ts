import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

export interface ApiConfig {
  openai: {
    apiKey: string;
    model: string;
  };
  gemini: {
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
    provider: 'openai' | 'gemini' | 'openclaw', 
    apiKey: string, 
    baseUrl?: string
  ) => Promise<{ success: boolean; message: string }>;
}

export const useAIApiKeys = (): UseAIApiKeysReturn => {
  const { user } = useAuthStore();
  const [apiConfig, setApiConfig] = useState<ApiConfig>({
    openai: { apiKey: '', model: 'gpt-4o-mini' },
    gemini: { apiKey: '', model: 'gemini-1.5-flash' },
    openclaw: { apiKey: '', model: 'default', baseUrl: '' }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load API keys on mount
  useEffect(() => {
    if (user?.id) {
      loadApiKeys();
    }
  }, [user?.id]);

  const loadApiKeys = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('user_api_keys')
        .select(`
          openai_api_key, 
          gemini_api_key, 
          openai_model, 
          gemini_model,
          openclaw_api_key,
          openclaw_model,
          openclaw_base_url
        `)
        .eq('user_id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST113') {
        throw fetchError;
      }

      if (data) {
        setApiConfig({
          openai: {
            apiKey: data.openai_api_key || '',
            model: data.openai_model || 'gpt-4o-mini'
          },
          gemini: {
            apiKey: data.gemini_api_key || '',
            model: data.gemini_model || 'gemini-1.5-flash'
          },
          openclaw: {
            apiKey: data.openclaw_api_key || '',
            model: data.openclaw_model || 'default',
            baseUrl: data.openclaw_base_url || ''
          }
        });
      }
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

    setIsSaving(true);
    setError(null);

    try {
      const { error: saveError } = await supabase
        .from('user_api_keys')
        .upsert({
          user_id: user.id,
          openai_api_key: config.openai.apiKey,
          gemini_api_key: config.gemini.apiKey,
          openai_model: config.openai.model,
          gemini_model: config.gemini.model,
          openclaw_api_key: config.openclaw.apiKey,
          openclaw_model: config.openclaw.model,
          openclaw_base_url: config.openclaw.baseUrl || null,
          updated_at: new Date().toISOString()
        });

      if (saveError) throw saveError;

      // Refresh local state
      setApiConfig(config);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save API keys');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const testConnection = async (
    provider: 'openai' | 'gemini' | 'openclaw',
    apiKey: string,
    baseUrl?: string
  ): Promise<{ success: boolean; message: string }> => {
    if (!apiKey) {
      return { success: false, message: 'API key is required' };
    }

    try {
      let endpoint: string;
      let body: any = {};

      if (provider === 'openai') {
        endpoint = '/api/openai/status';
      } else if (provider === 'gemini') {
        endpoint = '/api/googleai/test';
        body = { prompt: 'Test connection' };
      } else {
        // OpenClaw
        endpoint = '/api/openclaw/health';
        // OpenClaw health endpoint accepts the key via Authorization header
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      };

      // If custom baseUrl is provided for OpenClaw, we could proxy it, but for now we use our backend
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, message: 'Connection successful!' };
      } else {
        return { success: false, message: data.error || 'Connection failed' };
      }
    } catch (err) {
      return { success: false, message: 'Network error occurred' };
    }
  };

  return {
    apiConfig,
    isLoading,
    isSaving,
    error,
    saveApiKeys,
    testConnection
  };
};

export default useAIApiKeys;
