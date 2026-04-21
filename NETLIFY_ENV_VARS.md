# Netlify Environment Variables Guide

# Complete list of all environment variables needed for production deployment

## =====================================================

# SUPABASE (Required for Database & Auth)

# =====================================================

DATABASE*URL=postgresql://postgres:VideoRemix2026@db.bzxohkrxcwodllketcpz.supabase.co:5432/postgres
SUPABASE_URL=https://bzxohkrxcwodllketcpz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6eG9oa3J4Y3dvZGxsa2V0Y3B6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzg2NjM4NSwiZXhwIjoyMDg5NDQyMzg1fQ.S5HmTONnamT169WYF0riSphXij-Mwtk7D3pphfSrCFE
SUPABASE_ANON_KEY=sb_publishable*-CX9glOjtolD9mPJqjHlaQ_bFxkQZn6

# Client-side Supabase (VITE\_ prefix - safe to expose)

VITE*SUPABASE_URL=https://bzxohkrxcwodllketcpz.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable*-CX9glOjtolD9mPJqjHlaQ_bFxkQZn6

# =====================================================

# OPENAI (Required for AI Features)

# =====================================================

# Your OpenAI API Key - get from https://platform.openai.com/api-keys

OPENAI_API_KEY=sk-your-openai-api-key-here

# Fallback key (optional - for redundancy)

OPENAI_API_KEY_FALLBACK=sk-your-fallback-key-here

# Google AI (Alternative AI Provider)

GOOGLE_AI_API_KEY=your-google-ai-api-key-here

# =====================================================

# ELEVENLABS (Voice/AI Audio Features)

# =====================================================

ELEVENLABS_API_KEY=your-elevenlabs-api-key-here

# =====================================================

# SENDGRID (Email Sending)

# =====================================================

SENDGRID_API_KEY=your-sendgrid-api-key-here

# SendGrid Template IDs (optional - defaults exist)

# SENDGRID_INVITE_TEMPLATE_ID=d-invite-template

# SENDGRID_ADMIN_TEMPLATE_ID=d-admin-template

# SENDGRID_PREMIUM_TEMPLATE_ID=d-premium-template

# SENDGRID_BASIC_TEMPLATE_ID=d-basic-template

# =====================================================

# STRIPE (Payment Processing)

# =====================================================

STRIPE_SECRET_KEY=sk_live_your-stripe-secret-key-here
STRIPE_WEBHOOK_SECRET=whsec_your-stripe-webhook-secret-here

# Stripe Price IDs for subscriptions

STRIPE_SMARTCRM_BUNDLE_PRICE_ID=price_your-smartcrm-bundle-price-id
STRIPE_SALES_MAXIMIZER_PRICE_ID=price_your-sales-maximizer-price-id

# =====================================================

# AWS (S3 Storage for some features)

# =====================================================

AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_REGION=us-east-1
S3_HOST=your-s3-bucket.s3.amazonaws.com
S3_REGION=us-east-1

# =====================================================

# MESSAGEBIRD (SMS Features)

# =====================================================

MESSAGEBIRD_API_KEY=your-messagebird-api-key-here

# =====================================================

# OPENCLAW (CRM Integration)

# =====================================================

OPENCLAW_API_KEY=your-openclaw-api-key-here

# =====================================================

# JVZOO (Affiliate Platform Integration)

# =====================================================

JVZOO_SECRET_KEY=your-jvzoo-secret-key
JVZOO_IPNSECRET=your-jvzoo-ipn-secret

# =====================================================

# DATADOG (Monitoring - Optional)

# =====================================================

DATADOG_API_KEY=your-datadog-api-key-here

# =====================================================

# SERVER CONFIGURATION

# =====================================================

PORT=5000
NODE_ENV=production
CACHE_KEY_PREFIX=smartcrm:

# =====================================================

# DEVELOPMENT BYPASS (Remove in production!)

# =====================================================

# VITE_DEV_BYPASS_PASSWORD=dev-bypass-password-change-in-production
