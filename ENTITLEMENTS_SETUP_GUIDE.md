# Enhanced Entitlements System - Setup Guide

## Overview

The enhanced entitlements system provides comprehensive subscription management with product types, usage tracking, and webhook-based enforcement for SmartCRM.

## Features Implemented

### 1. Database Schema
- ✅ Entitlements table with product types (lifetime, monthly, yearly, payment_plan)
- ✅ Revocation timestamps with timezone support
- ✅ Invoice status tracking and delinquency counting
- ✅ Stripe and Zaxaa integration fields

### 2. Backend Services
- ✅ Entitlements utilities with Luxon timezone handling
- ✅ Stripe webhook handler for subscription events
- ✅ Zaxaa webhook handler for payment processing
- ✅ Automatic revocation date calculation
- ✅ API endpoints for entitlements management

### 3. Frontend Components
- ✅ RequireActive component for access control
- ✅ EntitlementsPage for admin management
- ✅ User-friendly status badges and messaging

### 4. Automated Enforcement
- ✅ Supabase Edge Function for scheduled sweeper
- ✅ Hourly cleanup of expired entitlements

## Setup Instructions

### 1. Environment Variables

Add these to your environment:

```env
# Stripe Integration (optional)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Zaxaa Integration (optional)
ZAXAA_WEBHOOK_SECRET=your_zaxaa_secret

# Already configured:
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...
```

### 2. Supabase Edge Function Deployment

Deploy the entitlements sweeper:

```bash
# Navigate to your Supabase project
supabase functions deploy entitlements-sweeper

# Schedule it to run hourly
supabase functions schedule create \
  --function-name entitlements-sweeper \
  --cron "0 * * * *"  # Every hour
```

### 3. Webhook Configuration

#### Stripe Webhooks:
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.replit.dev/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `customer.subscription.deleted`
   - `charge.dispute.created`

#### Zaxaa Webhooks:
1. Configure in Zaxaa admin panel
2. Set endpoint: `https://your-domain.replit.dev/api/webhooks/zaxaa`
3. Include user_id and product_type in metadata

### 4. Checkout Metadata

When creating payment sessions, include:

```javascript
metadata: {
  user_id: supabaseUserId,
  product_type: 'monthly' | 'yearly' | 'lifetime' | 'payment_plan'
}
```

## Usage Examples

### 1. Protecting Routes

```jsx
import RequireActive from '@/components/RequireActive';

function ProtectedFeature() {
  return (
    <RequireActive fallbackPath="/pricing">
      <YourFeatureComponent />
    </RequireActive>
  );
}
```

### 2. Manual Entitlement Creation

Access the admin panel at `/entitlements` to:
- View all user entitlements
- Create new entitlements manually
- Monitor subscription statuses
- Track payment history

### 3. Checking User Access

```javascript
// Frontend check
const response = await fetch('/api/entitlements/check');
const { isActive, entitlement } = await response.json();

// Backend check
import { getUserEntitlement, isUserActive } from './entitlements-utils';

const entitlement = await getUserEntitlement(userId);
const hasAccess = isUserActive(entitlement);
```

## Webhook Event Handling

### Payment Success
- Creates active entitlement
- Sets appropriate revocation date
- Resets delinquency count

### Payment Failure
- Payment plans: immediate revocation
- Subscriptions: grace period until natural expiration
- Updates delinquency count

### Cancellation
- Payment plans: immediate revocation
- Subscriptions: access until natural expiration

### Refunds
- Lifetime: no action (per policy)
- Others: immediate revocation

## Revocation Logic

### America/New_York Timezone
- Monthly: revokes at 12:00 AM ET first of next month
- Yearly: revokes at 12:00 AM ET first of next year
- Payment Plan: rolling monthly with immediate enforcement on failure
- Lifetime: never revokes

### Scheduled Enforcement
- Hourly sweeper checks for expired entitlements
- Automatically flips status from active/past_due to inactive
- Runs in Supabase Edge Functions for reliability

## API Endpoints

- `GET /api/entitlements/check` - Check user's entitlement status
- `GET /api/entitlements/list` - List all entitlements (admin)
- `POST /api/entitlements/create` - Manually create entitlement
- `POST /api/webhooks/stripe` - Stripe webhook handler
- `POST /api/webhooks/zaxaa` - Zaxaa webhook handler

## Monitoring & Troubleshooting

### Logs to Monitor
- Webhook processing success/failure
- Entitlement revocation events
- Payment processing errors
- Edge function execution

### Common Issues
1. **Timezone mismatches**: Ensure Luxon uses America/New_York
2. **Webhook signature failures**: Verify secret keys
3. **Missing metadata**: Check payment session setup
4. **Edge function timeouts**: Monitor Supabase function logs

## Next Steps

1. Test webhook integrations with Stripe/Zaxaa
2. Configure production webhook endpoints
3. Set up monitoring for critical entitlement events
4. Implement admin notifications for payment failures
5. Add reporting dashboard for subscription analytics

The system is now ready for production use with comprehensive subscription management and automated enforcement!