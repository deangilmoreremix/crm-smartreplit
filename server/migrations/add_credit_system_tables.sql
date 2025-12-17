-- Credit-based Billing System Tables
-- Migration to add credit system tables for credit-based billing

-- User Credits table - tracks credit balances for credit-based billing
CREATE TABLE IF NOT EXISTS user_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id),
    tenant_id UUID,
    total_credits DECIMAL(12,4) DEFAULT 0,
    used_credits DECIMAL(12,4) DEFAULT 0,
    available_credits DECIMAL(12,4) DEFAULT 0,
    last_purchase_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Credit Transactions table - tracks credit purchases and usage
CREATE TABLE IF NOT EXISTS credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id),
    tenant_id UUID,
    type TEXT NOT NULL CHECK (type IN ('purchase', 'usage', 'refund', 'admin_grant')),
    amount DECIMAL(12,4) NOT NULL,
    description TEXT,
    balance_before DECIMAL(12,4),
    balance_after DECIMAL(12,4),
    stripe_transaction_id TEXT,
    usage_event_id UUID REFERENCES usage_events(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(type);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_usage_event_id ON credit_transactions(usage_event_id);

-- Trigger will be created automatically by Drizzle

-- Insert generous credit packages with 50% profit margin and 2-3x more credits per dollar
-- These packages provide exceptional value with high credit-to-dollar ratios
INSERT INTO usage_plans (plan_name, display_name, description, billing_type, base_price_cents, features, limits, is_active) VALUES
('credit_pack_small', '500 Credits Pack', 'Perfect for getting started with generous credits', 'pay_per_use', 1000, '{"credits": 500}', '{"credits": 500}', true),
('credit_pack_medium', '2000 Credits Pack', 'Most popular choice with 2.5x more credits per dollar', 'pay_per_use', 3000, '{"credits": 2000}', '{"credits": 2000}', true),
('credit_pack_large', '5000 Credits Pack', 'Heavy usage pack with maximum value', 'pay_per_use', 6000, '{"credits": 5000}', '{"credits": 5000}', true),
('credit_pack_enterprise', '15000 Credits Pack', 'Enterprise solution with 3x more credits per dollar', 'pay_per_use', 15000, '{"credits": 15000}', '{"credits": 15000}', true)
ON CONFLICT (plan_name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    base_price_cents = EXCLUDED.base_price_cents,
    features = EXCLUDED.features,
    limits = EXCLUDED.limits,
    is_active = EXCLUDED.is_active;