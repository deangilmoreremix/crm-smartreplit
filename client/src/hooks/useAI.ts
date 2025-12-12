import { useState, useCallback } from 'react';
import { useToast } from './use-toast';

interface AIConfig {
  maxRetries?: number;
  retryDelay?: number;
  showToastOnError?: boolean;
  showToastOnSuccess?: boolean;
}

interface AIState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  retryCount: number;
}

export function useAI<T = any>(config: AIConfig = {}) {
  const {
    maxRetries = 2,
    retryDelay = 1000,
    showToastOnError = true,
    showToastOnSuccess = false
  } = config;

  const { toast } = useToast();
  const [state, setState] = useState<AIState<T>>({
    data: null,
    loading: false,
    error: null,
    retryCount: 0
  });

  const execute = useCallback(async (
    operation: () => Promise<T>,
    operationName: string = 'AI operation'
  ): Promise<T | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        setState(prev => ({ ...prev, retryCount: attempt }));

        const result = await operation();
        
        setState({
          data: result,
          loading: false,
          error: null,
          retryCount: attempt
        });

        if (showToastOnSuccess) {
          toast({
            title: 'Success',
            description: `${operationName} completed successfully`,
            variant: 'default'
          });
        }

        return result;
      } catch (error: any) {
        lastError = error;
        console.warn(`${operationName} attempt ${attempt + 1} failed:`, error);

        // If this isn't the last attempt, wait before retrying
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
        }
      }
    }

    // All attempts failed
    const errorMessage = lastError?.message || `${operationName} failed after ${maxRetries + 1} attempts`;
    
    setState({
      data: null,
      loading: false,
      error: errorMessage,
      retryCount: maxRetries
    });

    if (showToastOnError) {
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    }

    return null;
  }, [maxRetries, retryDelay, showToastOnError, showToastOnSuccess, toast]);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      retryCount: 0
    });
  }, []);

  const retry = useCallback(async (
    operation: () => Promise<T>,
    operationName: string = 'AI operation'
  ): Promise<T | null> => {
    return execute(operation, operationName);
  }, [execute]);

  return {
    ...state,
    execute,
    reset,
    retry,
    hasError: state.error !== null,
    hasData: state.data !== null,
    isRetrying: state.loading && state.retryCount > 0
  };
}

// Specialized hooks for common AI operations
export function useEmailGeneration() {
  return useAI({
    maxRetries: 2,
    showToastOnError: true,
    showToastOnSuccess: false
  });
}

export function useDealAnalysis() {
  return useAI({
    maxRetries: 1,
    showToastOnError: true,
    showToastOnSuccess: false
  });
}

export function useContentGeneration() {
  return useAI({
    maxRetries: 2,
    showToastOnError: true,
    showToastOnSuccess: false
  });
}
