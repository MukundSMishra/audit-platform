-- Create table for storing AI review reports
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS ai_review_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id TEXT NOT NULL UNIQUE,
  session_id UUID REFERENCES audit_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  report_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ai_review_reports_session_id ON ai_review_reports(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_review_reports_batch_id ON ai_review_reports(batch_id);
CREATE INDEX IF NOT EXISTS idx_ai_review_reports_user_id ON ai_review_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_review_reports_created_at ON ai_review_reports(created_at DESC);

-- Add RLS policies (Row Level Security)
ALTER TABLE ai_review_reports ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own reports
CREATE POLICY "Users can view own reports"
  ON ai_review_reports
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Users can insert their own reports
CREATE POLICY "Users can insert own reports"
  ON ai_review_reports
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_ai_review_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_review_reports_updated_at
  BEFORE UPDATE ON ai_review_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_review_reports_updated_at();

-- Verify the table was created
SELECT 
  'ai_review_reports table created successfully' as status,
  COUNT(*) as existing_reports
FROM ai_review_reports;
