---
name: stripe
description: "Use when working with Stripe payments, billing, customers, subscriptions, or using the Stripe CLI. Covers payment intents, charges, refunds, invoicing, customer management, webhook development, subscription billing, and test mode workflows in Node.js, Next.js, and server environments. Triggers: stripe CLI commands, any stripe npm package, @stripe/stripe-js, @stripe/react-stripe-js, stripe-node, payment/checkout flows, webhook listeners."
metadata:
  author: kilobyte
  version: "0.1.0"
---


# Stripe

## Core Principles

**1. Test mode vs Live mode separation.**
Stripe uses separate API keys for test and live modes. Never mix them. The Stripe CLI defaults to test mode unless you explicitly pass `--live` or set `STRIPE_LIVE_MODE=1`. Publishable keys are safe in client code; secret keys must remain server-side only.

**2. Webhooks are optional during local development, but required for payment confirmation.**
For one-time payments (PaymentIntents), use `stripe.confirmCardPayment` on the client with the client secret — no webhook needed to mark payment complete. Use webhooks for asynchronous events (subscriptions, disputes, refunds, invoice payments). During local development, use `stripe listen --forward-to localhost:PORT/webhook` to forward events to your local endpoint.

**3. Always confirm PaymentIntents on the client.**
The canonical flow: create PaymentIntent server-side → return `client_secret` → call `stripe.confirmCardPayment` on the client with card details and `client_secret`. Do not attempt to confirm server-side only; you lose 3D Secure and SCA compliance.

**4. Idempotency keys prevent duplicate charges.**
Include an `Idempotency-Key` header on all mutation requests (charges, refunds, subscriptions) to survive retries safely.

**5. Use Stripe objects, not raw amounts.**
Stripe.js handles currency formatting and 3DS. Never construct card data yourself — always use Stripe.js or PaymentElement. Server-side: use `stripe.paymentIntents.create` with `amount` and `currency` integers (amount in cents).

## Stripe CLI Usage

Always discover commands via `stripe --help`; flags change between versions. Key commands:

```bash
stripe login                          # Authenticate CLI with your Stripe account
stripe logout                         # Log out
stripe version                        # Show CLI version

# Webhook development
stripe listen --forward-to localhost:5000/webhook              # Forward events to local server
stripe listen --api-key sk_test_...                            # Use specific test key
stripe events list                                             # View recent events in dashboard
stripe trigger payment_intent.succeeded                        # Trigger test event
stripe trigger invoice.payment_failed                          # Simulate failed payment
stripe fixtures load payments                                   # Load sample payment data

# Customers, payments, subscriptions
stripe customers list
stripe customers create --email user@example.com
stripe payment-intents create --amount 2000 --currency usd
stripe charges list --limit 10
stripe subscriptions list
stripe invoices list

# Debugging
stripe logs tail                                                 # Stream recent logs
stripe error inspect err_xxx                                     # Look up error code docs
```

## API Keys and Configuration

In your `.env` or environment:

```
STRIPE_SECRET_KEY=sk_test_...      # Server-side only — NEVER expose to client
STRIPE_PUBLISHABLE_KEY=pk_test_... # Client-side (VITE_ for Vite/Next.js)
STRIPE_WEBHOOK_SECRET=whsec_...    # Used to verify webhook signatures
```

**Tip:** Store secret key in server-only env. For Next.js, keep it out of `NEXT_PUBLIC_` vars.

## Stripe.js — Client-Side Integration

Recommended approach for React/Next.js using `@stripe/stripe-js` and `@stripe/react-stripe-js`:

```tsx
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function Checkout({ clientSecret }) {
  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CheckoutForm />
    </Elements>
  );
}
```

Inside `CheckoutForm`, use `useStripe`/`useElements` to collect payment and call `stripe.confirmCardPayment`.

## Server-Side: Initialize Stripe

```ts
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16', // pin to latest stable
  // typescript: enableStripeType: true for stricter types
});
```

Create PaymentIntent:

```ts
const paymentIntent = await stripe.paymentIntents.create({
  amount: 2000,
  currency: 'usd',
  metadata: { order_id: '123' },
  // automatic_payment_methods: { enabled: true } // optional
});
```

## Webhook Handling

When using `stripe listen --forward-to`, Stripe sends events to your endpoint. Always verify signatures:

```ts
import { buffer } from 'micro';
import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import StripeWebhook from '@vercel/stripe-webhooks'; // or manual verify

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf.toString(), sig, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const pi = event.data.object as Stripe.PaymentIntent;
      console.log(`PaymentIntent ${pi.id} succeeded`);
      // fulfill order, update DB
      break;
    case 'invoice.payment_failed':
      const invoice = event.data.object as Stripe.Invoice;
      // notify customer, dunning
      break;
    // handle other events
  }

  res.json({ received: true });
}
```

For local development without signature verification (only use when `stripe listen` forwards), skip verification but never do this in production.

## Testing with Stripe CLI

Common test event triggers:

```bash
stripe trigger payment_intent.succeeded --amount 2000 --currency usd
stripe trigger payment_intent.payment_failed
stripe trigger invoice.payment_failed --customer cus_test
stripe trigger customer.subscription.created
stripe trigger charge.refunded
```

Use `stripe fixtures load payments` to auto-generate test customers, payment methods, and payment intents.

## Common Pitfalls

- **3D Secure required but not triggered** → Ensure `payment_method_types: ['card']` (default) and use test card `4000 0000 0000 3220` to force 3DS.
- **Duplicate charges** → Use idempotency keys: `stripe.paymentIntents.create(..., { idempotencyKey: 'unique-key' })`.
- **Webhooks not received** → Verify webhook endpoint URL reachable; `stripe listen` must be running; check `STRIPE_WEBHOOK_SECRET` matches the one shown during `stripe listen`.
- **Amount mismatch (currency not convertible)** → Amount must be integer in minor units (cents). Round appropriately.
- **Insufficient funds in test mode** → Use test cards; no real money moves. Declined cards: `4000 0000 0000 0002` (card declined).
- **Secret key exposed in client bundle** → Never prefix with `NEXT_PUBLIC_` or `VITE_`. Load from server-only env.

## References

- [Stripe CLI docs](https://stripe.com/docs/stripe-cli)
- [Payment Intents API](https://stripe.com/docs/payments/payment-intents)
- [Webhooks guide](https://stripe.com/docs/webhooks)
- [Testing with Stripe CLI](https://stripe.com/docs/testing)
- [React integration](https://stripe.com/docs/payments/accept-a-payment?platform=react)