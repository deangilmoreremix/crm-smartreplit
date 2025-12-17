-- Usage Billing System Tables
-- Migration to add complete usage billing system with Stripe integration

-- Usage Plans table - defines pricing plans for different features
CREATE TABLE IF NOT EXISTS usage_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT,
    billing_type TEXT NOT NULL CHECK (billing_type IN ('subscription', 'pay_per_use', 'hybrid')),
    base_price_cents INTEGER DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    billing_interval TEXT CHECK (billing_interval IN ('month', 'year', NULL)),
    is_active BOOLEAN DEFAULT true,
    stripe_product_id TEXT,
    stripe_price_id TEXT,
    features JSONB DEFAULT '{}',
    limits JSONB DEFAULT '{}',
    pricing_tiers JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Usage Events table - tracks individual usage events
CREATE TABLE IF NOT EXISTS usage_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    tenant_id UUID,
    event_type TEXT NOT NULL, -- 'api_call', 'ai_generation', 'storage', 'bandwidth', etc.
    feature_name TEXT NOT NULL, -- 'openai_api', 'content_generation', 'storage_gb', etc.
    quantity DECIMAL(10,4) NOT NULL DEFAULT 1,
    unit TEXT NOT NULL, -- 'requests', 'tokens', 'gb', 'minutes', etc.
    cost_cents INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    billing_cycle_id UUID,
    stripe_subscription_item_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Billing Cycles table - tracks billing periods
CREATE TABLE IF NOT EXISTS billing_cycles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    tenant_id UUID,
    stripe_subscription_id TEXT,
    billing_plan_id UUID REFERENCES usage_plans(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed', 'cancelled')),
    total_usage JSONB DEFAULT '{}',
    total_cost_cents INTEGER DEFAULT 0,
    stripe_invoice_id TEXT,
    invoice_pdf_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Usage Limits table - tracks user quotas and limits
CREATE TABLE IF NOT EXISTS user_usage_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    tenant_id UUID,
    feature_name TEXT NOT NULL,
    limit_value DECIMAL(12,4),
    used_value DECIMAL(12,4) DEFAULT 0,
    reset_date DATE,
    billing_cycle_id UUID REFERENCES billing_cycles(id),
    is_hard_limit BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, feature_name, billing_cycle_id)
);

-- Billing Notifications table - tracks billing alerts and notifications
CREATE TABLE IF NOT EXISTS billing_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    tenant_id UUID,
    notification_type TEXT NOT NULL CHECK (notification_type IN ('limit_warning', 'limit_exceeded', 'billing_cycle_end', 'payment_failed', 'subscription_cancelled')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_usage_events_user_id ON usage_events(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_created_at ON usage_events(created_at);
CREATE INDEX IF NOT EXISTS idx_usage_events_event_type ON usage_events(event_type);
CREATE INDEX IF NOT EXISTS idx_usage_events_billing_cycle_id ON usage_events(billing_cycle_id);

CREATE INDEX IF NOT EXISTS idx_billing_cycles_user_id ON billing_cycles(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_cycles_status ON billing_cycles(status);
CREATE INDEX IF NOT EXISTS idx_billing_cycles_dates ON billing_cycles(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_user_usage_limits_user_id ON user_usage_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_user_usage_limits_feature ON user_usage_limits(feature_name);

CREATE INDEX IF NOT EXISTS idx_billing_notifications_user_id ON billing_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_notifications_unread ON billing_notifications(user_id, is_read) WHERE is_read = false;

-- Insert default usage plans
INSERT INTO usage_plans (plan_name, display_name, description, billing_type, base_price_cents, billing_interval, features, limits, pricing_tiers) VALUES
('free', 'Free Plan', 'Basic plan with limited usage', 'subscription', 0, 'month', '["basic_crm", "limited_ai"]', '{"api_calls": 1000, "ai_tokens": 10000}', '[]'),
('starter', 'Starter Plan', 'Entry-level plan with moderate usage', 'subscription', 2900, 'month', '["full_crm", "ai_tools", "communications"]', '{"api_calls": 10000, "ai_tokens": 100000, "storage_gb": 10}', '[]'),
('professional', 'Professional Plan', 'Advanced plan for growing businesses', 'subscription', 7900, 'month', '["all_features", "white_label", "advanced_analytics"]', '{"api_calls": 50000, "ai_tokens": 500000, "storage_gb": 50}', '[]'),
('enterprise', 'Enterprise Plan', 'Unlimited usage for large organizations', 'subscription', 19900, 'month', '["all_features", "unlimited_usage", "priority_support"]', '{"unlimited": true}', '[]'),
('pay_per_use', 'Pay Per Use', 'Pay only for what you use', 'pay_per_use', 0, NULL, '["all_features"]', '{}', '[
    {"min_quantity": 0, "max_quantity": 10000, "price_per_unit": 0.1, "unit": "api_call"},
    {"min_quantity": 10001, "max_quantity": 50000, "price_per_unit": 0.08, "unit": "api_call"},
    {"min_quantity": 50001, "max_quantity": null, "price_per_unit": 0.05, "unit": "api_call"},
    {"min_quantity": 0, "max_quantity": 100000, "price_per_unit": 0.0002, "unit": "token"},
    {"min_quantity": 100001, "max_quantity": 1000000, "price_per_unit": 0.00015, "unit": "token"},
    {"min_quantity": 1000001, "max_quantity": null, "price_per_unit": 0.0001, "unit": "token"}
]');

-- Update trigger for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_usage_plans_updated_at BEFORE UPDATE ON usage_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_billing_cycles_updated_at BEFORE UPDATE ON billing_cycles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_usage_limits_updated_at BEFORE UPDATE ON user_usage_limits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();