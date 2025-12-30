-- =====================================================
-- Business Audits Schema Setup
-- =====================================================
-- Description: Creates storage bucket and table for
-- Contract Management feature with persistent storage.
-- =====================================================

-- 1. Create Storage Bucket for Audit Documents
-- =====================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('audit-docs', 'audit-docs', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Create Storage Policies for audit-docs bucket
-- =====================================================
-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload audit docs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'audit-docs');

-- Allow authenticated users to read their own files
CREATE POLICY "Authenticated users can read audit docs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'audit-docs');

-- Allow authenticated users to delete files
CREATE POLICY "Authenticated users can delete audit docs"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'audit-docs');

-- 3. Create business_audits Table
-- =====================================================
CREATE TABLE IF NOT EXISTS business_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_name TEXT NOT NULL,
  contract_type TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  status TEXT DEFAULT 'ready',
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE
);

-- 4. Create Index for Performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_business_audits_user_id ON business_audits(user_id);
CREATE INDEX IF NOT EXISTS idx_business_audits_client_id ON business_audits(client_id);
CREATE INDEX IF NOT EXISTS idx_business_audits_status ON business_audits(status);

-- 5. Enable Row Level Security
-- =====================================================
ALTER TABLE business_audits ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS Policies
-- =====================================================
-- Users can view their own business audits
CREATE POLICY "Users can view their own business audits"
ON business_audits FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own business audits
CREATE POLICY "Users can insert their own business audits"
ON business_audits FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own business audits
CREATE POLICY "Users can update their own business audits"
ON business_audits FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Users can delete their own business audits
CREATE POLICY "Users can delete their own business audits"
ON business_audits FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 7. Create Updated At Trigger
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_business_audits_updated_at
BEFORE UPDATE ON business_audits
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- End of Schema Setup
-- =====================================================
