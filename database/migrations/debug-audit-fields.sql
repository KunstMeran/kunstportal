-- Debug: Prüfe ob Audit-Felder in den Tabellen existieren und befüllt sind

-- 1. Invoices: Zeige die letzten 10 geänderten Rechnungen mit Audit-Feldern
SELECT
    id,
    invoice_number,
    status,
    created_at,
    created_by,
    updated_at,
    updated_by,
    kontrolled_at,
    kontrolled_by,
    paid_at,
    paid_by
FROM invoices
ORDER BY updated_at DESC NULLS LAST
LIMIT 10;

-- 2. Prüfe ob die Spalten überhaupt existieren
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'invoices'
AND column_name IN ('created_by', 'updated_by', 'updated_at', 'created_at');

-- 3. DATEV Bookings: Zeige die letzten 10 mit Audit-Feldern
SELECT
    id,
    dokument_nr,
    fornitore_name,
    created_at,
    created_by,
    updated_at,
    updated_by
FROM datev_bookings
ORDER BY updated_at DESC NULLS LAST
LIMIT 10;

-- 4. Prüfe ob die Spalten in datev_bookings existieren
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'datev_bookings'
AND column_name IN ('created_by', 'updated_by', 'updated_at', 'created_at');
