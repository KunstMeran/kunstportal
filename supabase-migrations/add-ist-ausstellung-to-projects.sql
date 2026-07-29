-- Migration: ist_ausstellung Flag für Projekte
-- Datum: 2026-07-29
-- Beschreibung: Fügt Flag hinzu um Ausstellungsprojekte von Verwaltungsprojekten zu unterscheiden

-- 1. Spalte hinzufügen
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS ist_ausstellung BOOLEAN DEFAULT true;

-- 2. Kommentar
COMMENT ON COLUMN projects.ist_ausstellung IS 'true = Ausstellungsprojekt (wird in DB-Rechnung berücksichtigt), false = Verwaltung/Allgemein';

-- 3. Index für Filterung
CREATE INDEX IF NOT EXISTS idx_projects_ist_ausstellung ON projects(ist_ausstellung) WHERE ist_ausstellung = true;
