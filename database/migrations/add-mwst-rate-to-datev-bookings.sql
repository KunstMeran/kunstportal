-- Migration: Add mwst_rate column to datev_bookings for VAT rate per invoice
-- Date: 2026-07-31
-- Description: Allows storing VAT rate per booking, default 22% (Italian standard)

-- Add mwst_rate column (stored as decimal, e.g. 22 for 22%)
ALTER TABLE datev_bookings
ADD COLUMN IF NOT EXISTS mwst_rate DECIMAL(5,2) DEFAULT 22;

-- Update existing records to have 22% as default
UPDATE datev_bookings
SET mwst_rate = 22
WHERE mwst_rate IS NULL;

-- Add comment
COMMENT ON COLUMN datev_bookings.mwst_rate IS 'VAT rate in percent (e.g. 22 for 22%, 10 for 10%, 0 for exempt)';
