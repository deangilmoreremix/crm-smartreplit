---
name: stripe-customers
description: "Use for Stripe Customer management: creating customers, attaching payment methods, customer metadata, invoices, retrieving customer objects, customer portal sessions, and customer lifecycle workflows. Triggers: customers, payment_methods, setup_intents, customer portal, metadata updates."
metadata:
  author: kilobyte
  version: "0.1.0"
---


# Stripe Customers

## Core Principles

**1. Customer is the owner of payment methods and subscriptions.**
In Stripe, every payment method, subscription, and invoice is attached to a Customer. Always create a Customer record before charging a user or starting a subscription.

**2. Customer metadata is your bridge between Stripe and your app.**
Store your internal user ID in `metadata` for easy correlation:

```ts
const customer = await stripe.customers.create({
  email: user.email,
  name: user.name,
  metadata: { userId: user.id, plan: 'pro' },
});
```

Never rely on `email` as a unique key — users can change email. Use your app's ID in metadata.

**3. Do not store sensitive personal data in metadata.**
Metadata is visible in Stripe Dashboard and potentially in webhooks. Keep PII minimal. Use internal references instead.

**4. Payment methods attach to Customers, not directly to Subscriptions.**
Attach a payment method once to the Customer, then reuse it across multiple subscriptions or one-time payments.

**5. Customer Portal allows self-service.**
Stripe's hosted customer portal lets users manage payment methods, view invoices, and cancel subscriptions without building your own UI.

## Creating a Customer

```ts
const customer = await stripe.customers.create({
  email: 'user@example.com',
  name: 'Jane Doe',
  address: {
    line1: '123 Main St',
    city: 'San Francisco',
    state: 'CA',
    postal_code: '94111',
    country: 'US',
  },
  phone: '+15551234567',
  metadata: { userId: 'clx_123456' },
});
```

Save `customer.id` in your database alongside your user record.

## Retrieving and Updating

```ts
// Retrieve
const customer = await stripe.customers.retrieve('cus_xxx');

// Update
await stripe.customers.update('cus_xxx', {
  email: 'new@example.com',
  name: 'New Name',
  metadata: { userId: 'clx_123456', tier: 'premium' },
});
```

## Attaching a Payment Method

Two common patterns:

**Pattern A: From a PaymentIntent (card collected via Stripe.js)**

```ts
// On the client after confirmCardPayment, the payment_method is attached automatically
const { paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
  payment_method: cardElement,
});

// Payment method ID is in paymentIntent.payment_method
const paymentMethodId = paymentIntent.payment_method as string;

// Find the Customer and set this as default
await stripe.customers.update(customerId, {
  invoice_settings: { default_payment_method: paymentMethodId },
});
```

**Pattern B: From a SetupIntent (save card for future use without immediate charge)**

Create SetupIntent on server:

```ts
const setupIntent = await stripe.setupIntents.create({
  customer: customerId,
});
```

Return `client_secret` to client and confirm with `stripe.confirmCardSetup`:

```tsx
const { setupIntent } = await stripe.confirmCardSetup(
  setupIntentClientSecret,
  { payment_method: cardElement }
);
// payment method is attached automatically to customer
```

## Customer Portal

Hosted page where customers can:
- Update payment method
- View invoice history
- Download receipts
- Cancel subscription

Create a portal session:

```ts
const session = await stripe.billingPortal.sessions.create({
  customer: customerId,
  return_url: 'https://yourapp.com/account',
});
```

Redirect user to `session.url`. The portal respects your configured features in the Stripe Dashboard (Settings → Billing → Customer portal).

## Listing Customers and Searching

```ts
// Paginated list
const customers = await stripe.customers.list({
  limit: 10,
  starting_after: 'cus_xxx', // for pagination
});

// Search by email or metadata
const results = await stripe.customers.search({
  query: "email:'user@example.com' OR metadata['userId']:'clx_123456'",
});
```

## Invoices associated with a Customer

```ts
const invoices = await stripe.invoices.list({
  customer: customerId,
  limit: 20,
});

for (const invoice of invoices.data) {
  console.log(invoice.id, invoice.status, invoice.amount_paid);
}
```

## Customer Balance (Credit)

You can add credit to a customer's balance (negative amount = credit):

```ts
await stripe.customers.createBalanceTransaction(customerId, {
  amount: -500, // credit $5.00
  currency: 'usd',
  description: 'Promo credit',
});
```

Balance automatically applies to future invoices.

## Deleting a Customer

Only delete if no subscriptions, invoices, or charges exist. Use with caution:

```ts
await stripe.customers.del('cus_xxx');
```

Better practice: mark as inactive in your system and keep Stripe record for historical/integrity reasons.

## Common Pitfalls

- **Creating multiple Customer objects for the same person** → Search by your `userId` metadata before creating new customers. Deduplicate with `stripe.customers.search` or store `stripeCustomerId` in your DB.
- **Fetching a Customer after update before webhook arrives** → Remember webhooks are async. If your UI must show immediate change, either wait for webhook confirmation or immediately reflect the optimistic update and reconcile later.
- **Payment method not attached** → Confirm SetupIntent or PaymentIntent properly; the attachment is automatic on success. If missing, re-collect card details.
- **Customer Portal not configured** → You must enable the portal in Stripe Dashboard first (Settings → Billing → Customer portal). Otherwise `billingPortal.sessions.create` returns an error.

## References

- [Customer object](https://stripe.com/docs/api/customers/object)
- [PaymentMethods API](https://stripe.com/docs/api/payment_methods)
- [SetupIntents API](https://stripe.com/docs/api/setup_intents)
- [Customer Portal](https://stripe.com/docs/billing/customer-portal)
- [Managing customers](https://stripe.com/docs/customers)