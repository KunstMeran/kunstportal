-- Migration: Fix DATEV Duplicate Constraint v2
-- Datum: 2026-07-29
-- Beschreibung: Erweiterter Unique-Index für Buchungen ohne Dokument-Nr.
--               (z.B. Mitgliedsbeiträge auf Konto 6401550)
--
-- Problem: Buchungen ohne partita_iva und ohne dokument_nr werden als Duplikate erkannt,
--          auch wenn sie von verschiedenen Personen sind.
--
-- Lösung: Erweitere den Index um konto_nr, fornitore_name und beschreibung

-- 1. Alte Constraints/Indices entfernen
DROP INDEX IF EXISTS idx_unique_datev_booking;
ALTER TABLE datev_bookings DROP CONSTRAINT IF EXISTS unique_datev_booking;

-- 2. Neuer erweiterter Index
-- Verwendet mehr Felder für bessere Unterscheidung von Buchungen ohne Dokument-Nr.
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_datev_booking_v2
    ON datev_bookings (
        COALESCE(partita_iva, ''),
        COALESCE(dokument_nr, ''),
        datum,
        betrag,
        COALESCE(konto_nr, ''),
        COALESCE(LEFT(fornitore_name, 50), ''),
        COALESCE(LEFT(beschreibung, 50), '')
    );

-- 3. Kommentar
COMMENT ON INDEX idx_unique_datev_booking_v2 IS
    'Extended unique constraint for DATEV bookings - handles bookings without document number (e.g. member payments)';
