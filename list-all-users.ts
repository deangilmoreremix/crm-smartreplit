import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres.gadedbrnqzpfqtsdfzcg:ParkerDean0805!@aws-0-us-east-1.pooler.supabase.com:5432/postgres',
  ssl: {
    rejectUnauthorized: false
  }
});

async function listAllUsers() {
  try {
    const client = await pool.connect();
    
    console.log('='.repeat(120));
    console.log('ALL USERS IN SMARTCRM DATABASE');
    console.log('='.repeat(120));
    console.log();
    
    const result = await client.query(`
      SELECT 
        p.id,
        u.email,
        p.first_name,
        p.last_name,
        p.username,
        p.role,
        p.app_context,
        p.email_template_set,
        p.created_at,
        p.updated_at,
        u.email_confirmed_at,
        u.last_sign_in_at
      FROM public.profiles p
      LEFT JOIN auth.users u ON p.id = u.id
      ORDER BY p.created_at DESC
    `);
    
    console.log(`Total Users: ${result.rows.length}\n`);
    console.log('-'.repeat(120));
    
    result.rows.forEach((user, index) => {
      console.log(`\n#${index + 1}`);
      console.log(`ID:              ${user.id}`);
      console.log(`Email:           ${user.email}`);
      console.log(`Name:            ${user.first_name || ''} ${user.last_name || ''}`);
      console.log(`Username:        ${user.username}`);
      console.log(`Role:            ${user.role}`);
      console.log(`App Context:     ${user.app_context}`);
      console.log(`Email Template:  ${user.email_template_set}`);
      console.log(`Email Confirmed: ${user.email_confirmed_at ? new Date(user.email_confirmed_at).toLocaleString() : 'Not confirmed'}`);
      console.log(`Last Sign In:    ${user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never'}`);
      console.log(`Created:         ${new Date(user.created_at).toLocaleString()}`);
      console.log(`Updated:         ${new Date(user.updated_at).toLocaleString()}`);
      console.log('-'.repeat(120));
    });
    
    // Summary by app context
    console.log('\n\n');
    console.log('='.repeat(120));
    console.log('SUMMARY BY APP CONTEXT');
    console.log('='.repeat(120));
    
    const contextSummary = await client.query(`
      SELECT 
        COALESCE(app_context, 'Not Assigned') as context,
        COUNT(*) as count
      FROM public.profiles
      GROUP BY app_context
      ORDER BY count DESC
    `);
    
    contextSummary.rows.forEach(row => {
      console.log(`${row.context}: ${row.count} users`);
    });
    
    // Summary by role
    console.log('\n');
    console.log('='.repeat(120));
    console.log('SUMMARY BY ROLE');
    console.log('='.repeat(120));
    
    const roleSummary = await client.query(`
      SELECT 
        role,
        COUNT(*) as count
      FROM public.profiles
      GROUP BY role
      ORDER BY count DESC
    `);
    
    roleSummary.rows.forEach(row => {
      console.log(`${row.role}: ${row.count} users`);
    });
    
    client.release();
    await pool.end();
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

listAllUsers();
