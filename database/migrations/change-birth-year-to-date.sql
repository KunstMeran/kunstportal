-- =====================================================
-- MIGRATION: birth_year -> birth_date
-- Ändert das Geburtsjahr-Feld zu einem vollständigen Geburtsdatum
-- Das Datum wird automatisch aus der Steuernummer (Codice Fiscale) berechnet
-- =====================================================

-- 1. Neue Spalte birth_date hinzufügen
ALTER TABLE members
ADD COLUMN IF NOT EXISTS birth_date DATE;

-- 2. Bestehende birth_year Werte migrieren (als 1. Januar des Jahres)
UPDATE members
SET birth_date = make_date(birth_year, 1, 1)
WHERE birth_year IS NOT NULL AND birth_date IS NULL;

-- 3. Alte Spalte birth_year entfernen (optional - erst nach Überprüfung)
-- ALTER TABLE members DROP COLUMN IF EXISTS birth_year;

-- 4. Kommentar hinzufügen
COMMENT ON COLUMN members.birth_date IS 'Geburtsdatum - wird automatisch aus Steuernummer (Codice Fiscale) berechnet';
