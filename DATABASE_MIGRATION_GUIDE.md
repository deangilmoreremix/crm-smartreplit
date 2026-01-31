# Database Migration Guide: Neon to Supabase PostgreSQL

## Overview
This guide will help you migrate your application database from Neon (Replit-hosted) to Supabase PostgreSQL.

---

## Prerequisites

1. **Supabase Account** - Sign up at https://supabase.com if you haven't already
2. **Supabase Project** - Create a new project or use an existing one
3. **Current Neon Database Credentials** - You have these from Replit

---

## Step 1: Get Your Supabase Connection String

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Go to **Settings** → **Database**
4. Under **Connection string**, select **URI** format
5. Copy the connection string (it will look like):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

**Note**: Replace `[YOUR-PASSWORD]` with your database password (set when you created the project).

---

## Step 2: Export Data from Neon (Current Database)

Run this command in your terminal to export all data:

```bash
pg_dump \
  --host=ep-lucky-pond-adj1appn.c-2.us-east-1.aws.neon.tech \
  --port=5432 \
  --username=neondb_owner \
  --dbname=neondb \
  --format=plain \
  --no-owner \
  --no-privileges \
  > database_backup.sql
```

When prompted, enter the password: `npg_m3wCI0Kcuzxh`

This will create a file called `database_backup.sql` with all your data.

---

## Step 3: Import Data to Supabase

### Option A: Using psql (Command Line)

```bash
psql \
  --host=db.[PROJECT-REF].supabase.co \
  --port=5432 \
  --username=postgres \
  --dbname=postgres \
  < database_backup.sql
```

Replace `[PROJECT-REF]` with your actual Supabase project reference.

When prompted, enter your Supabase database password.

### Option B: Using Supabase Dashboard (SQL Editor)

1. Open the `database_backup.sql` file
2. Copy the contents
3. Go to Supabase Dashboard → **SQL Editor**
4. Paste the SQL
5. Click **Run**

**Note**: For large databases, use Option A (command line) as the SQL Editor has size limits.

---

## Step 4: Update Application Code

The application currently uses `@neondatabase/serverless` which is specific to Neon. We need to update it to use a standard PostgreSQL connection that works with Supabase.

### Update `server/db.ts`

Replace the current content with:

```typescript
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "../shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Supabase
  }
});

export const db = drizzle({ client: pool, schema });
```

### Install Required Package

```bash
npm install pg
npm uninstall @neondatabase/serverless
```

---

## Step 5: Update Netlify Environment Variables

In your Netlify dashboard, update the `DATABASE_URL` environment variable:

**Old Value (Neon):**
```
postgresql://neondb_owner:npg_m3wCI0Kcuzxh@ep-lucky-pond-adj1appn.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
```

**New Value (Supabase):**
```
postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

Replace:
- `[YOUR-PASSWORD]` with your Supabase database password
- `[PROJECT-REF]` with your Supabase project reference

---

## Step 6: Test the Migration

1. **Run database migrations** (if using Drizzle):
   ```bash
   npm run db:push
   ```

2. **Verify data was imported correctly**:
   - Check Supabase Dashboard → Table Editor
   - Verify tables and data are present

3. **Test the application locally**:
   ```bash
   npm run dev
   ```

4. **Deploy to Netlify** and verify everything works

---

## Troubleshooting

### Issue: "Connection refused" or timeout
- Make sure you're using the correct Supabase host
- Verify your Supabase project is active
- Check that your IP is not blocked (Supabase has IP restrictions)

### Issue: "Permission denied"
- Make sure you're using the `postgres` user (not `supabase_admin`)
- Verify the password is correct

### Issue: Missing tables after import
- Check the `database_backup.sql` file was created successfully
- Ensure the import command completed without errors
- Check Supabase SQL Editor logs for errors

### Issue: SSL errors
- The updated `server/db.ts` includes SSL configuration
- Supabase requires SSL connections

---

## Post-Migration Checklist

- [ ] Data exported from Neon successfully
- [ ] Data imported to Supabase successfully
- [ ] All tables visible in Supabase Table Editor
- [ ] Application code updated (`server/db.ts`)
- [ ] Dependencies updated (`pg` installed, `@neondatabase/serverless` removed)
- [ ] Netlify environment variables updated
- [ ] Local testing passed
- [ ] Netlify deployment successful
- [ ] Application functionality verified

---

## Security Notes

⚠️ **Important**: After migration:
1. **Rotate your Supabase database password** in the Supabase Dashboard
2. **Never commit database credentials** to your repository
3. **Use Netlify environment variables** for all sensitive data
4. **Delete the `database_backup.sql` file** after successful migration

---

## Need Help?

If you encounter issues:
1. Check Supabase documentation: https://supabase.com/docs
2. Verify your connection string format
3. Check Netlify deploy logs for errors
4. Test database connectivity locally first
