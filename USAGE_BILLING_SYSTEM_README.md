# Complete Usage Billing System with Stripe Integration

This document describes the comprehensive usage-based billing system implemented for the CRM application, featuring Stripe metered billing integration.

## Overview

The usage billing system provides:
- **Usage Tracking**: Real-time tracking of API calls, AI usage, and other billable events
- **Metered Billing**: Pay-per-use pricing with tiered rates
- **Subscription Management**: Stripe-powered subscription handling
- **Usage Limits & Quotas**: Configurable limits with enforcement
- **Billing Dashboard**: User-friendly interface for monitoring usage and costs
- **Admin Analytics**: Comprehensive reporting and analytics

## Architecture

### Database Schema

The system adds the following tables to the existing schema:

#### `usage_plans`
Defines billing plans with pricing tiers and limits.
```sql
- plan_name: Unique plan identifier
- display_name: Human-readable name
- billing_type: 'subscription', 'pay_per_use', or 'hybrid'
- base_price_cents: Monthly base price
- pricing_tiers: JSON array of tiered pricing
- limits: JSON object of feature limits
- stripe_product_id/stripe_price_id: Stripe integration
```

#### `usage_events`
Tracks individual usage events.
```sql
- user_id: User who performed the action
- event_type: Type of event (api_call, ai_generation, etc.)
- feature_name: Feature being used
- quantity: Amount used
- unit: Unit of measurement
- cost_cents: Calculated cost
- billing_cycle_id: Associated billing cycle
```

#### `billing_cycles`
Manages billing periods.
```sql
- user_id: User being billed
- billing_plan_id: Associated plan
- start_date/end_date: Billing period
- total_usage: Aggregated usage data
- total_cost_cents: Total charges
- stripe_subscription_id: Stripe subscription
```

#### `user_usage_limits`
Enforces usage quotas.
```sql
- user_id: User the limit applies to
- feature_name: Feature being limited
- limit_value: Maximum allowed usage
- used_value: Current usage
- is_hard_limit: Whether to block usage when exceeded
```

#### `billing_notifications`
User alerts and warnings.
```sql
- user_id: User to notify
- notification_type: Type of notification
- title/message: Notification content
- is_read: Read status
```

## Core Services

### UsageTrackingService
Handles recording and retrieving usage data.

**Key Methods:**
- `recordUsage(data)`: Records a usage event
- `getUsageStats(userId)`: Retrieves usage statistics
- `setUsageLimits(limits)`: Sets user usage limits
- `getUnreadNotifications(userId)`: Gets billing notifications

### BillingCalculationService
Calculates costs and generates invoices.

**Key Methods:**
- `calculateBilling(cycleId)`: Calculates total billing for a cycle
- `generateInvoice(cycleId)`: Creates invoice data
- `estimateCosts(planId, usage)`: Estimates costs for usage patterns
- `calculateProratedCharge()`: Handles plan change proration

### StripeMeteredBillingService
Manages Stripe subscriptions and usage reporting.

**Key Methods:**
- `createMeteredSubscription(data)`: Creates Stripe subscription
- `reportUsage(data)`: Reports usage to Stripe
- `updateSubscriptionPlan()`: Changes subscription plans
- `cancelSubscription()`: Cancels subscriptions

### UsageLimitService
Enforces usage limits and quotas.

**Key Methods:**
- `checkLimit(userId, feature, quantity)`: Checks if usage is allowed
- `enforceLimit(userId, feature, quantity)`: Enforces limits
- `setUserLimitsFromPlan(userId, planId)`: Sets limits based on plan
- `getLimitWarnings(userId)`: Gets usage warnings

## API Endpoints

### Billing Routes (`/api/billing/`)

#### GET `/plans`
Returns available billing plans.

#### GET `/summary`
Returns user's billing summary including current plan, usage, and costs.

#### GET `/usage`
Returns detailed usage statistics with optional date filtering.

#### GET `/limits`
Returns current usage limits and quotas.

#### POST `/subscription`
Creates a new metered subscription.

#### PUT `/subscription/:id`
Updates subscription plan with proration.

#### DELETE `/subscription/:id`
Cancels subscription.

#### GET `/invoices`
Returns billing history and invoices.

#### GET `/notifications`
Returns unread billing notifications.

#### POST `/notifications/mark-read`
Marks notifications as read.

#### POST `/estimate`
Estimates costs for usage patterns.

#### POST `/prorate`
Calculates prorated charges for plan changes.

## Frontend Components

### BillingDashboard
Main billing interface with tabs for:
- **Overview**: Current plan, usage summary, limits
- **Usage**: Detailed usage breakdown by feature
- **Billing**: Invoice history, subscription management
- **Settings**: Billing preferences and notifications

### BillingPage
Page wrapper for the billing dashboard.

## Usage Tracking Middleware

### trackApiUsage(featureName, unit)
Tracks API endpoint usage.

### trackAiUsage(modelName)
Tracks AI API token usage.

### trackStorageUsage(operation)
Tracks file storage operations.

### enforceUsageLimits(featureName)
Middleware to enforce usage limits on endpoints.

## Configuration

### Default Usage Plans

1. **Free Plan**
   - API Calls: 1,000/month
   - AI Tokens: 10,000/month
   - Price: $0

2. **Starter Plan**
   - API Calls: 10,000/month
   - AI Tokens: 100,000/month
   - Storage: 10GB
   - Price: $29/month

3. **Professional Plan**
   - API Calls: 50,000/month
   - AI Tokens: 500,000/month
   - Storage: 50GB
   - Price: $79/month

4. **Enterprise Plan**
   - Unlimited usage
   - Priority support
   - Price: $199/month

5. **Pay Per Use**
   - $0.10 per 1,000 API calls
   - $0.002 per AI token
   - Volume discounts available

## Stripe Integration

### Webhook Handling
The system processes Stripe webhooks for:
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

### Metered Billing
- Automatic usage reporting to Stripe
- Real-time cost calculation
- Prorated billing for plan changes
- Invoice generation and PDF links

## Usage Limits & Enforcement

### Hard vs Soft Limits
- **Hard Limits**: Block usage when exceeded
- **Soft Limits**: Allow usage but send warnings

### Warning Thresholds
- 75%: Warning notification
- 90%: Critical notification
- 100%: Limit exceeded notification

### Reset Behavior
Limits reset at the start of each billing cycle or can be configured for calendar months.

## Notifications System

### Notification Types
- `limit_warning`: Usage approaching limit
- `limit_exceeded`: Usage limit exceeded
- `billing_cycle_end`: Billing cycle ending
- `payment_failed`: Payment processing failed
- `subscription_cancelled`: Subscription cancelled

### Delivery Methods
- In-app notifications (current implementation)
- Email notifications (future enhancement)
- Webhook notifications (for integrations)

## Analytics & Reporting

### User Analytics
- Usage trends over time
- Cost breakdown by feature
- Limit utilization rates

### Admin Analytics
- System-wide usage patterns
- Revenue analytics
- Customer usage distribution

## Testing

Comprehensive test suite covering:
- Unit tests for all services
- Integration tests for billing flows
- Performance tests for concurrent usage
- Error handling and edge cases

Run tests with:
```bash
npm test server/tests/billing-system.test.js
```

## Deployment Considerations

### Environment Variables
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Database Migrations
The system uses Drizzle ORM for schema management. Run migrations on deployment:
```bash
npx drizzle-kit migrate
```

### Stripe Configuration
1. Create products and prices in Stripe dashboard
2. Configure webhook endpoints for billing events
3. Set up tax rates and billing addresses
4. Configure subscription settings

## Future Enhancements

### Planned Features
- Multi-currency support
- Advanced tiered pricing
- Usage-based discounts
- Budget alerts and controls
- Team usage allocation
- Custom billing cycles
- Invoice customization
- Payment method management
- Billing address collection
- Tax calculation integration

### Integration Opportunities
- Zapier/webhook integrations
- Slack notifications
- Custom reporting APIs
- Third-party analytics
- Accounting software integration

## Troubleshooting

### Common Issues

1. **Usage not tracking**: Check middleware is applied to routes
2. **Stripe webhooks failing**: Verify webhook secret and endpoint URL
3. **Limits not enforcing**: Ensure limit service is called before usage
4. **Billing calculations incorrect**: Verify pricing tier configuration

### Monitoring
- Monitor Stripe webhook delivery
- Track usage event volume
- Alert on billing calculation errors
- Monitor limit enforcement effectiveness

## Support

For issues or questions about the billing system:
1. Check this documentation
2. Review server logs for error details
3. Test with Stripe dashboard for payment issues
4. Contact development team for code issues

---

This usage billing system provides a complete, production-ready solution for metered billing with Stripe integration, suitable for SaaS applications with complex usage patterns.