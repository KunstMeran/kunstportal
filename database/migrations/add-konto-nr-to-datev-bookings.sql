-- Migration: Add konto_nr to datev_bookings and fix fornitore_nr
-- Date: 2026-07-10
-- Purpose: Separate accounting account number (Conto) from supplier number

-- Add konto_nr column for accounting account
ALTER TABLE datev_bookings
ADD COLUMN IF NOT EXISTS konto_nr TEXT;

-- Add comment
COMMENT ON COLUMN datev_bookings.konto_nr IS 'Accounting account number (Conto from DATEV)';
COMMENT ON COLUMN datev_bookings.fornitore_nr IS 'Supplier number (from suppliers table)';

-- Optional: Copy existing fornitore_nr to konto_nr if needed
-- UPDATE datev_bookings SET konto_nr = fornitore_nr WHERE konto_nr IS NULL;
