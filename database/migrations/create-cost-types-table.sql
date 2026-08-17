-- Migration: Kostentypen-Tabelle mit RLS Policies
-- Datum: 2026-07-29
-- Beschreibung: Erstellt die cost_types Tabelle und aktiviert Row Level Security

-- 1. Tabelle erstellen (falls noch nicht vorhanden)
CREATE TABLE IF NOT EXISTS cost_types (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. RLS aktivieren
ALTER TABLE cost_types ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies hinzufügen
CREATE POLICY "Users can view cost_types"
    ON cost_types FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can insert cost_types"
    ON cost_types FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Users can update cost_types"
    ON cost_types FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Users can delete cost_types"
    ON cost_types FOR DELETE
    TO authenticated
    USING (true);
