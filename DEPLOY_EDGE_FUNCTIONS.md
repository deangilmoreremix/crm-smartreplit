# Deploy Missing Edge Functions

You're missing the core `contacts` and `deals` Edge Functions that your remote apps need. I've created them properly according to Supabase's documentation.

## Missing Functions Created

### ✅ contacts
- **Path**: `supabase/functions/contacts/index.ts`  
- **URL**: Will be `https://YOUR_PROJECT_REF.supabase.co/functions/v1/contacts`
- **Features**: Full CRUD operations, filtering, pagination, proper field mapping

### ✅ deals  
- **Path**: `supabase/functions/deals/index.ts`
- **URL**: Will be `https://YOUR_PROJECT_REF.supabase.co/functions/v1/deals`
- **Features**: Full CRUD operations, filtering, pagination, proper field mapping

## How to Deploy

### Option 1: Using Supabase CLI (Recommended)

```bash
# Install Supabase CLI if not installed
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy the new functions
supabase functions deploy contacts
supabase functions deploy deals
```

### Option 2: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to Edge Functions
3. Click "Create a new function"
4. Name it `contacts` and paste the content from `supabase/functions/contacts/index.ts`
5. Deploy
6. Repeat for `deals` function

## Key Features of These Functions

### Proper REST API Design
- `GET /contacts` - List contacts with filtering
- `GET /contacts/{id}` - Get single contact
- `POST /contacts` - Create contact
- `PATCH /contacts/{id}` - Update contact  
- `DELETE /contacts/{id}` - Delete contact

### Field Mapping
- Maps between your frontend interface and database schema
- Handles `firstName/lastName` ↔ `first_name/last_name`
- Converts `sources` array ↔ `source` string
- Maps `title` ↔ `position`

### Error Handling
- Proper HTTP status codes
- CORS headers for browser access
- Detailed error messages
- Graceful error responses

### Remote App Compatibility
- Maintains exact same endpoint structure your remote apps expect
- Returns data in the format your Contact/Deal interfaces expect
- Handles authentication via Authorization header

## Testing the Functions

After deployment, test with:

```bash
# Test contacts
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/contacts \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"User","email":"test@example.com"}'

# Test deals  
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/deals \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Deal","value":10000}'
```

## Once Deployed

Your services will automatically work with persistent storage because:

1. ✅ Edge Function endpoints exist at the expected URLs
2. ✅ Functions connect to your Supabase database 
3. ✅ Field mapping handles interface differences
4. ✅ Remote apps can call the functions without changes
5. ✅ Local development still has localStorage fallback

This solves your original issue while maintaining remote app compatibility!