-- Archivierungsfunktion für datev_bookings
-- Füge archived und archived_at Spalten hinzu

ALTER TABLE datev_bookings
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- Index für schnelles Filtern
CREATE INDEX IF NOT EXISTS idx_datev_bookings_archived ON datev_bookings(archived);

-- Kommentar
COMMENT ON COLUMN datev_bookings.archived IS 'Ob die Buchung archiviert/gelöscht wurde';
COMMENT ON COLUMN datev_bookings.archived_at IS 'Zeitpunkt der Archivierung';
