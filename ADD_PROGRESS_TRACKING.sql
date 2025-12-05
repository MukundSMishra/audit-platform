-- Add progress tracking columns to audit_sessions table
-- This allows saving and resuming audit progress

ALTER TABLE audit_sessions 
ADD COLUMN current_act_index INTEGER DEFAULT 0,
ADD COLUMN current_question_index INTEGER DEFAULT 0, 
ADD COLUMN last_saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Update existing sessions to have default values
UPDATE audit_sessions 
SET current_act_index = 0, 
    current_question_index = 0, 
    last_saved_at = CURRENT_TIMESTAMP
WHERE current_act_index IS NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_audit_sessions_progress 
ON audit_sessions(user_id, current_act_index, current_question_index);

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'audit_sessions'
AND column_name IN ('current_act_index', 'current_question_index', 'last_saved_at')
ORDER BY ordinal_position;