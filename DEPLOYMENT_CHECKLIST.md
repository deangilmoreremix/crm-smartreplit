# SmartCRM Deployment Checklist

## Pre-Deployment Checklist

### Environment Configuration

- [ ] `VITE_SUPABASE_URL` configured in Netlify environment
- [ ] `VITE_SUPABASE_ANON_KEY` configured in Netlify environment
- [ ] `OPENAI_API_KEY` configured in Netlify environment
- [ ] `STRIPE_SECRET_KEY` configured in Netlify environment
- [ ] `STRIPE_WEBHOOK_SECRET` configured in Netlify environment
- [ ] `SESSION_SECRET` configured in Netlify environment
- [ ] `REDIS_URL` configured in Netlify environment
- [ ] `NETLIFY_AUTH_TOKEN` available locally
- [ ] `NETLIFY_SITE_ID` configured

### Database

- [ ] Supabase project is accessible
- [ ] All migrations applied (`npm run db:push`)
- [ ] RLS policies verified
- [ ] Database indexes created
- [ ] Test data migrated (if applicable)

### Code Quality

- [ ] `npm run lint` passes without errors
- [ ] `npm run check` (TypeScript) passes without errors
- [ ] `npm run test` passes
- [ ] No console errors in build output

### Build Verification

- [ ] `npm run build` completes successfully
- [ ] `client/dist` contains expected files
- [ ] Assets properly hashed for cache busting
- [ ] Environment variables embedded correctly

### Security

- [ ] No secrets in source code
- [ ] CORS configured for production domains
- [ ] Security headers enabled (X-Frame-Options, etc.)
- [ ] Rate limiting enabled on API endpoints

## Post-Deployment Verification

### Basic Checks

- [ ] Application loads without errors
- [ ] Login/logout works
- [ ] Navigation works between pages
- [ ] No 404 errors for assets

### API Verification

- [ ] `/api/health` returns 200
- [ ] Contacts API responds correctly
- [ ] Deals API responds correctly
- [ ] Auth endpoints work

### Integration Testing

- [ ] Supabase connection working
- [ ] Redis session storage working
- [ ] OpenAI enrichment working
- [ ] Stripe webhooks receiving events

### Monitoring

- [ ] Netlify function logs accessible
- [ ] Error tracking configured
- [ ] Uptime monitoring enabled
- [ ] Health check script passing

## Rollback Procedure

### Quick Rollback (Netlify)

1. Log in to [Netlify Dashboard](https://app.netlify.com)
2. Navigate to Deploys
3. Find last working deployment
4. Click "Promote to production"

### Manual Rollback (if Netlify unavailable)

1. Clone previous version:
   ```bash
   git checkout <previous-tag>
   ```
2. Redeploy:
   ```bash
   ./scripts/deploy.sh
   ```

### Database Rollback

1. Use Drizzle Kit to revert:
   ```bash
   npm run db:push -- --force
   ```
2. Or manually restore from Supabase backup

### Environment Rollback

1. Revert environment variables in Netlify UI
2. Or use Netlify CLI:
   ```bash
   netlify env:import --scope production < vars.production
   ```

## Deployment Commands

### Deploy to Production

```bash
./scripts/deploy.sh
```

### Deploy with Site Name

```bash
./scripts/deploy.sh my-site-name
```

### Run Health Checks

```bash
./scripts/health-check.sh
```

### Deploy Functions Only

```bash
netlify functions:deploy
```

## Troubleshooting

### Build Failures

1. Check Node.js version matches `20`
2. Verify all dependencies installed
3. Clear build cache: `netlify deploy --build-cache-clean`

### Function Errors

1. Check function logs: `netlify functions:log`
2. Test locally: `netlify dev`
3. Verify environment variables set

### Database Connection Issues

1. Verify Supabase project running
2. Check connection string format
3. Test IP allowlist settings

## Contacts

- **Development Team:** Internal
- **Supabase Support:** support@supabase.io
- **Netlify Support:** support@netlify.com
