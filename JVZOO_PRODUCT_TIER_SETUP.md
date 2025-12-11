# JVZoo Product Tier Authentication Setup

## Overview
This system integrates JVZoo sales with Supabase authentication and product-based access control for three tiers:
- **SmartCRM** (base): Dashboard, Contacts, Pipeline, Calendar
- **Sales Maximizer**: Base features + AI Goals
- **AI Boost Unlimited**: All features + AI Tools

## Architecture

### Product Tiers
1. **smartcrm** - Base CRM features (default)
2. **sales_maximizer** - Includes AI Goals remote module
3. **ai_boost_unlimited** - Includes all AI Tools

### Access Control Flow
```
JVZoo Sale → Webhook → Create Supabase User → Send Magic Link → User Sets Password → Access Based on Product Tier
```

## Configuration

### 1. JVZoo Webhook Setup

**Webhook URL:** `https://your-domain.com/api/webhooks/jvzoo`

**Required Environment Variables:**
```bash
# JVZoo Configuration
JVZOO_SECRET_KEY=your_secret_key_here
# OR
JVZOO_IPNSECRET=your_ipn_secret_here

# Supabase (already configured)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Frontend URL for magic link redirect
FRONTEND_URL=https://smart-crm.videoremix.io
```

### 2. Product Mapping

Update the `PRODUCT_TIER_MAP` in `server/jvzoo-webhook.ts`:

```typescript
const PRODUCT_TIER_MAP: Record<string, ProductTier> = {
  // Map your actual JVZoo product IDs here
  'YOUR_SMARTCRM_PRODUCT_ID': 'smartcrm',
  'YOUR_SALES_MAXIMIZER_PRODUCT_ID': 'sales_maximizer', 
  'YOUR_AI_BOOST_PRODUCT_ID': 'ai_boost_unlimited',
};
```

### 3. Database Migration

Run the migration to add product_tier column:
```bash
# The migration file is already created at:
# supabase/migrations/20250117000002_add_product_tier.sql

# Apply it to your Supabase database via Supabase Dashboard
# Or run locally: npm run db:push
```

## JVZoo Webhook Events

### Supported Events
- **SALE**: New purchase → Creates user account with magic link
- **RFND**: Refund → Downgrades to base tier
- **CGBK**: Chargeback → Downgrades to base tier
- **INSF**: Insufficient funds → Logged (no action)

### Webhook Payload Example
```json
{
  "ccustname": "John Doe",
  "ccustemail": "john@example.com",
  "ctransaction": "SALE",
  "cproditem": "sales_maximizer",
  "cprodtitle": "Sales Maximizer Package",
  "ctransreceipt": "ABC123",
  "cverify": "SHA1_HASH_HERE"
}
```

## Testing the Flow

### 1. Test Webhook Locally

```bash
curl -X POST http://localhost:5000/api/webhooks/jvzoo \
  -H "Content-Type: application/json" \
  -d '{
    "ccustname": "Test User",
    "ccustemail": "test@example.com",
    "ctransaction": "SALE",
    "cproditem": "sales_maximizer",
    "cprodtitle": "Sales Maximizer Package",
    "ctransreceipt": "TEST123",
    "ctransvendor": "yourvendor",
    "cverify": "CALCULATED_HASH"
  }'
```

**Note:** Calculate `cverify` hash:
```javascript
const crypto = require('crypto');
const secretKey = 'YOUR_SECRET_KEY';
const receipt = 'TEST123';
const transaction = 'SALE';
const verificationString = `${secretKey}:${receipt}:${transaction}`;
const hash = crypto.createHash('sha1').update(verificationString).digest('hex').toUpperCase();
console.log(hash); // Use this as cverify
```

### 2. Verify User Creation

Check Supabase Dashboard → Authentication → Users
- User should be created with email
- User metadata should include `product_tier`

### 3. Test Magic Link

Check user's email for magic link → Click link → Set password → Login

### 4. Verify Access Control

**SmartCRM tier users should see:**
- ✅ Dashboard
- ✅ Contacts
- ✅ Pipeline
- ✅ Calendar
- ✅ Communication
- ❌ AI Goals (hidden)
- ❌ AI Tools (hidden)

**Sales Maximizer tier users should see:**
- ✅ All SmartCRM features
- ✅ AI Goals
- ❌ AI Tools (hidden)

**AI Boost Unlimited tier users should see:**
- ✅ All features
- ✅ AI Goals
- ✅ AI Tools

### 5. Test Admin Product Tier Management

1. Login as super admin (dean@videoremix.io, victor@videoremix.io, samuel@videoremix.io)
2. Navigate to Admin Panel → User Management
3. Find the test user
4. Change their product tier using the dropdown
5. Verify the user's navigation updates immediately

## Access Control Implementation

### Navigation (client/src/components/Navbar.tsx)
```typescript
// Tabs are filtered based on canAccess() check
const allTabs = [...]; // All navigation items
const mainTabs = allTabs.filter(tab => {
  if (!tab.requiresAccess) return true;
  return canAccess(tab.requiresAccess);
});
```

### Route Protection (client/src/App.tsx)
```typescript
<Route path="/ai-goals" element={
  <ProtectedRoute resource="ai_goals">
    <Navbar />
    <AIGoalsWithRemote />
  </ProtectedRoute>
} />
```

### Access Rules (client/src/components/RoleBasedAccess.tsx)
```typescript
const productTierAccess = {
  'ai_goals': ['sales_maximizer', 'ai_boost_unlimited'],
  'ai_tools': ['ai_boost_unlimited'],
};
```

## Files Modified

### Schema & Types
- `shared/schema.ts` - Added `productTier` field and types
- `supabase/migrations/20250117000002_add_product_tier.sql` - Database migration

### Backend
- `server/jvzoo-webhook.ts` - NEW: JVZoo webhook handler
- `server/routes.ts` - Added webhook route and product tier update endpoint

### Frontend
- `client/src/components/RoleBasedAccess.tsx` - Product tier access logic
- `client/src/components/Navbar.tsx` - Conditional navigation based on tier
- `client/src/App.tsx` - Route guards for protected features
- `client/src/pages/UserManagement.tsx` - Admin product tier management UI

## Troubleshooting

### Webhook Not Working
1. Check JVZoo IPN configuration has correct URL
2. Verify `JVZOO_SECRET_KEY` environment variable
3. Check server logs for webhook verification errors
4. Test hash calculation matches JVZoo's

### User Not Created
1. Verify Supabase service role key has admin permissions
2. Check Supabase logs for user creation errors
3. Ensure email is valid format

### Magic Link Not Sent
1. Check Supabase email templates are configured
2. Verify SMTP settings in Supabase
3. Check user's email metadata includes `email_template_set: 'smartcrm'`

### Access Control Not Working
1. Clear browser cache and localStorage
2. Check user's `productTier` field in database
3. Verify `canAccess()` logic in RoleBasedAccess
4. Check browser console for role/access errors

## Security Notes

1. **Webhook Verification**: Always verify the `cverify` hash from JVZoo
2. **Admin Emails**: Super admin emails are hardcoded and cannot be changed via webhook
3. **Product Tier Updates**: Only super admins can manually change product tiers
4. **Refunds**: Automatically downgrade to base tier on RFND/CGBK events

## Next Steps

1. **Configure JVZoo Products**: Map your actual product IDs in the webhook handler
2. **Test Purchase Flow**: Make a real or test purchase through JVZoo
3. **Monitor Webhooks**: Watch server logs for incoming webhook events
4. **Verify Access**: Login with different tiers and verify feature access
5. **Email Templates**: Customize Supabase email templates for your brand
