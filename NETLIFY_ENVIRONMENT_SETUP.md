# Netlify Environment Variables Setup Guide

## Overview
This guide explains how to properly configure environment variables in Netlify after removing exposed secrets from the repository. The `client/.env` file has been removed to prevent security issues, and all sensitive configuration must now be set through Netlify's environment variables.

## Why This Change Was Made
- **Security**: API keys and secrets were exposed in the repository
- **Compliance**: Netlify's security scanner flagged exposed secrets
- **Best Practices**: Environment variables should never be committed to version control

## Required Environment Variables

### Client-Side Variables (VITE_ prefixed)
These variables are accessible in the browser and should be safe to expose:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: AI API Keys (only if needed in browser)
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_ELEVENLABS_API_KEY=your_elevenlabs_api_key

# Application Configuration
VITE_ENV=production
```

### Server-Side Variables (for Edge Functions)
These variables are only accessible server-side and contain sensitive information:

```bash
# Database
DATABASE_URL=your_database_url

# Supabase (Server-side)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# API Keys (Server-side only)
OPENAI_API_KEY=your_openai_api_key
GEMINI_API_KEY=your_gemini_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key

# Server Configuration
PORT=5000
NODE_ENV=production
```

## How to Configure in Netlify

### Step 1: Access Netlify Dashboard
1. Go to [netlify.com](https://netlify.com) and sign in
2. Select your Smart CRM project

### Step 2: Configure Environment Variables
1. Go to **Site Settings** → **Environment Variables**
2. Click **Add Variable** for each required variable
3. Set the variable name and value
4. Choose the appropriate scope (All branches or specific branches)

### Step 3: Variable Scopes
- **Build Time**: Variables available during build process
- **Runtime**: Variables available to your application at runtime
- **Post-Processing**: Variables available during post-processing

For this project:
- All client-side variables (VITE_*) should be **Build Time**
- Server-side variables should be **Runtime**

## Verification Steps

### 1. Check Build Logs
After deployment, check the Netlify build logs to ensure:
- No "exposed secrets" warnings
- Environment variables are properly loaded
- Build completes successfully

### 2. Test Application Functionality
Verify that:
- Supabase connection works
- AI services function properly
- All features work as expected

## Troubleshooting

### Build Still Failing?
If you see "exposed secrets" errors:
1. Check that `client/.env` is completely removed from repository
2. Ensure all secrets are moved to Netlify environment variables
3. Clear Netlify's build cache and redeploy

### Missing Environment Variables?
If the app doesn't work after deployment:
1. Check Netlify logs for missing environment variable errors
2. Verify variable names match exactly (case-sensitive)
3. Ensure variables are set for the correct branch/context

### Local Development
For local development, create a `client/.env` file with your local values:
```bash
# Copy from .env.example and fill in your local values
cp client/.env.example client/.env
```

## Security Best Practices

1. **Never commit .env files** to version control
2. **Use different keys** for development and production
3. **Rotate keys regularly** for security
4. **Monitor access logs** for suspicious activity
5. **Use Netlify's branch-specific variables** for different environments

## Support

If you encounter issues:
1. Check the [Netlify Documentation](https://docs.netlify.com/configure-builds/environment-variables/)
2. Review the build logs for specific error messages
3. Ensure all required variables are configured correctly

---

**Last Updated**: 2025-09-17
**Security Fix**: Removed exposed secrets from repository