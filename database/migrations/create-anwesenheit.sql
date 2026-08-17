-- =====================================================
-- Migration: Anwesenheitsplanung & Essensgutscheine
-- Datum: 2026-08-17
-- Zweck: Mitarbeiter planen Buero-Tage, Admin sieht Bedarf
-- =====================================================

-- 1. Anwesenheitsplanung (User plant pro Tag)
CREATE TABLE IF NOT EXISTS anwesenheit_planung (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    datum DATE NOT NULL,

    -- Status
    im_buero BOOLEAN DEFAULT false,
    mittagessen BOOLEAN DEFAULT false,

    -- Bei Abwesenheit: Grund (optional)
    abwesenheit_grund VARCHAR(50) CHECK (abwesenheit_grund IN ('urlaub', 'krank', 'homeoffice', 'dienstreise', 'sonstiges')),
    abwesenheit_notiz TEXT,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ein Eintrag pro User pro Tag
    UNIQUE(user_id, datum)
);

-- 2. Essensgutschein-Bestellungen (Admin trackt Bestellungen)
CREATE TABLE IF NOT EXISTS essensgutschein_bestellungen (
    id BIGSERIAL PRIMARY KEY,
    jahr INT NOT NULL,
    monat INT NOT NULL CHECK (monat BETWEEN 1 AND 12),

    -- Bestellte Menge
    anzahl_bestellt INT NOT NULL DEFAULT 0,

    -- Tatsaechlich benoetigt (aus Planung berechnet)
    anzahl_geplant INT DEFAULT 0,

    -- Status
    status VARCHAR(20) DEFAULT 'offen' CHECK (status IN ('offen', 'bestellt', 'geliefert')),
    bestellt_am DATE,
    geliefert_am DATE,

    notizen TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ein Eintrag pro Monat
    UNIQUE(jahr, monat)
);

-- =====================================================
-- Indizes
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_anwesenheit_user ON anwesenheit_planung(user_id);
CREATE INDEX IF NOT EXISTS idx_anwesenheit_datum ON anwesenheit_planung(datum);
CREATE INDEX IF NOT EXISTS idx_anwesenheit_user_datum ON anwesenheit_planung(user_id, datum);
CREATE INDEX IF NOT EXISTS idx_anwesenheit_mittagessen ON anwesenheit_planung(datum) WHERE mittagessen = true;
CREATE INDEX IF NOT EXISTS idx_bestellungen_monat ON essensgutschein_bestellungen(jahr, monat);

-- =====================================================
-- RLS aktivieren
-- =====================================================
ALTER TABLE anwesenheit_planung ENABLE ROW LEVEL SECURITY;
ALTER TABLE essensgutschein_bestellungen ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS Policies
-- =====================================================

-- anwesenheit_planung
DROP POLICY IF EXISTS "Users can view anwesenheit_planung" ON anwesenheit_planung;
CREATE POLICY "Users can view anwesenheit_planung" ON anwesenheit_planung
    FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users can insert anwesenheit_planung" ON anwesenheit_planung;
CREATE POLICY "Users can insert anwesenheit_planung" ON anwesenheit_planung
    FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update anwesenheit_planung" ON anwesenheit_planung;
CREATE POLICY "Users can update anwesenheit_planung" ON anwesenheit_planung
    FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "Users can delete anwesenheit_planung" ON anwesenheit_planung;
CREATE POLICY "Users can delete anwesenheit_planung" ON anwesenheit_planung
    FOR DELETE TO authenticated USING (true);

-- essensgutschein_bestellungen
DROP POLICY IF EXISTS "Users can view essensgutschein_bestellungen" ON essensgutschein_bestellungen;
CREATE POLICY "Users can view essensgutschein_bestellungen" ON essensgutschein_bestellungen
    FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users can insert essensgutschein_bestellungen" ON essensgutschein_bestellungen;
CREATE POLICY "Users can insert essensgutschein_bestellungen" ON essensgutschein_bestellungen
    FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update essensgutschein_bestellungen" ON essensgutschein_bestellungen;
CREATE POLICY "Users can update essensgutschein_bestellungen" ON essensgutschein_bestellungen
    FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "Users can delete essensgutschein_bestellungen" ON essensgutschein_bestellungen;
CREATE POLICY "Users can delete essensgutschein_bestellungen" ON essensgutschein_bestellungen
    FOR DELETE TO authenticated USING (true);

-- =====================================================
-- Trigger fuer updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_anwesenheit_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_anwesenheit_updated ON anwesenheit_planung;
CREATE TRIGGER trigger_anwesenheit_updated
    BEFORE UPDATE ON anwesenheit_planung
    FOR EACH ROW EXECUTE FUNCTION update_anwesenheit_updated_at();

DROP TRIGGER IF EXISTS trigger_bestellungen_updated ON essensgutschein_bestellungen;
CREATE TRIGGER trigger_bestellungen_updated
    BEFORE UPDATE ON essensgutschein_bestellungen
    FOR EACH ROW EXECUTE FUNCTION update_anwesenheit_updated_at();

-- =====================================================
-- View: Tagesstatistik (wie viele essen heute)
-- =====================================================
CREATE OR REPLACE VIEW v_essensgutscheine_tagesstatistik AS
SELECT
    ap.datum,
    COUNT(*) FILTER (WHERE ap.im_buero = true) as anzahl_im_buero,
    COUNT(*) FILTER (WHERE ap.mittagessen = true) as anzahl_mittagessen,
    COUNT(*) FILTER (WHERE ap.abwesenheit_grund = 'homeoffice') as anzahl_homeoffice,
    COUNT(*) FILTER (WHERE ap.abwesenheit_grund = 'urlaub') as anzahl_urlaub,
    COUNT(*) FILTER (WHERE ap.abwesenheit_grund = 'krank') as anzahl_krank
FROM anwesenheit_planung ap
GROUP BY ap.datum
ORDER BY ap.datum;

-- =====================================================
-- View: Monatsstatistik (Summen pro Monat)
-- =====================================================
CREATE OR REPLACE VIEW v_essensgutscheine_monatsstatistik AS
SELECT
    EXTRACT(YEAR FROM ap.datum)::INT as jahr,
    EXTRACT(MONTH FROM ap.datum)::INT as monat,
    COUNT(*) FILTER (WHERE ap.mittagessen = true) as anzahl_mittagessen,
    COUNT(DISTINCT ap.user_id) FILTER (WHERE ap.im_buero = true) as anzahl_mitarbeiter_vor_ort,
    COUNT(DISTINCT ap.datum) as anzahl_tage_geplant
FROM anwesenheit_planung ap
GROUP BY EXTRACT(YEAR FROM ap.datum), EXTRACT(MONTH FROM ap.datum)
ORDER BY jahr DESC, monat DESC;

-- =====================================================
-- View: Wer ist heute da?
-- =====================================================
CREATE OR REPLACE VIEW v_heute_anwesend AS
SELECT
    ap.id,
    ap.user_id,
    u.username,
    u.email,
    ap.im_buero,
    ap.mittagessen,
    ap.abwesenheit_grund
FROM anwesenheit_planung ap
JOIN public.users u ON ap.user_id = u.id
WHERE ap.datum = CURRENT_DATE
ORDER BY u.username;

-- =====================================================
-- Kommentare
-- =====================================================
COMMENT ON TABLE anwesenheit_planung IS 'Tagesplanung: Buero, Homeoffice, Mittagessen';
COMMENT ON TABLE essensgutschein_bestellungen IS 'Admin-Tracking der Essensgutschein-Bestellungen';
COMMENT ON VIEW v_essensgutscheine_tagesstatistik IS 'Statistik pro Tag: Anwesende, Mittagessen';
COMMENT ON VIEW v_essensgutscheine_monatsstatistik IS 'Statistik pro Monat: Summe Mittagessen';
COMMENT ON VIEW v_heute_anwesend IS 'Wer ist heute im Buero?';
COMMENT ON COLUMN anwesenheit_planung.mittagessen IS 'True = Essensgutschein wird benoetigt';
COMMENT ON COLUMN anwesenheit_planung.abwesenheit_grund IS 'urlaub, krank, homeoffice, dienstreise, sonstiges';

