import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

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
      // Keys are stored server-side (user_api_keys, one row per provider)
      const response = await fetch('/api/user/api-keys');
      if (!response.ok) {
        setHasApiKeys(false);
      } else {
        const { keys = [] } = await response.json();
        setHasApiKeys(keys.some((k: any) => k.provider === 'openai' && k.isActive !== false));
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