-- Migration: Fix DATEV Duplicate Constraint
-- Datum: 2026-07-29
-- Beschreibung: Verbessert die Duplikat-Erkennung für DATEV-Buchungen
--               Verwendet COALESCE für NULL-Werte in partita_iva

-- 1. Alte Constraint entfernen
ALTER TABLE datev_bookings DROP CONSTRAINT IF EXISTS unique_datev_booking;

-- 2. Neue Constraint mit COALESCE für NULL-Werte
-- Dies behandelt partita_iva = NULL als leeren String für Duplikat-Prüfung
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_datev_booking
    ON datev_bookings (COALESCE(partita_iva, ''), dokument_nr, datum, betrag);

-- 3. Kommentar
COMMENT ON INDEX idx_unique_datev_booking IS 'Prevents duplicate DATEV bookings, treats NULL partita_iva as empty string';
