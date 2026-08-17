-- ============================================
-- Performance Indexes für Kunsthaus Meran
-- Ausführen im Supabase SQL Editor
-- ============================================

-- ============================================
-- DATEV_BOOKINGS Indexes
-- ============================================

-- Index für archived-Filter (wird bei fast jeder Abfrage verwendet)
CREATE INDEX IF NOT EXISTS idx_datev_bookings_archived
ON datev_bookings (archived)
WHERE archived IS NULL OR archived = false;

-- Index für Datum-Sortierung (häufigste Sortierung)
CREATE INDEX IF NOT EXISTS idx_datev_bookings_datum_desc
ON datev_bookings (datum DESC);

-- Index für Konto-Abfragen (Bilanz/GuV)
CREATE INDEX IF NOT EXISTS idx_datev_bookings_konto_nr
ON datev_bookings (konto_nr);

-- Index für Projekt-Filter
CREATE INDEX IF NOT EXISTS idx_datev_bookings_projekt_id
ON datev_bookings (projekt_id);

-- Kombinierter Index für häufige Filter-Kombination
CREATE INDEX IF NOT EXISTS idx_datev_bookings_archived_datum
ON datev_bookings (archived, datum DESC)
WHERE archived IS NULL OR archived = false;

-- Index für Lieferanten-Suche
CREATE INDEX IF NOT EXISTS idx_datev_bookings_partita_iva
ON datev_bookings (partita_iva);

-- Index für Import-Jahr (für Jahresfilter)
CREATE INDEX IF NOT EXISTS idx_datev_bookings_import_year
ON datev_bookings (import_year);

-- ============================================
-- INVOICES Indexes
-- ============================================

-- Index für linked_booking_id (Verknüpfungs-Abfragen)
CREATE INDEX IF NOT EXISTS idx_invoices_linked_booking_id
ON invoices (linked_booking_id);

-- Index für Upload-Datum Sortierung
CREATE INDEX IF NOT EXISTS idx_invoices_uploaded_at_desc
ON invoices (uploaded_at DESC);

-- Index für Partita IVA (Lieferanten-Zuordnung)
CREATE INDEX IF NOT EXISTS idx_invoices_partita_iva
ON invoices (partita_iva);

-- Index für archived-Filter
CREATE INDEX IF NOT EXISTS idx_invoices_archived
ON invoices (archived)
WHERE archived IS NULL OR archived = false;

-- ============================================
-- BUDGET_ENTRIES Indexes
-- ============================================

-- Index für Geschäftsjahr
CREATE INDEX IF NOT EXISTS idx_budget_entries_fiscal_year
ON budget_entries (fiscal_year);

-- Index für Konto-Nummer
CREATE INDEX IF NOT EXISTS idx_budget_entries_konto_nr
ON budget_entries (konto_nr);

-- Kombinierter Index
CREATE INDEX IF NOT EXISTS idx_budget_entries_year_konto
ON budget_entries (fiscal_year, konto_nr);

-- ============================================
-- CHART_OF_ACCOUNTS Indexes
-- ============================================

-- Index für Konto-Pattern Suche
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_konto_pattern
ON chart_of_accounts (konto_pattern);

-- Index für DB-Zuordnung (Kosten/Erlöse Filter)
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_db_zuordnung
ON chart_of_accounts (db_zuordnung);

-- ============================================
-- SUPPLIERS Indexes
-- ============================================

-- Index für Partita IVA (bereits unique, aber explizit für Performance)
CREATE INDEX IF NOT EXISTS idx_suppliers_partita_iva
ON suppliers (partita_iva);

-- ============================================
-- Statistik aktualisieren
-- ============================================
ANALYZE datev_bookings;
ANALYZE invoices;
ANALYZE budget_entries;
ANALYZE chart_of_accounts;
ANALYZE suppliers;

-- ============================================
-- Fertig!
-- Die Indexes sollten die Abfragen deutlich beschleunigen.
-- ============================================
