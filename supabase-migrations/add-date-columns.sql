-- Migration: Add separate date columns for registrazione and documento
-- Date: 2026-08-01
-- Purpose: Store both dates from DATEV export for accurate reporting

-- Add new date columns
ALTER TABLE datev_bookings
ADD COLUMN IF NOT EXISTS datum_registrazione DATE,
ADD COLUMN IF NOT EXISTS datum_documento DATE,
ADD COLUMN IF NOT EXISTS datum_competenza DATE,
ADD COLUMN IF NOT EXISTS konto_nr TEXT;

-- Create index for konto_nr
CREATE INDEX IF NOT EXISTS idx_datev_bookings_konto ON datev_bookings(konto_nr);

-- Comment on new columns
COMMENT ON COLUMN datev_bookings.datum_registrazione IS 'Data registrazione - Buchungsdatum (primary date for reporting)';
COMMENT ON COLUMN datev_bookings.datum_documento IS 'Data documento - Rechnungsdatum';
COMMENT ON COLUMN datev_bookings.datum_competenza IS 'Data competenza bilancio - Bilanzdatum';
COMMENT ON COLUMN datev_bookings.konto_nr IS 'Conto - Buchhaltungskonto (z.B. 6901201)';

-- Update existing records: copy datum to datum_registrazione
UPDATE datev_bookings
SET datum_registrazione = datum
WHERE datum_registrazione IS NULL;
