# Manual Edge Functions Deployment Guide

Since CLI authentication isn't available in this environment, here are the manual deployment methods for your missing Edge Functions.

## Missing Functions That Need Deployment

### ✅ contacts
**Status**: Created locally, needs deployment  
**File**: `supabase/functions/contacts/index.ts`

### ✅ deals  
**Status**: Created locally, needs deployment
**File**: `supabase/functions/deals/index.ts`

## Method 1: Supabase Dashboard (Recommended)

### Deploy `contacts` Function
1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT_REF/functions
2. Click **"Create a new function"**
3. Name: `contacts`
4. Copy the entire content from `supabase/functions/contacts/index.ts` 
5. Paste into the function editor
6. Click **"Deploy function"**

### Deploy `deals` Function  
1. Click **"Create a new function"**
2. Name: `deals`
3. Copy the entire content from `supabase/functions/deals/index.ts`
4. Paste into the function editor  
5. Click **"Deploy function"**

## Method 2: Using CLI (If You Have Access)

If you have local CLI access with authentication:

```bash
# Link your project (one time)
supabase link --project-ref YOUR_PROJECT_REF

# Deploy both functions
supabase functions deploy contacts --project-ref YOUR_PROJECT_REF
supabase functions deploy deals --project-ref YOUR_PROJECT_REF
```

## Method 3: GitHub Actions (For Future Automation)

Create `.github/workflows/deploy-functions.yml`:

```yaml
name: Deploy Functions
on:
  push:
    branches: [main]
    paths: ['supabase/functions/**']
jobs:
  deploy:
    runs-on: ubuntu-latest
    env:
      SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
      PROJECT_REF: YOUR_PROJECT_REF
    steps:
      - uses: actions/checkout@v3
      - uses: supabase/setup-cli@v1
      - run: supabase functions deploy --project-ref $PROJECT_REF
```

## After Deployment - Expected Results

Once deployed, these URLs should work:

### Contacts Function
- **URL**: https://YOUR_PROJECT_REF.supabase.co/functions/v1/contacts
- **Methods**: GET, POST, PATCH, DELETE
- **Test**: 
  ```bash
  curl https://YOUR_PROJECT_REF.supabase.co/functions/v1/contacts \
    -H "Authorization: Bearer YOUR_ANON_KEY"
  ```

### Deals Function  
- **URL**: https://YOUR_PROJECT_REF.supabase.co/functions/v1/deals
- **Methods**: GET, POST, PATCH, DELETE  
- **Test**:
  ```bash
  curl https://YOUR_PROJECT_REF.supabase.co/functions/v1/deals \
    -H "Authorization: Bearer YOUR_ANON_KEY"
  ```

## Verify Your Existing Functions

Your current deployed functions that should remain working:
- ✅ ai-analysis, ai-insights, ai-workflow-builder
- ✅ content-analyze, content-optimize, content-performance  
- ✅ gemini-generate, openai-generate
- ✅ admin-create-user, admin-update-user
- ✅ enrich-contact, analyze-sentiment
- ✅ All 40+ other AI and utility functions

## Post-Deployment Testing

After deploying, test in your CRM:

1. **Go to Contacts page** - Should load and work with persistent data
2. **Create a new contact** - Should save to database, not just localStorage  
3. **Go to Pipeline/Deals page** - Should load and work with persistent data
4. **Create a new deal** - Should save to database
5. **Check remote apps** - Should now work with persistent data

## Troubleshooting

### If Functions Fail to Deploy:
- Check that you copied the entire file content
- Verify no syntax errors in the dashboard editor
- Ensure your Supabase project has the required database tables

### If Functions Deploy But Don't Work:
- Check the Function logs in Supabase Dashboard
- Verify your database tables exist (`contacts`, `deals`)  
- Test the function URLs directly with curl

### Database Tables Required:

Your functions expect these tables to exist:

```sql
-- contacts table
CREATE TABLE contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  company TEXT,
  position TEXT,
  status TEXT DEFAULT 'lead',
  source TEXT DEFAULT 'Website',
  lead_score INTEGER,
  engagement_score INTEGER,
  tags TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- deals table  
CREATE TABLE deals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  value DECIMAL,
  stage TEXT DEFAULT 'discovery',
  status TEXT DEFAULT 'active',
  priority TEXT DEFAULT 'medium',
  contact_id UUID,
  contact_name TEXT,
  company TEXT,
  assignee_id UUID,
  assignee_name TEXT,
  expected_close_date DATE,
  probability INTEGER,
  ai_score INTEGER,
  tags TEXT[],
  activities JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Success Indicators

After successful deployment:
✅ Functions appear in your Supabase Functions list  
✅ Remote apps can connect to persistent data
✅ Contact/Deal creation saves to database
✅ No more 500 errors from missing endpoints  
✅ Data persists across sessions

Deploy using Method 1 (Dashboard) for the quickest results!