-- Migration: Add fornitore_name column to invoices table
-- Date: 2026-08-01
-- Purpose: Allow storing supplier name for invoice-only rows (not linked to DATEV bookings)

-- Add fornitore_name column to invoices table
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS fornitore_name TEXT;

-- Add comment to column
COMMENT ON COLUMN invoices.fornitore_name IS 'Supplier/vendor name for the invoice';

-- Create index for faster lookups (optional, for autocomplete)
CREATE INDEX IF NOT EXISTS idx_invoices_fornitore_name ON invoices(fornitore_name);
