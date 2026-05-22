/**
 * Rate Limiting Index
 * Re-exports consolidated rate limiters from security.ts
 */

export {
  apiLimiter,
  authLimiter,
  aiLimiter,
  uploadLimiter,
  adminLimiter,
  webhookLimiter,
  healthLimiter,
} from './security';

// Backward compatibility — some routes import adminRateLimit
export { adminLimiter as adminRateLimit } from './security';