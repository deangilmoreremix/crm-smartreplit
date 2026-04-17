// server/test-helpers/mock-env.ts
export function mockEnvironment(overrides: Record<string, string> = {}) {
  const originalEnv = { ...process.env };

  // Set test environment
  process.env.NODE_ENV = 'test';

  // Only set DATABASE_URL if not already set (for production readiness)
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
  }

  process.env.SUPABASE_URL = 'https://test.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';

  // Apply overrides
  Object.assign(process.env, overrides);

  return () => {
    // Restore original environment
    process.env = originalEnv;
  };
}
