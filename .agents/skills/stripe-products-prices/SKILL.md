---
name: stripe-products-prices
description: "Use for managing Stripe Products, Prices, recurring plans, one-time charges, coupons, and tax settings. Covers creating and updating products, recurring vs one-time prices, tax rates, and product catalog structure. Triggers: products, prices, tax_rates, coupons, discounts."
metadata:
  author: kilobyte
  version: "0.1.0"
---


# Stripe Products & Prices

## Core Principles

**1. Products and Prices are separate objects.**
A Product is the sellable item (name, description, images). A Price defines how much and how often (amount, currency, interval). One Product can have many Prices (e.g., monthly vs annual tiers).

**2. Prices must be used in Checkout Sessions or Subscriptions.**
You cannot charge a customer directly with a Price; you attach a Price to a Checkout Session or Subscription.

**3. Pre-create Prices in Dashboard for most use cases.**
For fixed plans, create Products and Prices in the Dashboard once, then reference their IDs (`price_xxx`) in code. For dynamic pricing (usage-based, variable quantity), either create Prices via API or send `amount` inline in Checkout's `line_items`.

**4. Tax rates attach to Prices or Invoices, not Products directly.**
Apply tax either at the Price level (static tax) or at the Invoice/Subscription level (dynamic, via Stripe Tax).

**5. Price status matters.**
Inactive Prices can still be used by existing Subscriptions but cannot be attached to new ones. Archive old Prices instead of deleting them to preserve historical data.

## Creating Products and Prices via Dashboard

Fastest for fixed plans:

1. Go to Stripe Dashboard → Products → Add Product.
2. Enter name, description, images.
3. Add a Price: amount, interval (one-time, month, year), currency.
4. Save. Copy the `price_xxx` ID.

## Creating Prices via API

Dynamic creation (e.g., usage-based or server-side pricing):

```ts
const product = await stripe.products.create({
  name: 'Pro Plan',
  description: 'Advanced features',
});

const price = await stripe.prices.create({
  product: product.id,
  unit_amount: 2000,        // $20.00 in cents
  currency: 'usd',
  recurring: { interval: 'month' },
  // optional: tax_behavior: 'exclusive' or 'inclusive'
});
```

For one-time:

```ts
const price = await stripe.prices.create({
  product: product.id,
  unit_amount: 5000,
  currency: 'usd',
  // No `recurring` field → one-time
});
```

## Using Prices in Checkout

```ts
const session = await stripe.checkout.sessions.create({
  mode: 'subscription',
  line_items: [
    {
      price: 'price_xxx',      // pre-created Price ID
      quantity: 1,
    },
  ],
  // ...success_url, cancel_url
});
```

### Dynamic amount (Pay-What-You-Want)

```ts
const session = await stripe.checkout.sessions.create({
  mode: 'payment',
  line_items: [
    {
      price_data: {
        currency: 'usd',
        product: 'prod_xxx',   // Product ID
        unit_amount: amount,   // provided by user
      },
      quantity: 1,
    },
  ],
});
```

## Updating Prices

Prices are immutable — you cannot change `unit_amount` or `recurring` on an existing Price. Instead create a new Price and:

- Update existing Subscriptions to new Price.
- Deactivate old Price (`active: false`) so new Checkout Session uses new Price.

```ts
await stripe.prices.update('price_old', { active: false });
```

## Tax Rates

Create a tax rate once, reuse across Prices/Invoices:

```ts
const taxRate = await stripe.taxRates.create({
  display_name: 'VAT',
  description: 'Value Added Tax',
  percentage: 20,
  jurisdiction: 'EU',
  inclusive: false,  // adds on top
});
```

Apply to a Price:

```ts
const price = await stripe.prices.create({
  product: 'prod_xxx',
  unit_amount: 1000,
  currency: 'usd',
  tax_behavior: 'exclusive',
  default_tax_rates: [taxRate.id],
});
```

Or apply at Checkout Session level:

```ts
const session = await stripe.checkout.sessions.create({
  // ...
  automatic_tax: { enabled: true }, // Stripe Tax auto-calculates
});
```

## Coupons and Discounts

Create a coupon (percentage or amount off):

```ts
const coupon = await stripe.coupons.create({
  percent_off: 25,
  duration: 'once',  // 'once', 'forever', 'repeating'
  name: 'Launch Discount',
});
```

Apply to a Checkout Session:

```ts
const session = await stripe.checkout.sessions.create({
  mode: 'subscription',
  line_items: [{ price: 'price_xxx', quantity: 1 }],
  discounts: [{ coupon: coupon.id }],
});
```

Or apply to a specific Subscription:

```ts
await stripe.subscriptions.update(subId, {
  promotion_code: 'promo_xxx',  // from customer facing code
});
```

## Managing Product Catalog

List all products:

```ts
const products = await stripe.products.list({
  active: true,
  limit: 20,
});
```

Use `metadata` to categorize:

```ts
await stripe.products.create({
  name: 'Enterprise Tier',
  metadata: { tier: 'enterprise', features: 'api,white-label,support' },
});
```

## Common Pitfalls

- **Changing a Price after creation** → Prices are immutable. Create new Price and update Subscriptions.
- **Applying coupon to wrong object** → Coupons apply to Checkout Session or Subscription, not Price. If a `price` already embeds a discount, additional discounts may not stack as expected.
- **Tax on inclusive vs exclusive** → Set `tax_behavior` correctly; inclusive means price already includes tax.
- **Forgetting to activate a Price** → New Prices default to `active: true`, but archived Prices are `active: false`.
- **Attaching multiple Prices to a Subscription without understanding quantity** → A Subscription typically has one `subscription_item` per Price. Changing quantity changes the number of seats/licenses.

## References

- [Products API](https://stripe.com/docs/api/products)
- [Prices API](https://stripe.com/docs/api/prices)
- [Checkout line_items](https://stripe.com/docs/api/checkout/sessions/create#create_checkout_session-line_items)
- [Coupons API](https://stripe.com/docs/api/coupons)
- [Tax Rates API](https://stripe.com/docs/api/tax_rates)
- [Stripe Billing](https://stripe.com/docs/billing)