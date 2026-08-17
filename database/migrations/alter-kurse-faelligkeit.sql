-- =====================================================
-- Migration: Kurse - Faelligkeitsdatum statt Gueltigkeit
-- Datum: 2026-08-17
-- Zweck: Einfaches Datum statt Monate + Erinnerung
-- =====================================================

-- Neues Feld hinzufuegen
ALTER TABLE kurse
ADD COLUMN IF NOT EXISTS faelligkeit_datum DATE;

COMMENT ON COLUMN kurse.faelligkeit_datum IS 'Optionales Faelligkeitsdatum fuer den Kurs';

-- Alte Felder koennen bleiben (fuer Rueckwaertskompatibilitaet)
-- oder geloescht werden wenn nicht mehr benoetigt:
-- ALTER TABLE kurse DROP COLUMN IF EXISTS gueltigkeit_monate;
-- ALTER TABLE kurse DROP COLUMN IF EXISTS erinnerung_tage;
