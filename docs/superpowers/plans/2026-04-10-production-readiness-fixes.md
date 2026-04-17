# Production Readiness Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all critical production readiness issues to achieve 100% production readiness

**Architecture:** Systematic fixes to testing infrastructure, database reliability, environment validation, and monitoring. Each fix is isolated and testable independently.

**Tech Stack:** TypeScript, Node.js, Vitest, Supabase, Netlify Functions

---

## File Structure

**New Files:**

- `docs/superpowers/plans/2026-04-10-production-readiness-fixes.md` - This plan
- `server/test-helpers/database.ts` - Database test utilities
- `server/test-helpers/mock-env.ts` - Environment mocking for tests
- `docs/production/environment-variables.md` - Production env documentation
- `server/monitoring/health-checks.ts` - Comprehensive health checks
- `server/monitoring/metrics.ts` - Application metrics collection

**Modified Files:**

- `vitest.config.ts` - Fix test configuration and globals
- `server/config.ts` - Environment validation improvements
- `server/tests/**/*.ts` - Convert jest to vi, fix database connections
- `client/src/test/setup.ts` - Add missing test globals
- `package.json` - Add missing test dependencies
- `netlify.toml` - Add production health checks

---

### Task 1: Fix Test Infrastructure - Convert Jest to Vi

**Files:**

- Modify: `vitest.config.ts`
- Modify: `client/src/test/setup.ts`
- Modify: `server/tests/unifiedEventSystem.test.ts`

- [ ] **Step 1: Update vitest config globals**

```typescript
// vitest.config.ts - Add global test functions
export default defineConfig({
  test: {
    globals: true, // This enables describe, it, expect, vi globally
    // ... rest of config
  },
  // ... rest of config
});
```

- [ ] **Step 2: Add vi global to test setup**

```typescript
// client/src/test/setup.ts - Add vi global
import { expect, afterEach, vi } from 'vitest'; // Add vi import
// ... existing code

// Make vi available globally
global.vi = vi;
```

- [ ] **Step 3: Convert jest mocks to vi in test files**

```typescript
// server/tests/unifiedEventSystem.test.ts - Replace jest with vi
import { describe, it, expect, vi } from 'vitest'; // Add vi import

// Replace jest.fn() with vi.fn()
const handler1 = vi.fn(); // was: jest.fn()
const handler2 = vi.fn(); // was: jest.fn()

// Replace jest timers with vi
vi.useFakeTimers(); // was: jest.useFakeTimers()
vi.runOnlyPendingTimers(); // was: jest.runOnlyPendingTimers()
```

- [ ] **Step 4: Run tests to verify conversion**

```bash
npx vitest run server/tests/unifiedEventSystem.test.ts -v
```

Expected: Tests should now use vi instead of jest

- [ ] **Step 5: Commit jest to vi conversion**

```bash
git add vitest.config.ts client/src/test/setup.ts server/tests/unifiedEventSystem.test.ts
git commit -m "test: convert jest to vi in test infrastructure"
```

---

### Task 2: Add Missing Test Dependencies

**Files:**

- Modify: `package.json`
- Create: `server/test-helpers/database.ts`
- Create: `server/test-helpers/mock-env.ts`

- [ ] **Step 1: Add missing test dependencies**

```json
{
  "devDependencies": {
    "@testing-library/user-event": "^14.5.2",
    "@vitest/coverage-v8": "^3.2.4",
    "supertest": "^7.0.0"
  }
}
```

- [ ] **Step 2: Create database test helper**

```typescript
// server/test-helpers/database.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../../shared/schema.js';

export function createTestDatabase() {
  const connectionString = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test';
  const client = postgres(connectionString, { max: 1 });
  return drizzle(client, { schema });
}

export async function cleanupTestData(db: any) {
  // Clean up test data in reverse dependency order
  await db.delete(schema.tasks);
  await db.delete(schema.appointments);
  await db.delete(schema.communications);
  await db.delete(schema.notes);
  await db.delete(schema.documents);
  await db.delete(schema.deals);
  await db.delete(schema.contacts);
  await db.delete(schema.profiles);
}
```

- [ ] **Step 3: Create environment mocking helper**

```typescript
// server/test-helpers/mock-env.ts
export function mockEnvironment(overrides: Record<string, string> = {}) {
  const originalEnv = { ...process.env };

  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
  process.env.SUPABASE_URL = 'https://test.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';

  // Apply overrides
  Object.assign(process.env, overrides);

  return () => {
    // Restore original environment
    process.env = originalEnv;
  };
}
```

- [ ] **Step 4: Install new dependencies**

```bash
npm install --save-dev @testing-library/user-event@^14.5.2 supertest@^7.0.0
```

- [ ] **Step 5: Commit test infrastructure improvements**

```bash
git add package.json server/test-helpers/
git commit -m "feat: add test infrastructure and missing dependencies"
```

---

### Task 3: Fix Database Connection Issues in Tests

**Files:**

- Modify: `server/tests/credit-purchase.test.ts`
- Modify: `server/tests/credit-purchase-api.test.ts`
- Create: `server/test-helpers/setup.ts`

- [ ] **Step 1: Create test setup helper**

```typescript
// server/test-helpers/setup.ts
import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { createTestDatabase, cleanupTestData } from './database.js';
import { mockEnvironment } from './mock-env.js';

export function setupDatabaseTests() {
  let db: any;
  let restoreEnv: () => void;

  beforeAll(async () => {
    restoreEnv = mockEnvironment();
    db = createTestDatabase();
  });

  afterAll(async () => {
    restoreEnv();
    if (db) {
      await db.$client.end();
    }
  });

  beforeEach(async () => {
    // Clean up before each test
    await cleanupTestData(db);
  });

  afterEach(async () => {
    // Additional cleanup if needed
  });

  return { getDb: () => db };
}
```

- [ ] **Step 2: Update credit purchase test**

```typescript
// server/tests/credit-purchase.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupDatabaseTests } from '../test-helpers/setup.js';
import { db } from '../db.js';

const { getDb } = setupDatabaseTests();

describe('Credit Purchase Flow Tests', () => {
  let testDb: any;

  beforeAll(() => {
    testDb = getDb();
  });

  // ... rest of test code using testDb instead of db
});
```

- [ ] **Step 3: Update credit purchase API test**

```typescript
// server/tests/credit-purchase-api.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { setupDatabaseTests } from '../test-helpers/setup.js';
import request from 'supertest';
import { app } from '../index.js'; // Import the app

const { getDb } = setupDatabaseTests();

describe('Credit Purchase API Tests', () => {
  let testDb: any;

  beforeAll(() => {
    testDb = getDb();
  });

  it('should create credit package', async () => {
    const response = await request(app).post('/api/credit-packages').send({
      name: 'Test Package',
      credits: 100,
      price: 10.0,
    });

    expect(response.status).toBe(201);
  });
});
```

- [ ] **Step 4: Run updated tests**

```bash
npx vitest run server/tests/credit-purchase.test.ts server/tests/credit-purchase-api.test.ts -v
```

Expected: Tests should connect to database properly

- [ ] **Step 5: Commit database test fixes**

```bash
git add server/tests/credit-purchase.test.ts server/tests/credit-purchase-api.test.ts server/test-helpers/setup.ts
git commit -m "fix: database connection issues in credit purchase tests"
```

---

### Task 4: Fix Contact API Service Tests

**Files:**

- Modify: `client/src/services/contact-api.service.test.ts`
- Modify: `client/src/test/setup.ts`

- [ ] **Step 1: Add userEvent to test setup**

```typescript
// client/src/test/setup.ts
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import userEvent from '@testing-library/user-event';

// Extend expect with jest-dom matchers
expect.extend(matchers);

// Set up userEvent
export const user = userEvent.setup();

// Clean up after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
```

- [ ] **Step 2: Fix contact API service test mocks**

```typescript
// client/src/services/contact-api.service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch globally
global.fetch = vi.fn();

describe('ContactAPIService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createContact', () => {
    it('should create contact successfully via Supabase Edge Function', async () => {
      const mockResponse = { id: '1', name: 'John Doe' };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const contactData = { firstName: 'John', lastName: 'Doe', email: 'john@example.com' };
      const result = await contactAPIService.createContact(contactData);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://test.supabase.co/functions/v1/contacts',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(contactData),
        })
      );

      expect(result).toEqual(mockResponse);
    });
  });
});
```

- [ ] **Step 3: Run contact API tests**

```bash
npx vitest run client/src/services/contact-api.service.test.ts -v
```

Expected: Tests should pass with proper mocking

- [ ] **Step 4: Commit contact API test fixes**

```bash
git add client/src/services/contact-api.service.test.ts client/src/test/setup.ts
git commit -m "fix: contact API service tests with proper mocking"
```

---

### Task 5: Add Environment Variable Documentation

**Files:**

- Create: `docs/production/environment-variables.md`
- Modify: `server/config.ts`

- [ ] **Step 1: Create environment variables documentation**

```markdown
# Production Environment Variables

This document lists all environment variables required for production deployment.

## Required Variables

### Database

- `DATABASE_URL`: PostgreSQL connection string (required)
  - Format: `postgresql://username:password@host:port/database`

### Supabase

- `SUPABASE_URL`: Supabase project URL (required)
  - Format: `https://your-project.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for admin operations (required)
- `SUPABASE_WEBHOOK_SECRET`: Secret for validating webhooks (optional)

### AI Services

- `OPENAI_API_KEY`: OpenAI API key for AI features (required for AI functionality)
- `OPENAI_API_KEY_FALLBACK`: Backup OpenAI API key (optional)
- `GOOGLE_AI_API_KEY`: Google AI API key (alternative to OpenAI)
- `ELEVENLABS_API_KEY`: ElevenLabs API key for voice features (optional)

### Payment Processing

- `STRIPE_WEBHOOK_SECRET`: Stripe webhook secret for payment validation (required for payments)
- `PAYPAL_WEBHOOK_SECRET`: PayPal webhook secret (optional)

### Email Services

- `SENDGRID_API_KEY`: SendGrid API key for email sending (required for email features)
- `FROM_EMAIL`: Sender email address (default: noreply@smartcrm.vip)

### External APIs

- `JVZOO_WEBHOOK_SECRET`: JVZoo webhook secret (optional)
- `ZAXAA_WEBHOOK_SECRET`: Zaxaa webhook secret (optional)

## Development Variables

### Development Mode

- `NODE_ENV`: Set to 'development' for dev features (default: development)
- `DEV_BYPASS_EMAILS`: Comma-separated list of emails for dev authentication bypass (dev only)

### Development URLs

- `FRONTEND_URL`: Frontend application URL for email links (default: https://smartcrm.vip)
- `SITE_URL`: Site URL for redirects (default: https://smart-crm.videoremix.io)

## Security Variables

### Monitoring

- `SENTRY_DSN`: Sentry DSN for error tracking (optional)
- `DATADOG_API_KEY`: DataDog API key for metrics (optional)

### Security

- `SECRETS_SCAN_ENABLED`: Enable secret scanning (default: true)
- `LOG_TO_FILE`: Log errors to file (default: false)

## Netlify Specific

### Build

- `VITE_ENABLE_MFE`: Enable module federation (default: true)
- `VITE_SUPABASE_URL`: Public Supabase URL for client-side code
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key for client-side operations

## Validation

The application validates these variables on startup. Missing required variables will cause the application to exit with an error in production mode.
```

- [ ] **Step 2: Update config with better validation**

```typescript
// server/config.ts - Add better validation
export function validateEnvironmentVariables(): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Critical variables that must be set in production
  const requiredVars = ['DATABASE_URL', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];

  // Recommended variables
  const recommendedVars = ['OPENAI_API_KEY', 'SENDGRID_API_KEY', 'STRIPE_WEBHOOK_SECRET'];

  // In production, these should be set
  if (config.nodeEnv === 'production') {
    requiredVars.forEach((varName) => {
      if (!process.env[varName]) {
        errors.push(`Missing required environment variable: ${varName}`);
      }
    });

    recommendedVars.forEach((varName) => {
      if (!process.env[varName]) {
        warnings.push(`Missing recommended environment variable: ${varName}`);
      }
    });
  }

  // Validate Supabase configuration
  if (config.supabaseUrl && !config.supabaseUrl.startsWith('https://')) {
    errors.push('SUPABASE_URL must be a valid HTTPS URL');
  }

  if (config.supabaseServiceKey && config.supabaseServiceKey.length < 50) {
    errors.push('SUPABASE_SERVICE_ROLE_KEY appears to be invalid (too short)');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
```

- [ ] **Step 3: Update validation call in config**

```typescript
// server/config.ts - Update validation usage
const validation = validateEnvironmentVariables();
if (!validation.valid) {
  console.error('❌ Environment variable validation failed:');
  validation.errors.forEach((error) => console.error(`  - ${error}`));

  if (validation.warnings.length > 0) {
    console.warn('⚠️ Environment variable warnings:');
    validation.warnings.forEach((warning) => console.warn(`  - ${warning}`));
  }

  // In production, exit with error if validation fails
  if (config.nodeEnv === 'production') {
    console.error('💥 Exiting due to invalid configuration in production');
    process.exit(1);
  } else {
    console.warn('⚠️ Continuing with invalid configuration in development');
  }
} else {
  console.log('✅ Environment variables validated successfully');
}
```

- [ ] **Step 4: Commit environment documentation**

```bash
git add docs/production/environment-variables.md server/config.ts
git commit -m "docs: add comprehensive environment variables documentation and improved validation"
```

---

### Task 6: Add Production Health Checks

**Files:**

- Create: `server/monitoring/health-checks.ts`
- Modify: `netlify.toml`
- Modify: `server/index.ts`

- [ ] **Step 1: Create comprehensive health checks**

```typescript
// server/monitoring/health-checks.ts
import { db } from '../db.js';
import { supabase, isSupabaseConfigured } from '../supabase.js';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  services: {
    database: ServiceHealth;
    supabase: ServiceHealth;
    openai?: ServiceHealth;
    stripe?: ServiceHealth;
    sendgrid?: ServiceHealth;
  };
  metrics: {
    activeConnections: number;
    memoryUsage: NodeJS.MemoryUsage;
    responseTime: number;
  };
}

interface ServiceHealth {
  status: 'up' | 'down' | 'degraded';
  responseTime?: number;
  error?: string;
  lastChecked: string;
}

export async function performHealthCheck(): Promise<HealthStatus> {
  const startTime = Date.now();

  const services: HealthStatus['services'] = {
    database: await checkDatabaseHealth(),
    supabase: await checkSupabaseHealth(),
  };

  // Optional service checks
  if (process.env.OPENAI_API_KEY) {
    services.openai = await checkOpenAIHealth();
  }

  if (process.env.STRIPE_WEBHOOK_SECRET) {
    services.stripe = await checkStripeHealth();
  }

  if (process.env.SENDGRID_API_KEY) {
    services.sendgrid = await checkSendGridHealth();
  }

  const responseTime = Date.now() - startTime;

  // Determine overall status
  const hasUnhealthy = Object.values(services).some((s) => s.status === 'down');
  const hasDegraded = Object.values(services).some((s) => s.status === 'degraded');

  let status: HealthStatus['status'] = 'healthy';
  if (hasUnhealthy) status = 'unhealthy';
  else if (hasDegraded) status = 'degraded';

  return {
    status,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
    services,
    metrics: {
      activeConnections: 0, // TODO: Implement connection tracking
      memoryUsage: process.memoryUsage(),
      responseTime,
    },
  };
}

async function checkDatabaseHealth(): Promise<ServiceHealth> {
  const startTime = Date.now();
  try {
    // Simple query to test database connectivity
    await db.execute('SELECT 1');
    return {
      status: 'up',
      responseTime: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'down',
      error: error.message,
      lastChecked: new Date().toISOString(),
    };
  }
}

async function checkSupabaseHealth(): Promise<ServiceHealth> {
  if (!isSupabaseConfigured()) {
    return {
      status: 'down',
      error: 'Supabase not configured',
      lastChecked: new Date().toISOString(),
    };
  }

  const startTime = Date.now();
  try {
    // Test Supabase connectivity
    const { error } = await supabase.from('profiles').select('id').limit(1);
    if (error) throw error;

    return {
      status: 'up',
      responseTime: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'down',
      error: error.message,
      lastChecked: new Date().toISOString(),
    };
  }
}

async function checkOpenAIHealth(): Promise<ServiceHealth> {
  // Placeholder - implement OpenAI health check
  return {
    status: 'up',
    lastChecked: new Date().toISOString(),
  };
}

async function checkStripeHealth(): Promise<ServiceHealth> {
  // Placeholder - implement Stripe health check
  return {
    status: 'up',
    lastChecked: new Date().toISOString(),
  };
}

async function checkSendGridHealth(): Promise<ServiceHealth> {
  // Placeholder - implement SendGrid health check
  return {
    status: 'up',
    lastChecked: new Date().toISOString(),
  };
}
```

- [ ] **Step 2: Add detailed health endpoint**

```typescript
// server/index.ts - Add detailed health endpoint
import { performHealthCheck } from './monitoring/health-checks.js';

// Replace existing health check with detailed one
app.get('/api/health', async (req, res) => {
  try {
    const healthStatus = await performHealthCheck();

    // Return appropriate status code
    const statusCode =
      healthStatus.status === 'healthy' ? 200 : healthStatus.status === 'degraded' ? 200 : 503;

    res.status(statusCode).json(healthStatus);
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      error: 'Health check failed',
      timestamp: new Date().toISOString(),
    });
  }
});
```

- [ ] **Step 3: Update Netlify configuration**

```toml
# netlify.toml - Add health check configuration
[build]
command = "npm run build"
publish = "server/public"
functions = "netlify/functions"

[build.environment]
NODE_VERSION = "20"
SECRETS_SCAN_ENABLED = "true"
VITE_ENABLE_MFE = "true"

# Health check for deployment verification
[build.health_check]
url = "https://your-site.netlify.app/api/health"
timeout = 30

[dev]
command = "npm run dev"
targetPort = 5000
port = 8888

# SPA fallback for client-side routing
[[redirects]]
from = "/*"
to = "/index.html"
status = 200

# API redirects to Netlify Functions
[[redirects]]
from = "/api/openai/smart-greeting"
to = "/.netlify/functions/openai"
status = 200
```

- [ ] **Step 4: Test health endpoint**

```bash
curl http://localhost:3000/api/health
```

Expected: JSON response with health status

- [ ] **Step 5: Commit health checks**

```bash
git add server/monitoring/health-checks.ts server/index.ts netlify.toml
git commit -m "feat: add comprehensive production health checks and monitoring"
```

---

### Task 7: Add Application Metrics Collection

**Files:**

- Create: `server/monitoring/metrics.ts`
- Modify: `server/index.ts`

- [ ] **Step 1: Create metrics collection service**

```typescript
// server/monitoring/metrics.ts
interface ApplicationMetrics {
  requests: {
    total: number;
    byEndpoint: Record<string, number>;
    byMethod: Record<string, number>;
    responseTime: {
      avg: number;
      p95: number;
      p99: number;
    };
  };
  errors: {
    total: number;
    byEndpoint: Record<string, number>;
    byType: Record<string, number>;
  };
  database: {
    connections: number;
    queryCount: number;
    slowQueries: number;
  };
  uptime: number;
  memoryUsage: NodeJS.MemoryUsage;
}

class MetricsCollector {
  private metrics: ApplicationMetrics;
  private requestTimes: number[] = [];

  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        byEndpoint: {},
        byMethod: {},
        responseTime: { avg: 0, p95: 0, p99: 0 },
      },
      errors: {
        total: 0,
        byEndpoint: {},
        byType: {},
      },
      database: {
        connections: 0,
        queryCount: 0,
        slowQueries: 0,
      },
      uptime: 0,
      memoryUsage: process.memoryUsage(),
    };

    // Update uptime every minute
    setInterval(() => {
      this.metrics.uptime = process.uptime();
      this.metrics.memoryUsage = process.memoryUsage();
    }, 60000);
  }

  recordRequest(endpoint: string, method: string, responseTime: number) {
    this.metrics.requests.total++;

    // Track by endpoint
    this.metrics.requests.byEndpoint[endpoint] =
      (this.metrics.requests.byEndpoint[endpoint] || 0) + 1;

    // Track by method
    this.metrics.requests.byMethod[method] = (this.metrics.requests.byMethod[method] || 0) + 1;

    // Track response times for percentiles
    this.requestTimes.push(responseTime);
    if (this.requestTimes.length > 1000) {
      this.requestTimes = this.requestTimes.slice(-1000);
    }

    this.updateResponseTimeMetrics();
  }

  recordError(endpoint: string, errorType: string) {
    this.metrics.errors.total++;

    this.metrics.errors.byEndpoint[endpoint] = (this.metrics.errors.byEndpoint[endpoint] || 0) + 1;

    this.metrics.errors.byType[errorType] = (this.metrics.errors.byType[errorType] || 0) + 1;
  }

  recordDatabaseQuery(queryTime: number) {
    this.metrics.database.queryCount++;
    if (queryTime > 1000) {
      // Slow query threshold
      this.metrics.database.slowQueries++;
    }
  }

  private updateResponseTimeMetrics() {
    if (this.requestTimes.length === 0) return;

    const sorted = [...this.requestTimes].sort((a, b) => a - b);

    this.metrics.requests.responseTime.avg =
      this.requestTimes.reduce((a, b) => a + b, 0) / this.requestTimes.length;

    this.metrics.requests.responseTime.p95 = sorted[Math.floor(sorted.length * 0.95)];

    this.metrics.requests.responseTime.p99 = sorted[Math.floor(sorted.length * 0.99)];
  }

  getMetrics(): ApplicationMetrics {
    return { ...this.metrics };
  }

  reset() {
    this.metrics.requests.total = 0;
    this.metrics.errors.total = 0;
    this.metrics.database.queryCount = 0;
    this.metrics.database.slowQueries = 0;
    this.requestTimes = [];
  }
}

export const metricsCollector = new MetricsCollector();
```

- [ ] **Step 2: Add metrics endpoint**

```typescript
// server/index.ts - Add metrics endpoint
import { metricsCollector } from './monitoring/metrics.js';

// Add metrics endpoint for monitoring
app.get('/api/metrics', (req, res) => {
  const metrics = metricsCollector.getMetrics();
  res.json(metrics);
});

// Add metrics middleware
app.use((req, res, next) => {
  const start = Date.now();
  const originalEnd = res.end;

  res.end = function (...args) {
    const responseTime = Date.now() - start;
    metricsCollector.recordRequest(req.path, req.method, responseTime);

    if (res.statusCode >= 400) {
      const errorType = res.statusCode >= 500 ? 'server_error' : 'client_error';
      metricsCollector.recordError(req.path, errorType);
    }

    originalEnd.apply(this, args);
  };

  next();
});
```

- [ ] **Step 3: Test metrics endpoint**

```bash
curl http://localhost:3000/api/metrics
```

Expected: JSON response with application metrics

- [ ] **Step 4: Commit metrics collection**

```bash
git add server/monitoring/metrics.ts server/index.ts
git commit -m "feat: add application metrics collection and monitoring endpoint"
```

---

### Task 8: Final Testing and Validation

**Files:**

- Modify: `vitest.config.ts`

- [ ] **Step 1: Update vitest config for coverage**

```typescript
// vitest.config.ts - Ensure coverage is properly configured
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./client/src/test/setup.ts'],
    include: [
      'client/src/**/*.{test,spec}.{js,mjs,cjs,ts,mtsx,jsx,tsx}',
      'server/**/*.{test,spec}.{js,mjs,cjs,ts,mtsx,jsx,tsx}',
    ],
    exclude: ['**/node_modules/**', '**/dist/**', '**/build/**', 'scripts/**'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'client/src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70,
        },
      },
    },
  },
  // ... rest of config
});
```

- [ ] **Step 2: Run full test suite with coverage**

```bash
npx vitest run --coverage
```

Expected: All tests pass with coverage report

- [ ] **Step 3: Run linting to ensure no regressions**

```bash
npm run lint
```

Expected: No linting errors

- [ ] **Step 4: Test production build**

```bash
npm run build
```

Expected: Build succeeds without errors

- [ ] **Step 5: Commit final validation**

```bash
git add vitest.config.ts
git commit -m "test: update vitest config for coverage and run final validation"
```

---

## Execution Options

**Plan complete and saved to `docs/superpowers/plans/2026-04-10-production-readiness-fixes.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
