# Database Migration: Add act_id to audit_sessions

## Required Changes

You need to add an `act_id` column to your `audit_sessions` table in Supabase to store which act/rules the audit is following.

## Migration SQL

Run this SQL in your Supabase SQL Editor:

```sql
-- Add act_id column to audit_sessions table
ALTER TABLE audit_sessions 
ADD COLUMN act_id TEXT;

-- Add comment for documentation
COMMENT ON COLUMN audit_sessions.act_id IS 'Identifier for the compliance act being audited (e.g., factories_act_1948, maharashtra_factories_rules_1963)';

-- Optional: Add a check constraint to ensure valid act_ids
ALTER TABLE audit_sessions
ADD CONSTRAINT valid_act_id CHECK (
  act_id IN (
    'factories_act_1948',
    'maharashtra_factories_rules_1963'
  )
);

-- Optional: Create an index for faster queries
CREATE INDEX idx_audit_sessions_act_id ON audit_sessions(act_id);
```

## Steps to Apply Migration

1. Go to https://supabase.com
2. Open your project
3. Click on "SQL Editor" in the left sidebar
4. Click "New Query"
5. Paste the SQL above
6. Click "Run" or press Ctrl+Enter
7. Verify success message

## Verification

After running the migration, verify it worked:

```sql
-- Check the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'audit_sessions' 
AND column_name = 'act_id';

-- Should return: act_id | text | YES
```

## Impact

- **Existing sessions:** Will have `act_id = NULL` (safe, won't break existing data)
- **New sessions:** Must specify an act_id when creating
- **Backward compatibility:** Old code will still work, but won't populate act_id

## Rollback (if needed)

If you need to remove this change:

```sql
-- Remove the constraint first (if you added it)
ALTER TABLE audit_sessions DROP CONSTRAINT IF EXISTS valid_act_id;

-- Remove the index (if you added it)
DROP INDEX IF EXISTS idx_audit_sessions_act_id;

-- Remove the column
ALTER TABLE audit_sessions DROP COLUMN act_id;
```

## Next Steps

After applying this migration:
1. Test creating a new audit session with act selection
2. Verify the act_id is saved correctly
3. Verify old sessions still load (with act_id = NULL)
4. Consider adding a default act_id for existing sessions if needed

## Optional: Set Default Act for Existing Sessions

If you want to set a default act for all existing sessions:

```sql
-- Set all existing sessions to use Factories Act 1948
UPDATE audit_sessions 
SET act_id = 'factories_act_1948'
WHERE act_id IS NULL;
```
