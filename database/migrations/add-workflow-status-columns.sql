-- Workflow-Status Spalten für datev_bookings
-- Falls sie noch nicht existieren

ALTER TABLE datev_bookings
ADD COLUMN IF NOT EXISTS workflow_status TEXT DEFAULT 'neu',
ADD COLUMN IF NOT EXISTS kontrolled_at DATE,
ADD COLUMN IF NOT EXISTS kontrolled_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS paid_at DATE,
ADD COLUMN IF NOT EXISTS paid_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS abgabestelle TEXT,
ADD COLUMN IF NOT EXISTS abgabestelle_am DATE;

-- Index für Status-Filterung
CREATE INDEX IF NOT EXISTS idx_datev_bookings_workflow_status ON datev_bookings(workflow_status);

-- Kommentare
COMMENT ON COLUMN datev_bookings.workflow_status IS 'Status: neu, kontrolliert, bezahlt';
COMMENT ON COLUMN datev_bookings.kontrolled_at IS 'Datum der Kontrolle';
COMMENT ON COLUMN datev_bookings.kontrolled_by IS 'Benutzer der kontrolliert hat';
COMMENT ON COLUMN datev_bookings.paid_at IS 'Datum der Bezahlung';
COMMENT ON COLUMN datev_bookings.paid_by IS 'Benutzer der als bezahlt markiert hat';
COMMENT ON COLUMN datev_bookings.abgabestelle IS 'Abgabestelle: gemeinde, region, provinz';
