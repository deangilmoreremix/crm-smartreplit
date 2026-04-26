-- ============================================================================
-- FIX CONTACT ANALYTICS INDEXES AND COMMENT
-- Add missing indexes for time_period and created_at, plus table comment
-- ============================================================================

-- Add missing indexes for contact_analytics
CREATE INDEX IF NOT EXISTS idx_contact_analytics_time_period ON public.contact_analytics(time_period);
CREATE INDEX IF NOT EXISTS idx_contact_analytics_created_at ON public.contact_analytics(created_at DESC);

-- Add table comment
COMMENT ON TABLE public.contact_analytics IS 'Comprehensive contact engagement and performance analytics tracking interactions, conversions, and response patterns';