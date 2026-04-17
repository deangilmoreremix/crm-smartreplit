// server/test-helpers/database.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../../shared/schema.js';

export async function createTestDatabase() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.warn('DATABASE_URL not set - skipping database tests');
    return null;
  }

  try {
    const client = postgres(connectionString, { max: 1 });
    const db = drizzle(client, { schema });

    // Test the connection
    await client`SELECT 1`;

    return db;
  } catch (error) {
    console.warn('Failed to create test database connection:', error.message);
    return null;
  }
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
