-- =====================================================
-- Migration: Berechtigung "Rechnungen als bezahlt markieren"
-- Datum: 2026-08-13
-- Zweck: Separate Berechtigung für das Markieren von Rechnungen als bezahlt
-- =====================================================

-- Neues Feld für Workspaces hinzufügen
ALTER TABLE workspaces
ADD COLUMN IF NOT EXISTS access_rechnungen_bezahlt BOOLEAN DEFAULT FALSE;

-- Kommentar
COMMENT ON COLUMN workspaces.access_rechnungen_bezahlt IS 'Berechtigung zum Markieren von Rechnungen als bezahlt';
