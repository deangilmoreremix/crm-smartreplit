/**
 * Client Environment Configuration
 * Centralized configuration for client-side environment variables
 */

// Environment detection
const currentOrigin = window.location.origin;
export const isDevelopment = currentOrigin.includes('localhost') ||
                            currentOrigin.includes('replit.dev') ||
                            currentOrigin.includes('replit.app');

// Production URLs - should be environment variables in production
export const PRODUCTION_APP_URL = import.meta.env.VITE_APP_URL || 'https://app.smartcrm.vip';
export const PRODUCTION_API_URL = import.meta.env.VITE_API_URL || 'https://api.smartcrm.vip';

// Dynamic URL resolution
export const getRedirectUrl = (path: string): string => {
  if (isDevelopment) {
    return `${currentOrigin}${path}`;
  }
  return `${PRODUCTION_APP_URL}${path}`;
};

export const getApiUrl = (): string => {
  if (isDevelopment) {
    return currentOrigin;
  }
  return PRODUCTION_API_URL;
};

// Auth redirect URLs
export const AUTH_REDIRECT_URLS = {
  confirm: getRedirectUrl('/auth/confirm'),
  resetPassword: getRedirectUrl('/auth/reset-password'),
  callback: getRedirectUrl('/auth/callback'),
};

// Feature flags
export const FEATURES = {
  enableDevBypass: isDevelopment,
  enableDebugLogging: isDevelopment,
  enableMockData: isDevelopment && import.meta.env.VITE_USE_MOCK_DATA === 'true',
};