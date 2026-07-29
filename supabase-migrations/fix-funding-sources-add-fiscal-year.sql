-- Migration: Funding Sources - fiscal_year Spalte hinzufügen
-- Datum: 2026-07-29
-- Beschreibung: Fügt die fehlende fiscal_year Spalte hinzu

-- 1. Spalte hinzufügen (falls nicht vorhanden)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'funding_sources' AND column_name = 'fiscal_year'
    ) THEN
        ALTER TABLE funding_sources ADD COLUMN fiscal_year INTEGER;

        -- Default-Wert für bestehende Einträge setzen (aktuelles Jahr)
        UPDATE funding_sources SET fiscal_year = EXTRACT(YEAR FROM created_at)::INTEGER WHERE fiscal_year IS NULL;

        -- NOT NULL Constraint hinzufügen
        ALTER TABLE funding_sources ALTER COLUMN fiscal_year SET NOT NULL;

        -- Default für neue Einträge
        ALTER TABLE funding_sources ALTER COLUMN fiscal_year SET DEFAULT EXTRACT(YEAR FROM NOW())::INTEGER;
    END IF;
END $$;

-- 2. Index erstellen (falls nicht vorhanden)
CREATE INDEX IF NOT EXISTS idx_funding_sources_year ON funding_sources(fiscal_year);

-- 3. Unique Constraint prüfen/erstellen
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'funding_sources_code_fiscal_year_key'
    ) THEN
        -- Erst prüfen ob code existiert
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'funding_sources' AND column_name = 'code'
        ) THEN
            ALTER TABLE funding_sources ADD CONSTRAINT funding_sources_code_fiscal_year_key UNIQUE(code, fiscal_year);
        END IF;
    END IF;
END $$;
