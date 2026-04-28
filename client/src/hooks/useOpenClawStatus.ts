import { useState, useEffect } from 'react';

export interface OpenClawStatus {
  hasApiKey: boolean;
  isHealthy: boolean;
  version?: string;
  error?: string;
}

export function useOpenClawStatus() {
  const [status, setStatus] = useState<OpenClawStatus>({
    hasApiKey: false,
    isHealthy: false,
  });
  const [loading, setLoading] = useState(true);

  const checkStatus = async () => {
    try {
      setLoading(true);

      // Check if API key is configured
      const hasApiKey = !!import.meta.env.VITE_OPENCLAW_API_KEY;

      // Check service health
      const healthResponse = await fetch('/api/openclaw/health');
      const healthData = await healthResponse.json();

      setStatus({
        hasApiKey,
        isHealthy: healthData.status === 'healthy',
        version: healthData.version,
        error: healthData.error,
      });
    } catch (error) {
      setStatus({
        hasApiKey: !!import.meta.env.VITE_OPENCLAW_API_KEY,
        isHealthy: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  return { status, loading, refresh: checkStatus };
}
