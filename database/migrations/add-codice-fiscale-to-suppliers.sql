-- Migration: Add codice_fiscale to suppliers table
-- Date: 2026-07-10
-- Purpose: Support for artists with only Codice Fiscale (without Partita IVA)

-- Add codice_fiscale column if not exists
ALTER TABLE suppliers
ADD COLUMN IF NOT EXISTS codice_fiscale TEXT;

-- Add comment
COMMENT ON COLUMN suppliers.codice_fiscale IS 'Italian Codice Fiscale for individuals/artists without Partita IVA';

-- Update country default if not set
ALTER TABLE suppliers
ALTER COLUMN country SET DEFAULT 'IT';
