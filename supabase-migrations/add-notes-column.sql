-- Migration: Add notes column to invoices table
-- Date: 2026-07-10
-- Purpose: Enable users to add notes to invoices

-- Add notes column to invoices table
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add comment to column
COMMENT ON COLUMN invoices.notes IS 'Internal notes for the invoice';
