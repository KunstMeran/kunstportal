# Datenbank-Schema

Dokumentation aller Tabellen und Spalten in der Supabase PostgreSQL-Datenbank.

**Stand:** 2026-08-01

## Übersicht Tabellen

| Tabelle | Beschreibung |
|---------|--------------|
| budget_entries | Budgeteinträge pro Konto und Monat |
| budget_items | Budget-Positionen (Legacy) |
| budget_konto_notes | Notizen zu Konten im Budget |
| budget_notes | Allgemeine Budget-Notizen |
| chart_of_accounts | Kontenplan mit Kategorien |
| cost_types | Kostenarten |
| costs | Einzelkosten (Legacy) |
| datev_bookings | DATEV-Buchungen aus Excel-Import |
| invoices | Rechnungen/PDFs |
| projects | Projekte |
| suppliers | Lieferanten |

---

## budget_entries

Budgeteinträge mit monatlichen Werten pro Konto.

| Spalte | Datentyp | Nullable | Beschreibung |
|--------|----------|----------|--------------|
| id | uuid | NO | Primärschlüssel |
| konto_nr | text | NO | Kontonummer |
| konto_name | text | YES | Kontobezeichnung |
| projekt_id | uuid | YES | Verknüpftes Projekt |
| description | text | NO | Beschreibung |
| fiscal_year | integer | NO | Geschäftsjahr |
| jan | numeric | YES | Januar-Budget |
| feb | numeric | YES | Februar-Budget |
| mar | numeric | YES | März-Budget |
| apr | numeric | YES | April-Budget |
| mai | numeric | YES | Mai-Budget |
| jun | numeric | YES | Juni-Budget |
| jul | numeric | YES | Juli-Budget |
| aug | numeric | YES | August-Budget |
| sep | numeric | YES | September-Budget |
| okt | numeric | YES | Oktober-Budget |
| nov | numeric | YES | November-Budget |
| dez | numeric | YES | Dezember-Budget |
| entry_type | text | YES | Eintragstyp |
| notes | text | YES | Notizen |
| created_at | timestamp with time zone | YES | Erstelldatum |
| updated_at | timestamp with time zone | YES | Änderungsdatum |
| created_by | uuid | YES | Erstellt von (User-ID) |

---

## budget_items

Budget-Positionen (Legacy-Tabelle).

| Spalte | Datentyp | Nullable | Beschreibung |
|--------|----------|----------|--------------|
| id | uuid | NO | Primärschlüssel |
| project_id | uuid | YES | Projekt-ID |
| category | character varying | NO | Kategorie |
| description | text | YES | Beschreibung |
| planned_amount | numeric | NO | Geplanter Betrag |
| created_at | timestamp with time zone | YES | Erstelldatum |
| updated_at | timestamp with time zone | YES | Änderungsdatum |

---

## budget_konto_notes

Notizen zu einzelnen Konten im Budget.

| Spalte | Datentyp | Nullable | Beschreibung |
|--------|----------|----------|--------------|
| id | uuid | NO | Primärschlüssel |
| konto_nr | text | NO | Kontonummer |
| fiscal_year | integer | NO | Geschäftsjahr |
| notes | text | YES | Notiztext |
| created_at | timestamp with time zone | YES | Erstelldatum |
| updated_at | timestamp with time zone | YES | Änderungsdatum |
| created_by | uuid | YES | Erstellt von (User-ID) |

---

## budget_notes

Allgemeine Budget-Notizen pro Geschäftsjahr.

| Spalte | Datentyp | Nullable | Beschreibung |
|--------|----------|----------|--------------|
| id | uuid | NO | Primärschlüssel |
| fiscal_year | integer | NO | Geschäftsjahr |
| notes | text | YES | Notiztext |
| created_at | timestamp with time zone | YES | Erstelldatum |
| updated_at | timestamp with time zone | YES | Änderungsdatum |
| created_by | uuid | YES | Erstellt von (User-ID) |

---

## chart_of_accounts

Kontenplan mit Kategorisierung und Zuordnung.

| Spalte | Datentyp | Nullable | Beschreibung |
|--------|----------|----------|--------------|
| id | uuid | NO | Primärschlüssel |
| konto_pattern | text | NO | Kontonummer-Muster (z.B. "68*") |
| konto_name | text | YES | Kontobezeichnung |
| kategorie | text | YES | Kategorie |
| beschreibung | text | YES | Beschreibung |
| db_zuordnung | text | NO | DB-Zuordnung (Kosten/Erlöse) |
| ist_projektbezogen | boolean | YES | Projektbezogenes Konto? |
| sort_order | integer | YES | Sortierreihenfolge |
| ist_aktiv | boolean | YES | Aktives Konto? |
| created_at | timestamp with time zone | YES | Erstelldatum |
| updated_at | timestamp with time zone | YES | Änderungsdatum |

---

## cost_types

Kostenarten-Stammdaten.

| Spalte | Datentyp | Nullable | Beschreibung |
|--------|----------|----------|--------------|
| id | character varying | NO | Primärschlüssel |
| name | character varying | NO | Name der Kostenart |
| description | text | YES | Beschreibung |
| is_active | boolean | YES | Aktiv? |
| created_at | timestamp with time zone | YES | Erstelldatum |

---

## costs

Einzelkosten (Legacy-Tabelle).

| Spalte | Datentyp | Nullable | Beschreibung |
|--------|----------|----------|--------------|
| id | uuid | NO | Primärschlüssel |
| project_id | uuid | YES | Projekt-ID |
| budget_item_id | uuid | YES | Budget-Position |
| category | character varying | NO | Kategorie |
| description | text | NO | Beschreibung |
| amount | numeric | NO | Betrag |
| cost_type | character varying | NO | Kostenart |
| date | date | NO | Datum |
| supplier | character varying | YES | Lieferant |
| invoice_number | character varying | YES | Rechnungsnummer |
| created_by | uuid | YES | Erstellt von |
| created_at | timestamp with time zone | YES | Erstelldatum |
| updated_at | timestamp with time zone | YES | Änderungsdatum |
| file_path | text | YES | Dateipfad |

---

## datev_bookings

DATEV-Buchungen aus Excel-Import.

| Spalte | Datentyp | Nullable | Beschreibung |
|--------|----------|----------|--------------|
| id | bigint | NO | Primärschlüssel (Auto-Increment) |
| import_year | integer | NO | Import-Jahr |
| import_month | integer | YES | Import-Monat |
| import_date | timestamp with time zone | YES | Import-Zeitpunkt |
| import_file_name | text | YES | Import-Dateiname |
| partita_iva | text | YES | Partita IVA (MwSt-Nr) |
| partita_iva_cliente | text | YES | Kunden-Partita IVA |
| fornitore_nr | text | YES | Lieferanten-Nummer |
| fornitore_name | text | NO | Lieferanten-Name |
| dokument_nr | text | NO | Dokumentnummer |
| dokument_typ | text | YES | Dokumenttyp (F=Fattura) |
| ist_gutschrift | boolean | YES | Ist Gutschrift? |
| betrag | numeric | YES | Betrag |
| betrag_netto | numeric | YES | Nettobetrag |
| betrag_mwst | numeric | YES | MwSt-Betrag |
| betrag_gesamt | numeric | YES | Gesamtbetrag |
| mwst_typ | text | YES | MwSt-Typ |
| datum | date | NO | Buchungsdatum |
| projekt_id | text | YES | Projekt-ID/Kostenstelle |
| beschreibung | text | YES | Buchungsbeschreibung |
| kategorie | text | YES | Kategorie |
| linked_invoice_id | uuid | YES | Verknüpfte Rechnung |
| created_at | timestamp with time zone | YES | Erstelldatum |
| updated_at | timestamp with time zone | YES | Änderungsdatum |
| konto_nr | text | YES | Kontonummer |
| archived | boolean | YES | Archiviert? |
| archived_at | timestamp with time zone | YES | Archiviert am |

### Unique Index

```sql
CREATE UNIQUE INDEX idx_unique_datev_booking_v2
ON datev_bookings (
    COALESCE(partita_iva, ''),
    COALESCE(dokument_nr, ''),
    datum,
    betrag,
    COALESCE(konto_nr, ''),
    COALESCE(LEFT(fornitore_name, 50), ''),
    COALESCE(LEFT(beschreibung, 50), '')
);
```

---

## invoices

Rechnungen/PDFs mit Verknüpfungen zu DATEV-Buchungen.

| Spalte | Datentyp | Nullable | Beschreibung |
|--------|----------|----------|--------------|
| id | uuid | NO | Primärschlüssel |
| file_path | text | NO | Dateipfad im Storage |
| file_name | text | NO | Dateiname |
| file_size | integer | YES | Dateigröße in Bytes |
| partita_iva | text | YES | Partita IVA des Lieferanten |
| invoice_number | text | YES | Rechnungsnummer |
| datev_buchung_id | integer | YES | (Legacy) DATEV-Buchungs-ID |
| status | text | YES | Status (pending/kontrolliert/bezahlt) |
| project_id | uuid | YES | Verknüpftes Projekt |
| uploaded_by | uuid | YES | Hochgeladen von (User-ID) |
| uploaded_at | timestamp with time zone | YES | Hochgeladen am |
| kontrolled_by | uuid | YES | Kontrolliert von (User-ID) |
| kontrolled_at | timestamp with time zone | YES | Kontrolliert am |
| paid_by | uuid | YES | Bezahlt von (User-ID) |
| paid_at | timestamp with time zone | YES | Bezahlt am |
| created_at | timestamp with time zone | YES | Erstelldatum |
| notes | text | YES | Notizen |
| kostentyp | text | YES | Kostentyp |
| funding_source_id | uuid | YES | Finanzierungsquelle |
| linked_datev_id | bigint | YES | (Legacy) Verknüpfte DATEV-ID |
| archived | boolean | YES | Archiviert? |
| archived_at | timestamp with time zone | YES | Archiviert am |
| linked_booking_id | bigint | YES | Verknüpfte DATEV-Buchung (FK) |
| fornitore_name | text | YES | Lieferantenname |

---

## projects

Projekte/Ausstellungen.

| Spalte | Datentyp | Nullable | Beschreibung |
|--------|----------|----------|--------------|
| id | uuid | NO | Primärschlüssel |
| name | character varying | NO | Projektname |
| description | text | YES | Beschreibung |
| location | character varying | YES | Ort |
| start_date | date | YES | Startdatum |
| end_date | date | YES | Enddatum |
| status | character varying | NO | Status |
| created_by | uuid | YES | Erstellt von (User-ID) |
| created_at | timestamp with time zone | YES | Erstelldatum |
| updated_at | timestamp with time zone | YES | Änderungsdatum |
| datev_id | character varying | YES | DATEV-Kostenstelle |
| budget | numeric | YES | Budget |
| pl1 | text | YES | Projektleiter 1 |
| pl2 | text | YES | Projektleiter 2 |
| dropbox_link | text | YES | Dropbox-Link |
| pl3 | character varying | YES | Projektleiter 3 |
| ist_ausstellung | boolean | YES | Ist Ausstellung? |

---

## suppliers

Lieferanten-Stammdaten.

| Spalte | Datentyp | Nullable | Beschreibung |
|--------|----------|----------|--------------|
| id | bigint | NO | Primärschlüssel (Auto-Increment) |
| partita_iva | text | NO | Partita IVA (Unique) |
| fornitore_nr | text | YES | Lieferantennummer |
| fornitore_name | text | NO | Lieferantenname |
| address | text | YES | Adresse |
| city | text | YES | Stadt |
| country | text | YES | Land (Default: IT) |
| email | text | YES | E-Mail |
| phone | text | YES | Telefon |
| import_date | timestamp with time zone | YES | Import-Datum |
| import_file_name | text | YES | Import-Dateiname |
| created_at | timestamp with time zone | YES | Erstelldatum |
| updated_at | timestamp with time zone | YES | Änderungsdatum |
| codice_fiscale | text | YES | Codice Fiscale |
| contact_user_id | uuid | YES | Zuständiger Benutzer |

---

## SQL-Abfrage für Schema

```sql
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;
```
