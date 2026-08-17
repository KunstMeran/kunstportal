-- Migration: Kontenplan für Deckungsbeitragsrechnung
-- Datum: 2026-07-29
-- Beschreibung: Erstellt chart_of_accounts Tabelle für DB-Zuordnung von DATEV-Konten

-- 1. Haupttabelle: Kontenplan
CREATE TABLE IF NOT EXISTS chart_of_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Konto-Identifikation
    konto_pattern TEXT NOT NULL UNIQUE,       -- z.B. "680*", "6901251" (Pattern oder exakt)
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

-- 2. Index für schnelles Pattern-Matching
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_pattern ON chart_of_accounts(konto_pattern);
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_db ON chart_of_accounts(db_zuordnung);

-- 3. RLS aktivieren
ALTER TABLE chart_of_accounts ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
CREATE POLICY "Users can view chart_of_accounts"
    ON chart_of_accounts FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can insert chart_of_accounts"
    ON chart_of_accounts FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Users can update chart_of_accounts"
    ON chart_of_accounts FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Users can delete chart_of_accounts"
    ON chart_of_accounts FOR DELETE
    TO authenticated
    USING (true);

-- 5. Trigger für updated_at
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

-- 6. Initiale Daten basierend auf Kontenzuordnung_DB-Rechnung.csv

-- UMSÄTZE
INSERT INTO chart_of_accounts (konto_pattern, konto_name, kategorie, db_zuordnung, ist_projektbezogen, sort_order) VALUES
('6001%', 'Erlöse Lieferungen/Leistungen', 'Umsatz', 'UMSATZ', true, 100),
('6401%', 'Zuschüsse und Beiträge', 'Umsatz', 'UMSATZ', false, 110),
('6400%', 'Sonstige betriebliche Erträge', 'Umsatz', 'UMSATZ', false, 120)
ON CONFLICT (konto_pattern) DO NOTHING;

-- DIREKTE KOSTEN (DB1)
INSERT INTO chart_of_accounts (konto_pattern, konto_name, kategorie, db_zuordnung, ist_projektbezogen, sort_order) VALUES
('680%', 'Materialkosten', 'Material', 'DB1_KOSTEN', true, 200),
('690125%', 'Dienstleistungen Ausstellung/Projekte', 'Dienstleistungen', 'DB1_KOSTEN', true, 210),
('69033%', 'Künstler-Kosten', 'Künstler', 'DB1_KOSTEN', true, 220)
ON CONFLICT (konto_pattern) DO NOTHING;

-- STRUKTURKOSTEN (DB2)
INSERT INTO chart_of_accounts (konto_pattern, konto_name, kategorie, db_zuordnung, ist_projektbezogen, sort_order) VALUES
('6901%', 'Verwaltung', 'Verwaltung', 'DB2_KOSTEN', false, 300),
('6902%', 'Werbung/Marketing', 'Marketing', 'DB2_KOSTEN', false, 310)
ON CONFLICT (konto_pattern) DO NOTHING;

-- FIXKOSTEN (DB3)
INSERT INTO chart_of_accounts (konto_pattern, konto_name, kategorie, db_zuordnung, ist_projektbezogen, sort_order) VALUES
('700%', 'Miete/Strukturen', 'Miete', 'DB3_KOSTEN', false, 400),
('69024%', 'Gebäudekosten', 'Gebäude', 'DB3_KOSTEN', false, 410),
('710%', 'Personalkosten', 'Personal', 'DB3_KOSTEN', false, 420)
ON CONFLICT (konto_pattern) DO NOTHING;

-- NEUTRAL (nicht in DB-Rechnung)
INSERT INTO chart_of_accounts (konto_pattern, konto_name, kategorie, db_zuordnung, ist_projektbezogen, sort_order) VALUES
('720%', 'Abschreibungen', 'Abschreibungen', 'NEUTRAL', false, 500),
('850%', 'Zinsen', 'Zinsen', 'NEUTRAL', false, 510)
ON CONFLICT (konto_pattern) DO NOTHING;

-- 7. Kommentare
COMMENT ON TABLE chart_of_accounts IS 'Kontenplan für Deckungsbeitragsrechnung - Zuordnung DATEV-Konten zu DB-Stufen';
COMMENT ON COLUMN chart_of_accounts.konto_pattern IS 'Konto-Pattern mit % als Wildcard (z.B. 680% für alle Konten die mit 680 beginnen)';
COMMENT ON COLUMN chart_of_accounts.db_zuordnung IS 'UMSATZ, DB1_KOSTEN, DB2_KOSTEN, DB3_KOSTEN, NEUTRAL';
COMMENT ON COLUMN chart_of_accounts.ist_projektbezogen IS 'Wenn true: Kosten nur in DB1 wenn projekt_id zugewiesen';
