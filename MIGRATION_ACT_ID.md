# Database Migration - Add act_id to session_answers

## Required Changes

The new company-first workflow requires tracking which act each answer belongs to. This requires adding an `act_id` column to the `session_answers` table.

## SQL Migration Script

```sql
-- Add act_id column to session_answers table
ALTER TABLE session_answers 
ADD COLUMN act_id TEXT;

-- Update the unique constraint to include act_id
-- First, drop the old constraint if it exists
ALTER TABLE session_answers
DROP CONSTRAINT IF EXISTS unique_session_question;

-- Add new constraint that includes act_id
ALTER TABLE session_answers
ADD CONSTRAINT unique_session_question_act 
UNIQUE(session_id, question_id, act_id);

-- Optional: Add index for faster lookups by act
CREATE INDEX IF NOT EXISTS idx_session_answers_act_id 
ON session_answers(session_id, act_id);

-- Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'session_answers'
ORDER BY ordinal_position;
```

## Step-by-Step Instructions

### 1. Access Supabase SQL Editor
1. Go to [Supabase Dashboard](https://supabase.com)
2. Select your project
3. Navigate to SQL Editor (left sidebar)
4. Click "New Query"

### 2. Copy and Paste the Migration
Copy the SQL script above and paste it into the SQL Editor.

### 3. Execute
Click "Run" or press `Cmd/Ctrl + Enter`

**Expected Result:** 
```
Success. No rows returned
```

### 4. Verify Success
Run this verification query:

```sql
-- Check that act_id column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'session_answers'
AND column_name = 'act_id';

-- Should return:
-- column_name: act_id
-- data_type: text
-- is_nullable: YES
```

### 5. Test the New Structure
```sql
-- View table structure
\d session_answers

-- Or query the table info
SELECT * FROM session_answers LIMIT 1;
```

## What This Change Does

### Before
```
session_answers table:
├── id
├── session_id
├── question_id
├── status
├── evidence_url
├── remarks
└── updated_at

Problem: Can't track which act an answer belongs to!
```

### After
```
session_answers table:
├── id
├── session_id
├── question_id
├── act_id              ← NEW! Links to AVAILABLE_ACTS id
├── status
├── evidence_url
├── remarks
└── updated_at

Benefit: Each answer now knows which act it's for!
```

### Unique Constraint
The constraint `unique_session_question_act` ensures:
- Same session + question + act = only ONE answer per question per act
- But same question can have different answers across different acts

Example:
```
Session 1, Question 1, Act 1 → Compliant  ✓ Allowed
Session 1, Question 1, Act 2 → Non-Compliant  ✓ Allowed (different act)
Session 1, Question 1, Act 1 → Non-Compliant  ✗ Conflict! (duplicate)
```

## Rollback Plan (If Needed)

If you need to undo this change:

```sql
-- Drop the new constraints and index
ALTER TABLE session_answers
DROP CONSTRAINT IF EXISTS unique_session_question_act;

DROP INDEX IF EXISTS idx_session_answers_act_id;

-- Drop the act_id column
ALTER TABLE session_answers
DROP COLUMN IF EXISTS act_id;

-- Recreate old constraint if needed
ALTER TABLE session_answers
ADD CONSTRAINT unique_session_question 
UNIQUE(session_id, question_id);
```

## Testing in App

After migration, test with this workflow:

1. **Create Company**: Name it "Test Factory"
2. **Select Acts**: Check both "Factories Act" and "MH Factory Rules"
3. **Audit Act 1**: Answer first question
   - Should save with `act_id = 'factories_act_1948'`
4. **Move to Act 2**: Click "Next Act"
5. **Answer Act 2 Question 1**: Same question as Act 1, but different act
   - Should save with `act_id = 'maharashtra_factories_rules_1963'`
6. **Verify in Supabase**:
   ```sql
   SELECT session_id, question_id, act_id, status
   FROM session_answers
   WHERE session_id = 'YOUR_SESSION_ID'
   ORDER BY act_id, question_id;
   ```
   Should see both answers with different act_ids!

## Related Code

### Frontend Implementation
- **App.jsx**: `currentActId = selectedActIds[currentActIndex]` - tracks current act
- **App.jsx**: Answer submission includes `act_id: currentActId`
- **ActSelector.jsx**: Allows multi-act selection

### Database Queries
- **Fetch answers for current act**:
  ```javascript
  const { data: savedAnswers } = await supabase
    .from('session_answers')
    .select('*')
    .eq('session_id', currentSessionId)
    .eq('act_id', currentActId);  // ← Filters by act!
  ```

---

## Status: ✅ REQUIRED FOR PRODUCTION

This migration **must be applied** before using the company-first workflow in production. The new `act_id` column is essential for multi-act audits.

---
