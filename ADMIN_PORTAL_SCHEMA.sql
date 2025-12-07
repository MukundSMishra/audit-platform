-- =====================================================
-- ADMIN PORTAL DATABASE SCHEMA
-- Complete migration for multi-tenant admin system
-- =====================================================

-- 1. EXTEND AUTH.USERS WITH PROFILES TABLE
-- This stores additional user information beyond Supabase auth
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    phone TEXT,
    role TEXT NOT NULL CHECK (role IN ('admin', 'intern', 'client')),
    is_active BOOLEAN DEFAULT true,
    assigned_region TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CLIENTS TABLE
-- Stores client/company information with subscription tracking
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    pincode TEXT,
    gstin TEXT,
    subscription_tier TEXT CHECK (subscription_tier IN ('trial', 'basic', 'professional', 'enterprise')),
    subscription_status TEXT CHECK (subscription_status IN ('active', 'expired', 'cancelled', 'trial')) DEFAULT 'trial',
    subscription_start_date DATE,
    subscription_end_date DATE,
    total_factories INTEGER DEFAULT 0,
    total_audits_allowed INTEGER,
    total_audits_used INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. FACTORIES TABLE (separate from audit_sessions)
-- Master list of factories under each client
CREATE TABLE IF NOT EXISTS public.factories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    factory_name TEXT NOT NULL,
    location TEXT,
    city TEXT,
    state TEXT,
    license_number TEXT,
    factory_type TEXT,
    employee_count INTEGER,
    contact_person TEXT,
    contact_phone TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. AUDIT ASSIGNMENTS TABLE
-- Links interns to specific audits with due dates
CREATE TABLE IF NOT EXISTS public.audit_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_session_id UUID REFERENCES public.audit_sessions(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES auth.users(id), -- intern user_id
    assigned_by UUID REFERENCES auth.users(id), -- admin user_id
    client_id UUID REFERENCES public.clients(id),
    factory_id UUID REFERENCES public.factories(id),
    due_date DATE,
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
    status TEXT CHECK (status IN ('assigned', 'in_progress', 'completed', 'cancelled')) DEFAULT 'assigned',
    notes TEXT,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. PAYMENT RECORDS TABLE
-- Track client payments and invoices
CREATE TABLE IF NOT EXISTS public.payment_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    invoice_number TEXT UNIQUE,
    amount DECIMAL(10, 2) NOT NULL,
    payment_date DATE,
    payment_method TEXT CHECK (payment_method IN ('bank_transfer', 'upi', 'cheque', 'cash', 'online')),
    payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')) DEFAULT 'pending',
    transaction_id TEXT,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. ACTIVITY LOGS TABLE
-- Track all admin and intern actions for audit trail
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL, -- e.g., 'assigned_audit', 'completed_audit', 'created_client'
    entity_type TEXT, -- e.g., 'audit', 'client', 'intern'
    entity_id UUID,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. UPDATE AUDIT_SESSIONS TABLE
-- Add columns to link with new structure
ALTER TABLE public.audit_sessions 
    ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id),
    ADD COLUMN IF NOT EXISTS factory_id UUID REFERENCES public.factories(id),
    ADD COLUMN IF NOT EXISTS assigned_intern_id UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 100),
    ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS review_notes TEXT,
    ADD COLUMN IF NOT EXISTS review_status TEXT CHECK (review_status IN ('pending', 'approved', 'rejected', 'needs_revision'));

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_active ON public.user_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_clients_subscription_status ON public.clients(subscription_status);
CREATE INDEX IF NOT EXISTS idx_factories_client_id ON public.factories(client_id);
CREATE INDEX IF NOT EXISTS idx_assignments_assigned_to ON public.audit_assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON public.audit_assignments(status);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON public.audit_assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_audit_sessions_client_id ON public.audit_sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_audit_sessions_assigned_intern ON public.audit_sessions(assigned_intern_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.factories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- User Profiles: Admins see all, interns see only their own
CREATE POLICY "Admins can view all user profiles" ON public.user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Users can view their own profile" ON public.user_profiles
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Admins can manage user profiles" ON public.user_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Clients: Admins see all, clients see only their own
CREATE POLICY "Admins can view all clients" ON public.clients
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can manage clients" ON public.clients
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Factories: Admins see all
CREATE POLICY "Admins can view all factories" ON public.factories
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can manage factories" ON public.factories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Assignments: Admins see all, interns see only their assignments
CREATE POLICY "Admins can view all assignments" ON public.audit_assignments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Interns can view their assignments" ON public.audit_assignments
    FOR SELECT USING (assigned_to = auth.uid());

CREATE POLICY "Admins can manage assignments" ON public.audit_assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Activity Logs: Admins can view all
CREATE POLICY "Admins can view all activity logs" ON public.activity_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Anyone can insert activity logs" ON public.activity_logs
    FOR INSERT WITH CHECK (true);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_factories_updated_at BEFORE UPDATE ON public.factories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update factory count when factory is added/removed
CREATE OR REPLACE FUNCTION update_client_factory_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.clients 
        SET total_factories = total_factories + 1 
        WHERE id = NEW.client_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.clients 
        SET total_factories = total_factories - 1 
        WHERE id = OLD.client_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER factory_count_trigger
    AFTER INSERT OR DELETE ON public.factories
    FOR EACH ROW EXECUTE FUNCTION update_client_factory_count();

-- Function to log activity
CREATE OR REPLACE FUNCTION log_activity(
    p_action TEXT,
    p_entity_type TEXT,
    p_entity_id UUID,
    p_details JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO public.activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (auth.uid(), p_action, p_entity_type, p_entity_id, p_details)
    RETURNING id INTO v_log_id;
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SEED DATA (FOR TESTING)
-- =====================================================

-- Note: You'll need to manually create the first admin user through Supabase Auth
-- Then run this to set their profile:
-- INSERT INTO public.user_profiles (id, email, full_name, role, is_active)
-- VALUES ('your-admin-user-id', 'admin@example.com', 'Admin User', 'admin', true);

-- Sample client (for testing)
-- INSERT INTO public.clients (company_name, contact_person, email, subscription_tier, subscription_status)
-- VALUES ('Demo Manufacturing Ltd', 'John Doe', 'john@demo.com', 'professional', 'active');

COMMENT ON TABLE public.user_profiles IS 'Extended user information with role-based access';
COMMENT ON TABLE public.clients IS 'Client companies with subscription management';
COMMENT ON TABLE public.factories IS 'Factory master data linked to clients';
COMMENT ON TABLE public.audit_assignments IS 'Assignment tracking for intern audits';
COMMENT ON TABLE public.payment_records IS 'Payment and invoice tracking';
COMMENT ON TABLE public.activity_logs IS 'Audit trail for all system actions';
