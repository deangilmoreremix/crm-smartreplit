import { useState } from 'react';

export interface OpenClawSetupState {
  step: 'welcome' | 'api-key' | 'demo' | 'complete';
  apiKey: string;
  isValidating: boolean;
  isValid: boolean;
  error?: string;
}

export function useOpenClawSetup() {
  const [state, setState] = useState<OpenClawSetupState>({
    step: 'welcome',
    apiKey: '',
    isValidating: false,
    isValid: false,
  });

  const nextStep = () => {
    setState((prev) => ({
      ...prev,
      step:
        prev.step === 'welcome'
          ? 'api-key'
          : prev.step === 'api-key'
            ? 'demo'
            : prev.step === 'complete'
              ? 'complete'
              : 'complete',
    }));
  };

  const prevStep = () => {
    setState((prev) => ({
      ...prev,
      step:
        prev.step === 'complete'
          ? 'demo'
          : prev.step === 'demo'
            ? 'api-key'
            : prev.step === 'api-key'
              ? 'welcome'
              : 'welcome',
    }));
  };

  const updateApiKey = (apiKey: string) => {
    setState((prev) => ({ ...prev, apiKey, isValid: false, error: undefined }));
  };

  const validateApiKey = async () => {
    if (!state.apiKey.trim()) {
      setState((prev) => ({ ...prev, error: 'API key is required' }));
      return false;
    }

    setState((prev) => ({ ...prev, isValidating: true, error: undefined }));

    try {
      // Test the API key with a simple health check
      const response = await fetch('/api/openclaw/health', {
        headers: {
          Authorization: `Bearer ${state.apiKey}`,
        },
      });

      if (response.ok) {
        setState((prev) => ({ ...prev, isValidating: false, isValid: true }));
        return true;
      } else {
        throw new Error('Invalid API key');
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isValidating: false,
        isValid: false,
        error: error instanceof Error ? error.message : 'Failed to validate API key',
      }));
      return false;
    }
  };

  const saveApiKey = async () => {
    if (!state.isValid) return false;

    try {
      // In a real implementation, this would save to backend
      // For now, we'll just validate and move to complete
      setState((prev) => ({ ...prev, step: 'complete' }));
      return true;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to save API key',
      }));
      return false;
    }
  };

  const reset = () => {
    setState({
      step: 'welcome',
      apiKey: '',
      isValidating: false,
      isValid: false,
    });
  };

  return {
    state,
    actions: {
      nextStep,
      prevStep,
      updateApiKey,
      validateApiKey,
      saveApiKey,
      reset,
    },
  };
}
