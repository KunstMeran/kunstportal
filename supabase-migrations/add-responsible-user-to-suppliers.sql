-- Migration: Add responsible user to suppliers
-- Date: 2026-08-01
-- Purpose: Allow assigning a responsible user to each supplier

-- Add responsible_user_id column to suppliers table
ALTER TABLE suppliers
ADD COLUMN IF NOT EXISTS responsible_user_id UUID REFERENCES auth.users(id);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_suppliers_responsible_user ON suppliers(responsible_user_id);

-- Comment
COMMENT ON COLUMN suppliers.responsible_user_id IS 'User responsible for this supplier';
