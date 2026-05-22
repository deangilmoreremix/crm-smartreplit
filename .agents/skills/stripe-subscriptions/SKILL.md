---
name: stripe-subscriptions
description: "Use for Stripe Subscriptions, recurring billing, plans/prices, subscription lifecycle (trial, cancel, pause, resume), invoices, metered usage, and subscription checkout flows. Triggers: customer.subscription.*, invoice.* events, subscription schedules, coupon/promotion codes, usage records."
metadata:
  author: kilobyte
  version: "0.1.0"
---


# Stripe Subscriptions

## Core Principles

**1. Subscriptions in Stripe are built on Prices and Products.**
Define Products (your service offering) and Prices (recurring amount, interval). A Subscription links a Customer to a Price and manages recurring invoices automatically.

**2. Two mainstream checkout flows:**
- **Checkout Session** (`/v1/checkout/sessions`): Hosted Stripe page. Fastest path; handles most complexity (coupons, taxes, trials, discounts).
- **Custom subscription flow**: Build your own UI, create Subscription via API, handle payment method collection separately. More control but more work.

**3. Subscription lifecycle is event-driven.**
Listen to webhook events (`invoice.payment_succeeded`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`) to grant/revoke access. Do not rely on assumption that a successful PaymentIntent means ongoing access.

**4. Use `subscription_schedule` for complex billing cycles.**
If a subscription starts with a trial, then switches to a paid plan, then changes again later, use `subscription_schedule` to define phases. Regular `subscription` updates are limited to immediate changes; schedules allow future-dated transitions.

**5. Trials are just a Subscription with a `trial_end` date.**
You can either set trial on the Subscription at creation or enable trial on the Price itself. Trial periods consume no invoices until they end.

## Creating a Subscription via Checkout

Simplest path for SaaS:

```ts
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const session = await stripe.checkout.sessions.create({
  mode: 'subscription',
  payment_method_types: ['card'],
  customer_email: user.email,            // pre-fill optional
  line_items: [
    {
      price: 'price_123PriceId',         // recurring Price ID
      quantity: 1,
    },
  ],
  success_url: 'https://yourapp.com/success?session_id={CHECKOUT_SESSION_ID}',
  cancel_url: 'https://yourapp.com/cancel',
  // optional: trial_period_days: 14,
});
```

Redirect user to `session.url`. Stripe handles payment method collection, first invoice, and immediately creates a Subscription. On success, read the `session_id` from the URL and retrieve the session to get `subscription` ID.

## Creating a Subscription via API (Custom Flow)

When you want to handle payment method collection yourself:

```ts
// 1. Create a Customer
const customer = await stripe.customers.create({
  email: user.email,
  name: user.name,
});

// 2. Attach a default payment method (collected via PaymentIntent/SetupIntent)
//    See stripe-payments skill for details.

// 3. Create the Subscription
const subscription = await stripe.subscriptions.create({
  customer: customer.id,
  items: [{ price: 'price_xxx' }],
  // optional: trial_period_days: 7,
  // optional: expand: ['latest_invoice.payment_intent']
});
```

**Important:** `expand: ['latest_invoice.payment_intent']` gives you the first invoice's PaymentIntent so you can confirm it client-side if payment is required immediately (no trial).

### Handling first payment (if no trial or trial ended)

If the first invoice requires payment, create a SetupIntent or PaymentIntent client-side to collect card details. Alternatively use the `payment_behavior: 'default_incomplete'` and `expand` options to get `client_secret`:

```ts
const subscription = await stripe.subscriptions.create({
  customer: customer.id,
  items: [{ price: 'price_xxx' }],
  payment_behavior: 'default_incomplete',
  expand: ['latest_invoice.payment_intent'],
});

const clientSecret = subscription.latest_invoice?.payment_intent?.client_secret;
```

Pass `clientSecret` to your client and confirm via `stripe.confirmCardPayment`.

## Webhook Events for Subscriptions

Always rely on webhooks for state changes:

| Event | Meaning | Action |
|-------|---------|--------|
| `invoice.payment_succeeded` | Invoice paid successfully | Extend access, grant features |
| `invoice.payment_failed` | Payment failed (card declined) | Notify user, restrict access after grace period |
| `customer.subscription.created` | New subscription | Provision access |
| `customer.subscription.updated` | Plan change, quantity change, trial started/ended | Adjust access level |
| `customer.subscription.deleted` | Subscription canceled or completed | Downgrade/revoke access |
| `invoice.finalized` | Invoice ready (before payment attempt) | Optional: send upcoming invoice email |

### Sample Webhook Handler:

```ts
case 'invoice.payment_succeeded':
  const invoice = event.data.object as Stripe.Invoice;
  const subId = invoice.subscription as string;
  await grantAccessToSubscription(subId);
  break;

case 'invoice.payment_failed':
  const failedInvoice = event.data.object as Stripe.Invoice;
  const sub = failedInvoice.subscription as string;
  await markSubscriptionPastDue(sub);
  // Stripe automatically retries; you may send dunning email
  break;

case 'customer.subscription.deleted':
  const canceledSub = event.data.object as Stripe.Subscription;
  await revokeAccess(canceledSub.id);
  break;
```

## Subscription Statuses

| Status | Meaning |
|--------|---------|
| `active` | Currently paying (or trialing). Access granted. |
| `trialing` | Trial period, not yet invoiced. Access granted (typically). |
| `past_due` | Payment failed, within Stripe's retry window. May still have access. |
| `canceled` | Cancellation scheduled or immediate; no future invoices. Access should be revoked at `current_period_end`. |
| `unpaid` | Payment failed and retries exhausted. No active access. |
| `incomplete` | First invoice not paid yet; subscription not active. |
| `incomplete_expired` | Subscription expired before payment. |

Use `status` field from `subscription` object to determine access. Always also check `cancel_at_period_end` — if `true`, the user has canceled but still has access until `current_period_end`.

## Canceling and Pausing

Cancel immediately (prorated refund?):

```ts
await stripe.subscriptions.del(subscriptionId, {
  invoice_now: true,  // generate final invoice immediately
  prorate: true,      // credit unused time
});
```

Cancel at period end (user keeps access until end of billing cycle):

```ts
await stripe.subscriptions.update(subscriptionId, {
  cancel_at_period_end: true,
});
```

Pause (Stripe Billing only — not available on all accounts):

```ts
await stripe.subscriptions.pause(subscriptionId, {
  behavior: 'keep_period_end', // or 'mark_uncollectible'
});
```

Resume:

```ts
await stripe.subscriptions.unpause(subscriptionId);
```

## Trials

Set trial at subscription creation:

```ts
await stripe.subscriptions.create({
  customer: customerId,
  items: [{ price: priceId }],
  trial_period_days: 14,
});
```

Or use `trial_end` as a Unix timestamp. You can also set trial on the Price itself when creating it in Stripe Dashboard.

## Metered Usage / Usage-based billing

For add-ons or overage billing, use `usage_record` on a metered Price:

```ts
// Report usage for a subscription item
await stripe.subscriptionItems.createUsageRecord(
  subscriptionItemId, // the subscription item's ID
  {
    quantity: 100,           // units used this period
    timestamp: Math.floor(Date.now() / 1000),
    action: 'set',           // or 'increment'
    // idempotency_key: 'unique-key' -- optional per call
  }
);
```

Stripe automatically invoices based on usage at the end of the billing period.

## Updating a Subscription

Change plan (upgrade/downgrade):

```ts
await stripe.subscriptions.update(subscriptionId, {
  items: [
    {
      id: currentSubscriptionItemId,
      price: newPriceId, // or null to remove
    },
  ],
  // optional: proration_behavior: 'create_prorations' (default)
  // optional: billing_cycle_anchor: 'now' (immediate invoice) or 'unchanged'
});
```

## Common Pitfalls

- **Creating a Subscription before collecting payment method** → Subscription becomes `incomplete`. Resolve by attaching a default payment method or canceling.
- **Handling fulfillment in client after `confirmCardPayment`** → Race condition if webhook arrives differently; prefer webhook-based fulfillment.
- **Missing `invoice.payment_failed` webhook handling** → User might lose access without notice.
- **Confusing `cancel_at_period_end` vs `canceled`** → Cancellation at period end keeps access until period end. Your access logic must honor both.
- **Mixing test and live webhook secrets** → Test mode events only reach test webhook endpoint; live mode needs a separate live endpoint or the same with live secret.
- **Attempting to update a subscription without knowing its `items[0].id`** → You need the subscription item ID to change prices. Fetch subscription first.

## References

- [Subscriptions API](https://stripe.com/docs/billing/subscriptions/overview)
- [Checkout Session API](https://stripe.com/docs/payments/checkout)
- [Subscription webhooks](https://stripe.com/docs/billing/subscriptions/webhooks)
- [Prorations](https://stripe.com/docs/billing/subscriptions/prorations)
- [Usage-based billing](https://stripe.com/docs/products-prices/usage-based-records)
- [Trial periods](https://stripe.com/docs/billing/subscriptions/trials)
- [Subscription schedules](https://stripe.com/docs/billing/subscriptions/subscription-schedules)