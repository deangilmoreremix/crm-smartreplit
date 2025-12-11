import { QueryClient } from '@tanstack/react-query';

// Default fetch function for API requests
const defaultFetcher = async (url: string, options?: RequestInit) => {
  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      queryFn: ({ queryKey }) => defaultFetcher(queryKey[0] as string),
    },
    mutations: {
      retry: 1,
    },
  },
});

// Helper function for API requests with mutations
export const apiRequest = async <T = any>(url: string, options: RequestInit = {}): Promise<T> => {
  return defaultFetcher(url, {
    method: 'GET',
    ...options,
    // Don't double-stringify - body is already a string from mutations
  });
};

export { queryClient };
export default queryClient;