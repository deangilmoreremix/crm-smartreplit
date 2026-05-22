---
name: stripe-webhooks
description: "Use for Stripe webhook development, local event forwarding, webhook signature verification, event handling patterns, test event triggers, and webhook endpoint configuration. Triggers: stripe listen, webhook construction, event parsing, signature validation, local development with ngrok/localhost, webhook retry logic, idempotent handling."
metadata:
  author: kilobyte
  version: "0.1.0"
---


# Stripe Webhooks

## Core Principles

**1. Always verify webhook signatures in production.**
Signature verification prevents forgery. The secret (`STRIPE_WEBHOOK_SECRET`) is endpoint-specific. Never skip verification in production. In local development with `stripe listen --forward-to`, you may skip verification only because the CLI adds its own auth — but still validate the source if forwarding publicly.

**2. Handle webhook idempotently.**
Events may arrive out of order or duplicate. Stripe includes `id` and `created` fields. Store processed event IDs and ignore duplicates. This prevents double-fulfillment on retries.

**3. Acknowledge quickly, act async.**
Return `200 OK` to Stripe within a few seconds to avoid retries. Defer long-running work to a queue or background task. Stripe expects a fast response; otherwise it retries with exponential backoff.

**4. Webhook types by payment flow.**
- One-time payments (PaymentIntents): `payment_intent.succeeded` is primary fulfillment signal. Do not rely on `charge.succeeded` alone.
- Subscriptions: Monitor `invoice.payment_succeeded`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`.
- Disputes: `charge.dispute.created`, `charge.dispute.updated`.
- Refunds: `charge.refunded`.

**5. Test mode events don't hit live endpoints.**
Stripe separates test and live modes. Webhook endpoints must be configured separately for each mode (or use the same URL but different secrets). `stripe listen` automatically sets up a local tunnel and configures a temporary test webhook endpoint pointing at your machine.

## Local Development with `stripe listen`

```bash
# Start forwarding to local endpoint
stripe listen --forward-to localhost:5000/api/webhook

# Listen on a specific port
stripe listen --forward-to localhost:3000/api/stripe/webhook --api-key sk_test_...

# For HTTPS local development (localhost with HTTPS)
stripe listen --forward-to https://your-ngrok-url.ngrok.io/webhook

# Events also show in your terminal as they arrive
```

The CLI prints the webhook signing secret (e.g., `whsec_...`). Set this in your local `.env` as `STRIPE_WEBHOOK_SECRET`. The CLI also automatically adds the endpoint to your Stripe dashboard in test mode.

## Webhook Signature Verification

Stripe signs each event with a secret unique to your endpoint. Verify before processing:

### Next.js / Vercel route handler example:

```ts
import { buffer } from 'micro';
import Stripe from 'stripe';
import { env } from 'process';

const stripe = new Stripe(env.STRIPE_SECRET_KEY);
const webhookSecret = env.STRIPE_WEBHOOK_SECRET!;

export const POST = async (req: Request) => {
  const buf = await buffer(req);
  const sig = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      buf.toString(),
      sig,
      webhookSecret
    );
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Idempotency check: has event.id been processed already?
  // if (await isEventProcessed(event.id)) return new Response(null, { status: 200 });

  switch (event.type) {
    case 'payment_intent.succeeded':
      // fulfill
      break;
  }

  return new Response(null, { status: 200 });
};
```

### Express.js example:

```ts
import express from 'express';
import Stripe from 'stripe';
import bodyParser from 'body-parser';

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Raw body needed for signature verification
app.post('/webhook', bodyParser.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.log(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle event
  switch (event.type) {
    case 'invoice.payment_succeeded':
      // grant access / extend subscription
      break;
    case 'invoice.payment_failed':
      // send dunning email, downgrade
      break;
  }

  res.json({ received: true });
});
```

## Idempotency and Duplicate Events

Stripe retries failed deliveries for up to 3 days. Always check if an event has already been processed using its `id` before fulfilling:

```ts
async function handleEvent(event: Stripe.Event) {
  const existing = await db.webhookEvent.findUnique({
    where: { stripe_event_id: event.id }
  });
  if (existing) {
    console.log(`Event ${event.id} already processed — skipping`);
    return;
  }

  // Record event to prevent re-processing
  await db.webhookEvent.create({
    data: { stripe_event_id: event.id, type: event.type, processed_at: new Date() }
  });

  // ... handle fulfillment
}
```

## Testing Webhooks Locally

With `stripe listen` running, trigger events:

```bash
stripe trigger payment_intent.succeeded
stripe trigger invoice.payment_failed --customer cus_test123
stripe trigger charge.refunded
```

Inspect events:

```bash
stripe events list --limit 5
stripe events retrieve evt_xxx
```

## Webhook Event Types Reference

Common events you should handle:

| Event Type | When it fires | Typical Action |
|-----------|---------------|----------------|
| `payment_intent.succeeded` | Payment completes successfully | Fulfill order, grant access |
| `payment_intent.payment_failed` | Card declined or auth fails | Show error, retry UI |
| `invoice.payment_succeeded` | Subscription invoice paid | Extend subscription, grant access |
| `invoice.payment_failed` | Subscription payment fails | Send dunning email, restrict access |
| `customer.subscription.updated` | Subscription status/plan change | Adjust user permissions |
| `customer.subscription.deleted` | Subscription canceled/completed | Downgrade/revoke access |
| `charge.refunded` | Refund issued | Update records, notify |
| `charge.dispute.created` | Customer disputes charge | Investigate, gather evidence |

## Handling Retries and Failures

Stripe retries with exponential backoff if your endpoint returns non-2xx or times out (> 30s). Plan for at least 3 retries over 72 hours.

Best practices:
- Respond `2xx` as soon as you've safely queued the work (within 5–10 seconds max).
- Log every webhook with `event.id` to aid debugging.
- If work fails, return non-2xx to trigger a retry, but ensure your handler can safely re-process the same event.

## Webhook Debugging

Check recent live/test events in dashboard: `https://dashboard.stripe.com/webhooks`. Or via CLI:

```bash
stripe events list --limit 10
stripe logs tail                # Stream recent webhook delivery attempts
stripe webhook-endpoints list   # Show configured endpoints
```

If events aren't arriving:
- Confirm `stripe listen` is running when testing locally.
- Ensure your local server is listening on the correct port and reachable by the tunnel.
- Check that the webhook endpoint URL is registered in the dashboard.
- Verify you're using the correct API key mode (test vs live) — webhooks are mode-specific.

## Security Checklist

- [ ] Verify signatures using `stripe.webhooks.constructEvent` with `STRIPE_WEBHOOK_SECRET`.
- [ ] Use HTTPS in production — Stripe rejects non-HTTPS URLs for live webhooks.
- [ ] Store processed event IDs to prevent duplicate fulfillment.
- [ ] Respond within 5–10 seconds; offload heavy work to background jobs.
- [ ] Keep `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` out of client bundles; use server-only env.

## References

- [Stripe Webhooks guide](https://stripe.com/docs/webhooks)
- [Stripe CLI webhook forwarding](https://stripe.com/docs/stripe-cli/webhooks)
- [Testing webhooks with CLI](https://stripe.com/docs/webhooks/test)
- [Webhook signature verification](https://stripe.com/docs/webhooks/signatures)
- [Handling idempotency](https://stripe.com/docs/webhooks/idempotent)