-- Migration: Budget-Konto-Notizen pro Jahr
-- Datum: 2026-07-31
-- Beschreibung: Ermöglicht Notizen pro Konto und Jahr in der Budgetplanung

-- Tabelle für Konto-Notizen (pro Konto pro Jahr)
CREATE TABLE IF NOT EXISTS budget_konto_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    konto_nr TEXT NOT NULL,                     -- Kontonummer/Kategorie
    fiscal_year INTEGER NOT NULL,               -- Jahr
    notes TEXT,                                 -- Notiz
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),

    -- Eindeutig pro Konto und Jahr
    CONSTRAINT unique_konto_year UNIQUE (konto_nr, fiscal_year)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_budget_konto_notes_year ON budget_konto_notes(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_budget_konto_notes_konto ON budget_konto_notes(konto_nr);

-- RLS aktivieren
ALTER TABLE budget_konto_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view budget_konto_notes"
    ON budget_konto_notes FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can insert budget_konto_notes"
    ON budget_konto_notes FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Users can update budget_konto_notes"
    ON budget_konto_notes FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Users can delete budget_konto_notes"
    ON budget_konto_notes FOR DELETE
    TO authenticated
    USING (true);

-- Trigger für updated_at
CREATE OR REPLACE FUNCTION update_budget_konto_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_budget_konto_notes_updated_at ON budget_konto_notes;
CREATE TRIGGER trigger_budget_konto_notes_updated_at
    BEFORE UPDATE ON budget_konto_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_budget_konto_notes_updated_at();

-- Kommentar
COMMENT ON TABLE budget_konto_notes IS 'Notizen pro Bilanzkonto und Jahr für Budgetplanung';
