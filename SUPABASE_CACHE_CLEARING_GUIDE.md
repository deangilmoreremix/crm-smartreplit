# Supabase Schema Cache Clearing Guide

## Quick Methods to Clear Cache

### Method 1: Dashboard Schema Refresh (Easiest)
1. Go to **Table Editor**: https://supabase.com/dashboard/project/YOUR_PROJECT_REF/editor
2. Click on the **deals** table
3. Click the **Refresh** icon (🔄) in the top right
4. Wait 30 seconds, then redeploy your Edge Function

### Method 2: Force Schema Update via SQL
Run this in your **SQL Editor**:
```sql
-- Force table metadata refresh
COMMENT ON TABLE deals IS 'Schema cache refresh';
COMMENT ON TABLE contacts IS 'Schema cache refresh';
```

### Method 3: Restart Edge Functions
1. Go to **Edge Functions**: https://supabase.com/dashboard/project/YOUR_PROJECT_REF/functions
2. Click on **deals** function
3. Click **Deploy** (redeploy without changes)
4. Wait 1-2 minutes for cache to clear

### Method 4: PostgREST Schema Cache Reset
In **SQL Editor**, run:
```sql
-- This forces PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
```

### Method 5: Wait and Retry (Natural Cache Expiry)
- Supabase schema cache expires every **10 minutes**
- Wait 10-15 minutes and try your function again

## Troubleshooting Steps

### If Cache Issues Persist:

1. **Check Actual Columns Exist**:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'deals' 
ORDER BY ordinal_position;
```

2. **Verify with Raw Data**:
```sql
SELECT * FROM deals LIMIT 1;
```

3. **Use Generic SELECT***:
Instead of specific column names in Edge Functions, use `SELECT *` to avoid cache issues.

### Best Practices to Avoid Cache Issues:

1. **Always use `SELECT *` in Edge Functions** when possible
2. **Avoid explicit column lists** in schema-sensitive queries  
3. **Test functions after any schema changes**
4. **Redeploy functions after database modifications**

## Current Issue Resolution

For your deals function, the fastest fix is:

1. **Deploy the simple version** I created (`supabase/functions/deals/index.ts.simple`)
2. **Use Method 1 above** to refresh the schema in Dashboard
3. **Wait 2-3 minutes** for cache to propagate
4. **Test the function again**

The simple version uses `SELECT *` which bypasses column-specific cache issues.

## Prevention

After resolving, consider:
- Using `SELECT *` in Edge Functions instead of explicit column names
- Always refreshing schema cache after database changes
- Testing Edge Functions immediately after deployment