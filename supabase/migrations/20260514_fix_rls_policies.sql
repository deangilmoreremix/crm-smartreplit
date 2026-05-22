-- ============================================================================
-- FIX RLS POLICIES: Replace tenant_id JWT check with profile-based access
-- ============================================================================
-- PROBLEM: RLS policies were checking auth.jwt()->>'tenant_id' which is never
-- populated in the JWT. This caused ALL data access to fail.
-- 
-- SOLUTION: Use profile_id = auth.uid() pattern instead
-- ============================================================================

-- ============================================================================
-- CONTACTS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "contacts_select_smartcrm" ON public.contacts;
CREATE POLICY "contacts_select_smartcrm" ON public.contacts
    FOR SELECT USING (
        app_slug = 'smartcrm'
        AND (profile_id = auth.uid() OR profile_id IS NULL)
    );

DROP POLICY IF EXISTS "contacts_insert_smartcrm" ON public.contacts;
CREATE POLICY "contacts_insert_smartcrm" ON public.contacts
    FOR INSERT WITH CHECK (
        app_slug = 'smartcrm'
        AND profile_id = auth.uid()
    );

DROP POLICY IF EXISTS "contacts_update_smartcrm" ON public.contacts;
CREATE POLICY "contacts_update_smartcrm" ON public.contacts
    FOR UPDATE USING (
        app_slug = 'smartcrm'
        AND profile_id = auth.uid()
    );

DROP POLICY IF EXISTS "contacts_delete_smartcrm" ON public.contacts;
CREATE POLICY "contacts_delete_smartcrm" ON public.contacts
    FOR DELETE USING (
        app_slug = 'smartcrm'
        AND profile_id = auth.uid()
    );

-- ============================================================================
-- DEALS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "deals_select_smartcrm" ON public.deals;
CREATE POLICY "deals_select_smartcrm" ON public.deals
    FOR SELECT USING (
        app_slug = 'smartcrm'
        AND profile_id = auth.uid()
    );

DROP POLICY IF EXISTS "deals_insert_smartcrm" ON public.deals;
CREATE POLICY "deals_insert_smartcrm" ON public.deals
    FOR INSERT WITH CHECK (
        app_slug = 'smartcrm'
        AND profile_id = auth.uid()
    );

DROP POLICY IF EXISTS "deals_update_smartcrm" ON public.deals;
CREATE POLICY "deals_update_smartcrm" ON public.deals
    FOR UPDATE USING (
        app_slug = 'smartcrm'
        AND profile_id = auth.uid()
    );

DROP POLICY IF EXISTS "deals_delete_smartcrm" ON public.deals;
CREATE POLICY "deals_delete_smartcrm" ON public.deals
    FOR DELETE USING (
        app_slug = 'smartcrm'
        AND profile_id = auth.uid()
    );

-- ============================================================================
-- TASKS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "tasks_select_smartcrm" ON public.tasks;
CREATE POLICY "tasks_select_smartcrm" ON public.tasks
    FOR SELECT USING (
        app_slug = 'smartcrm'
        AND profile_id = auth.uid()
    );

DROP POLICY IF EXISTS "tasks_insert_smartcrm" ON public.tasks;
CREATE POLICY "tasks_insert_smartcrm" ON public.tasks
    FOR INSERT WITH CHECK (
        app_slug = 'smartcrm'
        AND profile_id = auth.uid()
    );

DROP POLICY IF EXISTS "tasks_update_smartcrm" ON public.tasks;
CREATE POLICY "tasks_update_smartcrm" ON public.tasks
    FOR UPDATE USING (
        app_slug = 'smartcrm'
        AND profile_id = auth.uid()
    );

DROP POLICY IF EXISTS "tasks_delete_smartcrm" ON public.tasks;
CREATE POLICY "tasks_delete_smartcrm" ON public.tasks
    FOR DELETE USING (
        app_slug = 'smartcrm'
        AND profile_id = auth.uid()
    );

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================
DROP POLICY IF EXISTS "profiles_select_smartcrm" ON public.profiles;
CREATE POLICY "profiles_select_smartcrm" ON public.profiles
    FOR SELECT USING (
        app_slug = 'smartcrm'
        AND (id = auth.uid() OR id = auth.uid())
    );

-- ============================================================================
-- Update existing records with NULL profile_id
-- ============================================================================
UPDATE contacts SET profile_id = NULL WHERE profile_id IS NULL;
UPDATE deals SET profile_id = NULL WHERE profile_id IS NULL;
UPDATE tasks SET profile_id = NULL WHERE profile_id IS NULL;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- SELECT tablename, policyname FROM pg_policies WHERE tablename IN ('contacts', 'deals', 'tasks', 'profiles') ORDER BY tablename;
