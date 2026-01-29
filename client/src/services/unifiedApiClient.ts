import { unifiedEventSystem } from './unifiedEventSystem';

export interface ApiRequest {
  endpoint: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  data?: any;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  cache?: boolean;
  cacheTTL?: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
  headers?: Record<string, string>;
  timestamp: number;
  cached?: boolean;
}

export interface ApiConfig {
  baseURL: string;
  defaultHeaders: Record<string, string>;
  timeout: number;
  retries: number;
  cacheEnabled: boolean;
  cacheSize: number;
}

class UnifiedApiClient {
  private static instance: UnifiedApiClient;
  private config: ApiConfig;
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  private activeRequests: Map<string, AbortController> = new Map();

  static getInstance(): UnifiedApiClient {
    if (!UnifiedApiClient.instance) {
      UnifiedApiClient.instance = new UnifiedApiClient();
    }
    return UnifiedApiClient.instance;
  }

  private constructor() {
    this.config = {
      baseURL: '',
      defaultHeaders: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 30000,
      retries: 3,
      cacheEnabled: true,
      cacheSize: 100
    };

    this.setupInterceptors();
  }

  // Configure the API client
  configure(config: Partial<ApiConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // Make an API request
  async request<T = any>(request: ApiRequest): Promise<ApiResponse<T>> {
    const {
      endpoint,
      method = 'GET',
      data,
      headers = {},
      timeout = this.config.timeout,
      retries = this.config.retries,
      cache = this.config.cacheEnabled,
      cacheTTL = 300000 // 5 minutes default
    } = request;

    const url = endpoint.startsWith('http') ? endpoint : `${this.config.baseURL}${endpoint}`;
    const cacheKey = `${method}:${url}:${JSON.stringify(data)}`;

    // Check cache first
    if (method === 'GET' && cache && this.isCached(cacheKey)) {
      const cachedData = this.getCached(cacheKey);
      if (cachedData) {
        return {
          success: true,
          data: cachedData,
          timestamp: Date.now(),
          cached: true
        };
      }
    }

    // Cancel any existing request with the same cache key
    this.cancelRequest(cacheKey);

    const controller = new AbortController();
    this.activeRequests.set(cacheKey, controller);

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await this.makeRequest(url, method, data, headers, timeout, controller);

        // Cache successful GET responses
        if (method === 'GET' && cache && response.success && response.data) {
          this.setCache(cacheKey, response.data, cacheTTL);
        }

        // Emit success event
        unifiedEventSystem.emit({
          type: 'API_REQUEST_SUCCESS',
          source: 'unifiedApiClient',
          data: {
            endpoint,
            method,
            statusCode: response.statusCode,
            attempt: attempt + 1
          },
          priority: 'low'
        });

        return response;
      } catch (error: any) {
        lastError = error;

        // Don't retry on client errors (4xx)
        if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
          break;
        }

        // Emit retry event
        if (attempt < retries) {
          unifiedEventSystem.emit({
            type: 'API_REQUEST_RETRY',
            source: 'unifiedApiClient',
            data: {
              endpoint,
              method,
              attempt: attempt + 1,
              error: error.message
            },
            priority: 'medium'
          });
        }
      }
    }

    // All retries failed
    const errorResponse: ApiResponse<T> = {
      success: false,
      error: lastError?.message || 'Request failed after all retries',
      statusCode: (lastError as any)?.statusCode,
      timestamp: Date.now()
    };

    // Emit error event
    unifiedEventSystem.emit({
      type: 'API_REQUEST_ERROR',
      source: 'unifiedApiClient',
      data: {
        endpoint,
        method,
        error: errorResponse.error,
        statusCode: errorResponse.statusCode
      },
      priority: 'high'
    });

    return errorResponse;
  }

  // Make the actual HTTP request
  private async makeRequest(
    url: string,
    method: string,
    data: any,
    headers: Record<string, string>,
    timeout: number,
    controller: AbortController
  ): Promise<ApiResponse> {
    const mergedHeaders = { ...this.config.defaultHeaders, ...headers };

    const requestOptions: RequestInit = {
      method,
      headers: mergedHeaders,
      signal: controller.signal
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      requestOptions.body = JSON.stringify(data);
    }

    // Set timeout
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeout);

    try {
      const response = await fetch(url, requestOptions);
      clearTimeout(timeoutId);

      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw {
          message: `HTTP ${response.status}: ${errorText}`,
          statusCode: response.status
        };
      }

      let responseData;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      return {
        success: true,
        data: responseData,
        statusCode: response.status,
        headers: responseHeaders,
        timestamp: Date.now()
      };
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw { message: 'Request timeout', statusCode: 408 };
      }

      throw error;
    }
  }

  // Cache management
  private isCached(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  private getCached(key: string): any {
    const cached = this.cache.get(key);
    return cached ? cached.data : null;
  }

  private setCache(key: string, data: any, ttl: number): void {
    // Clean up old entries if cache is full
    if (this.cache.size >= this.config.cacheSize) {
      const oldestKey = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp)[0][0];
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  // Cancel active request
  private cancelRequest(key: string): void {
    const controller = this.activeRequests.get(key);
    if (controller) {
      controller.abort();
      this.activeRequests.delete(key);
    }
  }

  // Setup request/response interceptors
  private setupInterceptors(): void {
    // Add authentication headers automatically
    const originalRequest = this.request.bind(this);
    this.request = async <T = any>(request: ApiRequest): Promise<ApiResponse<T>> => {
      // Add auth token if available - check for dev bypass tokens first
      if (!request.headers?.Authorization) {
        // Check for dev bypass session
        const devSession = localStorage.getItem('dev-user-session');
        const devToken = localStorage.getItem('sb-supabase-auth-token');
        const devMode = localStorage.getItem('smartcrm-dev-mode');

        console.log('🔍 API Client Auth Check:', {
          devSession: !!devSession,
          devToken: !!devToken,
          devMode,
          endpoint: request.endpoint
        });

        if ((devSession && devToken) || devMode === 'true') {
          // Use dev bypass token format expected by server
          const token = devToken ? JSON.parse(devToken).access_token : 'dev-bypass-token';
          console.log('🔑 Using dev bypass token for request');
          request.headers = {
            ...request.headers,
            Authorization: `Bearer ${token}`
          };
        } else {
          // Check for regular auth token
          const authToken = localStorage.getItem('authToken');
          if (authToken) {
            console.log('🔑 Using regular auth token for request');
            request.headers = {
              ...request.headers,
              Authorization: `Bearer ${authToken}`
            };
          } else {
            console.log('⚠️ No auth token found for request');
          }
        }
      }

      return originalRequest(request);
    };
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }

  // Get cache stats
  getCacheStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.config.cacheSize
    };
  }

  // Get active requests count
  getActiveRequestsCount(): number {
    return this.activeRequests.size;
  }
}

// Create singleton instance
export const unifiedApiClient = UnifiedApiClient.getInstance();

// Convenience methods for common HTTP methods
export const api = {
  get: <T = any>(endpoint: string, config?: Partial<ApiRequest>) =>
    unifiedApiClient.request<T>({ ...config, endpoint, method: 'GET' }),

  post: <T = any>(endpoint: string, data?: any, config?: Partial<ApiRequest>) =>
    unifiedApiClient.request<T>({ ...config, endpoint, method: 'POST', data }),

  put: <T = any>(endpoint: string, data?: any, config?: Partial<ApiRequest>) =>
    unifiedApiClient.request<T>({ ...config, endpoint, method: 'PUT', data }),

  patch: <T = any>(endpoint: string, data?: any, config?: Partial<ApiRequest>) =>
    unifiedApiClient.request<T>({ ...config, endpoint, method: 'PATCH', data }),

  delete: <T = any>(endpoint: string, config?: Partial<ApiRequest>) =>
    unifiedApiClient.request<T>({ ...config, endpoint, method: 'DELETE' })
};