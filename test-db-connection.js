// Test database connection
const { Pool } = require('pg');

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ Database connection successful!');

    const result = await client.query('SELECT version();');
    console.log('PostgreSQL Version:', result.rows[0].version);

    const tablesResult = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' LIMIT 5;"
    );
    console.log('\nSample tables in database:');
    tablesResult.rows.forEach((row) => console.log(`  - ${row.table_name}`));

    client.release();
    await pool.end();
    console.log('\n✅ Connection test completed successfully!');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();
