-- =====================================================
-- Migration: Shop Publikations-Ausgaben
-- Datum: 2026-08-17
-- Zweck: Erfassung von Artikelausgaben an Mitarbeiter/Externe
-- =====================================================

-- 1. Externe Empfaenger Tabelle (fuer Plus-Button)
CREATE TABLE IF NOT EXISTS shop_externe_empfaenger (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    notiz TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Haupt-Tabelle: Shop-Ausgaben
CREATE TABLE IF NOT EXISTS shop_ausgaben (
    id BIGSERIAL PRIMARY KEY,
    datum DATE NOT NULL DEFAULT CURRENT_DATE,
    uhrzeit TIME DEFAULT CURRENT_TIME,

    -- Artikel-Referenz
    artikel_id BIGINT NOT NULL REFERENCES shop_artikel(id),
    menge INT NOT NULL DEFAULT 1,

    -- Empfaenger-Typ: 'mitarbeiter' oder 'extern'
    empfaenger_typ VARCHAR(20) NOT NULL CHECK (empfaenger_typ IN ('mitarbeiter', 'extern')),

    -- Bei Mitarbeiter: Referenz auf users-Tabelle
    empfaenger_user_id UUID REFERENCES public.users(id),

    -- Bei Externem: Referenz auf externe_empfaenger oder direkte Daten
    empfaenger_extern_id BIGINT REFERENCES shop_externe_empfaenger(id),
    empfaenger_extern_name VARCHAR(255),
    empfaenger_extern_notiz TEXT,

    -- Zweck/Anlass der Ausgabe
    zweck TEXT,

    -- Audit-Felder
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraint: Entweder Mitarbeiter ODER Extern
    CONSTRAINT chk_empfaenger_typ CHECK (
        (empfaenger_typ = 'mitarbeiter' AND empfaenger_user_id IS NOT NULL) OR
        (empfaenger_typ = 'extern' AND (empfaenger_extern_id IS NOT NULL OR empfaenger_extern_name IS NOT NULL))
    )
);

-- Indizes fuer Performance
CREATE INDEX IF NOT EXISTS idx_shop_ausgaben_datum ON shop_ausgaben(datum);
CREATE INDEX IF NOT EXISTS idx_shop_ausgaben_artikel ON shop_ausgaben(artikel_id);
CREATE INDEX IF NOT EXISTS idx_shop_ausgaben_user ON shop_ausgaben(empfaenger_user_id);
CREATE INDEX IF NOT EXISTS idx_shop_ausgaben_extern ON shop_ausgaben(empfaenger_extern_id);

-- =====================================================
-- RLS Policies
-- =====================================================
ALTER TABLE shop_ausgaben ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_externe_empfaenger ENABLE ROW LEVEL SECURITY;

-- shop_ausgaben Policies
CREATE POLICY "Users can view shop_ausgaben" ON shop_ausgaben
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert shop_ausgaben" ON shop_ausgaben
    FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update shop_ausgaben" ON shop_ausgaben
    FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete shop_ausgaben" ON shop_ausgaben
    FOR DELETE TO authenticated USING (true);

-- shop_externe_empfaenger Policies
CREATE POLICY "Users can view shop_externe_empfaenger" ON shop_externe_empfaenger
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert shop_externe_empfaenger" ON shop_externe_empfaenger
    FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update shop_externe_empfaenger" ON shop_externe_empfaenger
    FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete shop_externe_empfaenger" ON shop_externe_empfaenger
    FOR DELETE TO authenticated USING (true);

-- =====================================================
-- Trigger: Bestand automatisch reduzieren bei Ausgabe
-- =====================================================
CREATE OR REPLACE FUNCTION update_shop_artikel_bestand_on_ausgabe()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.artikel_id IS NOT NULL THEN
        -- Bestand reduzieren bei Ausgabe
        UPDATE shop_artikel
        SET bestand_aktuell = bestand_aktuell - NEW.menge,
            updated_at = NOW()
        WHERE id = NEW.artikel_id;
    ELSIF TG_OP = 'DELETE' AND OLD.artikel_id IS NOT NULL THEN
        -- Bestand zurueckgeben bei Loeschung
        UPDATE shop_artikel
        SET bestand_aktuell = bestand_aktuell + OLD.menge,
            updated_at = NOW()
        WHERE id = OLD.artikel_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_bestand_on_ausgabe ON shop_ausgaben;
CREATE TRIGGER trigger_update_bestand_on_ausgabe
    AFTER INSERT OR DELETE ON shop_ausgaben
    FOR EACH ROW EXECUTE FUNCTION update_shop_artikel_bestand_on_ausgabe();

-- =====================================================
-- Kommentare
-- =====================================================
COMMENT ON TABLE shop_ausgaben IS 'Publikations-Ausgaben an Mitarbeiter oder Externe';
COMMENT ON TABLE shop_externe_empfaenger IS 'Externe Empfaenger fuer Publikationsausgaben';
COMMENT ON COLUMN shop_ausgaben.empfaenger_typ IS 'mitarbeiter = interner User, extern = Gaeste/Partner';
