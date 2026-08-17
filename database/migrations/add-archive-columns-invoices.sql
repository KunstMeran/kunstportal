-- Archivierungsfunktion für invoices Tabelle
-- Füge archived und archived_at Spalten hinzu (falls noch nicht vorhanden)

ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- Index für schnelles Filtern
CREATE INDEX IF NOT EXISTS idx_invoices_archived ON invoices(archived);

-- Kommentar
COMMENT ON COLUMN invoices.archived IS 'Ob die Rechnung archiviert/gelöscht wurde';
COMMENT ON COLUMN invoices.archived_at IS 'Zeitpunkt der Archivierung';
