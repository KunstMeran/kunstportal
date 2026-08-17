-- =====================================================
-- Migration: Kostentyp-Felder für DATEV-Buchungen
-- Datum: 2026-08-13
-- Zweck: Kostentyp und Workflow-Status für Rechnungen speichern
-- =====================================================

-- Kostentyp-Felder hinzufügen
ALTER TABLE datev_bookings
ADD COLUMN IF NOT EXISTS kostentyp TEXT,
ADD COLUMN IF NOT EXISTS kostentyp_am DATE,
ADD COLUMN IF NOT EXISTS kostentyp_von UUID REFERENCES users(id);

-- Workflow-Status-Felder hinzufügen
ALTER TABLE datev_bookings
ADD COLUMN IF NOT EXISTS workflow_status TEXT DEFAULT 'neu',
ADD COLUMN IF NOT EXISTS kontrolliert_von UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS kontrolliert_am DATE,
ADD COLUMN IF NOT EXISTS bezahlt_am DATE,
ADD COLUMN IF NOT EXISTS notizen TEXT;

-- Kommentare
COMMENT ON COLUMN datev_bookings.kostentyp IS 'Zugewiesener Kostentyp (z.B. Kuration, Transport, etc.)';
COMMENT ON COLUMN datev_bookings.kostentyp_am IS 'Datum der Kostentyp-Zuweisung';
COMMENT ON COLUMN datev_bookings.kostentyp_von IS 'User der den Kostentyp zugewiesen hat';
COMMENT ON COLUMN datev_bookings.workflow_status IS 'Workflow-Status: neu, kontrolliert, bezahlt';
COMMENT ON COLUMN datev_bookings.kontrolliert_von IS 'User der die Rechnung kontrolliert hat';
COMMENT ON COLUMN datev_bookings.kontrolliert_am IS 'Datum der Kontrolle';
COMMENT ON COLUMN datev_bookings.bezahlt_am IS 'Bezahlt-Datum';
COMMENT ON COLUMN datev_bookings.notizen IS 'Interne Notizen zur Buchung';

-- Index für schnellere Filterung nach Kostentyp
CREATE INDEX IF NOT EXISTS idx_datev_bookings_kostentyp ON datev_bookings(kostentyp);
CREATE INDEX IF NOT EXISTS idx_datev_bookings_workflow_status ON datev_bookings(workflow_status);
