---
name: stripe-testing
description: "Use for testing Stripe integrations: test cards, test mode vs live mode, Stripe CLI fixtures and triggers, common test scenarios, error simulation, and test helper utilities. Covers PaymentIntent tests, webhook testing, subscription testing, and test mode best practices."
metadata:
  author: kilobyte
  version: "0.1.0"
---


# Stripe Testing

## Core Principles

**1. Always use test mode during development.**
Test mode keys (`sk_test_...`, `pk_test_...`) are completely isolated from live money. You can safely use any test card; no real charges occur.

**2. Test mode and live mode are separate universes.**
Customers, Products, Prices, Subscriptions, and Charges do not cross over. Your test data never touches live, and vice versa.

**3. Use Stripe CLI to simulate events and generate test data.**
The CLI is your primary tool for webhook testing and seeding. `stripe fixtures load` creates sample customers, cards, and subscriptions.

**4. Write integration tests that exercise the full flow end-to-end.**
Unit tests won't catch webhook signature verification bugs or 3DS handling gaps. Use a test stack (Test Stripe account + local server + CLI) and cover: one-time payment, subscription creation, webhook received, subscription renewal simulation.

**5. Test failure modes as much as success paths.**
Simulate card declines, insufficient funds, expired cards, 3DS failures, and webhook retries. Ensure your app degrades gracefully.

## Test Cards

| Card Number | Scenario |
|-------------|----------|
| `4242 4242 4242 4242` | Successful charge (standard) |
| `4000 0027 6000 3184` | Requires 3D Secure (auth block) |
| `4000 0000 0000 3220` | Requires 3D Secure (2-arg variant) |
| `4000 0025 0000 3155` | Generic 3D Secure required |
| `4000 0000 0000 0002` | Card declined — insufficient funds |
| `4000 0000 0000 9995` | Incorrect CVC |
| `4000 0000 0000 0341` | Expired card |
| `4000 0000 0000 9692` | Lost card |
| `4000 0000 0000 9987` | Stolen card |
| `4000 0000 0000 0069` | `processing_error` |
| `4000 0000 0000 0119` | `rate_limit` |

Expiry: any future date; CVC: any 3 digits; postal: any 5 digits.

## Stripe CLI for Testing

### Log in (once)

```bash
stripe login
```

### Forward webhooks to your local server

```bash
stripe listen --forward-to localhost:5000/api/webhook/stripe
```

The CLI prints a webhook secret like `whsec_...` — set as `STRIPE_WEBHOOK_SECRET` in your local `.env`.

### Trigger specific events

```bash
stripe trigger payment_intent.succeeded
stripe trigger payment_intent.payment_failed
stripe trigger charge.refunded
stripe trigger customer.subscription.created
stripe trigger invoice.payment_failed
stripe trigger charge.dispute.created
```

You can pass overrides:

```bash
stripe trigger payment_intent.succeeded --amount 5000 --currency usd
stripe trigger invoice.payment_failed --customer cus_test123
```

### Load sample data

```bash
stripe fixtures load payments    # creates customers, cards, PaymentIntents
stripe fixtures load subscriptions  # creates Products, Prices, Subscriptions
stripe fixtures load all
```

Useful for seeding dev database quickly.

### Inspect events

```bash
stripe events list --limit 10
stripe events retrieve evt_xxx
```

### Simulate a dispute

```bash
stripe trigger charge.dispute.created
stripe disputes list
```

## Webhook Testing Patterns

- **Signature verification**: The CLI includes a valid signature when forwarding. Use `STRIPE_WEBHOOK_SECRET` exactly as printed when `stripe listen` starts.
- **Event replay**: Use `stripe events retrieve <id> | stripe trigger -` to replay a specific live event locally.
- **Testing chronological**: Trigger `invoice.payment_failed`, then `invoice.payment_succeeded` to simulate dunning recovery.

## Test Mode in Dashboard

Visit `https://dashboard.stripe.com/test` to see all test data. Keys:
- Test publishable: `pk_test_...`
- Test secret: `sk_test_...`

Live dashboard at `https://dashboard.stripe.com` uses live keys. Never mix modes.

## Simulating 3D Secure

Use card `4000 0027 6000 3184` or `4000 0000 0000 3220`. Stripe.js automatically displays the 3DS modal in the browser.

To test **without 3DS**, use `4242 4242 4242 4242` (no authentication required).

## Testing Subscriptions

Create a subscription with a trial to avoid immediate charge:

```ts
await stripe.subscriptions.create({
  customer: customerId,
  items: [{ price: priceId }],
  trial_period_days: 7,
});
```

To fast-forward to invoice/payment without waiting days, you can:

1. Set trial to 0 and use `billing_cycle_anchor: 'now'` on update, or
2. Use the Dashboard to "Simulate" upcoming invoice, or
3. Trigger `invoice.payment_succeeded` manually via CLI.

### Testing renewal

Create a subscription with ` billing_cycle_anchor` in the past to generate an immediate first invoice, then advance time via the Dashboard's billing simulator (not CLI). Alternatively, use `trial_end` in the past to force immediate invoice generation.

## Common Test Scenarios

**One-time payment flow:**
```bash
# 1. Start local server with webhook endpoint
# 2. stripe listen --forward-to localhost:5000/api/webhook
# 3. In your app UI, enter test card 4242...
# 4. Confirm card payment on client
# 5. Observe webhook output in terminal; verify DB updates
```

**Subscription with failure:**
```bash
# Create subscription with test customer
stripe trigger customer.subscription.created
# Then simulate a failed payment
stripe trigger invoice.payment_failed --subscription sub_xxx
# Verify your dunning logic runs (send email, restrict access)
```

**Refund flow:**
```bash
# After a successful PaymentIntent
stripe refunds create --payment-intent pi_xxx
# Observe `charge.refunded` event
```

**Dispute flow:**
```bash
stripe trigger charge.dispute.created
# Submit evidence
stripe disputes submit_evidence dis_xxx --evidence "["product_description": "Digital service", ...]"
```

## Error Simulation

Force specific error codes by using designated test cards. Some errors require explicit configuration:

| Error | How to test |
|-------|-------------|
| `card_declined` | Card `4000 0000 0000 0002` |
| `expired_card` | Card `4000 0000 0000 0341` |
| `incorrect_cvc` | Card `4000 0000 0000 9995` |
| `processing_error` | Card `4000 0000 0000 0069` |
| `rate_limit` | Card `4000 0000 0000 0119` |

3D Secure: use `4000 0027 6000 3184` or Enable `payment_method_options[card][request_three_d_secure]=any` in PaymentIntent creation.

## Writing Automated Integration Tests

Example with Jest + Supertest:

```ts
import request from 'supertest';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });

describe('Payment flow', () => {
  it('completes a successful payment', async () => {
    // Create PaymentIntent server-side
    const pi = await stripe.paymentIntents.create({
      amount: 500,
      currency: 'usd',
      payment_method_types: ['card'],
    });

    // Simulate client confirmation using test token
    const clientSecret = pi.client_secret;
    const res = await request(app)
      .post('/api/checkout/confirm')
      .send({ clientSecret, paymentMethod: 'pm_card_visa' });
    
    expect(res.status).toBe(200);
  });
});
```

Remember: Integration tests require a test Stripe key; never use live keys in CI.

## Common Test Pitfalls

- **Using live keys in test code** → Verify `STRIPE_SECRET_KEY` starts with `sk_test_`.
- **Assuming webhook events arrive instantly** → Add small wait (`await new Promise(r => setTimeout(r, 1000))`) in tests or poll DB for webhook processing.
- **Not resetting state between tests** → Create fresh Customers, PaymentIntents per test. Clean up after (delete test objects) to avoid cluttering Dashboard.
- **Using fixed Amounts and forgetting currency** → Always specify `currency` in PaymentIntent/Checkout creation; otherwise test-mode default may differ from prod.
- **3DS modal not appearing in headless test runners** → For e2e tests (Playwright/Cypress), use test card `4000 0027 6000 3184` and `confirmCardPayment`; Stripe.js handles 3DS flow automatically - it's not a blocking modal in headless mode but the API still simulates it.

## References

- [Stripe testing guide](https://stripe.com/docs/testing)
- [Test card numbers](https://stripe.com/docs/testing#cards)
- [Stripe CLI testing](https://stripe.com/docs/stripe-cli#test)
- [Integration testing best practices](https://stripe.com/docs/testing/integration-tests)
- [Webhook testing](https://stripe.com/docs/webhooks/test)
- [Test mode API keys](https://stripe.com/docs/keys#test-live-modes)