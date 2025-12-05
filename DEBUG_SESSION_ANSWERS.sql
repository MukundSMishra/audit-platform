-- DEBUG: Check session_answers table structure and data
-- Run this in Supabase SQL Editor to debug the answer saving issue

-- 1. Check table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'session_answers'
ORDER BY ordinal_position;

-- 2. Check constraints (unique constraints)
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'session_answers';

-- 3. Check recent session_answers data
SELECT session_id, act_id, question_id, status, evidence_url, remarks, updated_at
FROM session_answers
ORDER BY updated_at DESC
LIMIT 10;

-- 4. Fix constraint if needed (run this if constraint is missing or wrong)
-- First drop any existing constraint
ALTER TABLE session_answers DROP CONSTRAINT IF EXISTS unique_session_question;
ALTER TABLE session_answers DROP CONSTRAINT IF EXISTS unique_session_question_act;
ALTER TABLE session_answers DROP CONSTRAINT IF EXISTS session_answers_session_id_question_id_act_id_key;

-- Add the correct unique constraint
ALTER TABLE session_answers
ADD CONSTRAINT session_answers_unique_key 
UNIQUE(session_id, question_id, act_id);

-- 5. Test data integrity
SELECT session_id, act_id, question_id, COUNT(*) as duplicate_count
FROM session_answers
GROUP BY session_id, act_id, question_id
HAVING COUNT(*) > 1;