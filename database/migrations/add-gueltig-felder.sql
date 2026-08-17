-- =====================================================
-- Migration: Gültigkeitszeitraum für Kategorien + Tageszeit für Eintritte
-- Datum: 2026-08-13
-- Zweck: Gültig ab/bis Felder für Kategorien, Tageszeit für Besucheranalyse
-- =====================================================

-- Eintritts-Kategorien: Gültigkeitszeitraum hinzufügen
ALTER TABLE shop_eintritt_kategorien
ADD COLUMN IF NOT EXISTS gueltig_ab DATE,
ADD COLUMN IF NOT EXISTS gueltig_bis DATE;

-- Mitglieds-Kategorien: Gültigkeitszeitraum hinzufügen
ALTER TABLE shop_mitglied_kategorien
ADD COLUMN IF NOT EXISTS gueltig_ab DATE,
ADD COLUMN IF NOT EXISTS gueltig_bis DATE;

-- Verkäufe: Tageszeit für Besucherstatistik (Vormittag/Nachmittag)
ALTER TABLE shop_verkaeufe
ADD COLUMN IF NOT EXISTS tageszeit VARCHAR(20);

-- Kommentare
COMMENT ON COLUMN shop_eintritt_kategorien.gueltig_ab IS 'Preis gültig ab diesem Datum';
COMMENT ON COLUMN shop_eintritt_kategorien.gueltig_bis IS 'Preis gültig bis zu diesem Datum (NULL = unbegrenzt)';
COMMENT ON COLUMN shop_mitglied_kategorien.gueltig_ab IS 'Beitrag gültig ab diesem Datum';
COMMENT ON COLUMN shop_mitglied_kategorien.gueltig_bis IS 'Beitrag gültig bis zu diesem Datum (NULL = unbegrenzt)';
COMMENT ON COLUMN shop_verkaeufe.tageszeit IS 'Tageszeit des Eintritts (vormittag, nachmittag)';
