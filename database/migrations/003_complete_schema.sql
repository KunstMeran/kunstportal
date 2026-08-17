-- =====================================================
-- Kunstmeran Database Schema - Complete
-- Generated: 2026-08-17
-- Target: Hetzner PostgreSQL 18.4
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. CUSTOM TYPES
-- =====================================================

CREATE TYPE permission_level AS ENUM ('none', 'read', 'write', 'delete');

-- =====================================================
-- 2. BASE TABLES (no foreign keys)
-- =====================================================

-- Users
CREATE TABLE users (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    username varchar NOT NULL,
    password_hash varchar,
    role varchar NOT NULL,
    email varchar,
    hourly_rate numeric DEFAULT 25,
    auth_id uuid,
    user_type text DEFAULT 'intern',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Projects
CREATE TABLE projects (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name varchar NOT NULL,
    description text,
    location varchar,
    start_date date,
    end_date date,
    status varchar NOT NULL,
    datev_id varchar,
    budget numeric DEFAULT 0,
    pl1 text,
    pl2 text,
    pl3 varchar,
    dropbox_link text,
    ist_ausstellung boolean DEFAULT true,
    hide_in_reporting boolean DEFAULT false,
    created_by uuid REFERENCES users(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    updated_by uuid,
    deleted_at timestamptz,
    deleted_by uuid
);

-- Workspaces
CREATE TABLE workspaces (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    rechnungen_nur_zugewiesene boolean DEFAULT false,
    is_active boolean DEFAULT true,
    access_dashboard permission_level DEFAULT 'none',
    access_projekte permission_level DEFAULT 'none',
    access_rechnungen permission_level DEFAULT 'none',
    access_bewegungen permission_level DEFAULT 'none',
    access_lieferanten permission_level DEFAULT 'none',
    access_mitglieder permission_level DEFAULT 'none',
    access_einnahmen permission_level DEFAULT 'none',
    access_konfiguration permission_level DEFAULT 'none',
    access_inventar permission_level DEFAULT 'none',
    access_reporting permission_level DEFAULT 'none',
    access_zeiterfassung text DEFAULT 'none',
    access_rechnungen_bezahlt boolean DEFAULT false,
    created_by uuid,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- User Workspaces
CREATE TABLE user_workspaces (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    workspace_id uuid NOT NULL REFERENCES workspaces(id),
    is_admin boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    created_by uuid
);

-- Suppliers
CREATE TABLE suppliers (
    id bigserial PRIMARY KEY,
    partita_iva text NOT NULL,
    fornitore_nr text,
    fornitore_name text NOT NULL,
    address text,
    city text,
    country text DEFAULT 'IT',
    email text,
    phone text,
    codice_fiscale text,
    is_kursanbieter boolean DEFAULT false,
    contact_user_id uuid REFERENCES users(id),
    import_date timestamptz DEFAULT now(),
    import_file_name text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    deleted_at timestamptz,
    deleted_by uuid
);

-- Funding Sources
CREATE TABLE funding_sources (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code text NOT NULL,
    name text NOT NULL,
    source text,
    amount numeric NOT NULL DEFAULT 0,
    year integer NOT NULL,
    fiscal_year integer NOT NULL DEFAULT EXTRACT(year FROM now())::integer,
    is_abgabestelle boolean DEFAULT false,
    status text DEFAULT 'offen',
    notes text,
    document_path text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    deleted_at timestamptz,
    deleted_by uuid
);

-- Members
CREATE TABLE members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    member_number integer,
    last_name text NOT NULL,
    first_name text,
    gender text,
    language text,
    address text,
    postal_code text,
    city text,
    email text,
    phone text,
    birth_year integer,
    birth_date date,
    tax_number text,
    membership_fee numeric DEFAULT 0,
    donation numeric DEFAULT 0,
    join_date date,
    payment_method text,
    hashtag text,
    notes text,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    deleted_at timestamptz,
    deleted_by uuid
);

-- Cost Types
CREATE TABLE cost_types (
    id varchar PRIMARY KEY,
    name varchar NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    deleted_at timestamptz,
    deleted_by uuid
);

-- Chart of Accounts
CREATE TABLE chart_of_accounts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    konto_pattern text NOT NULL,
    konto_name text,
    kategorie text,
    beschreibung text,
    db_zuordnung text NOT NULL DEFAULT 'NEUTRAL',
    ist_projektbezogen boolean DEFAULT false,
    sort_order integer DEFAULT 0,
    ist_aktiv boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    deleted_at timestamptz,
    deleted_by uuid
);

-- Konto Bezeichnungen
CREATE TABLE konto_bezeichnungen (
    konto_nr text PRIMARY KEY,
    beschreibung_it text,
    beschreibung_de text,
    typ text,
    ist_summe boolean DEFAULT false
);

-- =====================================================
-- 3. TABLES WITH FOREIGN KEYS
-- =====================================================

-- Budget Items (legacy)
CREATE TABLE budget_items (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id uuid REFERENCES projects(id),
    category varchar NOT NULL,
    description text,
    planned_amount numeric NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    deleted_at timestamptz,
    deleted_by uuid
);

-- Costs (legacy)
CREATE TABLE costs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id uuid REFERENCES projects(id),
    budget_item_id uuid REFERENCES budget_items(id),
    category varchar NOT NULL,
    description text NOT NULL,
    amount numeric NOT NULL,
    cost_type varchar NOT NULL,
    date date NOT NULL,
    supplier varchar,
    invoice_number varchar,
    file_path text,
    created_by uuid REFERENCES users(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    updated_by uuid,
    deleted_at timestamptz,
    deleted_by uuid
);

-- Budget Entries
CREATE TABLE budget_entries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    konto_nr text NOT NULL,
    konto_name text,
    projekt_id uuid REFERENCES projects(id),
    description text NOT NULL,
    fiscal_year integer NOT NULL,
    jan numeric DEFAULT 0,
    feb numeric DEFAULT 0,
    mar numeric DEFAULT 0,
    apr numeric DEFAULT 0,
    mai numeric DEFAULT 0,
    jun numeric DEFAULT 0,
    jul numeric DEFAULT 0,
    aug numeric DEFAULT 0,
    sep numeric DEFAULT 0,
    okt numeric DEFAULT 0,
    nov numeric DEFAULT 0,
    dez numeric DEFAULT 0,
    entry_type text DEFAULT 'budget',
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid
);

-- Budget Notes
CREATE TABLE budget_notes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    fiscal_year integer NOT NULL,
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid
);

-- Budget Konto Notes
CREATE TABLE budget_konto_notes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    konto_nr text NOT NULL,
    fiscal_year integer NOT NULL,
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid
);

-- Anwesenheit Planung
CREATE TABLE anwesenheit_planung (
    id bigserial PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES users(id),
    datum date NOT NULL,
    im_buero boolean DEFAULT false,
    mittagessen boolean DEFAULT false,
    abwesenheit_grund varchar,
    abwesenheit_notiz text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Essensgutschein Bestellungen
CREATE TABLE essensgutschein_bestellungen (
    id bigserial PRIMARY KEY,
    jahr integer NOT NULL,
    monat integer NOT NULL,
    anzahl_bestellt integer NOT NULL DEFAULT 0,
    anzahl_geplant integer DEFAULT 0,
    status varchar DEFAULT 'offen',
    bestellt_am date,
    geliefert_am date,
    notizen text,
    created_by uuid,
    created_at timestamptz DEFAULT now(),
    updated_by uuid,
    updated_at timestamptz DEFAULT now()
);

-- DATEV Bookings
CREATE TABLE datev_bookings (
    id bigserial PRIMARY KEY,
    import_year integer NOT NULL,
    import_month integer,
    import_date timestamptz DEFAULT now(),
    import_file_name text,
    partita_iva text,
    partita_iva_cliente text,
    fornitore_nr text,
    fornitore_name text NOT NULL,
    dokument_nr text NOT NULL,
    dokument_typ text,
    ist_gutschrift boolean DEFAULT false,
    betrag numeric,
    betrag_netto numeric,
    betrag_mwst numeric,
    betrag_gesamt numeric,
    mwst_typ text,
    mwst_rate numeric DEFAULT 22,
    datum date NOT NULL,
    datum_registrazione date,
    datum_documento date,
    datum_competenza date,
    projekt_id text,
    beschreibung text,
    kategorie text,
    konto_nr text,
    kostentyp text,
    kostentyp_am date,
    kostentyp_von uuid,
    abgabestelle text,
    abgabestelle_am date,
    archived boolean DEFAULT false,
    archived_at timestamptz,
    workflow_status text DEFAULT 'neu',
    kontrolled_at date,
    kontrolled_by uuid,
    kontrolliert_von uuid REFERENCES users(id),
    kontrolliert_am date,
    paid_at date,
    paid_by uuid,
    bezahlt_am date,
    notizen text,
    linked_invoice_id uuid,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    deleted_at timestamptz,
    deleted_by uuid
);

-- Invoices
CREATE TABLE invoices (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_path text NOT NULL,
    file_name text NOT NULL,
    file_size integer,
    partita_iva text,
    invoice_number text,
    fornitore_name text,
    datev_buchung_id integer,
    status text DEFAULT 'uploaded',
    workflow_status text DEFAULT 'neu',
    kostentyp text,
    project_id uuid REFERENCES projects(id),
    funding_source_id uuid REFERENCES funding_sources(id),
    linked_datev_id bigint REFERENCES datev_bookings(id),
    linked_booking_id bigint REFERENCES datev_bookings(id),
    archived boolean DEFAULT false,
    archived_at timestamptz,
    uploaded_by uuid,
    uploaded_at timestamptz DEFAULT now(),
    kontrolled_by uuid,
    kontrolled_at timestamptz,
    paid_by uuid,
    paid_at timestamptz,
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz,
    created_by uuid,
    updated_by uuid,
    deleted_at timestamptz,
    deleted_by uuid
);

-- Add FK for datev_bookings.linked_invoice_id (after invoices created)
ALTER TABLE datev_bookings ADD CONSTRAINT fk_datev_linked_invoice
    FOREIGN KEY (linked_invoice_id) REFERENCES invoices(id);

-- Member Payments
CREATE TABLE member_payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id uuid NOT NULL REFERENCES members(id),
    year integer NOT NULL,
    amount numeric,
    payment_date date,
    datev_buchung_id text,
    datev_buchungstext text,
    notes text,
    created_at timestamptz DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    deleted_at timestamptz,
    deleted_by uuid
);

-- Time Entries
CREATE TABLE time_entries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid REFERENCES projects(id),
    user_id uuid REFERENCES users(id),
    supplier_partita_iva text REFERENCES suppliers(partita_iva),
    date date NOT NULL,
    hours numeric NOT NULL,
    description text,
    activity_type varchar,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    deleted_at timestamptz,
    deleted_by uuid
);

-- =====================================================
-- 4. KURS TABLES
-- =====================================================

-- Kurs Kategorien
CREATE TABLE kurs_kategorien (
    id bigserial PRIMARY KEY,
    code varchar NOT NULL,
    name varchar NOT NULL,
    beschreibung text,
    farbe varchar DEFAULT '#3498db',
    sortierung integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- Kurs Anbieter
CREATE TABLE kurs_anbieter (
    id bigserial PRIMARY KEY,
    name varchar NOT NULL,
    kontakt_person varchar,
    email varchar,
    telefon varchar,
    adresse text,
    notizen text,
    is_active boolean DEFAULT true,
    created_by uuid,
    created_at timestamptz DEFAULT now(),
    updated_by uuid,
    updated_at timestamptz DEFAULT now()
);

-- Kurse
CREATE TABLE kurse (
    id bigserial PRIMARY KEY,
    name varchar NOT NULL,
    beschreibung text,
    kategorie_id bigint REFERENCES kurs_kategorien(id),
    anbieter_id bigint REFERENCES kurs_anbieter(id),
    ist_pflicht boolean DEFAULT false,
    gueltigkeit_monate integer,
    erinnerung_tage integer DEFAULT 30,
    kosten_pro_person numeric,
    kosten_pauschal numeric,
    dauer_stunden numeric,
    is_active boolean DEFAULT true,
    created_by uuid,
    created_at timestamptz DEFAULT now(),
    updated_by uuid,
    updated_at timestamptz DEFAULT now()
);

-- Kurs Termine
CREATE TABLE kurs_termine (
    id bigserial PRIMARY KEY,
    kurs_id bigint NOT NULL REFERENCES kurse(id),
    datum date NOT NULL,
    uhrzeit_von time,
    uhrzeit_bis time,
    ort varchar,
    online boolean DEFAULT false,
    online_link text,
    kosten_gesamt numeric,
    status varchar DEFAULT 'geplant',
    notizen text,
    created_by uuid,
    created_at timestamptz DEFAULT now(),
    updated_by uuid,
    updated_at timestamptz DEFAULT now()
);

-- Kurs Teilnehmer
CREATE TABLE kurs_teilnehmer (
    id bigserial PRIMARY KEY,
    termin_id bigint NOT NULL REFERENCES kurs_termine(id),
    user_id uuid NOT NULL REFERENCES users(id),
    status varchar DEFAULT 'angemeldet',
    zertifikat_erhalten boolean DEFAULT false,
    zertifikat_datum date,
    zertifikat_ablauf date,
    zertifikat_datei text,
    notizen text,
    created_by uuid,
    created_at timestamptz DEFAULT now(),
    updated_by uuid,
    updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- 5. SHOP TABLES
-- =====================================================

-- Shop Artikeltypen
CREATE TABLE shop_artikeltypen (
    id bigserial PRIMARY KEY,
    code varchar NOT NULL,
    name varchar NOT NULL,
    is_system boolean DEFAULT false,
    sortierung integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- Shop Artikel
CREATE TABLE shop_artikel (
    id bigserial PRIMARY KEY,
    artikelnr varchar NOT NULL,
    name varchar NOT NULL,
    beschreibung text,
    artikeltyp varchar,
    hersteller text,
    autor text,
    einkaufsjahr varchar,
    standort varchar DEFAULT 'Shop',
    einkaufspreis numeric,
    verkaufspreis numeric NOT NULL,
    mwst_satz varchar DEFAULT '22',
    bestand_aktuell integer DEFAULT 0,
    bestand_min integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_by uuid,
    created_at timestamptz DEFAULT now(),
    updated_by uuid,
    updated_at timestamptz DEFAULT now()
);

-- Shop Eintritt Kategorien
CREATE TABLE shop_eintritt_kategorien (
    id bigserial PRIMARY KEY,
    code varchar NOT NULL,
    name varchar NOT NULL,
    preis numeric NOT NULL,
    mwst_satz numeric DEFAULT 22.00,
    is_active boolean DEFAULT true,
    sortierung integer DEFAULT 0,
    gueltig_ab date,
    gueltig_bis date,
    created_at timestamptz DEFAULT now()
);

-- Shop Mitglied Kategorien
CREATE TABLE shop_mitglied_kategorien (
    id bigserial PRIMARY KEY,
    code varchar NOT NULL,
    name varchar NOT NULL,
    betrag numeric NOT NULL,
    is_active boolean DEFAULT true,
    sortierung integer DEFAULT 0,
    gueltig_ab date,
    gueltig_bis date,
    created_at timestamptz DEFAULT now()
);

-- Shop Externe Empfaenger
CREATE TABLE shop_externe_empfaenger (
    id bigserial PRIMARY KEY,
    name varchar NOT NULL,
    notiz text,
    created_by uuid,
    created_at timestamptz DEFAULT now()
);

-- Shop Verkaeufe
CREATE TABLE shop_verkaeufe (
    id bigserial PRIMARY KEY,
    datum date NOT NULL DEFAULT CURRENT_DATE,
    uhrzeit time DEFAULT CURRENT_TIME,
    typ varchar NOT NULL,
    artikel_id bigint REFERENCES shop_artikel(id),
    eintritt_kategorie varchar,
    mitglied_kategorie varchar,
    mitglied_name text,
    menge integer NOT NULL DEFAULT 1,
    einzelpreis numeric NOT NULL,
    mwst_satz varchar,
    gesamtpreis numeric NOT NULL,
    zahlungsart varchar NOT NULL DEFAULT 'bar',
    tageszeit varchar,
    notizen text,
    storniert boolean DEFAULT false,
    storniert_at timestamptz,
    storniert_by uuid,
    created_by uuid,
    created_at timestamptz DEFAULT now()
);

-- Shop Einkaeufe
CREATE TABLE shop_einkaeufe (
    id bigserial PRIMARY KEY,
    artikel_id bigint REFERENCES shop_artikel(id),
    datum date NOT NULL DEFAULT CURRENT_DATE,
    menge integer NOT NULL,
    einzelpreis numeric,
    gesamtpreis numeric,
    lieferant_name text,
    rechnung_nr text,
    notizen text,
    created_by uuid,
    created_at timestamptz DEFAULT now()
);

-- Shop Ausgaben
CREATE TABLE shop_ausgaben (
    id bigserial PRIMARY KEY,
    datum date NOT NULL DEFAULT CURRENT_DATE,
    uhrzeit time DEFAULT CURRENT_TIME,
    artikel_id bigint NOT NULL REFERENCES shop_artikel(id),
    menge integer NOT NULL DEFAULT 1,
    empfaenger_typ varchar NOT NULL,
    empfaenger_user_id uuid REFERENCES users(id),
    empfaenger_extern_id bigint REFERENCES shop_externe_empfaenger(id),
    empfaenger_extern_name varchar,
    empfaenger_extern_notiz text,
    zweck text,
    created_by uuid,
    created_at timestamptz DEFAULT now()
);

-- Shop Kassen Bewegungen
CREATE TABLE shop_kassen_bewegungen (
    id bigserial PRIMARY KEY,
    datum date NOT NULL DEFAULT CURRENT_DATE,
    uhrzeit time DEFAULT CURRENT_TIME,
    typ varchar NOT NULL,
    betrag numeric NOT NULL,
    grund text,
    storniert boolean DEFAULT false,
    created_by uuid,
    created_at timestamptz DEFAULT now()
);

-- Shop Kassenabschluss
CREATE TABLE shop_kassenabschluss (
    id bigserial PRIMARY KEY,
    datum date NOT NULL,
    anfangsbestand_bar numeric DEFAULT 0,
    einnahmen_bar numeric DEFAULT 0,
    einnahmen_pos numeric DEFAULT 0,
    einnahmen_gesamt numeric DEFAULT 0,
    ausgaenge_bar numeric DEFAULT 0,
    endbestand_bar_soll numeric DEFAULT 0,
    endbestand_bar_ist numeric,
    differenz numeric,
    anzahl_verkaeufe integer DEFAULT 0,
    kassiert_von uuid,
    notizen text,
    abgeschlossen boolean DEFAULT false,
    abgeschlossen_at timestamptz,
    created_at timestamptz DEFAULT now()
);

-- =====================================================
-- 6. VIEWS
-- =====================================================

-- User Permissions View
CREATE OR REPLACE VIEW user_permissions AS
SELECT
    u.id as user_id,
    u.email as user_email,
    MAX(w.access_dashboard) as access_dashboard,
    MAX(w.access_projekte) as access_projekte,
    MAX(w.access_rechnungen) as access_rechnungen,
    MAX(w.access_bewegungen) as access_bewegungen,
    MAX(w.access_lieferanten) as access_lieferanten,
    MAX(w.access_mitglieder) as access_mitglieder,
    MAX(w.access_einnahmen) as access_einnahmen,
    MAX(w.access_konfiguration) as access_konfiguration,
    MAX(w.access_inventar) as access_inventar,
    MAX(w.access_reporting) as access_reporting,
    BOOL_OR(w.rechnungen_nur_zugewiesene) as rechnungen_nur_zugewiesene,
    BOOL_OR(uw.is_admin) as is_workspace_admin
FROM users u
LEFT JOIN user_workspaces uw ON u.id = uw.user_id
LEFT JOIN workspaces w ON uw.workspace_id = w.id AND w.is_active = true
GROUP BY u.id, u.email;

-- Heute Anwesend View
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
JOIN users u ON ap.user_id = u.id
WHERE ap.datum = CURRENT_DATE;

-- Ablaufende Zertifikate View
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
    (kt.zertifikat_ablauf - CURRENT_DATE)::integer as tage_bis_ablauf
FROM kurs_teilnehmer kt
JOIN users u ON kt.user_id = u.id
JOIN kurs_termine kterm ON kt.termin_id = kterm.id
JOIN kurse k ON kterm.kurs_id = k.id
LEFT JOIN kurs_kategorien kk ON k.kategorie_id = kk.id
WHERE kt.zertifikat_ablauf IS NOT NULL;

-- Essensgutscheine Tagesstatistik View
CREATE OR REPLACE VIEW v_essensgutscheine_tagesstatistik AS
SELECT
    datum,
    COUNT(*) FILTER (WHERE im_buero = true) as anzahl_im_buero,
    COUNT(*) FILTER (WHERE mittagessen = true) as anzahl_mittagessen,
    COUNT(*) FILTER (WHERE abwesenheit_grund = 'homeoffice') as anzahl_homeoffice,
    COUNT(*) FILTER (WHERE abwesenheit_grund = 'urlaub') as anzahl_urlaub,
    COUNT(*) FILTER (WHERE abwesenheit_grund = 'krank') as anzahl_krank
FROM anwesenheit_planung
GROUP BY datum;

-- Essensgutscheine Monatsstatistik View
CREATE OR REPLACE VIEW v_essensgutscheine_monatsstatistik AS
SELECT
    EXTRACT(year FROM datum)::integer as jahr,
    EXTRACT(month FROM datum)::integer as monat,
    COUNT(*) FILTER (WHERE mittagessen = true) as anzahl_mittagessen,
    COUNT(DISTINCT user_id) FILTER (WHERE im_buero = true) as anzahl_mitarbeiter_vor_ort,
    COUNT(*) as anzahl_tage_geplant
FROM anwesenheit_planung
GROUP BY EXTRACT(year FROM datum), EXTRACT(month FROM datum);

-- =====================================================
-- 7. INDEXES
-- =====================================================

-- DATEV Bookings
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_datev_booking_v2
ON datev_bookings (import_year, partita_iva, dokument_nr, betrag, datum)
WHERE deleted_at IS NULL;

CREATE INDEX idx_datev_bookings_projekt ON datev_bookings(projekt_id);
CREATE INDEX idx_datev_bookings_datum ON datev_bookings(datum);
CREATE INDEX idx_datev_bookings_workflow ON datev_bookings(workflow_status);

-- Invoices
CREATE INDEX idx_invoices_partita_iva ON invoices(partita_iva);
CREATE INDEX idx_invoices_project ON invoices(project_id);
CREATE INDEX idx_invoices_status ON invoices(workflow_status);

-- Members
CREATE INDEX idx_members_active ON members(is_active);
CREATE INDEX idx_members_name ON members(last_name, first_name);

-- Shop
CREATE INDEX idx_shop_verkaeufe_datum ON shop_verkaeufe(datum);
CREATE INDEX idx_shop_artikel_active ON shop_artikel(is_active);

-- Budget
CREATE INDEX idx_budget_entries_year ON budget_entries(fiscal_year);
CREATE INDEX idx_budget_entries_konto ON budget_entries(konto_nr);

-- Anwesenheit
CREATE INDEX idx_anwesenheit_datum ON anwesenheit_planung(datum);
CREATE INDEX idx_anwesenheit_user ON anwesenheit_planung(user_id);

-- =====================================================
-- 8. GRANTS (for kunstmeran_app user)
-- =====================================================

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO kunstmeran_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO kunstmeran_app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO kunstmeran_app;

-- =====================================================
-- DONE!
-- =====================================================
