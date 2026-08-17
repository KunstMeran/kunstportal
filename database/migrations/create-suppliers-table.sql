-- Migration: Create suppliers table
-- Date: 2026-07-10
-- Purpose: Store supplier information imported from separate Excel export

-- Create suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
    id BIGSERIAL PRIMARY KEY,

    -- Supplier data
    partita_iva TEXT UNIQUE NOT NULL,
    fornitore_nr TEXT,
    fornitore_name TEXT NOT NULL,
    codice_fiscale TEXT,

    -- Additional info (can be extended)
    address TEXT,
    city TEXT,
    country TEXT DEFAULT 'IT',
    email TEXT,
    phone TEXT,

    -- Import tracking
    import_date TIMESTAMPTZ DEFAULT NOW(),
    import_file_name TEXT,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_suppliers_partita_iva ON suppliers(partita_iva);
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(fornitore_name);

-- RLS policies
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view suppliers" ON suppliers;
CREATE POLICY "Users can view suppliers"
ON suppliers FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Users can insert suppliers" ON suppliers;
CREATE POLICY "Users can insert suppliers"
ON suppliers FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update suppliers" ON suppliers;
CREATE POLICY "Users can update suppliers"
ON suppliers FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_suppliers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_update_suppliers_updated_at ON suppliers;
CREATE TRIGGER trigger_update_suppliers_updated_at
    BEFORE UPDATE ON suppliers
    FOR EACH ROW
    EXECUTE FUNCTION update_suppliers_updated_at();

-- Comment on table
COMMENT ON TABLE suppliers IS 'Supplier master data imported from DATEV supplier export';
COMMENT ON COLUMN suppliers.partita_iva IS 'Unique Italian VAT ID (Partita IVA)';
