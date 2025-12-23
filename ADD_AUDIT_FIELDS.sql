-- Add audit_types (array) and total_factories columns to clients table
-- Run this in Supabase SQL Editor

-- Add audit_types column as TEXT array to support multiple audit selections
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS audit_types TEXT[] DEFAULT ARRAY['regulatory']::TEXT[];

-- Add total_factories column
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS total_factories INTEGER DEFAULT 1 CHECK (total_factories > 0);

-- Add comment for documentation
COMMENT ON COLUMN clients.audit_types IS 'Array of audit types opted by client: regulatory (labour laws, environmental) and/or business (contract compliance)';
COMMENT ON COLUMN clients.total_factories IS 'Number of factories the client has enrolled for auditing';

-- Migrate existing audit_type (singular) to audit_types (array) if column exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'audit_type') THEN
    UPDATE clients 
    SET audit_types = ARRAY[audit_type]::TEXT[]
    WHERE audit_type IS NOT NULL AND (audit_types IS NULL OR array_length(audit_types, 1) IS NULL);
  END IF;
END $$;

-- Update existing clients to have default values if needed
UPDATE clients 
SET audit_types = ARRAY['regulatory']::TEXT[], total_factories = 1 
WHERE (audit_types IS NULL OR array_length(audit_types, 1) IS NULL) OR total_factories IS NULL;

-- Optional: Drop old audit_type column after migration (uncomment if you want to remove it)
-- ALTER TABLE clients DROP COLUMN IF EXISTS audit_type;
