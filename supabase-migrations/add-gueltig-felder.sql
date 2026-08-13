-- =====================================================
-- Migration: Gültigkeitszeitraum für Kategorien hinzufügen
-- Datum: 2026-08-13
-- Zweck: Gültig ab/bis Felder für Eintritts- und Mitglieds-Kategorien
-- =====================================================

-- Eintritts-Kategorien: Gültigkeitszeitraum hinzufügen
ALTER TABLE shop_eintritt_kategorien
ADD COLUMN IF NOT EXISTS gueltig_ab DATE,
ADD COLUMN IF NOT EXISTS gueltig_bis DATE;

-- Mitglieds-Kategorien: Gültigkeitszeitraum hinzufügen
ALTER TABLE shop_mitglied_kategorien
ADD COLUMN IF NOT EXISTS gueltig_ab DATE,
ADD COLUMN IF NOT EXISTS gueltig_bis DATE;

-- Kommentare
COMMENT ON COLUMN shop_eintritt_kategorien.gueltig_ab IS 'Preis gültig ab diesem Datum';
COMMENT ON COLUMN shop_eintritt_kategorien.gueltig_bis IS 'Preis gültig bis zu diesem Datum (NULL = unbegrenzt)';
COMMENT ON COLUMN shop_mitglied_kategorien.gueltig_ab IS 'Beitrag gültig ab diesem Datum';
COMMENT ON COLUMN shop_mitglied_kategorien.gueltig_bis IS 'Beitrag gültig bis zu diesem Datum (NULL = unbegrenzt)';
