-- Performance Indexes Migration for Massive Scale
-- This migration adds critical indexes for handling 10,000+ concurrent users

-- Contacts table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contacts_email ON contacts(email) WHERE email IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contacts_status ON contacts(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contacts_created_at ON contacts(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contacts_user_email ON contacts(user_id, email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contacts_user_status ON contacts(user_id, status);

-- Deals table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_deals_user_id ON deals(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_deals_contact_id ON deals(contact_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_deals_stage ON deals(stage);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_deals_probability ON deals(probability);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_deals_created_at ON deals(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_deals_user_stage ON deals(user_id, stage);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_deals_user_probability ON deals(user_id, probability DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_deals_expected_close_date ON deals(expected_close_date) WHERE expected_close_date IS NOT NULL;

-- Tasks table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_contact_id ON tasks(contact_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_deal_id ON tasks(deal_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_due_date ON tasks(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_user_status ON tasks(user_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_user_due_date ON tasks(user_id, due_date);

-- Appointments table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_start_time ON appointments(start_time);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_created_at ON appointments(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_user_start_time ON appointments(user_id, start_time);

-- Communications table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_communications_user_id ON communications(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_communications_type ON communications(type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_communications_created_at ON communications(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_communications_user_type ON communications(user_id, type);

-- Notes table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notes_contact_id ON notes(contact_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notes_deal_id ON notes(deal_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notes_user_created_at ON notes(user_id, created_at DESC);

-- Documents table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_type ON documents(type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_user_type ON documents(user_id, type);

-- Profiles table indexes (for authentication)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_product_tier ON profiles(product_tier);

-- Company tables indexes (multi-tenant)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_owner_user_id ON companies(owner_user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_domain ON companies(domain);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_subscription_tier ON companies(subscription_tier);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_company_users_company_id ON company_users(company_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_company_users_user_id ON company_users(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_company_users_role ON company_users(role);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_company_users_status ON company_users(status);

-- Partial indexes for better performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contacts_active ON contacts(user_id, created_at DESC) WHERE status = 'active';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_deals_open ON deals(user_id, created_at DESC) WHERE stage NOT IN ('closed-won', 'closed-lost');
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_pending ON tasks(user_id, due_date) WHERE status = 'pending' AND due_date IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_upcoming ON appointments(user_id, start_time) WHERE start_time > NOW() AND status = 'scheduled';

-- Composite indexes for common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contacts_user_status_created ON contacts(user_id, status, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_deals_user_stage_created ON deals(user_id, stage, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_user_priority_due ON tasks(user_id, priority, due_date);

-- Text search indexes (if using full-text search)
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contacts_search ON contacts USING gin(to_tsvector('english', coalesce(name, '') || ' ' || coalesce(email, '') || ' ' || coalesce(company, '')));
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_deals_search ON deals USING gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '')));

-- Update table statistics for better query planning
ANALYZE contacts;
ANALYZE deals;
ANALYZE tasks;
ANALYZE appointments;
ANALYZE communications;
ANALYZE notes;
ANALYZE documents;
ANALYZE profiles;
ANALYZE companies;
ANALYZE company_users;