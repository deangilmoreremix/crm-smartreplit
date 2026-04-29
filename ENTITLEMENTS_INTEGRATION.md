# Supabase Entitlements Integration

## Overview

Complete feature gating system using Supabase database with 140 pre-loaded users across 4 package tiers.

## Packages & Feature Access

| Package | Users | Features | Access |
|---------|-------|----------|--------|
| `super_admin` | 1 (dean@smartcrm.vip) | All (wildcard `*`) | Everything |
| `whitelabel` | 10 (Whitelabel Lifetime) | SmartMarketer + White Label (37 features) | Full platform + branding |
| `smartmarketer` | 125 (all others) | AI, Analytics, Communication (27 features) | Full CRM/AI w/out white-label |
| `no_access` | 4 (Yearly buyers) | None (0) | Locked |
| `regular` | auto-created | Core CRM only (5 features) | Basic access |

**Note:** Yearly buyers are currently `no_access` but will receive `smartmarketer` once Stripe webhook is integrated.

## Database Schema

### Tables
- `public.user_entitlements` — one row per user (email unique)
- `public.package_features` — feature_key per package

### RPC Function
- `public.user_has_feature(email text, feature_key text)` → boolean

## Client Usage

### ProtectedRoute
```tsx
import { FeatureKey } from '../types/entitlements';

<ProtectedRoute featureKey={FeatureKey.AI_TOOLS}>
  <AIToolsPage />
</ProtectedRoute>

<ProtectedRoute featureKey={FeatureKey.WHITE_LABEL_CUSTOMIZATION}>
  <WhiteLabelCustomization />
</ProtectedRoute>
```

### Navbar Conditional Rendering
```tsx
import { useEntitlements } from '../contexts/EntitlementContext';
import { canAccess } from '../components/RoleBasedAccess';

const { canAccess } = useRole();
const { entitlement } = useEntitlements();

// Check feature
if (canAccess('ai_tools')) {
  // show AI menu
}

// Check package
if (entitlement?.package === 'whitelabel') {
  // show white-label menu
}
```

## Server Usage

### Middleware
```typescript
import { requireEntitlement } from '../middleware/entitlements';
import { FeatureKey } from '../types/entitlements';

// Protect single feature
app.post('/api/openclaw/run',
  requireAuth,
  requireEntitlement(FeatureKey.OPENCLAW),
  handler
);

// Already applied globally to route groups:
// - /api/openclaw/* → OPENCLAW
// - /api/openai/* → AI_TOOLS
// - /api/billing/* → BUY_CREDITS
// - /api/themes/* → WHITE_LABEL_CUSTOMIZATION
// - etc.
```

### Access Checks in Handlers
```typescript
// Entitlement attached by middleware
router.get('/api/some-protected', requireAuth, requireEntitlement(FeatureKey.X), (req, res) => {
  const userPackage = (req as any).userPackage; // 'smartmarketer' | 'whitelabel' | etc.
  const entitlement = (req as any).entitlement; // full UserEntitlement object
  // ... handler code
});
```

## Testing

### Database Queries
```bash
# Verify user count
supabase db query --linked -o table "SELECT package, COUNT(*) FROM user_entitlements GROUP BY package;"

# Test feature access
supabase db query --linked -o table "SELECT user_has_feature('fredrik.kaada@gmail.com', 'white_label_customization');"
supabase db query --linked -o table "SELECT user_has_feature('thomaspublications@gmail.com', 'ai_tools');"
supabase db query --linked -o table "SELECT user_has_feature('stevebarrett.ceo@gmail.com', 'dashboard');"
```

### Manual UI Testing
1. `npm run dev` → http://localhost:3000
2. Login with test accounts (magic link)
3. Verify navbar shows correct menu items
4. Try direct URLs (e.g., `/openclaw`, `/white-label`, `/ai-tools`)
5. Check API calls in DevTools Network tab (200 vs 403)

See MANUAL_TESTING_GUIDE.md for detailed checklist.

## Feature Key Reference

Common feature keys used in routes:
- `CORE_CRM` — base CRM access (granted to all non-no_access packages)
- `AI_TOOLS` — all OpenAI/AI features
- `ANALYTICS` — analytics dashboards
- `TEXT_MESSAGES` — SMS messaging
- `PHONE_SYSTEM` — VoIP phone
- `VIDEO_EMAIL` — video email
- `APPOINTMENTS` — calendar/appointments
- `WHITE_LABEL_CUSTOMIZATION` — theme customization
- `DOMAIN_MANAGEMENT` — custom domains
- `OPENCLAW` — OpenClaw AI CRM
- `ADMIN_PANEL` — admin dashboard
- `BUY_CREDITS` — billing/purchases

Full list: `client/src/types/entitlements.ts` (FeatureKey enum)

## Migration Notes

### Pre-Integration
- System used `productTier` field from `profiles` table for access control
- No centralized feature list; scattered role checks

### Post-Integration
- All access via `user_entitlements.package` + `package_features` mappings
- `user_has_feature()` is single source of truth
- Client and server both enforce gating

### Backwards Compatibility
- `profiles.productTier` field still exists but no longer used for gating
- Can be removed in future cleanup
- Existing code that reads `user.productTier` will not reflect correct package — use `entitlement.package` instead

## Future Work

### 1. Stripe Webhook Integration (TODO)
Update `server/stripe-webhook.ts` to sync payments to `user_entitlements`:

```typescript
// On checkout.session.completed
const { email, priceId } = session;
const package = mapPriceIdToPackage(priceId); // 'smartmarketer' | 'whitelabel'
await supabase
  .from('user_entitlements')
  .update({ package, source: 'Stripe', notes: priceId })
  .eq('email', email);
```

### 2. Code Cleanup (Optional)
- Remove `requireProductTier` export from `server/routes/auth.ts`
- Delete `server/routes.ts` if unused
- Replace remaining `user.productTier` references with `entitlement.package`

### 3. Admin UI (Optional)
Build admin page to manually edit `user_entitlements` records.

## Architecture

```
┌─────────────┐
│   React UI  │
└──────┬──────┘
       │ ProtectedRoute checks canAccessFeature()
       ▼
┌─────────────────┐
│  EntitlementContext  │
│  (fetches user_entitlements by email) │
└────────┬────────┘
         │ RPC call
         ▼
┌─────────────────────┐
│ Supabase            │
│ ├─ user_entitlements │
│ ├─ package_features  │
│ └─ user_has_feature()│
└─────────────────────┘
```

Server enforces same checks at API layer — never trust client.

## Support

Questions? See integration summary at `/tmp/INTEGRATION_SUMMARY.md` or review commit `75b0926`.
