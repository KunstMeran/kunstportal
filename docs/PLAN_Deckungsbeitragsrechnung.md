# Plan: Deckungsbeitragsrechnung (DB-Reporting)

**Stand:** Juli 2026
**Status:** Zur Freigabe

---

## Ziel

Ein automatisiertes Deckungsbeitrags-Reporting, das:
1. DATEV-Konten automatisch den DB-Stufen zuordnet
2. Direkte Projektkosten vom DB1 erfasst
3. Gemeinkosten proportional nach Ausstellungsdauer auf Projekte verteilt
4. Nicht-projektbezogene Einnahmen separat UND im Gesamt-DB zeigt

---

## Datenmodell

### 1. Neue Tabelle: `chart_of_accounts` (Kontenplan)

```sql
CREATE TABLE chart_of_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    konto_nr TEXT NOT NULL UNIQUE,        -- z.B. "6901251"
    konto_name TEXT,                       -- z.B. "DL Ausstellung"
    konto_bereich TEXT,                    -- z.B. "690125*" (Pattern)
    db_zuordnung TEXT NOT NULL,            -- 'UMSATZ', 'DB1_KOSTEN', 'DB2_KOSTEN', 'DB3_KOSTEN', 'NEUTRAL'
    kategorie TEXT,                        -- z.B. "Dienstleistungen Ausstellung"
    beschreibung TEXT,
    ist_projektbezogen BOOLEAN DEFAULT false,  -- true = Kosten gehen nur in DB1 wenn Projekt zugewiesen
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**DB-Zuordnungen:**

| Wert | Bedeutung | Beispiel-Konten |
|------|-----------|-----------------|
| `UMSATZ` | Einnahmen/Erlöse | 6001*, 6401*, 6400* |
| `DB1_KOSTEN` | Direkte Projektkosten | 680*, 690125*, 69033* |
| `DB2_KOSTEN` | Strukturkosten (Verwaltung, Marketing) | 6901*, 6902* |
| `DB3_KOSTEN` | Fixkosten (Miete, Personal, Gebäude) | 700*, 710*, 69024* |
| `NEUTRAL` | Nicht in DB-Rechnung (z.B. Durchlaufposten) | - |

### 2. Erweiterung: `projects` Tabelle

Bereits vorhanden:
- `start_date` - Ausstellungsbeginn
- `end_date` - Ausstellungsende

Neu hinzufügen:
```sql
ALTER TABLE projects ADD COLUMN IF NOT EXISTS
    ist_ausstellung BOOLEAN DEFAULT true;  -- false = z.B. "Allgemein/Verwaltung"
```

---

## Berechnungslogik

### Schritt 1: Projekt-Gewichtung berechnen

```
Projekt-Gewicht = Anzahl Tage (end_date - start_date + 1)
Gesamt-Tage = Summe aller Projekt-Gewichte im Zeitraum
Anteil Projekt X = Projekt-X-Tage / Gesamt-Tage
```

**Beispiel 2026:**
| Projekt | Start | Ende | Tage | Anteil |
|---------|-------|------|------|--------|
| Complice | 01.03 | 15.06 | 107 | 35% |
| Animacies | 01.07 | 30.09 | 92 | 30% |
| Menschenbilder | 15.10 | 15.12 | 62 | 20% |
| Konzertreihe | diverse | diverse | 45 | 15% |
| **Gesamt** | | | **306** | **100%** |

### Schritt 2: DB1 pro Projekt

```
DB1 (Projekt X) =
    Projektbezogene Einnahmen (Projekt X)
  - Direkte Kosten mit projekt_id = X
```

**Wichtig:** Nur Buchungen mit `projekt_id` werden direkt zugeordnet.

### Schritt 3: DB2 pro Projekt

```
DB2 (Projekt X) =
    DB1 (Projekt X)
  - (Strukturkosten GESAMT × Anteil Projekt X)
```

### Schritt 4: DB3 pro Projekt

```
DB3 (Projekt X) =
    DB2 (Projekt X)
  - (Fixkosten GESAMT × Anteil Projekt X)
```

### Schritt 5: Gesamt-DB (mit allen Einnahmen)

```
Gesamt-DB =
    Alle Einnahmen (inkl. Mitgliedsbeiträge, allg. Förderungen)
  - Alle Kosten

= Summe aller Projekt-DB3
  + Nicht-projektbezogene Einnahmen
```

---

## UI-Design

### 1. Konfiguration > Kontenplan

**Neue Seite unter Konfiguration:**

```
+------------------------------------------------------------------+
| Kontenplan                                        [+ Konto]       |
+------------------------------------------------------------------+
| Suche: [________________]  Filter: [Alle DB-Stufen ▼]            |
+------------------------------------------------------------------+
| Konto-Nr | Name                  | Kategorie      | DB-Zuordnung |
|----------|----------------------|----------------|--------------|
| 6001*    | Erlöse Lieferungen   | Umsatz         | [UMSATZ ▼]   |
| 680*     | Materialkosten       | Material       | [DB1 ▼]      |
| 6901*    | Verwaltung           | Verwaltung     | [DB2 ▼]      |
| 700*     | Miete                | Fixkosten      | [DB3 ▼]      |
+------------------------------------------------------------------+
```

**Features:**
- Pattern-basierte Zuordnung (680* matched 6800750, 6802510, etc.)
- Dropdown für DB-Zuordnung
- Checkbox "Projektbezogen" (für DB1-Kosten)
- Import aus CSV (vorhandene Kontenzuordnung_DB-Rechnung.csv)

### 2. Reporting > Deckungsbeiträge

**Neue Hauptnavigation:**

```
+------------------------------------------------------------------+
| Deckungsbeitragsrechnung 2026                    [CSV] [PDF]     |
+------------------------------------------------------------------+
| Zeitraum: [01.01.2026] bis [31.12.2026]         [Aktualisieren]  |
+------------------------------------------------------------------+

ÜBERSICHT
+------------------------------------------------------------------+
|                    | Complice | Animacies | Menschen. | GESAMT   |
|--------------------|----------|-----------|-----------|----------|
| Umsätze (Projekt)  |  125.000 |    98.000 |    67.000 |  290.000 |
| - Direkte Kosten   |   45.000 |    38.000 |    29.000 |  112.000 |
|--------------------|----------|-----------|-----------|----------|
| = DB1              |   80.000 |    60.000 |    38.000 |  178.000 |
| DB1-Marge          |     64%  |      61%  |      57%  |     61%  |
|--------------------|----------|-----------|-----------|----------|
| - Strukturkosten   |   24.500 |    21.000 |    14.000 |   59.500 |
|   (anteilig 35%)   |   (30%)  |    (20%)  |           |          |
|--------------------|----------|-----------|-----------|----------|
| = DB2              |   55.500 |    39.000 |    24.000 |  118.500 |
|--------------------|----------|-----------|-----------|----------|
| - Fixkosten        |   35.000 |    30.000 |    20.000 |   85.000 |
|   (anteilig)       |          |           |           |          |
|--------------------|----------|-----------|-----------|----------|
| = DB3              |   20.500 |     9.000 |     4.000 |   33.500 |
+------------------------------------------------------------------+

NICHT-PROJEKTBEZOGENE EINNAHMEN
+------------------------------------------------------------------+
| Mitgliedsbeiträge                               |        15.000  |
| Förderung Gemeinde (allgemein)                  |        50.000  |
| Sonstige                                        |         5.000  |
|-------------------------------------------------|----------------|
| Summe                                           |        70.000  |
+------------------------------------------------------------------+

GESAMT-ERGEBNIS
+------------------------------------------------------------------+
| Summe Projekt-DB3                               |        33.500  |
| + Nicht-projektbezogene Einnahmen               |        70.000  |
|-------------------------------------------------|----------------|
| = GESAMT-ERGEBNIS                               |       103.500  |
+------------------------------------------------------------------+
```

### 3. Projekt-Detail-Ansicht

In der bestehenden Projektansicht wird ein neuer Tab "Deckungsbeitrag" hinzugefügt:

```
[Übersicht] [Rechnungen] [Deckungsbeitrag] [Budget]

+------------------------------------------------------------------+
| Projekt: Complice                                                 |
| Zeitraum: 01.03.2026 - 15.06.2026 (107 Tage)                     |
+------------------------------------------------------------------+

| Position              | Betrag    | Details                       |
|-----------------------|-----------|-------------------------------|
| Umsätze               |  125.000  | [Details anzeigen]            |
|   - Eintrittsgelder   |   25.000  |                               |
|   - Zuschuss Provinz  |  100.000  |                               |
|-----------------------|-----------|-------------------------------|
| Direkte Kosten        |   45.000  | [Details anzeigen]            |
|   - Künstler-Honorar  |   20.000  |                               |
|   - Katalog           |   15.000  |                               |
|   - Transport         |   10.000  |                               |
|-----------------------|-----------|-------------------------------|
| = DB1                 |   80.000  | Marge: 64%                    |
|-----------------------|-----------|-------------------------------|
| Strukturkosten (35%)  |   24.500  | Anteil: 35% von 70.000        |
| = DB2                 |   55.500  |                               |
|-----------------------|-----------|-------------------------------|
| Fixkosten (35%)       |   35.000  | Anteil: 35% von 100.000       |
| = DB3                 |   20.500  |                               |
+------------------------------------------------------------------+
```

---

## Implementierungsschritte

### Phase 1: Datenbank & Kontenplan
1. Migration: `chart_of_accounts` Tabelle erstellen
2. Migration: `projects.ist_ausstellung` hinzufügen
3. CSV-Import für bestehende Kontenzuordnung
4. UI: Kontenplan unter Konfiguration

### Phase 2: Berechnung
5. `data-adapter.js`: Funktion `calculateContributionMargins(year, startDate, endDate)`
6. Projekt-Gewichtung nach Tagen
7. Matching: `konto_nr` gegen `chart_of_accounts` Pattern

### Phase 3: Reporting UI
8. Neue View: "Deckungsbeiträge" in Navigation
9. Übersichts-Tabelle mit allen Projekten
10. Detail-Ansicht pro Projekt
11. CSV/PDF Export

### Phase 4: Integration
12. Projekt-Detail: Tab "Deckungsbeitrag"
13. Dashboard-Widget: DB-Übersicht
14. Nicht-projektbezogene Einnahmen separat ausweisen

---

## Offene Fragen / Entscheidungen

1. **Pattern-Matching:** Soll `680*` auch `68012345` matchen, oder nur `680xxxx`?
   → Vorschlag: Alle Konten die mit dem Pattern beginnen

2. **Zeitraum-Überlappung:** Was wenn ein Projekt über Jahreswechsel geht?
   → Vorschlag: Tage nur im ausgewählten Zeitraum zählen

3. **Projekte ohne Datum:** Was mit Projekten ohne start_date/end_date?
   → Vorschlag: Gleichmäßige Verteilung auf alle Monate

4. **Mitgliedsbeiträge:** Aus `member_payments` oder aus DATEV-Konto 6401550?
   → Vorschlag: DATEV-Konto ist führend (da dort der tatsächliche Zahlungseingang)

---

## Abhängigkeiten

- `konto_nr` muss in DATEV-Buchungen befüllt sein (bereits vorhanden)
- Projekte brauchen `start_date` und `end_date` (bereits vorhanden)
- `funding_sources` für nicht-projektbezogene Einnahmen (bereits vorhanden)

---

## Geschätzter Aufwand

| Phase | Beschreibung |
|-------|--------------|
| Phase 1 | Datenbank & Kontenplan-UI |
| Phase 2 | Berechnungslogik |
| Phase 3 | Reporting-UI |
| Phase 4 | Integration & Feinschliff |
