-- COPY AND PASTE THIS INTO SUPABASE SQL EDITOR
-- Navigate to: Supabase Dashboard > SQL Editor > New Query

-- Step 1: Add the required columns
ALTER TABLE audit_sessions 
ADD COLUMN current_act_index INTEGER DEFAULT 0,
ADD COLUMN current_question_index INTEGER DEFAULT 0, 
ADD COLUMN last_saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Step 2: Update existing sessions (optional)
UPDATE audit_sessions 
SET current_act_index = 0, 
    current_question_index = 0, 
    last_saved_at = CURRENT_TIMESTAMP
WHERE current_act_index IS NULL;

-- Step 3: Verify columns were added (check results)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'audit_sessions'
AND column_name IN ('current_act_index', 'current_question_index', 'last_saved_at');

-- Expected result: 3 rows showing the new columns