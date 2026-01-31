// Test database connection
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres.gadedbrnqzpfqtsdfzcg:ParkerDean0805!@aws-0-us-east-1.pooler.supabase.com:5432/postgres',
  ssl: {
    rejectUnauthorized: false
  }
});

async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ Database connection successful!');
    
    const result = await client.query('SELECT version();');
    console.log('PostgreSQL Version:', result.rows[0].version);
    
    const tablesResult = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' LIMIT 5;");
    console.log('\nSample tables in database:');
    tablesResult.rows.forEach(row => console.log(`  - ${row.table_name}`));
    
    client.release();
    await pool.end();
    console.log('\n✅ Connection test completed successfully!');
  } catch (error: any) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();
