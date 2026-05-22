import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';

export const useApiKeyStatus = () => {
  const { user } = useAuthStore();
  const [hasApiKeys, setHasApiKeys] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      checkApiKeys();
    } else {
      setHasApiKeys(null);
      setIsLoading(false);
    }
  }, [user?.id]);

  const checkApiKeys = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_api_keys')
        .select('openai_api_key, gemini_api_key')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST113') {
        console.error('Error checking API keys:', error);
        setHasApiKeys(false);
      } else if (data) {
        const hasKeys = !!(data.openai_api_key || data.gemini_api_key);
        setHasApiKeys(hasKeys);
      } else {
        setHasApiKeys(false);
      }
    } catch (error) {
      console.error('Error checking API keys:', error);
      setHasApiKeys(false);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshStatus = () => {
    setHasApiKeys(null);
    setIsLoading(true);
    checkApiKeys();
  };

  return { hasApiKeys, isLoading, refreshStatus };
};

export default useApiKeyStatus;