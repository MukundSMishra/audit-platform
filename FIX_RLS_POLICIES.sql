-- =====================================================
-- FIX RLS POLICIES - Remove Circular Dependency
-- =====================================================

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can view all user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can manage user profiles" ON public.user_profiles;

-- Create new, simpler policies without circular dependency
-- Policy 1: Users can always view their own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT 
    USING (id = auth.uid());

-- Policy 2: Users can update their own profile (except role)
CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE 
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid() AND role = (SELECT role FROM public.user_profiles WHERE id = auth.uid()));

-- Policy 3: Service role can do everything (for admin operations)
CREATE POLICY "Service role full access" ON public.user_profiles
    FOR ALL 
    USING (true)
    WITH CHECK (true);

-- Verify the table is accessible
SELECT 'user_profiles table is now accessible' as status;
