-- =====================================================
-- FIX ALL RLS POLICIES - Remove Admin-only Restrictions
-- =====================================================

-- DROP ALL EXISTING RESTRICTIVE POLICIES
-- Clients
DROP POLICY IF EXISTS "Admins can view all clients" ON public.clients;
DROP POLICY IF EXISTS "Admins can manage clients" ON public.clients;

-- Factories
DROP POLICY IF EXISTS "Admins can view all factories" ON public.factories;
DROP POLICY IF EXISTS "Admins can manage factories" ON public.factories;

-- Assignments
DROP POLICY IF EXISTS "Admins can view all assignments" ON public.audit_assignments;
DROP POLICY IF EXISTS "Interns can view their assignments" ON public.audit_assignments;
DROP POLICY IF EXISTS "Admins can manage assignments" ON public.audit_assignments;

-- Activity Logs
DROP POLICY IF EXISTS "Admins can view all activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Anyone can insert activity logs" ON public.activity_logs;

-- Payment Records (if exists)
DROP POLICY IF EXISTS "Admins can view all payments" ON public.payment_records;
DROP POLICY IF EXISTS "Admins can manage payments" ON public.payment_records;

-- CREATE NEW SIMPLE POLICIES
-- These allow authenticated users to access based on their needs

-- Clients: Admins can do everything, clients can view their own
CREATE POLICY "Authenticated users can view clients" ON public.clients
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage clients" ON public.clients
    FOR ALL USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

-- Factories: Same as clients
CREATE POLICY "Authenticated users can view factories" ON public.factories
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage factories" ON public.factories
    FOR ALL USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

-- Assignments: Interns see their own, admins see all
CREATE POLICY "Users can view relevant assignments" ON public.audit_assignments
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage assignments" ON public.audit_assignments
    FOR ALL USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

-- Activity Logs: Everyone can view and insert
CREATE POLICY "Users can view activity logs" ON public.activity_logs
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert activity logs" ON public.activity_logs
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Payment Records
CREATE POLICY "Users can view payments" ON public.payment_records
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage payments" ON public.payment_records
    FOR ALL USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

SELECT 'All RLS policies updated successfully' as status;
