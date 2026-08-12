-- Migration: Mehrere Mitglieder pro DATEV-Buchung erlauben
-- Datum: 2026-08-03
-- Beschreibung: Paare zahlen oft zusammen, daher soll eine Buchung
--               mehreren Mitgliedern zugeordnet werden können

-- 1. Alte Unique Constraint entfernen
ALTER TABLE member_payments
    DROP CONSTRAINT IF EXISTS member_payments_member_id_year_key;

-- 2. Neue Constraint hinzufügen: Ein Mitglied kann pro Jahr nur EINE Zahlung haben,
--    aber die gleiche datev_buchung_id kann mehreren Mitgliedern zugeordnet werden
ALTER TABLE member_payments
    ADD CONSTRAINT member_payments_member_year_unique
    UNIQUE (member_id, year);

-- HINWEIS: Diese Constraint ist gleich wie vorher!
-- Der Unterschied ist nur in der Anwendungslogik:
-- Wenn ein Paar gemeinsam zahlt, wird der Betrag aufgeteilt
-- und jedes Mitglied bekommt einen eigenen Eintrag mit der halben Summe
-- aber der gleichen datev_buchung_id als Referenz

-- Beispiel:
-- Buchung: 180€ (Paar zahlt zusammen)
-- Mitglied A: 90€, datev_buchung_id = 'xyz'
-- Mitglied B: 90€, datev_buchung_id = 'xyz'

-- Index für schnelle Abfragen nach datev_buchung_id
CREATE INDEX IF NOT EXISTS idx_member_payments_datev_buchung
    ON member_payments(datev_buchung_id);
