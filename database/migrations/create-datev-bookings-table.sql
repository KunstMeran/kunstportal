-- Migration: Create datev_bookings table
-- Date: 2026-07-10
-- Purpose: Store DATEV bookings imported from Excel exports

-- Create datev_bookings table
CREATE TABLE IF NOT EXISTS datev_bookings (
    id BIGSERIAL PRIMARY KEY,

    -- Import tracking
    import_year INTEGER NOT NULL,
    import_month INTEGER,
    import_date TIMESTAMPTZ DEFAULT NOW(),
    import_file_name TEXT,

    -- DATEV data
    partita_iva TEXT,
    partita_iva_cliente TEXT,
    fornitore_nr TEXT,
    fornitore_name TEXT NOT NULL,
    dokument_nr TEXT NOT NULL,
    dokument_typ TEXT,
    ist_gutschrift BOOLEAN DEFAULT FALSE,

    -- Beträge
    betrag DECIMAL(12, 2),
    betrag_netto DECIMAL(12, 2),
    betrag_mwst DECIMAL(12, 2),
    betrag_gesamt DECIMAL(12, 2),
    mwst_typ TEXT,

    -- Datum und Details
    datum DATE NOT NULL,
    projekt_id TEXT,
    beschreibung TEXT,
    kategorie TEXT,

    -- Linked invoice
    linked_invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Unique constraint to prevent duplicates
    CONSTRAINT unique_datev_booking UNIQUE (partita_iva, dokument_nr, datum, betrag)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_datev_bookings_year ON datev_bookings(import_year);
CREATE INDEX IF NOT EXISTS idx_datev_bookings_date ON datev_bookings(datum);
CREATE INDEX IF NOT EXISTS idx_datev_bookings_projekt ON datev_bookings(projekt_id);
CREATE INDEX IF NOT EXISTS idx_datev_bookings_partita ON datev_bookings(partita_iva, dokument_nr);

-- RLS policies
ALTER TABLE datev_bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view datev bookings" ON datev_bookings;
CREATE POLICY "Users can view datev bookings"
ON datev_bookings FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Users can insert datev bookings" ON datev_bookings;
CREATE POLICY "Users can insert datev bookings"
ON datev_bookings FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update datev bookings" ON datev_bookings;
CREATE POLICY "Users can update datev bookings"
ON datev_bookings FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_datev_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_update_datev_bookings_updated_at ON datev_bookings;
CREATE TRIGGER trigger_update_datev_bookings_updated_at
    BEFORE UPDATE ON datev_bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_datev_bookings_updated_at();

-- Comment on table
COMMENT ON TABLE datev_bookings IS 'DATEV bookings imported from Excel exports with duplicate prevention';
COMMENT ON COLUMN datev_bookings.import_year IS 'Year of the import (used for filtering existing data)';
COMMENT ON COLUMN datev_bookings.import_month IS 'Optional month of the import';
COMMENT ON CONSTRAINT unique_datev_booking ON datev_bookings IS 'Prevents duplicate imports of the same booking';
