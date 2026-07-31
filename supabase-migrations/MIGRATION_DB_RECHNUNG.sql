-- =====================================================
-- MIGRATION: Deckungsbeitragsrechnung (DB-Rechnung)
-- Datum: Juli 2026
--
-- Dieses Script enthält ALLE notwendigen Migrationen
-- für die Deckungsbeitragsrechnung.
--
-- Ausführen im Supabase SQL Editor!
-- =====================================================

-- =====================================================
-- TEIL 1: Kontenplan (chart_of_accounts)
-- =====================================================

-- 1.1 Haupttabelle: Kontenplan
CREATE TABLE IF NOT EXISTS chart_of_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Konto-Identifikation
    konto_pattern TEXT NOT NULL UNIQUE,       -- z.B. "680%", "6901251" (Pattern oder exakt)
    konto_name TEXT,                          -- z.B. "Materialkosten"

    -- Kategorisierung
    kategorie TEXT,                           -- z.B. "Material", "Dienstleistungen", "Personal"
    beschreibung TEXT,

    -- DB-Zuordnung (Kernfunktion)
    db_zuordnung TEXT NOT NULL DEFAULT 'NEUTRAL',
    -- Werte: 'UMSATZ', 'DB1_KOSTEN', 'DB2_KOSTEN', 'DB3_KOSTEN', 'NEUTRAL'

    -- Projektbezug
    ist_projektbezogen BOOLEAN DEFAULT false, -- true = nur in DB1 wenn projekt_id vorhanden

    -- Sortierung/Anzeige
    sort_order INTEGER DEFAULT 0,
    ist_aktiv BOOLEAN DEFAULT true,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.2 Indizes
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_pattern ON chart_of_accounts(konto_pattern);
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_db ON chart_of_accounts(db_zuordnung);

-- 1.3 RLS aktivieren
ALTER TABLE chart_of_accounts ENABLE ROW LEVEL SECURITY;

-- 1.4 RLS Policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chart_of_accounts' AND policyname = 'Users can view chart_of_accounts') THEN
        CREATE POLICY "Users can view chart_of_accounts"
            ON chart_of_accounts FOR SELECT
            TO authenticated
            USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chart_of_accounts' AND policyname = 'Users can insert chart_of_accounts') THEN
        CREATE POLICY "Users can insert chart_of_accounts"
            ON chart_of_accounts FOR INSERT
            TO authenticated
            WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chart_of_accounts' AND policyname = 'Users can update chart_of_accounts') THEN
        CREATE POLICY "Users can update chart_of_accounts"
            ON chart_of_accounts FOR UPDATE
            TO authenticated
            USING (true)
            WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chart_of_accounts' AND policyname = 'Users can delete chart_of_accounts') THEN
        CREATE POLICY "Users can delete chart_of_accounts"
            ON chart_of_accounts FOR DELETE
            TO authenticated
            USING (true);
    END IF;
END $$;

-- 1.5 Trigger für updated_at
CREATE OR REPLACE FUNCTION update_chart_of_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_chart_of_accounts_updated_at ON chart_of_accounts;
CREATE TRIGGER trigger_chart_of_accounts_updated_at
    BEFORE UPDATE ON chart_of_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_chart_of_accounts_updated_at();

-- 1.6 Initiale Daten (Standard-Kontenzuordnung)

-- UMSÄTZE
INSERT INTO chart_of_accounts (konto_pattern, konto_name, kategorie, db_zuordnung, ist_projektbezogen, sort_order) VALUES
('6001%', 'Erlöse Lieferungen/Leistungen', 'Umsatz', 'UMSATZ', true, 100),
('6401%', 'Zuschüsse und Beiträge', 'Umsatz', 'UMSATZ', false, 110),
('6400%', 'Sonstige betriebliche Erträge', 'Umsatz', 'UMSATZ', false, 120),
('640%', 'Betriebliche Erträge', 'Umsatz', 'UMSATZ', false, 130)
ON CONFLICT (konto_pattern) DO NOTHING;

-- DIREKTE KOSTEN (DB1) - Projektbezogen
INSERT INTO chart_of_accounts (konto_pattern, konto_name, kategorie, db_zuordnung, ist_projektbezogen, sort_order) VALUES
('680%', 'Materialkosten', 'Material', 'DB1_KOSTEN', true, 200),
('690125%', 'Dienstleistungen Ausstellung/Projekte', 'Dienstleistungen', 'DB1_KOSTEN', true, 210),
('69033%', 'Künstler-Kosten', 'Künstler', 'DB1_KOSTEN', true, 220),
('6903%', 'Freiberufliche Kosten', 'Freiberufler', 'DB1_KOSTEN', true, 225)
ON CONFLICT (konto_pattern) DO NOTHING;

-- STRUKTURKOSTEN (DB2) - Verwaltung/Marketing
INSERT INTO chart_of_accounts (konto_pattern, konto_name, kategorie, db_zuordnung, ist_projektbezogen, sort_order) VALUES
('6901%', 'Verwaltung', 'Verwaltung', 'DB2_KOSTEN', false, 300),
('6902%', 'Werbung/Marketing', 'Marketing', 'DB2_KOSTEN', false, 310),
('691%', 'Büromaterial/Verwaltung', 'Verwaltung', 'DB2_KOSTEN', false, 320),
('692%', 'Versicherungen', 'Verwaltung', 'DB2_KOSTEN', false, 330)
ON CONFLICT (konto_pattern) DO NOTHING;

-- FIXKOSTEN (DB3) - Miete/Personal/Gebäude
INSERT INTO chart_of_accounts (konto_pattern, konto_name, kategorie, db_zuordnung, ist_projektbezogen, sort_order) VALUES
('700%', 'Miete/Strukturen', 'Miete', 'DB3_KOSTEN', false, 400),
('69024%', 'Gebäudekosten', 'Gebäude', 'DB3_KOSTEN', false, 410),
('710%', 'Personalkosten', 'Personal', 'DB3_KOSTEN', false, 420),
('711%', 'Sozialabgaben', 'Personal', 'DB3_KOSTEN', false, 430),
('72%', 'Abgaben/Steuern', 'Steuern', 'DB3_KOSTEN', false, 440)
ON CONFLICT (konto_pattern) DO NOTHING;

-- NEUTRAL (nicht in DB-Rechnung)
INSERT INTO chart_of_accounts (konto_pattern, konto_name, kategorie, db_zuordnung, ist_projektbezogen, sort_order) VALUES
('720%', 'Abschreibungen', 'Abschreibungen', 'NEUTRAL', false, 500),
('850%', 'Zinsen', 'Zinsen', 'NEUTRAL', false, 510),
('9%', 'Durchlaufposten', 'Durchlauf', 'NEUTRAL', false, 900)
ON CONFLICT (konto_pattern) DO NOTHING;

-- Kommentare
COMMENT ON TABLE chart_of_accounts IS 'Kontenplan für Deckungsbeitragsrechnung - Zuordnung DATEV-Konten zu DB-Stufen';
COMMENT ON COLUMN chart_of_accounts.konto_pattern IS 'Konto-Pattern mit % als Wildcard (z.B. 680% für alle Konten die mit 680 beginnen)';
COMMENT ON COLUMN chart_of_accounts.db_zuordnung IS 'UMSATZ, DB1_KOSTEN, DB2_KOSTEN, DB3_KOSTEN, NEUTRAL';
COMMENT ON COLUMN chart_of_accounts.ist_projektbezogen IS 'Wenn true: Kosten nur in DB1 wenn projekt_id zugewiesen';


-- =====================================================
-- TEIL 2: ist_ausstellung Flag für Projekte
-- =====================================================

-- 2.1 Spalte hinzufügen
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS ist_ausstellung BOOLEAN DEFAULT true;

-- 2.2 Kommentar
COMMENT ON COLUMN projects.ist_ausstellung IS 'true = Ausstellungsprojekt (wird in DB-Rechnung berücksichtigt), false = Verwaltung/Allgemein';

-- 2.3 Index für Filterung
CREATE INDEX IF NOT EXISTS idx_projects_ist_ausstellung ON projects(ist_ausstellung) WHERE ist_ausstellung = true;


-- =====================================================
-- FERTIG!
-- =====================================================
-- Nach der Ausführung sollte das Reporting funktionieren.
--
-- WICHTIG: Stellen Sie sicher, dass:
-- 1. Projekte start_date und end_date haben
-- 2. DATEV-Buchungen mit konto_nr existieren
-- 3. Bei Bedarf weitere Konten im Kontenplan ergänzen
-- =====================================================

SELECT 'Migration erfolgreich! Kontenplan mit ' || COUNT(*) || ' Einträgen erstellt.' as status
FROM chart_of_accounts;
