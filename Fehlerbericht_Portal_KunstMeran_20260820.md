# Fehlerbericht – portal.kunstmeranoarte.org

**Erstellt am:** 20.08.2026, ca. 15:45–16:10 Uhr
**Zuletzt aktualisiert:** 21.08.2026
**Umfang:** Alle 13 Sidebar-Bereiche, alle Untertabs, Dialoge geöffnet
**Testart:** Nur lesend – es wurde nichts gespeichert, gelöscht oder exportiert
**Angemeldet als:** info (Rolle: Mitarbeiter)

---

## 🔧 Behobene Fehler (Stand 21.08.2026)

Die folgenden Punkte wurden durch die Commits `614d774` bis `eba682a` behoben:

| Problem | Status | Commit |
|---------|--------|--------|
| Zeiterfassung 403 Permission Error | ✅ Behoben | `614d774`, `c978de6` |
| Members laden nicht (column "nachname" error) | ✅ Behoben | `c978de6` |
| Zeiterfassung CRUD (Speichern/Löschen) | ✅ Behoben | `135d13c` |
| Anwesenheit lädt nicht | ✅ Behoben | `fe70f3c` |
| Shop Artikel JOIN-Fehler | ✅ Behoben | `614d774` |
| Kontenplan CRUD fehlt | ✅ Behoben | `614d774` |
| Workspaces laden nicht | ✅ Behoben | `295b472` |
| Personal → Kalender (Zeiteinträge) | ✅ Behoben | `135d13c` |
| Lieferanten 2025 Daten fehlen | ✅ Behoben | `bed8dfa` - Limit auf 10000 erhöht |
| Users laden via SupabaseService | ✅ Behoben | `b1578c9` - auf ApiClient migriert |
| Kurse API startdatum Spalte fehlt | ✅ Behoben | `14fb45b` - ORDER BY k.name ASC |
| Kurse Funktionen auf SupabaseService | ✅ Behoben | `d3ff386` - auf ApiClient migriert |
| Anwesenheit API falsche Spalten | ✅ Behoben | `6f32106` - an Tabellenstruktur angepasst |
| CostTypes via SupabaseService | ✅ Behoben | `bed8dfa` - auf ApiClient migriert |
| Permissions via SupabaseService | ✅ Behoben | `bed8dfa` - Session-Permissions nutzen |
| Anwesenheit Kalender User-ID | ✅ Behoben | `318dd3f` - session.id ist bereits public.users.id |
| Anwesenheit Kalender Auswahl | ✅ Behoben | `990906d` - CSS Klasse 'ausgewaehlt' ohne Umlaut |
| Anwesenheit Speichern duplicate key | ✅ Behoben | `8e34ad7`, `cecb9f0` - manuelles Check+Insert/Update |
| Externe Tab zeigt nichts | ✅ Behoben | `eba682a` - zeigt jetzt Lieferanten-Zeiteinträge |

**Hinweis:** Nach Server-Update (`git pull && pm2 restart kunstmeran-api`) sind diese Fixes aktiv.

### Datenbankfix erforderlich (einmalig):
```sql
-- ID-Sequenz für anwesenheit_planung reparieren:
SELECT setval('anwesenheit_planung_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM anwesenheit_planung));
```

---

## 1. Zusammenfassung

Der größte Teil der Fehler geht auf **eine einzige Ursache** zurück: Im Frontend werden
noch Funktionen aufgerufen, die es im aktuellen Datenzugriffs-Layer nicht (mehr) gibt.
In der Browser-Konsole erscheinen dauernd:

- `ReferenceError: SupabaseService is not defined`
- `ReferenceError: supabaseClient is not defined`
- `TypeError: DataManager.<funktion> is not a function`
- `TypeError: ApiClient.getActiveAbgabestellen is not a function`

Offenbar wurde von Supabase auf die eigene API/PostgreSQL umgestellt (`api-client.js`,
`data-adapter.js`), aber viele Aufrufstellen in `app.js`, `data.js` und
`excel-import-service.js` wurden nicht mitgezogen.

### Fortschritt (21.08.2026):

**5 von 14 Bereichen** aus Abschnitt 3 wurden behoben:
- ✅ Mitglieder, Anwesenheit, Kontenplan, Workspaces, Zeiterfassung

**Noch offen:** Reporting (4 Tabs), Einnahmenplanung, Budgetplanung, Kurse, Import-Statistik

Zweite, unabhängige Ursache: **alle Bild-/Icon-Dateien fehlen auf dem Server.**

---

## 2. Kritisch – falsche Zahlen

### 2.1 Dashboard: Gesamtbudget ist völlig falsch (Zahlen werden aneinandergehängt statt addiert)

Angezeigt: `125.000.500.060.000.144.342.650.007.900.098.154,00 €`
Korrekt wäre: **463.996,00 €**

Nachweis – die Einzelbudgets werden als Text verkettet:

| Projekt | Budget |
|---|---|
| Kunsthaus Wartungen | 12.500 |
| Rahmenprogramm | 5.000 |
| Menschenbilder | 60.000 |
| Wanderausstellung | 144.342 |
| Stadtraum Meran | 65.000 |
| Animacies | 79.000 |
| Complice | 98.154 |

„12500" + „5000" + „60000" + „144342" + „65000" + „79000" + „98154"
= 12500500060000144342650007900098154 → genau die angezeigte Zahl.

Ursache: Die Budgets kommen als String aus der DB und werden mit `+` addiert.
Fix: vor der Summierung `parseFloat()` / `Number()`.

**Folgefehler:** „Verfügbar" zeigt eine leicht andere Riesenzahl
(`…140.000.000.000.000.000.000`) – dort wurde später doch numerisch gerechnet und
die Gleitkomma-Genauigkeit ging verloren. Außerdem sprengt die Zahl das Layout:
die Seite bekommt einen horizontalen Scrollbalken und der Wert wird in der Kachel
abgeschnitten.

### 2.2 Dashboard: „Aktive Projekte" zeigt 0

Es sind 8 Projekte vorhanden, alle mit Status „Laufend". Trotzdem steht dort `0`.

### 2.3 Dashboard-Projektübersicht zeigt nur 7 von 8 Projekten

Das Projekt „Shop" fehlt in der Liste (vermutlich weil es kein Budget hat).

---

## 3. Bereiche, die komplett nicht laden

| Bereich | Anzeige | Status |
|---|---|---|
| **Reporting → 1. Projektübersicht** | „Fehler: DataManager._getProjectsOriginal is not a function" | 🔴 Offen |
| **Reporting → 2. Deckungsbeiträge** | „Fehler: supabaseClient is not defined" | 🔴 Offen |
| **Reporting → 3. Gesamt-DB** | „Fehler: supabaseClient is not defined" | 🔴 Offen |
| **Reporting → 6. Bilanz/GuV** | bleibt dauerhaft bei „Lade Bilanz-Daten…" | 🔴 Offen |
| **Einnahmenplanung** | Fehler-Toast, Liste leer | 🔴 Offen |
| **Budgetplanung** | Fehler-Toast, alle Kacheln 0 EUR | 🔴 Offen |
| **Mitglieder** | Fehler-Toast, Liste leer | ✅ **Behoben** (c978de6) |
| **Personal → Kurse** | Toast „Kurse konnten nicht geladen werden" | 🔴 Offen |
| **Personal → Anwesenheit** | Toast „Anwesenheit konnte nicht geladen werden" | ✅ **Behoben** (fe70f3c) |
| **Import → Import-Statistik** | alle vier Kacheln zeigen nur „–" | 🔴 Offen |
| **Konfiguration → Kontenplan** | „Fehler beim Laden" | ✅ **Behoben** (614d774) |
| **Konfiguration → Workspaces** | Toast „Workspaces konnten nicht geladen werden" | ✅ **Behoben** (295b472) |
| **Konfiguration → Kurse** | 2× „Fehler beim Laden" | 🔴 Offen |
| **Projekt-Detail → Zeiterfassung** | rot „Fehler beim Laden" | ✅ **Behoben** (135d13c) |

---

## 4. Lieferanten – gravierend

### 4.1 Lieferantenliste ist leer

Bereich **Lieferanten** zeigt „Keine Lieferanten gefunden." und „0 Lieferanten gesamt" –
gleichzeitig aber „120 Mit Rechnungen" und „259.105,78 € Gesamtvolumen".
Beim Seitenstart meldet die Konsole ausdrücklich `✅ 598 Lieferanten geladen`.
Die Daten sind also da, kommen aber nicht in der Liste an. Die Suche findet ebenfalls nichts.

### 4.2 Lieferanten-Autocomplete in der Rechnungstabelle findet nie etwas

Klickt man in der Rechnungsliste auf einen Lieferantennamen, öffnet sich ein Inline-Feld.
Egal was man eingibt (getestet: „Zoom", „DANDOLO", nur „a"), es erscheint immer
**„Keine Lieferanten gefunden"** – obwohl genau diese Lieferanten in der Tabelle stehen.
Konsole: `Fehler beim Laden der Lieferanten: ReferenceError: SupabaseService is not defined`
(`loadSuppliersForAutocomplete`).

### 4.3 Escape bricht die Bearbeitung nicht ab, sondern versucht zu speichern – und scheitert

Im selben Inline-Feld führt ESC (bzw. Klick daneben) zu einem Speicherversuch statt zum
Abbrechen. Ergebnis: Toast **„Fehler – Lieferant konnte nicht gespeichert werden"**.
Konsole: `Fehler beim Aktualisieren des Lieferantennamens: ReferenceError: SupabaseService is not defined`.
(Gut: Es wurde dadurch nichts verändert – der Datensatz stand nach dem Neuladen unverändert da.)

### 4.4 Filter „Abgabestelle" bleibt leer

In den Rechnungen enthält das Dropdown „ABGABESTELLE" nur den Eintrag „Alle".
Konsole: `TypeError: ApiClient.getActiveAbgabestellen is not a function`.

---

## 5. Buttons, die nichts tun

| Ort | Button | Verhalten |
|---|---|---|
| Projekt-Detail (Kopfzeile) | **Bearbeiten** | Kein Dialog, keine Reaktion, kein Konsolenfehler |
| Projekt-Detail → Kosten | **+ Kosten hinzufügen** | Kein Dialog, keine Reaktion |
| Dialog „Zeit erfassen" | Umschalter **Lieferant** | Bleibt auf „Mitarbeiter", Formular ändert sich nicht |

---

## 6. Navigation / falsche Verlinkung

### 6.1 Shop & Kasse: Klick auf „Kasse" öffnet „Interne Ausgaben"

Reproduzierbar: Tab **Kasse** anklicken → es wird „Interne Ausgaben (Publikationen)"
geöffnet und der Tab „Interne Ausgaben" markiert. Der Kassen-Tab ist damit gar nicht erreichbar.

### 6.2 Leerer Inhaltsbereich beim Betreten von „Shop" und „Budgetplanung"

Beide Seiten zeigen die Tab-Leiste, aber **kein Tab ist vorausgewählt** – darunter ist alles
weiß. Erst ein manueller Klick auf einen Tab lädt Inhalt. Sollte per Default den ersten Tab öffnen.

---

## 7. Darstellung / Layout

### 7.1 Alle Icons und das Logo sind kaputt (überall im Portal)

Sidebar-Icons, Logo oben links, die Icons auf der Import-Seite und die Bearbeiten-/Löschen-
Icons in der Konfiguration erscheinen als „kaputtes Bild"-Platzhalter.

**Ursache gefunden:** Die Bilddateien liegen nicht auf dem Server. Ruft man z. B.
`https://portal.kunstmeranoarte.org/icons/17-dashboard.svg` direkt auf, kommt nicht das SVG,
sondern die **Login-HTML-Seite** zurück (Status 200 durch SPA-Fallback). Gleiches bei
`/logo_weiss.png` → landet auf `app.html`.
Betroffen u. a.: `17-dashboard.svg`, `18-project.svg`, `01-document.svg`, `05-company.svg`,
`23-user.svg`, `30-inventory.svg`, `32-shop.svg`, `06-trend.svg`, `29-income.svg`,
`31-budget.svg`, `04-upload.svg`, `20-settings.svg`, `02-sync.svg`, `03-data.svg`,
`14-attachment.svg`, `09-edit.svg`, `16-error.svg`, `07-close.svg`, `logo_weiss.png`,
`logo_ohne_Text_weiss.png`.
Fix: Icon-Ordner mit deployen bzw. Server-Rewrite so einstellen, dass echte Dateipfade nicht
auf die HTML-Seite umgeleitet werden.

### 7.2 Sidebar überdeckt beim Aufklappen den Inhalt

Die Sidebar ist eingeklappt (nur Icons) und klappt beim Überfahren auf – dabei legt sie sich
über den Seiteninhalt. Der erste Klick klappt nur auf, erst der zweite navigiert.

### 7.3 Seite läuft rechts aus dem Bild

Auf mehreren Seiten (Dashboard, Rechnungen, Projekt-Detail, Shop, Import) sind Buttons und
Kacheln rechts abgeschnitten und nur per horizontalem Scrollen erreichbar – z. B.
„+ Zeit erfassen", der Schließen-Button im Projekt-Detail, „+ Mitglied" im Shop.
Geprüft bei ca. 1300 px Fensterbreite.

### 7.4 Umlaute fehlen an mehreren Stellen

Konsequent „ae/oe/ue" statt Umlauten – wirkt wie ein Encoding- oder Copy-Paste-Rest:

- Tab „Zeiteintraege" → *Zeiteinträge*
- „Meine Zeiteintraege"
- „Keine Eintraege gefunden"
- Anwesenheit: „Buero + Mittagessen", „Buero + Essen", „Homeoffice", „Ausgewaehlt",
  „Zuruecksetzen"
- Neuer Lieferant: „Kann als Anbieter fuer Schulungen/Kurse ausgewaehlt werden"

---

## 8. Daten-Inkonsistenzen (bitte prüfen, ob gewollt)

| Beobachtung | Detail |
|---|---|
| Projektfilter in den Rechnungen passt nicht zur Projektliste | Filter enthält **„Konzertreihe"** (existiert nicht in der Projektliste) und **es fehlt „Kunsthaus Wartungen"**. Das Projekt-Dropdown *in den Tabellenzeilen* enthält dagegen die richtigen 8 Projekte. |
| Konfiguration → Kostentypen: „Keine Kostentypen definiert" | Im Rechnungsfilter gibt es aber Kuration, Künstlerausgabe, Transport, Produktion, Vermittlung, Dokumentation, Kommunikation |
| Konfiguration → Mitarbeiter: „Keine Mitarbeiter definiert" | Im Dialog „Zeit erfassen" stehen aber **„Administrator" und „Max Mustermann"** – sieht nach Demo-Daten aus |
| Keine der 392 Rechnungen hat ein Projekt zugewiesen | Alle stehen auf „– Kein Projekt –". Dadurch überall IST = 0,00 € und „0 Rechnungen" pro Projekt. Vermutlich echter Datenstand, aber es macht Dashboard und Reporting wertlos. |
| Reporting → Bilanz/GuV | Jahresauswahl steht auf 2026, die Tabellenspalten heißen aber 2025 / 2024 |

---

## 9. Was funktioniert hat

- Anmeldung, Grundnavigation, Wiederherstellung der zuletzt geöffneten Ansicht nach Reload
- **Projekte**: Liste mit allen 8 Projekten, Details-Dialog öffnet
- **Rechnungen**: 392 Rechnungen, Summen stimmen (259.105,78 + 55.539,61 = 314.645,39 €),
  Lieferanten-Filter oben funktioniert, Paginierung, Spaltensortierung
- **Personal → Externe** und **→ Kalender**
- Dialoge **„Zeit erfassen"** und **„Neuer Lieferant"** öffnen sauber
- **Shop**: Inventar, Verkäufe, Einkäufe, Rechnungen, Interne Ausgaben
- **Reporting** Seite 4 (Kategorien), 5 (Kontenplan), 7 (Besucher)
- **Konfiguration**: MwSt-Sätze, Shop, Datenexport-Oberfläche
- **Inventar**: korrekt als „Nur Lesezugriff" gesperrt

### Neu funktionsfähig (nach Fixes vom 21.08.2026):

- **Mitglieder**: Liste lädt korrekt ✅
- **Personal → Anwesenheit**: Kalender lädt, Auswahl möglich ✅
- **Personal → Kalender**: Zeiteinträge werden angezeigt ✅
- **Zeiterfassung CRUD**: Erstellen, Bearbeiten, Löschen funktioniert ✅
- **Konfiguration → Kontenplan**: Lädt und CRUD funktioniert ✅
- **Konfiguration → Workspaces**: Lädt korrekt ✅

**Nicht getestet** (weil schreibend bzw. Download): Speichern-Buttons, CSV-/Excel-Export,
Excel-Import, „Aktualisieren"/„Lieferanten sync"/„PDF verknüpfen" in den Rechnungen,
„Buchungen zuweisen" bei den Mitgliedern.

---

## 10. Vorschlag zur Reihenfolge

1. **Icon-/Logo-Dateien deployen** – kleiner Fix, sofort sichtbarer Effekt (Abschnitt 7.1)
2. **Dashboard-Budgetsumme numerisch rechnen** – Ein-Zeilen-Fix, aktuell peinlichster Fehler (2.1)
3. **Supabase-Altlasten ersetzen** (`SupabaseService`, `supabaseClient`, fehlende
   `DataManager.*` / `ApiClient.*`-Methoden) – behebt Abschnitt 3 und 4 in einem Zug
4. Tote Buttons verdrahten (Abschnitt 5) und Kasse-Tab korrigieren (6.1)
5. Kosmetik: Umlaute, Layout-Überlauf, Default-Tab (6.2, 7.3, 7.4)
