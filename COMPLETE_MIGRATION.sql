-- COMPLETE DATABASE MIGRATION - Fix Missing Columns
-- Copy and paste this entire script into Supabase SQL Editor

-- Step 1: Add missing act_id column to session_answers table
ALTER TABLE session_answers 
ADD COLUMN IF NOT EXISTS act_id TEXT;

-- Step 2: Add progress tracking columns to audit_sessions table  
ALTER TABLE audit_sessions 
ADD COLUMN IF NOT EXISTS current_act_index INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_question_index INTEGER DEFAULT 0, 
ADD COLUMN IF NOT EXISTS last_saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Step 3: Update existing session_answers to have a default act_id
-- This assumes you want to assign existing answers to the first act
UPDATE session_answers 
SET act_id = 'factories_act_1948'
WHERE act_id IS NULL;

-- Step 4: Update existing audit_sessions with default progress values
UPDATE audit_sessions 
SET current_act_index = 0, 
    current_question_index = 0, 
    last_saved_at = CURRENT_TIMESTAMP
WHERE current_act_index IS NULL;

-- Step 5: Fix unique constraints for session_answers
-- Remove old constraint if it exists
ALTER TABLE session_answers DROP CONSTRAINT IF EXISTS unique_session_question;
ALTER TABLE session_answers DROP CONSTRAINT IF EXISTS unique_session_question_act;
ALTER TABLE session_answers DROP CONSTRAINT IF EXISTS session_answers_session_id_question_id_act_id_key;

-- Add the correct unique constraint
ALTER TABLE session_answers
ADD CONSTRAINT session_answers_unique_key 
UNIQUE(session_id, question_id, act_id);

-- Step 6: Verify all columns exist
SELECT 'session_answers columns:' as table_info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'session_answers'
AND column_name IN ('act_id', 'session_id', 'question_id', 'status')
ORDER BY column_name;

SELECT 'audit_sessions columns:' as table_info;  
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'audit_sessions'
AND column_name IN ('current_act_index', 'current_question_index', 'last_saved_at')
ORDER BY column_name;

-- Expected Results:
-- Should show act_id, session_id, question_id, status for session_answers
-- Should show current_act_index, current_question_index, last_saved_at for audit_sessions