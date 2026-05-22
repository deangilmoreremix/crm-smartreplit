---
name: stripe-payments
description: "Use for Stripe PaymentIntents, one-time charges, payment methods, 3D Secure/SCA, confirmations, and payment flow patterns. Covers card payments, Apple Pay/Google Pay, saved payment methods, and handling declined payments. Triggers: payment_intents, charges, payment_methods, confirmCardPayment, payment_element, card_element."
metadata:
  author: kilobyte
  version: "0.1.0"
---


# Stripe Payments

## Core Principles

**1. PaymentIntents are the canonical way to accept card payments.**
Do not create `Charge` objects directly — `PaymentIntent` is the recommended flow (PSD2/SCA compliant). PaymentIntents handle authentication (3D Secure) and state transitions automatically.

**2. The two-step client-server flow is required for 3D Secure.**
Server creates PaymentIntent with `amount`, `currency`, optional `payment_method_types` → client uses `stripe.confirmCardPayment` with `client_secret`. This delegates authentication to Stripe.js.

**3. Idempotency keys protect against duplicate charges.**
Include a unique `Idempotency-Key` header on every mutation. On network error, retry with the same key safely.

**4. Never handle raw card data.**
Use Stripe.js (Stripe Elements or PaymentElement) to tokenize cards in the browser. Server only receives a `payment_method` ID or `payment_method_types` array. PCI compliance requires this separation.

**5. Amounts are integers in minor currency units (cents).**
`amount: 2000` = $20.00. Never send floating-point; multiply by 100 and round.

## PaymentIntent Flow — EndtoEnd Example

### 1SA Create PaymentIntent (Server)

```ts
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });

export async function POST(req: Request) {
  const { amount, currency = 'usd' } = await req.json();

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency,
    payment_method_types: ['card'],
    // automatic_payment_methods: { enabled: true }, // newer alternative
    metadata: { order_id: generateOrderId() },
  });

  return Response.json({ clientSecret: paymentIntent.client_secret });
}
```

### Step 2: Confirm Payment (Client)

```tsx
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function CheckoutForm({ clientSecret }: { clientSecret: string }) {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    const { error } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: elements.getElement(CardElement)! },
    });

    if (error) {
      console.error(error.message);
    } else {
      // Payment succeeded — optionally redirect or show success
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <button type="submit" disabled={!stripe}>Pay</button>
    </form>
  );
}
```

### Step 3: Handle Webhook (Server) — Recommended for fulfillment

Although `confirmCardPayment` resolves successfully on the client, rely on `payment_intent.succeeded` webhook for final fulfillment to guarantee idempotency and handle async flows (e.g., delayed capture, certain payment methods):

```ts
// /app/api/webhook/stripe/route.ts
switch (event.type) {
  case 'payment_intent.succeeded':
    const pi = event.data.object as Stripe.PaymentIntent;
    await fulfillOrder(pi.metadata.order_id);
    break;
}
```

## Using PaymentElement (Unified UI)

PaymentElement automatically renders all supported payment methods (card, Apple Pay, Google Pay, Link, etc.) based on customer device and region:

```tsx
import { PaymentElement } from '@stripe/react-stripe-js';

function Checkout({ clientSecret }: { clientSecret: string }) {
  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CheckoutForm />
    </Elements>
  );
}

function CheckoutForm() {
  const { elements } = useElements();
  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />  {/* replaces CardElement */}
      <button>Pay</button>
    </form>
  );
}
```

Server-side: enable automatic payment methods:

```ts
stripe.paymentIntents.create({
  amount: 2000,
  currency: 'usd',
  automatic_payment_methods: { enabled: true },
});
```

## Saved Payment Methods and Customers

Attach a payment method to a Customer for future reuse:

```ts
// Create Customer
const customer = await stripe.customers.create({
  email: 'user@example.com',
  name: 'Jane Doe',
});

// Attach a PaymentMethod (received from client via confirm)
const paymentMethod = await stripe.paymentMethods.attach(
  pmId,
  { customer: customer.id }
);

// Set as default
await stripe.customers.update(customer.id, {
  invoice_settings: { default_payment_method: paymentMethod.id },
});
```

To reuse: create PaymentIntent with `customer` and optionally `invoice_settings.default_payment_method` is used automatically.

## Handling Declines and Errors

`confirmCardPayment` returns an error — display the message but do not retry automatically. Common errors:

- `card_declined`: Check Stripe Dashboard > Payments for decline code (insufficient_funds, lost_card, etc.).
- `processing_error`: Temporary issue — suggest retry after a few minutes.
- `rate_limit`: Too many requests — add exponential backoff client-side.

Log every error server-side for analysis.

## Refunds

Full or partial refunds via `charge` or `paymentIntent`:

```ts
// Refund entire charge
await stripe.refunds.create({ payment_intent: piId });

// Partial refund (amount in cents)
await stripe.refunds.create({
  payment_intent: piId,
  amount: 500, // $5.00
  reason: 'product_unsatisfactory',
});
```

## Disputes

Listen for `charge.dispute.created` webhook. Gather evidence via API and submit:

```ts
const dispute = event.data.object as Stripe.Dispute;
await stripe.disputes.submitEvidence(dispute.id, {
  evidence: {
    product_description: 'Digital subscription service',
    customer_email: 'user@example.com',
    access_log: 'User accessed service for 14 days',
  },
});
```

## Testing Card Numbers

Use Stripe test card numbers for different scenarios:

| Card Number | Scenario |
|-------------|----------|
| `4242 4242 4242 4242` | Successful charge |
| `4000 0027 6000 3184` | Requires 3D Secure |
| `4000 0000 0000 0002` | Card declined — insufficient funds |
| `4000 0000 0000 3220` | Requires 3D Secure (2-arg) |
| `4000 0025 0000 3155` | Incorrect CVC |

Expiry: any future date; CVC: any 3 digits; postal: any 5 digits.

## Common Pitfalls

- **PaymentIntent not confirmed** → Always call `stripe.confirmCardPayment` client-side, not just create.
- **Wrong amount type** → `amount` must be integer (cents). Floating-point causes `invalid_integer_amount`.
- **Using test keys in production** → Double-check env vars; Stripe cards only work in test mode with test keys.
- **Confusing Charges vs PaymentIntents** → Prefer PaymentIntents; Charges API is legacy.
- **Missing CORS on webhook endpoint when using stripe listen with HTTPS tunnel** → Ensure server CORS allows the tunnel domain or disable CORS for webhook route in dev.
- **Not handling idempotency** → Use idempotency keys on create/update; check for existing webhook event IDs.
- **Exposing secret key client-side** → Only publishable key goes to frontend. Secret key in `STRIPE_SECRET_KEY` (no `NEXT_PUBLIC_` or `VITE_`).

## References

- [PaymentIntents API](https://stripe.com/docs/payments/payment-intents)
- [Accept a payment with Stripe.js](https://stripe.com/docs/payments/accept-a-payment)
- [3D Secure guide](https://stripe.com/docs/payments/3d-secure)
- [Saved payment methods](https://stripe.com/docs/payments/save-and-reuse)
- [PaymentElement](https://stripe.com/docs/payments/payment-element)
- [Testing without 3DS](https://stripe.com/docs/testing#cards)
- [Idempotent requests](https://stripe.com/docs/api/idempotent_requests)