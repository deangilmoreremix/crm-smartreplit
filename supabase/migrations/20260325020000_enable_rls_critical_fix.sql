-- Enable Row Level Security on 16 tables that were missing it
-- This fixes a critical security vulnerability
-- Migration timestamp: 20260325020000

-- Enable RLS on app_features
ALTER TABLE public.app_features ENABLE ROW LEVEL SECURITY;

-- Enable RLS on benefits_features
ALTER TABLE public.benefits_features ENABLE ROW LEVEL SECURITY;

-- Enable RLS on faqs
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

-- Enable RLS on feature_analytics
ALTER TABLE public.feature_analytics ENABLE ROW LEVEL SECURITY;

-- Enable RLS on feature_benefits
ALTER TABLE public.feature_benefits ENABLE ROW LEVEL SECURITY;

-- Enable RLS on feature_faqs
ALTER TABLE public.feature_faqs ENABLE ROW LEVEL SECURITY;

-- Enable RLS on feature_ratings
ALTER TABLE public.feature_ratings ENABLE ROW LEVEL SECURITY;

-- Enable RLS on feature_relationships
ALTER TABLE public.feature_relationships ENABLE ROW LEVEL SECURITY;

-- Enable RLS on feature_steps
ALTER TABLE public.feature_steps ENABLE ROW LEVEL SECURITY;

-- Enable RLS on feature_use_cases
ALTER TABLE public.feature_use_cases ENABLE ROW LEVEL SECURITY;

-- Enable RLS on hero_content
ALTER TABLE public.hero_content ENABLE ROW LEVEL SECURITY;

-- Enable RLS on import_records
ALTER TABLE public.import_records ENABLE ROW LEVEL SECURITY;

-- Enable RLS on pricing_plans
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;

-- Enable RLS on subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Enable RLS on testimonials
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- Enable RLS on user_feature_interactions
ALTER TABLE public.user_feature_interactions ENABLE ROW LEVEL SECURITY;

-- Create policies for service_role bypass (allows Supabase client to work)
-- app_features policies
CREATE POLICY "Allow service_role full access to app_features" ON public.app_features
    FOR ALL USING (auth.role() = 'service_role');

-- benefits_features policies
CREATE POLICY "Allow service_role full access to benefits_features" ON public.benefits_features
    FOR ALL USING (auth.role() = 'service_role');

-- faqs policies
CREATE POLICY "Allow service_role full access to faqs" ON public.faqs
    FOR ALL USING (auth.role() = 'service_role');

-- feature_analytics policies
CREATE POLICY "Allow service_role full access to feature_analytics" ON public.feature_analytics
    FOR ALL USING (auth.role() = 'service_role');

-- feature_benefits policies
CREATE POLICY "Allow service_role full access to feature_benefits" ON public.feature_benefits
    FOR ALL USING (auth.role() = 'service_role');

-- feature_faqs policies
CREATE POLICY "Allow service_role full access to feature_faqs" ON public.feature_faqs
    FOR ALL USING (auth.role() = 'service_role');

-- feature_ratings policies
CREATE POLICY "Allow service_role full access to feature_ratings" ON public.feature_ratings
    FOR ALL USING (auth.role() = 'service_role');

-- feature_relationships policies
CREATE POLICY "Allow service_role full access to feature_relationships" ON public.feature_relationships
    FOR ALL USING (auth.role() = 'service_role');

-- feature_steps policies
CREATE POLICY "Allow service_role full access to feature_steps" ON public.feature_steps
    FOR ALL USING (auth.role() = 'service_role');

-- feature_use_cases policies
CREATE POLICY "Allow service_role full access to feature_use_cases" ON public.feature_use_cases
    FOR ALL USING (auth.role() = 'service_role');

-- hero_content policies
CREATE POLICY "Allow service_role full access to hero_content" ON public.hero_content
    FOR ALL USING (auth.role() = 'service_role');

-- import_records policies
CREATE POLICY "Allow service_role full access to import_records" ON public.import_records
    FOR ALL USING (auth.role() = 'service_role');

-- pricing_plans policies
CREATE POLICY "Allow service_role full access to pricing_plans" ON public.pricing_plans
    FOR ALL USING (auth.role() = 'service_role');

-- subscriptions policies
CREATE POLICY "Allow service_role full access to subscriptions" ON public.subscriptions
    FOR ALL USING (auth.role() = 'service_role');

-- testimonials policies
CREATE POLICY "Allow service_role full access to testimonials" ON public.testimonials
    FOR ALL USING (auth.role() = 'service_role');

-- user_feature_interactions policies
CREATE POLICY "Allow service_role full access to user_feature_interactions" ON public.user_feature_interactions
    FOR ALL USING (auth.role() = 'service_role');