-- =====================================================
-- Migration: Kursverwaltung (Training Management)
-- Datum: 2026-08-17
-- Zweck: Kurs-Stammdaten, Teilnehmer-Zuweisungen, Zertifikate
-- =====================================================

-- 1. Kursanbieter (Trainingsunternehmen, Institute)
CREATE TABLE IF NOT EXISTS kurs_anbieter (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    kontakt_person VARCHAR(255),
    email VARCHAR(255),
    telefon VARCHAR(50),
    adresse TEXT,
    notizen TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Kurskategorien (Sicherheit, IT, Sprachen, etc.)
CREATE TABLE IF NOT EXISTS kurs_kategorien (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    beschreibung TEXT,
    farbe VARCHAR(20) DEFAULT '#3498db',
    sortierung INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default-Kategorien einfuegen
INSERT INTO kurs_kategorien (code, name, farbe, sortierung) VALUES
    ('sicherheit', 'Arbeitssicherheit', '#e74c3c', 1),
    ('brandschutz', 'Brandschutz', '#e67e22', 2),
    ('erstehilfe', 'Erste Hilfe', '#27ae60', 3),
    ('it', 'IT & Software', '#3498db', 4),
    ('sprachen', 'Sprachen', '#9b59b6', 5),
    ('fuehrung', 'Fuehrungskompetenz', '#1abc9c', 6),
    ('fachlich', 'Fachkompetenz', '#34495e', 7),
    ('sonstiges', 'Sonstiges', '#95a5a6', 99)
ON CONFLICT (code) DO NOTHING;

-- 3. Kurse (Stammdaten)
CREATE TABLE IF NOT EXISTS kurse (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    beschreibung TEXT,

    -- Kategorisierung
    kategorie_id BIGINT REFERENCES kurs_kategorien(id),
    anbieter_id BIGINT REFERENCES kurs_anbieter(id),

    -- Pflicht oder Freiwillig
    ist_pflicht BOOLEAN DEFAULT false,

    -- Gueltigkeit des Zertifikats (in Monaten, NULL = unbegrenzt)
    gueltigkeit_monate INT,

    -- Vorlaufzeit fuer Erinnerung (in Tagen vor Ablauf)
    erinnerung_tage INT DEFAULT 30,

    -- Kosten
    kosten_pro_person DECIMAL(10,2),
    kosten_pauschal DECIMAL(10,2),

    -- Dauer
    dauer_stunden DECIMAL(5,2),

    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Kurs-Termine (einzelne Durchfuehrungen eines Kurses)
CREATE TABLE IF NOT EXISTS kurs_termine (
    id BIGSERIAL PRIMARY KEY,
    kurs_id BIGINT NOT NULL REFERENCES kurse(id) ON DELETE CASCADE,

    -- Termin
    datum DATE NOT NULL,
    uhrzeit_von TIME,
    uhrzeit_bis TIME,

    -- Ort
    ort VARCHAR(255),
    online BOOLEAN DEFAULT false,
    online_link TEXT,

    -- Kosten (ueberschreibt Kurs-Kosten falls abweichend)
    kosten_gesamt DECIMAL(10,2),

    -- Status
    status VARCHAR(20) DEFAULT 'geplant' CHECK (status IN ('geplant', 'bestaetigt', 'abgeschlossen', 'abgesagt')),

    notizen TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Kurs-Teilnehmer (Mitarbeiter-Zuweisungen zu Terminen)
CREATE TABLE IF NOT EXISTS kurs_teilnehmer (
    id BIGSERIAL PRIMARY KEY,
    termin_id BIGINT NOT NULL REFERENCES kurs_termine(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

    -- Status
    status VARCHAR(20) DEFAULT 'angemeldet' CHECK (status IN ('angemeldet', 'teilgenommen', 'nicht_erschienen', 'abgesagt')),

    -- Zertifikat
    zertifikat_erhalten BOOLEAN DEFAULT false,
    zertifikat_datum DATE,
    zertifikat_ablauf DATE,
    zertifikat_datei TEXT,

    notizen TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(termin_id, user_id)
);

-- =====================================================
-- Indizes
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_kurse_kategorie ON kurse(kategorie_id);
CREATE INDEX IF NOT EXISTS idx_kurse_anbieter ON kurse(anbieter_id);
CREATE INDEX IF NOT EXISTS idx_kurse_aktiv ON kurse(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_kurs_termine_datum ON kurs_termine(datum);
CREATE INDEX IF NOT EXISTS idx_kurs_termine_kurs ON kurs_termine(kurs_id);
CREATE INDEX IF NOT EXISTS idx_kurs_termine_status ON kurs_termine(status);
CREATE INDEX IF NOT EXISTS idx_kurs_teilnehmer_user ON kurs_teilnehmer(user_id);
CREATE INDEX IF NOT EXISTS idx_kurs_teilnehmer_termin ON kurs_teilnehmer(termin_id);
CREATE INDEX IF NOT EXISTS idx_kurs_teilnehmer_ablauf ON kurs_teilnehmer(zertifikat_ablauf) WHERE zertifikat_ablauf IS NOT NULL;

-- =====================================================
-- RLS aktivieren
-- =====================================================
ALTER TABLE kurs_anbieter ENABLE ROW LEVEL SECURITY;
ALTER TABLE kurs_kategorien ENABLE ROW LEVEL SECURITY;
ALTER TABLE kurse ENABLE ROW LEVEL SECURITY;
ALTER TABLE kurs_termine ENABLE ROW LEVEL SECURITY;
ALTER TABLE kurs_teilnehmer ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS Policies
-- =====================================================

-- kurs_anbieter
DROP POLICY IF EXISTS "Users can view kurs_anbieter" ON kurs_anbieter;
CREATE POLICY "Users can view kurs_anbieter" ON kurs_anbieter
    FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users can insert kurs_anbieter" ON kurs_anbieter;
CREATE POLICY "Users can insert kurs_anbieter" ON kurs_anbieter
    FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update kurs_anbieter" ON kurs_anbieter;
CREATE POLICY "Users can update kurs_anbieter" ON kurs_anbieter
    FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "Users can delete kurs_anbieter" ON kurs_anbieter;
CREATE POLICY "Users can delete kurs_anbieter" ON kurs_anbieter
    FOR DELETE TO authenticated USING (true);

-- kurs_kategorien
DROP POLICY IF EXISTS "Users can view kurs_kategorien" ON kurs_kategorien;
CREATE POLICY "Users can view kurs_kategorien" ON kurs_kategorien
    FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users can manage kurs_kategorien" ON kurs_kategorien;
CREATE POLICY "Users can manage kurs_kategorien" ON kurs_kategorien
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- kurse
DROP POLICY IF EXISTS "Users can view kurse" ON kurse;
CREATE POLICY "Users can view kurse" ON kurse
    FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users can insert kurse" ON kurse;
CREATE POLICY "Users can insert kurse" ON kurse
    FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update kurse" ON kurse;
CREATE POLICY "Users can update kurse" ON kurse
    FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "Users can delete kurse" ON kurse;
CREATE POLICY "Users can delete kurse" ON kurse
    FOR DELETE TO authenticated USING (true);

-- kurs_termine
DROP POLICY IF EXISTS "Users can view kurs_termine" ON kurs_termine;
CREATE POLICY "Users can view kurs_termine" ON kurs_termine
    FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users can insert kurs_termine" ON kurs_termine;
CREATE POLICY "Users can insert kurs_termine" ON kurs_termine
    FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update kurs_termine" ON kurs_termine;
CREATE POLICY "Users can update kurs_termine" ON kurs_termine
    FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "Users can delete kurs_termine" ON kurs_termine;
CREATE POLICY "Users can delete kurs_termine" ON kurs_termine
    FOR DELETE TO authenticated USING (true);

-- kurs_teilnehmer
DROP POLICY IF EXISTS "Users can view kurs_teilnehmer" ON kurs_teilnehmer;
CREATE POLICY "Users can view kurs_teilnehmer" ON kurs_teilnehmer
    FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users can insert kurs_teilnehmer" ON kurs_teilnehmer;
CREATE POLICY "Users can insert kurs_teilnehmer" ON kurs_teilnehmer
    FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update kurs_teilnehmer" ON kurs_teilnehmer;
CREATE POLICY "Users can update kurs_teilnehmer" ON kurs_teilnehmer
    FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "Users can delete kurs_teilnehmer" ON kurs_teilnehmer;
CREATE POLICY "Users can delete kurs_teilnehmer" ON kurs_teilnehmer
    FOR DELETE TO authenticated USING (true);

-- =====================================================
-- Trigger fuer updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_kurse_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_kurse_updated ON kurse;
CREATE TRIGGER trigger_kurse_updated
    BEFORE UPDATE ON kurse
    FOR EACH ROW EXECUTE FUNCTION update_kurse_updated_at();

DROP TRIGGER IF EXISTS trigger_kurs_termine_updated ON kurs_termine;
CREATE TRIGGER trigger_kurs_termine_updated
    BEFORE UPDATE ON kurs_termine
    FOR EACH ROW EXECUTE FUNCTION update_kurse_updated_at();

DROP TRIGGER IF EXISTS trigger_kurs_teilnehmer_updated ON kurs_teilnehmer;
CREATE TRIGGER trigger_kurs_teilnehmer_updated
    BEFORE UPDATE ON kurs_teilnehmer
    FOR EACH ROW EXECUTE FUNCTION update_kurse_updated_at();

DROP TRIGGER IF EXISTS trigger_kurs_anbieter_updated ON kurs_anbieter;
CREATE TRIGGER trigger_kurs_anbieter_updated
    BEFORE UPDATE ON kurs_anbieter
    FOR EACH ROW EXECUTE FUNCTION update_kurse_updated_at();

-- =====================================================
-- View: Ablaufende Zertifikate (naechste 90 Tage)
-- =====================================================
CREATE OR REPLACE VIEW v_ablaufende_zertifikate AS
SELECT
    kt.id,
    kt.user_id,
    u.username,
    k.name as kurs_name,
    k.ist_pflicht,
    kk.name as kategorie,
    kk.farbe as kategorie_farbe,
    kt.zertifikat_datum,
    kt.zertifikat_ablauf,
    kt.zertifikat_ablauf - CURRENT_DATE as tage_bis_ablauf
FROM kurs_teilnehmer kt
JOIN kurs_termine kterm ON kt.termin_id = kterm.id
JOIN kurse k ON kterm.kurs_id = k.id
LEFT JOIN kurs_kategorien kk ON k.kategorie_id = kk.id
JOIN public.users u ON kt.user_id = u.id
WHERE kt.zertifikat_erhalten = true
  AND kt.zertifikat_ablauf IS NOT NULL
  AND kt.zertifikat_ablauf <= CURRENT_DATE + INTERVAL '90 days'
  AND kt.zertifikat_ablauf >= CURRENT_DATE
ORDER BY kt.zertifikat_ablauf ASC;

-- =====================================================
-- Kommentare
-- =====================================================
COMMENT ON TABLE kurs_anbieter IS 'Kursanbieter und Trainingsunternehmen';
COMMENT ON TABLE kurs_kategorien IS 'Kategorien fuer Kurse (Sicherheit, IT, etc.)';
COMMENT ON TABLE kurse IS 'Kurs-Stammdaten (Schulungen, Weiterbildungen)';
COMMENT ON TABLE kurs_termine IS 'Einzelne Durchfuehrungstermine eines Kurses';
COMMENT ON TABLE kurs_teilnehmer IS 'Teilnehmer-Zuweisungen mit Zertifikat-Tracking';
COMMENT ON VIEW v_ablaufende_zertifikate IS 'Zertifikate die in den naechsten 90 Tagen ablaufen';
COMMENT ON COLUMN kurse.gueltigkeit_monate IS 'Gueltigkeit des Zertifikats in Monaten (NULL = unbegrenzt)';
COMMENT ON COLUMN kurse.erinnerung_tage IS 'Tage vor Ablauf fuer Erinnerung';
COMMENT ON COLUMN kurs_teilnehmer.zertifikat_datei IS 'Pfad zum Zertifikat-Upload (Supabase Storage)';
