-- =====================================================
-- Migration: Kursanbieter-Flag fuer Lieferanten
-- Datum: 2026-08-17
-- Zweck: Lieferanten koennen als Kursanbieter markiert werden
-- =====================================================

-- 1. is_kursanbieter Flag zur suppliers Tabelle hinzufuegen
ALTER TABLE suppliers
ADD COLUMN IF NOT EXISTS is_kursanbieter BOOLEAN DEFAULT false;

COMMENT ON COLUMN suppliers.is_kursanbieter IS 'Wenn true, kann dieser Lieferant als Kursanbieter verwendet werden';

-- Index fuer schnellere Filterung
CREATE INDEX IF NOT EXISTS idx_suppliers_kursanbieter ON suppliers(is_kursanbieter) WHERE is_kursanbieter = true;

-- 2. kurse-Tabelle anpassen: anbieter_id verweist auf suppliers statt kurs_anbieter
-- Zuerst pruefen ob die alte Referenz existiert und ggf. entfernen
DO $$
BEGIN
    -- Alte FK entfernen falls vorhanden
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'kurse_anbieter_id_fkey'
        AND table_name = 'kurse'
    ) THEN
        ALTER TABLE kurse DROP CONSTRAINT kurse_anbieter_id_fkey;
    END IF;
END $$;

-- Neue FK auf suppliers setzen (BIGINT, da suppliers.id BIGSERIAL ist)
-- Nur wenn die Spalte noch nicht auf suppliers verweist
DO $$
BEGIN
    -- FK hinzufuegen
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
        WHERE tc.table_name = 'kurse'
        AND tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_name = 'suppliers'
        AND ccu.column_name = 'id'
    ) THEN
        ALTER TABLE kurse
        ADD CONSTRAINT kurse_anbieter_supplier_fkey
        FOREIGN KEY (anbieter_id) REFERENCES suppliers(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. View fuer Kursanbieter erstellen
CREATE OR REPLACE VIEW v_kursanbieter AS
SELECT
    id,
    fornitore_name as name,
    email,
    phone as telefon,
    address as adresse
FROM suppliers
WHERE is_kursanbieter = true
ORDER BY fornitore_name;

COMMENT ON VIEW v_kursanbieter IS 'Lieferanten die als Kursanbieter markiert sind';
