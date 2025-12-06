-- Add act_ids column to audit_sessions table
-- This column stores the array of all selected acts for multi-act audits

ALTER TABLE audit_sessions 
ADD COLUMN IF NOT EXISTS act_ids TEXT[];

-- Update existing sessions to have act_ids array from the old act_id column
UPDATE audit_sessions 
SET act_ids = ARRAY[act_id]
WHERE act_ids IS NULL AND act_id IS NOT NULL;

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'audit_sessions'
AND column_name = 'act_ids';

-- Expected Result:
-- column_name | data_type | is_nullable
-- act_ids     | ARRAY     | YES
