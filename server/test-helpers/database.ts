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
