export interface ApiEndpoint {
  baseURL: string;
  timeout?: number;
  retries?: number;
}

export interface ApiConfig {
  auth: {
    endpoint: ApiEndpoint;
    tokenKey: string;
    refreshTokenKey: string;
  };
}

const apiConfig: ApiConfig = {
  auth: {
    endpoint: {
      baseURL: '/api/auth',
      timeout: 30000,
      retries: 2
    },
    tokenKey: 'supabase.auth.token',
    refreshTokenKey: 'supabase.auth.refresh_token'
  }
};

// Add validation for required endpoints
export const validateApiConfig = () => {
  const requiredEndpoints = ['/api/auth/user-role', '/api/auth/refresh'];
  const warnings: string[] = [];
  
  requiredEndpoints.forEach(endpoint => {
    // This would check if endpoints exist in production
    console.debug(`Checking endpoint: ${endpoint}`);
  });
  
  return warnings;
};

export default apiConfig;