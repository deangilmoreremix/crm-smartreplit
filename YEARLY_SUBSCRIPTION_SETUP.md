# Yearly Subscription Setup - Revised

## Current Status

The 4 existing Yearly buyers are temporarily blocked (`no_access` package) as per your instruction. This is a **temporary restriction** for the initial cohort.

## Going Forward

When users purchase a **Yearly subscription** through the app, they should receive:

**Package:** `smartmarketer`

This gives them full access to:
- Core CRM (Dashboard, Contacts, Pipeline, Calendar)
- All AI Tools & AI Goals
- All Analytics & Intelligence features
- Communication Hub (Video Email, SMS, Phone, Voice Profiles)
- Smart Marketer tools (Invoicing, Lead Automation, Forms, Business Analyzer, Content Library, Circle Prospecting)
- Connected Apps (FunnelCraft AI, SmartCRM Closer, ContentAI)
- Billing/Credits

**NOT included:**
- White Label features
- OpenClaw
- Admin Panel

## Stripe Integration for Yearly Subscription

You'll need to create a Stripe product/price for "Smart CRM Yearly" and when the payment succeeds, call your backend to upgrade the user's entitlement from `no_access` (or `regular`) to `smartmarketing`.

### Stripe Webhook Handler Example

```ts
// In your Stripe webhook handler (e.g., server/stripe/webhook.ts)
import { requireEntitlement } from '../middleware/entitlements';

// When subscription is created/paid
if (event.type === 'checkout.session.completed' || event.type === 'customer.subscription.updated') {
  const session = event.data.object;
  const customerEmail = session.customer_email;
  const priceId = session.display_items?.[0]?.price?.id || session.price?.id;
  
  // Check if this is the Yearly price
  const YEARLY_PRICE_ID = 'price_your_yearly_price_id_here';
  
  if (priceId === YEARLY_PRICE_ID) {
    // Upgrade user to smartmarketer package
    await supabase
      .from('user_entitlements')
      .upsert(
        { email: customerEmail, package: 'smartmarketer' },
        { onConflict: 'email' }
      );
  }
}
```

### Pricing Page Route

```tsx
// New route for yearly subscription purchase
<Route
  path="/purchase/yearly"
  element={
    <ProtectedRoute requireProductTier>
      <Navbar />
      <YearlySubscriptionPage />
    </ProtectedRoute>
  }
/>
```

The `YearlySubscriptionPage` would integrate Stripe Checkout.

## Migration of Existing Yearly Buyers

When you're ready to activate the 4 existing Yearly buyers, simply update their package:

```sql
-- Change from no_access to smartmarketer
UPDATE public.user_entitlements
SET package = 'smartmarketer', updated_at = NOW()
WHERE email IN (
  'stevebarrett.ceo@gmail.com',
  'beam42@gmail.com',
  'appwebtisingsolutions@gmail.com',
  'nikolauswihlidal@gmail.com'
);
```

Or through the app, you could provide them a special upgrade link.

## Package Hierarchy Recap

| Package | Features | Price |
|----------|----------|-------|
| `no_access` | None | Free trial only (no login) |
| `regular` | Core CRM only | One-time purchase? (you need to define) |
| `smartmarketer` | Full platform (no white label/OpenClaw) | Lifetime, Monthly, **Yearly**, Main, Bundle, Dec Promo |
| `whitelabel` | Full + White Label | Whitelabel Lifetime |
| `super_admin` | Everything | Internal team |

## Action Items

1. **Define Regular package** — Determine if you want a "Regular" one-time purchase or if all paying customers get `smartmarketer`
2. **Set up Stripe** — Create Yearly price ID
3. **Build checkout page** — `/purchase/yearly` page with Stripe integration
4. **Webhook** — Handle subscription.success → upgrade entitlement to `smartmarketer`
5. **Decide on existing Yearly buyers** — When to activate them (immediately or after they pay again?)
