// server/test-helpers/setup.ts
import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { createTestDatabase, cleanupTestData } from './database.js';
import { mockEnvironment } from './mock-env.js';

export function setupDatabaseTests() {
  let db: any;
  let restoreEnv: () => void;

  beforeAll(async () => {
    restoreEnv = mockEnvironment();
    db = await createTestDatabase();
    if (!db) {
      console.warn('Database not available for tests - skipping database-dependent tests');
    }
  });

  afterAll(async () => {
    restoreEnv();
    if (db) {
      await db.$client.end();
    }
  });

  beforeEach(async () => {
    // Clean up before each test
    if (db) {
      await cleanupTestData(db);
    }
  });

  afterEach(async () => {
    // Additional cleanup if needed
  });

  return { getDb: () => db };
}
