-- Migration: Mitglieder-Verwaltung
-- Datum: 2026-07-29
-- Beschreibung: Erstellt die members Tabelle für Mitgliederverwaltung mit Zahlungs-Tracking

-- 1. Tabelle erstellen
CREATE TABLE IF NOT EXISTS members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_number INTEGER,                        -- Mitgliedsnummer (falls vorhanden)
    last_name TEXT NOT NULL,                      -- Nachname
    first_name TEXT,                              -- Vorname
    gender TEXT,                                  -- m/f
    language TEXT,                                -- Sprache (de/it)

    -- Adresse
    address TEXT,                                 -- Anschrift
    postal_code TEXT,                             -- CAP/PLZ
    city TEXT,                                    -- Ort

    -- Kontakt
    email TEXT,
    phone TEXT,

    -- Persönliche Daten
    birth_year INTEGER,                           -- Geburtsjahr
    tax_number TEXT,                              -- Steuernummer (StNr)

    -- Mitgliedschaft
    membership_fee DECIMAL(10,2) DEFAULT 0,       -- Jahresbeitrag
    donation DECIMAL(10,2) DEFAULT 0,             -- Spende
    join_date DATE,                               -- Datum Beitritt
    payment_method TEXT,                          -- Zahlungsart

    -- Sonstiges
    hashtag TEXT,                                 -- Hashtag/Kategorie
    notes TEXT,                                   -- Info/Notizen

    -- Status
    is_active BOOLEAN DEFAULT true,               -- Aktives Mitglied?

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- 2. Tabelle für Mitgliedsbeitrags-Zahlungen (Verknüpfung mit DATEV)
CREATE TABLE IF NOT EXISTS member_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,                        -- Zahlungsjahr (z.B. 2026)
    amount DECIMAL(10,2),                         -- Gezahlter Betrag
    payment_date DATE,                            -- Zahlungsdatum
    datev_buchung_id TEXT,                        -- Referenz zur DATEV-Buchung (rechnungId)
    datev_buchungstext TEXT,                      -- Buchungstext aus DATEV (für Anzeige)
    notes TEXT,                                   -- Notizen
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),

    UNIQUE(member_id, year)                       -- Pro Jahr nur eine Zahlung pro Mitglied
);

-- 3. Indizes für schnelle Abfragen
CREATE INDEX IF NOT EXISTS idx_members_last_name ON members(last_name);
CREATE INDEX IF NOT EXISTS idx_members_active ON members(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_member_payments_year ON member_payments(year);
CREATE INDEX IF NOT EXISTS idx_member_payments_member ON member_payments(member_id);

-- 4. RLS aktivieren
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_payments ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies für members
CREATE POLICY "Users can view members"
    ON members FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can insert members"
    ON members FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Users can update members"
    ON members FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Users can delete members"
    ON members FOR DELETE
    TO authenticated
    USING (true);

-- 6. RLS Policies für member_payments
CREATE POLICY "Users can view member_payments"
    ON member_payments FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can insert member_payments"
    ON member_payments FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Users can update member_payments"
    ON member_payments FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Users can delete member_payments"
    ON member_payments FOR DELETE
    TO authenticated
    USING (true);

-- 7. Trigger für updated_at
CREATE OR REPLACE FUNCTION update_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_members_updated_at ON members;
CREATE TRIGGER trigger_members_updated_at
    BEFORE UPDATE ON members
    FOR EACH ROW
    EXECUTE FUNCTION update_members_updated_at();
