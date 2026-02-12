# Supabase CLI Setup - SmartCRM

## ✅ Completed Setup

### 1. Project Linked Successfully
- **Project ID**: `gadedbrnqzpfqtsdfzcg`
- **Project Name**: SmartCRM
- **Region**: East US (North Virginia)
- **Linked**: Yes

### 2. Configuration Updated
Updated `supabase/config.toml`:
- Project ID set to `gadedbrnqzpfqtsdfzcg`
- Auth URLs configured for production: `https://app.smartcrm.vip`
- Additional redirect URLs for auth callbacks

### 3. Secrets Configured in Supabase
The following secrets are set in Supabase Edge Functions:
- `ANTHROPIC_API_KEY`
- `CLIPDROP_API_KEY`
- `ELEVENLABS_API_KEY`
- `GEMINI_API_KEY`
- `OPENAI_API_KEY`
- `RECRAFT_API_KEY`
- `STABILITY_API_KEY`
- `SUPABASE_ANON_KEY`
- `SUPABASE_DB_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_URL`

---

## ⚠️ Manual Actions Required

### 1. Client-Side Environment Variables (Netlify)
Add these to **Netlify Dashboard → Site Settings → Environment Variables**:

| Variable | Value |
|----------|-------|
| `VITE_SUPABASE_URL` | `https://gadedbrnqzpfqtsdfzcg.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (use value from .env) |

**Note**: The `.env` file has the correct values. Copy `VITE_SUPABASE_ANON_KEY` from line 18 of `.env`.

### 2. Database Migrations
The CLI cannot connect through the pooler for migrations. Please run manually:

**Option A - Supabase Dashboard:**
1. Go to https://supabase.com/dashboard/project/gadedbrnqzpfqtsdfzcg/sql
2. Copy contents of `supabase/migrations/*.sql` files
3. Run each migration in the SQL editor

**Option B - Direct Connection:**
1. Get connection string from: Supabase Dashboard → Settings → Database
2. Use a PostgreSQL client (psql, DBeaver, TablePlus) with direct connection
3. Run migrations from `supabase/migrations/` directory

### 3. Auth Configuration
Update auth settings in Supabase Dashboard:
- Go to Authentication → URL Configuration
- Ensure Site URL is: `https://app.smartcrm.vip`
- Add redirect URLs:
  - `https://app.smartcrm.vip/auth/callback`
  - `https://app.smartcrm.vip/auth/reset-password`
  - `https://app.smartcrm.vip/auth/recovery`
  - `https://smartcrm.videoremix.io`

---

## Useful CLI Commands

```bash
# Check link status
npx supabase projects list

# List secrets
npx supabase secrets list --project-ref gadedbrnqzpfqtsdfzcg

# Set a secret
npx supabase secrets set MY_SECRET=value --project-ref gadedbrnqzpfqtsdfzcg

# Unlink project
npx supabase unlink

# Link again (if needed)
npx supabase link --project-ref gadedbrnqzpfqtsdfzcg
```

---

## Troubleshooting

### "Failed to connect to postgres" (SCRAM auth error)
This is a known issue with the connection pooler. Use direct connection through Supabase Dashboard SQL editor instead.

### "Supabase Not Configured" in browser
Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set in Netlify environment variables.

### Login issues after password reset
Ensure the user's email is confirmed in Supabase Authentication → Users table, or disable email confirmation in Authentication → Settings.
