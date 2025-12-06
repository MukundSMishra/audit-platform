-- DELETE ALL TEST AUDIT DATA
-- Copy and paste this script into Supabase SQL Editor to clean up test data

-- Step 1: Delete all answers from session_answers table
DELETE FROM session_answers;

-- Step 2: Delete all audit sessions from audit_sessions table
DELETE FROM audit_sessions;

-- Step 3: Verify deletion
SELECT 'session_answers remaining:' as info, COUNT(*) as count FROM session_answers
UNION ALL
SELECT 'audit_sessions remaining:' as info, COUNT(*) as count FROM audit_sessions;

-- Expected Result: Both counts should be 0
