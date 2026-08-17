-- Migration: Einnahmeplanung / Funding Sources (Abgabestellen)
-- Datum: 2026-07-29
-- Beschreibung: Erstellt die funding_sources Tabelle für Einnahmeplanung mit Abgabestellen-Funktion

-- 1. Tabelle erstellen
CREATE TABLE IF NOT EXISTS funding_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL,                          -- z.B. "2026-01"
    name TEXT NOT NULL,                          -- z.B. "Förderung Gemeinde Webseite"
    source TEXT,                                 -- Geldgeber z.B. "Gemeinde Meran"
    amount DECIMAL(12,2) NOT NULL DEFAULT 0,     -- Budgetierter Betrag
    fiscal_year INTEGER NOT NULL,                -- Geschäftsjahr
    is_abgabestelle BOOLEAN DEFAULT false,       -- Als Abgabestelle bei Rechnungen verwendbar?
    status TEXT DEFAULT 'offen',                 -- zugesagt, beantragt, offen, abgelehnt
    notes TEXT,                                  -- Notizen
    document_path TEXT,                          -- Pfad zu hinterlegtem Dokument
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),

    UNIQUE(code, fiscal_year)                    -- Code muss pro Jahr eindeutig sein
);

-- 2. Index für schnelle Abfragen
CREATE INDEX IF NOT EXISTS idx_funding_sources_year ON funding_sources(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_funding_sources_abgabestelle ON funding_sources(is_abgabestelle) WHERE is_abgabestelle = true;

-- 3. RLS aktivieren
ALTER TABLE funding_sources ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
CREATE POLICY "Users can view funding_sources"
    ON funding_sources FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can insert funding_sources"
    ON funding_sources FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Users can update funding_sources"
    ON funding_sources FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Users can delete funding_sources"
    ON funding_sources FOR DELETE
    TO authenticated
    USING (true);

-- 5. Invoices-Tabelle erweitern: Abgabestelle-Referenz hinzufügen
-- (Falls die Spalte noch nicht existiert)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'invoices' AND column_name = 'funding_source_id'
    ) THEN
        ALTER TABLE invoices ADD COLUMN funding_source_id UUID REFERENCES funding_sources(id);
    END IF;
END $$;

-- 6. Trigger für updated_at
CREATE OR REPLACE FUNCTION update_funding_sources_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_funding_sources_updated_at ON funding_sources;
CREATE TRIGGER trigger_funding_sources_updated_at
    BEFORE UPDATE ON funding_sources
    FOR EACH ROW
    EXECUTE FUNCTION update_funding_sources_updated_at();
