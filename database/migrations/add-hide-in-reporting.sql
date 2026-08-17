-- =====================================================
-- Migration: hide_in_reporting Flag für Projekte
-- Datum: 2026-08-13
-- Zweck: Projekte aus dem Reporting ausblenden (Shop, Strukturkosten etc.)
-- =====================================================

-- Neues Feld für Projekte hinzufügen
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS hide_in_reporting BOOLEAN DEFAULT FALSE;

-- Kommentar
COMMENT ON COLUMN projects.hide_in_reporting IS 'Wenn TRUE, wird das Projekt nicht im Dashboard und Reporting angezeigt (für Shop, Strukturkosten etc.)';

-- Index für schnellere Filterung
CREATE INDEX IF NOT EXISTS idx_projects_hide_in_reporting ON projects(hide_in_reporting);
