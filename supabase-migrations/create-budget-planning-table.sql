-- Migration: Budget-Planung
-- Datum: 2026-07-29
-- Beschreibung: Tabellen für monatliche Budgetplanung nach Bilanzkonten und Projekten

-- 1. Budget-Einträge Tabelle (pro Konto, monatlich)
CREATE TABLE IF NOT EXISTS budget_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Zuordnung
    konto_nr TEXT NOT NULL,                        -- Bilanzkonto (z.B. "6401550")
    konto_name TEXT,                               -- Bezeichnung des Kontos
    projekt_id UUID REFERENCES projects(id) ON DELETE SET NULL,  -- Optional: Projekt-Zuordnung

    -- Budget-Details
    description TEXT NOT NULL,                     -- Beschreibung der Ausgabe
    fiscal_year INTEGER NOT NULL,                  -- Jahr

    -- Monatliche Beträge (Budget/Forecast)
    jan DECIMAL(12,2) DEFAULT 0,
    feb DECIMAL(12,2) DEFAULT 0,
    mar DECIMAL(12,2) DEFAULT 0,
    apr DECIMAL(12,2) DEFAULT 0,
    mai DECIMAL(12,2) DEFAULT 0,
    jun DECIMAL(12,2) DEFAULT 0,
    jul DECIMAL(12,2) DEFAULT 0,
    aug DECIMAL(12,2) DEFAULT 0,
    sep DECIMAL(12,2) DEFAULT 0,
    okt DECIMAL(12,2) DEFAULT 0,
    nov DECIMAL(12,2) DEFAULT 0,
    dez DECIMAL(12,2) DEFAULT 0,

    -- Typ: budget oder forecast
    entry_type TEXT DEFAULT 'budget' CHECK (entry_type IN ('budget', 'forecast')),

    -- Notizen
    notes TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- 2. Budget-Notizen Tabelle (pro Jahr)
CREATE TABLE IF NOT EXISTS budget_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fiscal_year INTEGER NOT NULL UNIQUE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- 3. Indizes
CREATE INDEX IF NOT EXISTS idx_budget_entries_year ON budget_entries(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_budget_entries_konto ON budget_entries(konto_nr);
CREATE INDEX IF NOT EXISTS idx_budget_entries_projekt ON budget_entries(projekt_id);
CREATE INDEX IF NOT EXISTS idx_budget_entries_type ON budget_entries(entry_type);

-- 4. RLS aktivieren
ALTER TABLE budget_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_notes ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies für budget_entries
CREATE POLICY "Users can view budget_entries"
    ON budget_entries FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can insert budget_entries"
    ON budget_entries FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Users can update budget_entries"
    ON budget_entries FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Users can delete budget_entries"
    ON budget_entries FOR DELETE
    TO authenticated
    USING (true);

-- 6. RLS Policies für budget_notes
CREATE POLICY "Users can view budget_notes"
    ON budget_notes FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can insert budget_notes"
    ON budget_notes FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Users can update budget_notes"
    ON budget_notes FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 7. Trigger für updated_at
CREATE OR REPLACE FUNCTION update_budget_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_budget_entries_updated_at ON budget_entries;
CREATE TRIGGER trigger_budget_entries_updated_at
    BEFORE UPDATE ON budget_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_budget_entries_updated_at();

-- Kommentare
COMMENT ON TABLE budget_entries IS 'Monatliche Budget-Planung nach Bilanzkonten';
COMMENT ON TABLE budget_notes IS 'Notizen zur Budgetplanung pro Jahr';
COMMENT ON COLUMN budget_entries.entry_type IS 'budget = geplantes Budget, forecast = aktuelle Prognose';
