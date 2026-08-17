-- Migration: Workflow-Status Spalten für invoices
-- Damit können auch PDFs ohne DATEV-Verknüpfung einen Status haben
-- Bei Verknüpfung wird der Status synchronisiert

ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS workflow_status TEXT DEFAULT 'neu',
ADD COLUMN IF NOT EXISTS kontrolled_at DATE,
ADD COLUMN IF NOT EXISTS kontrolled_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS paid_at DATE,
ADD COLUMN IF NOT EXISTS paid_by UUID REFERENCES auth.users(id);

-- Index für Status-Filterung
CREATE INDEX IF NOT EXISTS idx_invoices_workflow_status ON invoices(workflow_status);

-- Kommentare
COMMENT ON COLUMN invoices.workflow_status IS 'Status: neu, kontrolliert, bezahlt';
COMMENT ON COLUMN invoices.kontrolled_at IS 'Datum der Kontrolle';
COMMENT ON COLUMN invoices.kontrolled_by IS 'Benutzer der kontrolliert hat';
COMMENT ON COLUMN invoices.paid_at IS 'Datum der Bezahlung';
COMMENT ON COLUMN invoices.paid_by IS 'Benutzer der als bezahlt markiert hat';
