-- Delete all existing clients from the database
-- Run this in Supabase SQL Editor to start with a clean slate

-- First, delete all audit sessions that reference clients
DELETE FROM audit_sessions;

-- Now delete all clients
DELETE FROM clients;

-- Verify deletion
SELECT COUNT(*) as remaining_clients FROM clients;
SELECT COUNT(*) as remaining_sessions FROM audit_sessions;
