-- =====================================================
-- Migration: Shop & Kasse Tabellen
-- Datum: 2026-08-12
-- Zweck: Vollständiges Shop-Modul mit Inventar, Verkäufe, Einkäufe und Kassenführung
-- =====================================================

-- 1. Artikeltypen (Buch, Katalog, Objekt, etc.)
CREATE TABLE IF NOT EXISTS shop_artikeltypen (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    is_system BOOLEAN DEFAULT false,
    sortierung INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO shop_artikeltypen (code, name, is_system, sortierung) VALUES
    ('buch', 'Buch', true, 1),
    ('katalog', 'Katalog', true, 2),
    ('poster', 'Poster', true, 3),
    ('objekt', 'Objekt/Gadget', true, 4),
    ('schmuck', 'Schmuck', true, 5),
    ('sonstiges', 'Sonstiges', true, 99)
ON CONFLICT (code) DO NOTHING;

-- 2. Eintritts-Kategorien (konfigurierbar)
CREATE TABLE IF NOT EXISTS shop_eintritt_kategorien (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    preis DECIMAL(10,2) NOT NULL,
    mwst_satz DECIMAL(5,2) DEFAULT 22.00,
    is_active BOOLEAN DEFAULT true,
    sortierung INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO shop_eintritt_kategorien (code, name, preis, mwst_satz, sortierung) VALUES
    ('erwachsen', 'Erwachsene', 8.00, 22.00, 1),
    ('ermaessigt', 'Ermäßigt', 5.00, 22.00, 2),
    ('gruppe', 'Gruppen (ab 10)', 6.00, 22.00, 3),
    ('fuehrung', 'Führung', 12.00, 22.00, 4),
    ('frei', 'Freier Eintritt', 0.00, 22.00, 5)
ON CONFLICT (code) DO NOTHING;

-- 3. Mitgliedsbeitrags-Kategorien
CREATE TABLE IF NOT EXISTS shop_mitglied_kategorien (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    betrag DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    sortierung INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO shop_mitglied_kategorien (code, name, betrag, sortierung) VALUES
    ('einzel', 'Einzelmitglied', 35.00, 1),
    ('familie', 'Familienmitglied', 50.00, 2),
    ('foerderer', 'Fördermitglied', 100.00, 3),
    ('student', 'Student/Schüler', 15.00, 4)
ON CONFLICT (code) DO NOTHING;

-- 4. Shop-Artikel (Stammdaten + Bestand)
CREATE TABLE IF NOT EXISTS shop_artikel (
    id BIGSERIAL PRIMARY KEY,
    artikelnr VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    beschreibung TEXT,

    -- Kategorisierung
    artikeltyp VARCHAR(50),  -- buch, katalog, objekt, etc.

    -- Herkunft (aus Excel-Import)
    hersteller TEXT,  -- Verlag / Hersteller
    autor TEXT,  -- Hrsg. / Autor bei Büchern
    einkaufsjahr VARCHAR(20),  -- "2025", "vor 2017"
    standort VARCHAR(50) DEFAULT 'Shop',  -- Shop, Bücherkeller

    -- Preise
    einkaufspreis DECIMAL(10,2),
    verkaufspreis DECIMAL(10,2) NOT NULL,
    mwst_satz VARCHAR(20) DEFAULT '22',  -- '4', '22', 'art74'

    -- Lagerbestand
    bestand_aktuell INT DEFAULT 0,
    bestand_min INT DEFAULT 0,

    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Shop-Verkäufe (alle Einnahmen: Artikel, Eintritte, Mitgliedsbeiträge)
CREATE TABLE IF NOT EXISTS shop_verkaeufe (
    id BIGSERIAL PRIMARY KEY,
    datum DATE NOT NULL DEFAULT CURRENT_DATE,
    uhrzeit TIME DEFAULT CURRENT_TIME,

    -- Typ: 'artikel', 'eintritt', 'mitglied'
    typ VARCHAR(20) NOT NULL,

    -- Bei Artikel
    artikel_id BIGINT REFERENCES shop_artikel(id),

    -- Bei Eintritt
    eintritt_kategorie VARCHAR(50),

    -- Bei Mitgliedsbeitrag
    mitglied_kategorie VARCHAR(50),
    mitglied_name TEXT,

    menge INT NOT NULL DEFAULT 1,
    einzelpreis DECIMAL(10,2) NOT NULL,
    mwst_satz VARCHAR(20),  -- '4', '22', 'art74', NULL bei Mitglied
    gesamtpreis DECIMAL(10,2) NOT NULL,

    -- Zahlungsart: 'bar' oder 'pos' (Karte)
    zahlungsart VARCHAR(20) NOT NULL DEFAULT 'bar',

    notizen TEXT,
    storniert BOOLEAN DEFAULT false,
    storniert_at TIMESTAMPTZ,
    storniert_by UUID REFERENCES auth.users(id),

    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Shop-Einkäufe (Warenbeschaffung)
CREATE TABLE IF NOT EXISTS shop_einkaeufe (
    id BIGSERIAL PRIMARY KEY,
    artikel_id BIGINT REFERENCES shop_artikel(id),
    datum DATE NOT NULL DEFAULT CURRENT_DATE,
    menge INT NOT NULL,
    einzelpreis DECIMAL(10,2),
    gesamtpreis DECIMAL(10,2),
    lieferant_name TEXT,
    rechnung_nr TEXT,
    notizen TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Kassen-Bewegungen (Ausgänge, Einlagen, Korrekturen)
CREATE TABLE IF NOT EXISTS shop_kassen_bewegungen (
    id BIGSERIAL PRIMARY KEY,
    datum DATE NOT NULL DEFAULT CURRENT_DATE,
    uhrzeit TIME DEFAULT CURRENT_TIME,
    typ VARCHAR(20) NOT NULL,  -- 'entnahme', 'einlage', 'korrektur'
    betrag DECIMAL(10,2) NOT NULL,  -- positiv = Einlage, negativ = Entnahme
    grund TEXT,
    storniert BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Kassenabschlüsse (täglich)
CREATE TABLE IF NOT EXISTS shop_kassenabschluss (
    id BIGSERIAL PRIMARY KEY,
    datum DATE UNIQUE NOT NULL,

    -- Anfangsbestand Bar (vom Vortag oder manuell)
    anfangsbestand_bar DECIMAL(10,2) DEFAULT 0,

    -- Einnahmen
    einnahmen_bar DECIMAL(10,2) DEFAULT 0,
    einnahmen_pos DECIMAL(10,2) DEFAULT 0,
    einnahmen_gesamt DECIMAL(10,2) DEFAULT 0,

    -- Ausgänge Bar
    ausgaenge_bar DECIMAL(10,2) DEFAULT 0,

    -- Endbestand Bar
    endbestand_bar_soll DECIMAL(10,2) DEFAULT 0,  -- berechnet
    endbestand_bar_ist DECIMAL(10,2),  -- gezählt
    differenz DECIMAL(10,2),

    anzahl_verkaeufe INT DEFAULT 0,

    kassiert_von UUID REFERENCES auth.users(id),
    notizen TEXT,
    abgeschlossen BOOLEAN DEFAULT false,
    abgeschlossen_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Indizes für Performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_shop_verkaeufe_datum ON shop_verkaeufe(datum);
CREATE INDEX IF NOT EXISTS idx_shop_verkaeufe_zahlungsart ON shop_verkaeufe(zahlungsart);
CREATE INDEX IF NOT EXISTS idx_shop_verkaeufe_typ ON shop_verkaeufe(typ);
CREATE INDEX IF NOT EXISTS idx_shop_artikel_typ ON shop_artikel(artikeltyp);
CREATE INDEX IF NOT EXISTS idx_shop_artikel_standort ON shop_artikel(standort);
CREATE INDEX IF NOT EXISTS idx_shop_einkaeufe_datum ON shop_einkaeufe(datum);
CREATE INDEX IF NOT EXISTS idx_shop_kassen_bewegungen_datum ON shop_kassen_bewegungen(datum);

-- =====================================================
-- RLS Policies
-- =====================================================
ALTER TABLE shop_artikeltypen ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_eintritt_kategorien ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_mitglied_kategorien ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_artikel ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_verkaeufe ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_einkaeufe ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_kassen_bewegungen ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_kassenabschluss ENABLE ROW LEVEL SECURITY;

-- Alle authentifizierten Benutzer können lesen und schreiben
CREATE POLICY "Users can view shop_artikeltypen" ON shop_artikeltypen FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage shop_artikeltypen" ON shop_artikeltypen FOR ALL TO authenticated WITH CHECK (true);

CREATE POLICY "Users can view shop_eintritt_kategorien" ON shop_eintritt_kategorien FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage shop_eintritt_kategorien" ON shop_eintritt_kategorien FOR ALL TO authenticated WITH CHECK (true);

CREATE POLICY "Users can view shop_mitglied_kategorien" ON shop_mitglied_kategorien FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage shop_mitglied_kategorien" ON shop_mitglied_kategorien FOR ALL TO authenticated WITH CHECK (true);

CREATE POLICY "Users can view shop_artikel" ON shop_artikel FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage shop_artikel" ON shop_artikel FOR ALL TO authenticated WITH CHECK (true);

CREATE POLICY "Users can view shop_verkaeufe" ON shop_verkaeufe FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage shop_verkaeufe" ON shop_verkaeufe FOR ALL TO authenticated WITH CHECK (true);

CREATE POLICY "Users can view shop_einkaeufe" ON shop_einkaeufe FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage shop_einkaeufe" ON shop_einkaeufe FOR ALL TO authenticated WITH CHECK (true);

CREATE POLICY "Users can view shop_kassen_bewegungen" ON shop_kassen_bewegungen FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage shop_kassen_bewegungen" ON shop_kassen_bewegungen FOR ALL TO authenticated WITH CHECK (true);

CREATE POLICY "Users can view shop_kassenabschluss" ON shop_kassenabschluss FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage shop_kassenabschluss" ON shop_kassenabschluss FOR ALL TO authenticated WITH CHECK (true);

-- =====================================================
-- Trigger für updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_shop_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_shop_artikel_updated ON shop_artikel;
CREATE TRIGGER trigger_shop_artikel_updated
    BEFORE UPDATE ON shop_artikel
    FOR EACH ROW EXECUTE FUNCTION update_shop_updated_at();

-- =====================================================
-- Trigger: Bestand automatisch aktualisieren bei Verkauf
-- =====================================================
CREATE OR REPLACE FUNCTION update_shop_artikel_bestand_on_verkauf()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.typ = 'artikel' AND NEW.artikel_id IS NOT NULL AND NOT COALESCE(NEW.storniert, false) THEN
        -- Bestand reduzieren bei Verkauf
        UPDATE shop_artikel
        SET bestand_aktuell = bestand_aktuell - NEW.menge,
            updated_at = NOW()
        WHERE id = NEW.artikel_id;
    ELSIF TG_OP = 'UPDATE' AND OLD.storniert = false AND NEW.storniert = true AND NEW.typ = 'artikel' AND NEW.artikel_id IS NOT NULL THEN
        -- Bestand zurückgeben bei Storno
        UPDATE shop_artikel
        SET bestand_aktuell = bestand_aktuell + NEW.menge,
            updated_at = NOW()
        WHERE id = NEW.artikel_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_bestand_on_verkauf ON shop_verkaeufe;
CREATE TRIGGER trigger_update_bestand_on_verkauf
    AFTER INSERT OR UPDATE ON shop_verkaeufe
    FOR EACH ROW EXECUTE FUNCTION update_shop_artikel_bestand_on_verkauf();

-- =====================================================
-- Trigger: Bestand erhöhen bei Einkauf
-- =====================================================
CREATE OR REPLACE FUNCTION update_shop_artikel_bestand_on_einkauf()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.artikel_id IS NOT NULL THEN
        UPDATE shop_artikel
        SET bestand_aktuell = bestand_aktuell + NEW.menge,
            updated_at = NOW()
        WHERE id = NEW.artikel_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_bestand_on_einkauf ON shop_einkaeufe;
CREATE TRIGGER trigger_update_bestand_on_einkauf
    AFTER INSERT ON shop_einkaeufe
    FOR EACH ROW EXECUTE FUNCTION update_shop_artikel_bestand_on_einkauf();

-- Kommentare
COMMENT ON TABLE shop_artikeltypen IS 'Artikelkategorien für den Shop (Buch, Katalog, etc.)';
COMMENT ON TABLE shop_eintritt_kategorien IS 'Eintritts-Kategorien mit Preisen (Erwachsene, Ermäßigt, etc.)';
COMMENT ON TABLE shop_mitglied_kategorien IS 'Mitgliedsbeitrags-Kategorien';
COMMENT ON TABLE shop_artikel IS 'Shop-Artikel Stammdaten mit aktuellem Lagerbestand';
COMMENT ON TABLE shop_verkaeufe IS 'Alle Verkäufe (Artikel, Eintritte, Mitgliedsbeiträge)';
COMMENT ON TABLE shop_einkaeufe IS 'Wareneinkäufe zur Bestandserhöhung';
COMMENT ON TABLE shop_kassen_bewegungen IS 'Kassenein- und -ausgänge (Entnahmen, Einlagen)';
COMMENT ON TABLE shop_kassenabschluss IS 'Tägliche Kassenabschlüsse';
