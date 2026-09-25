# Sprachaudit Kunst Meran

**Was auf Italienisch und Englisch deutsch bleibt**

Projektsoftware Kunst Meran · portal.kunstmeranoarte.org/app.html · Stand 25. August 2026

Die Sprache steht jetzt auf **IT**. Danach habe ich dieselbe Runde auf **EN** gedreht — alle 13 Menüpunkte, 50 Ansichten und Tabs, alle 46 Dialoge. Ergebnis: Das Wörterbuch ist fast fertig, die Oberfläche benutzt es nur an wenigen Stellen.

| Kennzahl | Wert | |
|---|---|---|
| Keys im Wörterbuch | **480** | in `it.js`, `en.js` und `de.js` — sauber übersetzt |
| Fehlender Key | **1** | nur `shop.pos` — in IT und EN |
| Deutsche Texte sichtbar | **225** | über 50 Ansichten und Tabs, in IT und EN praktisch identisch |
| Dialoge komplett deutsch | **46 / 46** | kein einziges Formular ist an die Sprachumschaltung angeschlossen |

---

## Befund: Das Problem ist nicht die Übersetzung, sondern die Verdrahtung

Wer die Sprache auf IT stellt, sieht: Menü, Seitentitel und ein paar Tabellenköpfe wechseln — der Rest bleibt deutsch. Das liegt nicht an fehlenden italienischen Texten. Die gibt es. Sie werden nur nicht abgerufen.

> **Beispiel „Details"-Button in der Projektliste.** Im Wörterbuch steht `actions.details` mit „Dettagli" für IT. Auf dem Bildschirm steht trotzdem „Details", weil der Button den Text fest im HTML stehen hat und den Key nie fragt.
>
> Dasselbe gilt für „Laufend" (*In corso*), „Bearbeiten" (*Modifica*), „Löschen" (*Elimina*), „Alle Jahre" (*Tutti gli anni*) und rund 60 weitere.

Praktisch heißt das: Der Übersetzungsaufwand ist deutlich kleiner als er aussieht, der Programmieraufwand deutlich größer. Etwa ein Viertel der Fundstellen braucht nur ein `data-i18n`-Attribut bzw. einen `t()`-Aufruf — die Übersetzung liegt schon bereit. Drei Viertel brauchen zusätzlich einen neuen Key in allen drei Sprachdateien.

**Legende**

- **[KEY DA]** — Übersetzung existiert im Wörterbuch, wird aber nicht benutzt. Reiner Code-Fix.
- **[HARTKODIERT]** — Text steht fest im HTML oder in `app.js`. Key muss neu angelegt und übersetzt werden.
- *nur IT* / *nur EN* — ohne Markierung: betrifft beide Sprachen gleichermaßen.

---

## Teil A — Wörterbuch: fast lückenlos

Alle drei Sprachdateien haben exakt dieselbe Struktur und 480 Einträge. Es fehlt genau ein Key, und eine Handvoll Werte sind mit dem deutschen identisch geblieben.

### Fehlender Eintrag

| Key | Deutsch | fehlt in |
|---|---|---|
| `shop.pos` | „POS" | `it.js`, `en.js` |

### Werte, die noch deutsch sind

**Italienisch**

| Key | aktuell | Vorschlag |
|---|---|---|
| `attendance.homeoffice` | Homeoffice | Telelavoro |
| `nav.reporting` / `reporting.title` | Reporting | prüfen: Rendicontazione |
| `nav.shop`, `nav.dashboard`, `forms.budget` | Shop, Dashboard, Budget | vermutlich bewusst so |

**Englisch**

| Key | aktuell | Vorschlag |
|---|---|---|
| `calendar.weekdays.mo` | Mo | Mon |
| `calendar.weekdays.fr` | Fr | Fri |
| `calendar.weekdays.sa` | Sa | Sat |
| `attendance.homeoffice` | Homeoffice | Home office |
| `nav.import` / `import.title` | Import | ok |
| `personnel.filterAdmin` | Filter (Admin) | unverdächtig |

Nicht aufgeführt sind Werte, die in allen Sprachen gleich lauten dürfen: Dashboard, Status, Name, Budget, PDF, Transport, CSV Export, Partita IVA, „+/- %", Administrator.

---

## Teil B — Was auf dem Bildschirm deutsch bleibt

Pro Ansicht bzw. Tab, in der Reihenfolge der Seitenleiste. Alles hier war sowohl mit IT als auch mit EN sichtbar, sofern nicht anders markiert.

### Dashboard — 2 Fundstellen

- **[KEY DA]** Mitarbeiter → *Dipendente / Employee* (`personnel.employee`)
- **[HARTKODIERT]** „50 Rechnungen" (Zähler in den Kacheln) — *nur IT gesehen*

### Progetti · Projekte — 5 Fundstellen

- **[KEY DA]** Alle Jahre → *Tutti gli anni / All years* (`forms.allYears`)
- **[KEY DA]** Laufend → *In corso / Running* (`status.running`)
- **[KEY DA]** Details → *Dettagli* (`actions.details`)
- **[HARTKODIERT]** Zeige 1–8 von 8 Projekten
- **[KEY DA]** Keine Projekte vorhanden (`projects.noProjects`) — *nur EN gesehen*

### Fatture · Rechnungen — 7 Fundstellen

- **[KEY DA]** Alle Projekte (`forms.allProjects`)
- **[KEY DA]** Alle → *Tutti / All* (`submissionPoints.all`)
- **[KEY DA]** Alle Lieferanten (`forms.allSuppliers`)
- **[HARTKODIERT]** `-- Kein Projekt --`
- **[HARTKODIERT]** Summe (1258 Rechnungen):
- **[HARTKODIERT]** Seite 1 von 126 (1258 Rechnungen)
- **[HARTKODIERT]** PDF suchen oder hierhin ziehen…

### Fornitori · Lieferanten — nur Daten

Die Oberfläche selbst ist hier weitgehend übersetzt. Deutsch sind die *Inhalte* — Lieferantennamen und Adressen aus der Datenbank („Architekturstiftung Südtirol", „Elektro Pföstl Daniel", Straßenangaben). Das ist kein Übersetzungsfehler.

### Inventario · Inventar — 15 Fundstellen

**Key vorhanden, nicht benutzt**

| Deutsch | Italienisch |
|---|---|
| Kategorie | Categoria |
| Alle Kategorien | Tutte le categorie |
| Standort | Posizione |
| Alle Standorte | Tutte le Sedi |
| Inventar | Inventario |
| Bezeichnung | Descrizione |
| Geändert | Modificato |
| Aktionen | Azioni |
| Bearbeiten | Modifica |
| Löschen | Elimina |
| CSV Export | *nur IT* |

**Hartkodiert**

- Inventar – Kunstgüter *(Seitentitel)*
- \+ Neuer Gegenstand
- Möbel & Aufbau *(Datenbank-Kategorie)*
- Stühle gelb *(Datensatz)*

### Shop — alle 6 Tabs

**Key vorhanden, nicht benutzt**

Alle Typen (`shop.allTypes`) · MwSt (`shop.vat`) · Brutto (`invoices.gross`) · Netto (`invoices.net`) · Kassenabschluss (`shop.cashRegister`) · Zeit (`shop.time`) · Betrag (`revenue.amount`) · Beschreibung (`forms.description`) · Von (`forms.from`) · Datum (`attendance.date`) · Artikel (`shop.article`) · Menge (`shop.quantity`) · Externe (`personnel.external`) · Bar (`shop.cash`) · Bestand (`shop.stock`)

**Hartkodiert**

- MwSt-Aufschlüsselung
- 4% (Bücher)
- Gezählter Bestand:
- Abschließen
- Alle Bewegungen
- Shop-Rechnungen (Kostenstelle 2699)
- Lieferant/Kunde
- Keine Rechnungen für Shop gefunden
- Interne Ausgaben (Publikationen)
- bis · Alle Empfänger · Empfänger
- \+ Neue Ausgabe
- Bücherkeller *(Datenbank-Standort)*
- Keine Verkäufe vorhanden.
- Keine Einkäufe vorhanden.

### Reporting — alle 7 Reports, durchgehend deutsch

**Tab-Leiste (hartkodiert)**

1. Projektübersicht
2. Deckungsbeiträge
3. Gesamt-DB
4. Kategorien
5. Kontenplan
6. Bilanz/GuV
7. Besucher

**Report-Inhalte (hartkodiert)**

- Reporting & Deckungsbeiträge
- Deckungsbeiträge pro Projekt
- Umsätze ohne Projekt
- Erlöse nicht zugeordnet
- Kosten ohne Projekt
- Direkte Kosten nicht zugeordnet
- Mitgliedsbeiträge, Förderungen → anteilig
- Gesamt-DBN
- Gesamt-Deckungsbeitragsrechnung
- YTD (bis heute) · YTD (bis Vormonat)
- Ganzes Jahr · Aktuelles Jahr
- März · Mär *(Monatsnamen)*
- Kosten nach Kategorie
- Kontenplan – Nicht zugewiesene Kosten
- Nur Konten mit Buchungen
- ohne Kostenstelle/Projekt-Zuweisung – diese sind nicht in der Projekt-Abrechnung enthalten.
- Bilanz & Gewinn- und Verlustrechnung
- Gewinn- und Verlustrechnung (GuV)
- Pro Woche · Pro Monat · Pro Jahr
- Gesamt Besucher
- Einnahmen Eintritte
- Aufschlüsselung nach Kategorie
- Seite 1 von 3
- Fehler: Zu viele Anfragen, bitte später versuchen

**Key vorhanden, nicht benutzt**

Projektübersicht (`dashboard.projectOverview`) · Projekt (`invoices.project`) · IST-Kosten (`projects.actualCosts`) · Verfügbar (`projects.available`) · Aktualisieren (`actions.refresh`) · Umsatz (`shop.revenue`) · Differenz (`budget.difference`) · Anzahl (`inventory.quantity`)

### Pianificazione Entrate · Einnahmenplanung — 16 Fundstellen

**Key vorhanden, nicht benutzt**

Einnahmenplanung (`revenue.title`) · + Neue Einnahme (`revenue.newRevenue`) · Zugesagt (`revenue.status.promised`) · Jahr (`forms.year`) · Typ (`calendar.type`) · Status (`invoices.status`) · Alle Status (`forms.allStatus`) · Abgabestelle (`submissionPoints.title`)

**Hartkodiert**

- Ausgaben · Einnahmen · Summe
- Budget Gesamt
- Erlöse (Shop, Ausstellungen)
- Sonstige
- Bestätigt (Dokument vorhanden)
- Geplante Einnahmen

### Pianificazione Budget · Budgetplanung — 3 Tabs, alle deutsch beschriftet

**Tab-Leiste (hartkodiert):** Nach Bilanzkonten · Nach Projekten · Notizen

**Key vorhanden, nicht benutzt**

Budgetplanung (`budget.title`) · Gesamtbudget (`dashboard.totalBudget`) · Notizen (`forms.notes`) · Notiz (`invoices.note`) · Gesamt (`shop.total`) · IST (`budget.actual`) · Speichern (`actions.save`)

**Hartkodiert**

- \+ Budget hinzufügen
- Budget nach Projekten
- Keine Projekte mit Budget gefunden
- Notizen werden automatisch pro Jahr gespeichert.
- Notizen zur Budgetplanung eingeben…
- 1. UMSÄTZE *(Kontengruppen-Überschrift)*
- Mär *(Monatsspalte)*

### Soci · Mitglieder — 2 Fundstellen

- **[HARTKODIERT]** Alle Orte
- **[KEY DA]** Keine Mitglieder gefunden (`members.noMembers`)

### Importa · Import — 9 Fundstellen

- **[HARTKODIERT]** DATEV-Buchungen, Lieferanten und Rechnungs-PDFs importieren
- **[HARTKODIERT]** Excel-Datei
- **[HARTKODIERT]** Lieferanten importieren
- **[HARTKODIERT]** Verknüpfte PDFs
- **[HARTKODIERT]** Jahre importiert
- **[HARTKODIERT]** oder
- **[HARTKODIERT]** PDFs hier ablegen oder klicken zum Auswählen
- **[HARTKODIERT]** Mehrere Dateien gleichzeitig möglich
- **[KEY DA]** Lieferanten (`suppliers.title`)

### Configurazione · Konfiguration — 8 Tabs, alle deutsch beschriftet

**Tab-Leiste (hartkodiert):** Kostentypen · Kontenplan · MwSt-Sätze · Workspaces · Mitarbeiter · Kurse · Shop · Datenexport

**Oberfläche (hartkodiert)**

- Lieferanten verwalten
- \+ Neues Konto · + Neuer Kostentyp · + Neuer Workspace · + Neuer Mitarbeiter
- Alle DB-Stufen
- Alle Einnahmen
- Suche nach Konto oder Name…
- Keine Mitarbeiter definiert
- Geändert: 13.7.2026 18:32
- MwSt-Sätze (EU) · MwSt-Sätze (Shop)
- Verfügbare MwSt-Sätze für Shop-Artikel:
- – Bücher, Zeitschriften · – Standardsatz für Waren
- Österreich · Dänemark · Rumänien *(Länderliste)*
- Alle Daten exportieren · Projekt-Export
- Wählen Sie ein Projekt für den Export:
- `-- Projekt wählen --` · Projekt exportieren

**Key vorhanden, nicht benutzt**

Kurse (`courses.title`) · Personal (`personnel.title`) · Benutzer (`config.user`) · Land (`forms.country`) · Aktiv (`status.active`) · Künstler (`artists.artistsList`) · Keine Projekte mit Buchungen gefunden (`dashboard.noProjectsFound`)

**Datenbank-Inhalte** — siehe Teil E: Kostentypen und Kontenplan-Bezeichnungen („Künstlerhonorare", „Auf- und Abbau Dienstleistung", „Repräsentationsspesen", „Warenbestandsveränderungen", „Register- und Stempelgebühr", „Zinserträge" …), Shop-Kategorien („Ermäßigt", „Führung", „Fördermitglied", „Student/Schüler")

### Personale & Ore · Personal & Zeiten — 5 Tabs

- **[KEY DA]** \+ Zeit erfassen (`personnel.newTimeEntry`)
- **[HARTKODIERT]** Keine Einträge gefunden
- **[HARTKODIERT]** \+ Neuer Kostentyp
- **[KEY DA]** Kuration, Künstlerausgabe, Transport, Produktion, Vermittlung, Dokumentation, Kommunikation (`costTypes.*` — nur IT)

---

## Teil C — Die Dialoge: 46 von 46 komplett deutsch

Kein einziges Formular der Anwendung ist an die Sprachumschaltung angeschlossen. Das ist die größte zusammenhängende Lücke — und gleichzeitig die, die sich am strukturiertesten abarbeiten lässt, weil alles in `app.html` steht.

### Häufigste Texte über alle Dialoge

| Text | kommt vor | Übersetzung |
|---|---:|---|
| Abbrechen | 35× | **[KEY DA]** Annulla / Cancel |
| Speichern | 26× | **[KEY DA]** Salva / Save |
| Datum * | 11× | **[HARTKODIERT]** (Stern am Ende) |
| Notizen | 11× | **[KEY DA]** Note / Notes |
| Beschreibung | 7× | **[KEY DA]** Descrizione |
| Schließen | 6× | **[KEY DA]** |
| Lieferant | 5× | **[KEY DA]** Fornitore |
| Kategorie / Mitarbeiter | 4× | **[KEY DA]** |
| Standort / Typ / Land / Bar / Menge * / `-- Artikel auswählen --` | 3× | gemischt |

### Pro Dialog

| Dialog | Texte | Charakteristische Beispiele |
|---|---:|---|
| `rechnung-detail-modal` | 24 | Projektzuordnung kann vom PL oder Barbara geändert werden · Geteilte Rechnung · Kontrolliert · Bezahlt · Kostentyp · Gemeinde · Provinz · Interne Notizen… |
| `einnahme-form-modal` | 17 | Neue Einnahme · Eindeutig pro Jahr · Als Abgabestelle bei Rechnungen verwenden · z.B. Förderung Webseite |
| `shop-ausgabe-modal` | 17 | Empfänger-Typ * · `-- Mitarbeiter auswählen --` · + Neue Person erfassen · Dieser Empfänger hat diesen Artikel bereits am … |
| `cost-form-modal` | 15 | Kosten erfassen · `-- Kein Lieferant --` · PDF hier ablegen oder klicken zum Auswählen · Maximale Größe: 10 MB |
| `konto-buchungen-modal` | 15 | Buchungen für Konto · Datum (neueste zuerst) · Betrag (höchste zuerst) · Lieferant (A-Z) |
| `time-form-modal` | 13 | Mitarbeiter * · Stunden * · Was wurde gemacht? (z.B. Wartung Heizung, Elektroinstallation…) |
| `budget-entry-modal` | 13 | Neuer Budget-Eintrag · Eingabe verteilt gleichmäßig auf 12 Monate · Monatliche Beträge (EUR) · Summe Monate: |
| `adresse-form-modal` | 12 | Neuer Kontakt · Straße / Adresse · Sonstige |
| `workspace-form-modal` | 12 | Neuer Workspace · Rechnungen: Nur zugewiesene anzeigen |
| `account-form-modal` | 11 | Neues Konto · Nutze % als Wildcard (680% = alle Konten die mit 680 beginnen) · Neutral (nicht in DB) |
| `supplier-form-modal` | 11 | Neuer Lieferant · Lieferanten-Nr. · Zuständig für Rechnungskontrolle bei Rechnungen ohne Projektzuweisung |
| `inventar-form-modal` | 11 | Neuer Gegenstand · Reparaturbedürftig · Anhänge (Bilder, Verträge, Dokumente) |
| `shop-artikel-form-modal` | 10 | Neuer Artikel · 4% (Bücher) · Nur bei neuem Artikel. Danach über Einkäufe/Verkäufe. |
| `project-form-modal` | 9 | Neues Projekt · Planung / Laufend / Abgeschlossen · – für Shop, Strukturkosten etc. |
| `sitzung-form-modal` | 9 | Neue Sitzung · Protokoll / Notizen · + Aufgabe hinzufügen |
| `user-form-modal` | 8 | Neuer Mitarbeiter · Vor- und Nachname · Intern / Extern / Rolle |
| `kuenstler-form-modal` | 8 | Neuer Künstler · Strg+Klick für Mehrfachauswahl · Notizen / Biografie |
| `member-form-modal` | 8 | Neues Mitglied · Männlich · z.B. Überweisung, Bar… |
| `shop-verkauf-eintritt-modal` | 8 | Vormittag (bis 12:00) · Preis pro Person (EUR) * |
| `datev-verknuepfung-modal` | 7 | DATEV-Bewegung mit Rechnung verknüpfen · Bereits verknüpft · Wählen Sie ein PDF aus der Liste |
| `shop-eintritt-kat-modal` | 7 | Neue Eintritts-Kategorie · 10% (ermäßigt) · Gültig ab / Gültig bis |
| `shop-verkauf-artikel-modal` | 7 | `-- Artikel auswählen --` · Menge * · MwSt |
| `member-payment-modal` | 6 | DATEV-Buchung auswählen (Konto 6401550) · `-- Buchung auswählen --` |
| `shop-einkauf-form-modal` | 6 | Betrag (EUR) * · `-- Artikel auswählen --` |
| `shop-verkauf-mitglied-modal` | 6 | `-- Kategorie auswählen --` |
| `buchungen-zuweisung-modal` | 5 | Mitglied(er) auswählen · Klicken um auszuwählen (max. 2 bei gemeinsamer Zahlung) |
| `workspace-users-modal` | 5 | Benutzer im Workspace · Der Benutzer muss sich bereits einmal angemeldet haben. |
| `kurs-form-modal` / `kurs-termin-modal` | 4 + 7 | Neuer Kurs · Dauer (Stunden) · Kosten Pauschal · Neuer Termin · Ueberschreibt Kurs-Kosten |
| `pdf-preview-modal` | 4 | Öffnen · PDF nicht gefunden |
| `shop-anfangsbestand-modal` | 4 | Anfangsbestand setzen |
| `shop-import-modal` | 4 | Importiere Artikel aus der Shopinventar-Excel-Datei. · Oder: Andere Excel-Datei hochladen |
| `shop-mitglied-kat-modal` | 4 | Neue Mitglieds-Kategorie · Gültig ab |
| `costtype-form-modal` | 3 | Neuer Kostentyp |
| `member-import-modal` | 3 | Excel-Datei (.xlsx, .xls) · Importieren |
| `shop-kassen-entnahme-modal` / `-einlage-modal` | 3 + 3 | Betrag (EUR) * · Notiz |
| `anwesenheit-form-modal` | 3 | Abwesend · Urlaub · Krank |
| `bestellung-modal` | 3 | Neue Bestellung erfassen · Anzahl bestellt · Monat |
| `project-detail-modal` | 2 | Bitte nutzen Sie die erweiterte Projektansicht. |
| `convert-form-modal` | 2 | In IST-Kosten umwandeln |
| `shop-einkauf-verknuepfung-modal` | 2 | Einkauf mit Rechnung verknüpfen |
| `ablaufende-zertifikate-modal` | 2 | Kurs · Pflicht |
| `kurs-kategorie-modal` | 1 | Neue Kurskategorie |
| `shop-rechnung-details-modal` | 1 | Lieferant/Kunde |

---

## Teil D — Meldungen, Rückfragen und Fehlertexte

In `js/app.js` stehen 381 deutsche Textbausteine, die zur Laufzeit erscheinen: Erfolgsmeldungen, Sicherheitsabfragen vor dem Löschen, Validierungshinweise, CSV-Kopfzeilen. Keiner davon läuft über das Wörterbuch. (`{X}` steht für eine eingesetzte Zahl oder einen Namen.)

### Berechtigungen und Status

- Keine Berechtigung zum Bearbeiten
- Keine Berechtigung zum Löschen
- wird angezeigt (nur Ansicht, keine Bearbeitung)
- Nur Admins können Rechnungen als bezahlt markieren
- Nur Admins können als bezahlt markieren
- Geändert: {X} ({X})
- Status geändert · Rechnung ist jetzt „{X}"
- Status konnte nicht geändert werden
- Status konnte nicht geändert werden: {X}
- Rechnung als {X} markiert
- Keine Invoice verknüpft – Status kann nicht geändert werden

### Projekte, Kosten, Zeiten

- Zeige {X}-{X} von {X} Projekten
- Keine Projekte vorhanden · Projekt nicht gefunden · Unbekanntes Projekt
- Neues Projekt · Projekt bearbeiten
- Projekt wurde aktualisiert · Neues Projekt wurde angelegt
- Projekt konnte nicht gespeichert werden:
- Projekt wirklich löschen? Alle zugehörigen Budgets und Kosten werden ebenfalls gelöscht.
- Kosten erfassen · Kosten bearbeiten · Kosten wirklich löschen?
- Kosten gespeichert, aber Datei-Upload fehlgeschlagen:
- Geplant · Geplant: {X}%
- Gefilterte Zeiteinträge · Alle Zeiteinträge · Meine Zeiteinträge
- Zeiteintrag wurde gespeichert · Zeiteintrag wirklich löschen?
- Fehler beim Speichern des Zeiteintrags · Fehler beim Löschen des Zeiteintrags
- Fehler beim Laden des Jahres:
- Bitte wählen Sie ein Projekt · Bitte wählen Sie ein Projekt aus.
- Bitte wählen Sie einen Kostentyp aus.
- Keine Einträge · Keine Einträge ausgewählt.
- Kostentyp „{X}" wurde {X} Einträgen zugewiesen. · Fehler beim Zuweisen:

### Rechnungen, PDFs, DATEV

- Seite {X} von {X} ({X} Rechnungen) · {X}-{X} von {X}
- Alle auswählen · {X} ausgewählt · 1 Rechnung ausgewählt · {X} Rechnungen ausgewählt
- Meine Rechnungen · Kein Lieferant · Lieferant: {X}
- Bezahlt-Datum aktualisiert · Rechnung als bezahlt markiert
- {X} Rechnung(en) als kontrolliert markieren? / markiert
- {X} Rechnung(en) auf „neu" zurücksetzen? / zurückgesetzt
- {X} Rechnung(en) als bezahlt markieren? / markiert
- {X} Rechnung(en) archiviert
- Projekt gesetzt · Projekt wurde zugewiesen · Projekt entfernt
- Projektzuweisung wurde aufgehoben · Projekt konnte nicht gesetzt werden
- Rechnung nach „{X}" verschoben · Rechnung konnte nicht verschoben werden
- Abgabestelle „{X}" für {X} Rechnung(en) setzen? / gesetzt
- Abgabestelle konnte nicht gesetzt werden
- Abgabestelle für {X} Buchung(en) aktualisiert · Abgabestelle für PDF aktualisiert
- Abgabestelle gespeichert (lokal), aber keine DATEV-Buchung gefunden
- Abgabestelle konnte nicht gespeichert werden: {X}
- Lokal gespeichert, aber keine DATEV-Buchung gefunden
- MwSt-Satz auf {X}% geändert · MwSt-Satz konnte nicht gespeichert werden: {X}
- Weiteres PDF hinzufügen (oder hierhin ziehen)
- PDF-Verknüpfung trennen? Das PDF bleibt erhalten und kann neu zugewiesen werden.
- PDF-Verknüpfung wurde entfernt · Verknüpfung wurde entfernt
- Möchten Sie die Verknüpfung wirklich trennen?
- Möchten Sie die fehlerhafte PDF-Verknüpfung wirklich entfernen?
- PDF wurde mit DATEV-Buchung verknüpft · Verknüpft · Nicht verknüpft · Bereits verknüpft
- Verknüpfung fehlgeschlagen · Verknüpfung fehlgeschlagen: {X}
- Ungültiges Format für DATEV-Key · Jetzt verknüpfen
- Bitte nur PDF-Dateien hochladen. · {X} wird hochgeladen… · {X} wurde hochgeladen und verknüpft
- PDF nicht gefunden · PDF nicht in Datenbank gefunden · DATEV-Bewegung nicht gefunden
- Bitte zuerst ein PDF auswählen · Bitte wählen Sie eine Bewegung und ein PDF aus.
- {X} PDFs automatisch mit DATEV verknüpft · {X} PDFs automatisch verknüpft
- Keine Rechnungen zum Exportieren vorhanden · {X} Rechnungen exportiert
- Rechnungsnummer konnte nicht gespeichert werden
- Ansprechperson wurde aktualisiert / konnte nicht gespeichert werden
- Buchung nicht gefunden · Buchung wurde nicht gefunden
- Notiz wurde gespeichert / aktualisiert · Notiz konnte nicht gespeichert werden: {X}
- Keine löschbaren Einträge ausgewählt.
- {X} Eintrag/Einträge löschen? · • {X} PDF(s) ohne DATEV-Verknüpfung (werden dauerhaft gelöscht)
- Gelöscht · {X} Eintrag/Einträge gelöscht · Löschen fehlgeschlagen:

### Stammdaten: Lieferanten, Konten, Kostentypen, Mitarbeiter

- Neuer Lieferant · Lieferant bearbeiten · Lieferant nicht gefunden
- Lieferant wurde aktualisiert / angelegt / konnte nicht gespeichert werden
- Lieferant wirklich löschen?
- Keine Lieferanten in der Datenbank gefunden.
- Diese Funktion muss ueber eine Server-API implementiert werden.
- Konto hinzufügen · Neues Konto · Konto wirklich löschen?
- Neuer Kostentyp · Kostentyp wirklich löschen?
- Neuer Mitarbeiter · Mitarbeiter bearbeiten · Mitarbeiter wurde erfolgreich gespeichert.
- Bitte geben Sie einen Namen ein. · Bitte Name eingeben
- Bearbeiten · Löschen · Unbekannter Fehler · Fehler: · Fehler beim Speichern: · Fehler beim Löschen:
- Österreich · Dänemark · Rumänien

### Inventar, Kontakte, Künstler, Sitzungen

- Neue Sitzung · Sitzung wirklich löschen? Alle zugehörigen Aufgaben werden ebenfalls gelöscht.
- Aufgabe wirklich löschen?
- Neuer Künstler · Künstler bearbeiten · Künstler wirklich löschen?
- Neuer Gegenstand · Inventar-Eintrag wurde gespeichert
- Gegenstand wirklich aus dem Inventar löschen?
- {X} Datei(en) werden hochgeladen… · Upload-Fehler · Datei {X} konnte nicht hochgeladen werden
- Neuer Kontakt · Kontakt wirklich löschen? · Künstler · Lieferant · Sonstige · Möbel
- CSV-Kopfzeile: `Inventar-Nr;Bezeichnung;Kategorie;Standort;Zustand;Anschaffung;Wert;Beschreibung`
- CSV-Kopfzeile: `Name;Organisation;Kategorie;Email;Telefon;Strasse;PLZ;Stadt;Land;Notizen`

### Reporting und Export

- Bitte zuerst die Berechnung starten (Aktualisieren klicken).
- Bitte zuerst den Report laden (Aktualisieren klicken).
- Besucherstatistik_{X}_{X}.csv · Seite {X} von {X}
- CSV: `Projekt;Tage;Anteil;Umsatz;Direkte Kosten;DB1;Strukturkosten;DB2;Fixkosten;DB3`
- CSV: `Konto;Bezeichnung (DE);Bezeichnung (IT);Aktuelles Jahr;Vorjahr;Differenz;Anzahl Buchungen`
- CSV: `Datum;Lieferant;Dokument-Nr;Beschreibung;Betrag`
- CSV: `Datum;Lieferant;Beschreibung;Dokumentnr;Netto;MwSt;Brutto`
- CSV: `Code;Name;Geldgeber;Jahr;Budget;Status;Abgabestelle;Notizen`
- Kontenplan – Kosten ohne Kostenstelle · Jahr: {X} vs. Vorjahr: {X}
- Buchungen für Konto {X} – {X} · Suchen in Buchungstext, Konto…
- Summe Gesamtleistung (A) · Summe betriebliche Aufwendungen (B)
- Summe Finanzerträge/-aufwendungen (C) · Jahresüberschuss/-fehlbetrag
- (01.01. – {X} {X}, {X} Monate) · (Ganzes Jahr, 12 Monate)
- Summe: 0,00 EUR · Summe: {X} EUR · 1. UMSÄTZE
- Erlöse Lieferungen/Leistungen · Sonstige betriebliche Erträge · Zuschüsse und Beiträge
- Projekt-Export: {X} · Fehler beim Export:
- Bitte wählen Sie eine Excel-Datei aus · Import wird gestartet… · Import erfolgreich
- Fehler beim Lesen der Datei: · Die Datei enthält keine Daten.
- Keine Header-Zeile mit „Nachname" gefunden. Bitte prüfen Sie das Excel-Format.
- Bitte nur PDF-Dateien hochladen. · Datei zu groß. Maximale Größe: 10 MB
- Warnung: Dateiname nicht erkannt · Verknüpfungen erstellt · , {X} Fehler
- Partita IVA: {X} • Rechnung: {X} · PDF öffnen

### Einnahmen, Budget, Mitglieder

- Einnahmen konnten nicht geladen werden · Neue Einnahme · Einnahme nicht gefunden
- Einnahme wirklich löschen? Verknüpfte Rechnungen werden von dieser Abgabestelle entfernt.
- Keine Rechnungen zugeordnet · Bestätigungsdokument (E-Mail, Zusage, Vertrag)
- Budgetplanung konnte nicht geladen werden · + Budget hinzufügen
- Jahresbudget eingeben – wird gleichmäßig auf 12 Monate verteilt
- Budget für {X} gespeichert · Budget konnte nicht gespeichert werden
- Neuer Budget-Eintrag · Budget-Eintrag wurde aktualisiert / erstellt / gelöscht
- Möchten Sie diesen Budget-Eintrag wirklich löschen?
- Notizen wurden gespeichert · Notizen konnten nicht gespeichert werden
- CSV-Export wird noch implementiert
- Mitglieder konnten nicht geladen werden · Neues Mitglied · Mitglied nicht gefunden
- Mitglied wurde aktualisiert · Neues Mitglied wurde angelegt
- Zahlung wurde zugewiesen / entfernt · Zahlung für {X} wirklich entfernen?
- Zahlung wurde {X} zugewiesen · Buchung wurde {X} zugewiesen
- Keine Mitglieder mit offenen Zahlungen gefunden.
- Klicken zum Bearbeiten · Notiz hinzufügen · Notiz für {X}, {X}:
- Buchungen konnten nicht geladen werden · Daten konnten nicht geladen werden
- {X} Mitglied(er) ausgewählt · Bitte wählen Sie eine Buchung und mindestens ein Mitglied aus.
- Fehler: Buchung oder Mitglied nicht gefunden.

### Workspaces und Benutzer

- Workspaces konnten nicht geladen werden · Neuer Workspace
- Workspace wurde aktualisiert / erstellt / gelöscht
- Workspace konnte nicht gespeichert / gelöscht werden
- Benutzer verwalten · Benutzer in „{X}" · Kein Workspace ausgewählt
- Bitte geben Sie eine E-Mail-Adresse ein
- Benutzer mit dieser E-Mail wurde nicht gefunden. Der Benutzer muss sich zuerst anmelden.
- Hinzugefügt · {X} wurde zum Workspace hinzugefügt · Dieser Benutzer ist bereits im Workspace
- Möchten Sie diesen Benutzer wirklich aus dem Workspace entfernen?
- Benutzer wurde aus dem Workspace entfernt / konnte nicht entfernt werden
- Projekte · Rechnungen · Einnahmen · Lieferanten · | Nur zugewiesene Rechnungen

### Shop und Kasse

- Shop konnte nicht geladen werden · Neuer Artikel
- Name und Verkaufspreis sind Pflichtfelder · Artikel konnte nicht gespeichert werden
- Möchten Sie diesen Artikel wirklich löschen? · Artikel gelöscht
- Formular konnte nicht geöffnet werden: · Modal konnte nicht geöffnet werden
- Bitte wählen Sie einen Artikel · Verkauf konnte nicht erfasst werden
- Eintritt konnte nicht erfasst werden · Mitgliedsbeitrag konnte nicht erfasst werden
- Möchten Sie diesen Verkauf wirklich stornieren? · Verkauf nicht gefunden
- Artikel und Menge sind Pflichtfelder · Einkauf konnte nicht erfasst werden
- Möchten Sie diesen Einkauf wirklich löschen? Der Bestand wird entsprechend angepasst.
- Rechnung als kontrolliert markiert · Rechnungsdetails konnten nicht geladen werden
- Keine unverknüpften Einkäufe vorhanden · Rechnung mit Einkauf verknüpft
- Bitte geben Sie einen Betrag ein · Bewegung nicht gefunden
- Möchten Sie diese Kassen-Bewegung wirklich löschen? · Bewegung gelöscht
- Bitte Datum eingeben · Bitte geben Sie den Ist-Bestand ein
- Nicht genügend Bestand ({X} verfügbar)
- Bitte wählen Sie einen Mitarbeiter aus
- Bitte wählen Sie eine externe Person aus oder erfassen Sie eine neue
- Ausgabe konnte nicht gespeichert werden · Ausgabe gelöscht
- Möchten Sie diese Ausgabe wirklich löschen? Der Bestand wird wieder erhöht.
- Neue Eintritts-Kategorie · Neue Mitglieds-Kategorie · Neue Kurskategorie
- Möchten Sie diese Eintritts-/Mitglieds-Kategorie wirklich löschen? · Kategorie gelöscht
- Diesen Artikeltyp wirklich löschen? · Artikeltyp gelöscht
- Code und Name sind erforderlich
- Excel-Datei konnte nicht gelesen werden · Datei nicht gefunden / konnte nicht geladen werden

### Kurse und Anwesenheit

- Kurse konnten nicht geladen werden · Neuer Kurs · + Neuer Kurs · Neuer Termin: {X}
- Anwesenheit konnte nicht geladen werden
- Bitte waehle zuerst Tage aus · Bitte Status auswaehlen · Bitte Monat waehlen
- {X} OK, {X} Fehler · Woche geplant
- Büro · Büro + Essen · März

---

## Teil E — Deutsch, aber kein Übersetzungsfehler

Ein Teil der deutschen Texte kommt nicht aus dem Code, sondern aus der Datenbank. Die lassen sich nicht über `it.js` lösen — dafür bräuchte es zweisprachige Felder oder gepflegte italienische Bezeichnungen.

| Bereich | Beispiele | Anmerkung |
|---|---|---|
| Kontenplan | Warenbestandsveränderungen · Register- und Stempelgebühr · Abfallgebühr und Plakatkonzession · Zinserträge · Erlöse Lieferungen/Leistungen · Sonstige betriebliche Erträge | Der CSV-Export kennt bereits „Bezeichnung (DE)" *und* „Bezeichnung (IT)" — die Oberfläche zeigt aber immer die deutsche. |
| Kostentypen | Künstlerhonorare · Kuratorenhonorare und Reisekosten · Auf- und Abbau Dienstleistung · Öffentlichkeitsarbeit, Marketing, Werbung · Repräsentationsspesen · Transport und Zoll | Für die Kurzformen (Kuration, Vermittlung …) gibt es `costTypes.*`-Keys, für die Langformen nicht. |
| Shop-Kategorien | Ermäßigt · Führung · Fördermitglied · Student/Schüler | Stammdaten aus der Shop-Konfiguration. |
| Inventar | Möbel & Aufbau · Bücherkeller · Stühle gelb | Kategorien, Standorte und Einzelstücke. |
| Lieferanten | Architekturstiftung Südtirol · Elektro Pföstl Daniel · Straßenangaben aus DATEV | Eigennamen — bleiben zu Recht wie sie sind. |

---

## Nächste Schritte — in welcher Reihenfolge sich das lohnt

| # | Schritt | Wirkung |
|---:|---|---|
| 1 | **Vorhandene Keys anschließen.** Rund 60 Stellen brauchen nur ein `data-i18n`-Attribut. Übersetzung liegt bereits vor. | Tabellenköpfe, Filter, Buttons wechseln sofort mit |
| 2 | **Die 46 Dialoge.** Alles in einer Datei (`app.html`), viele Texte wiederholen sich — „Abbrechen" 35×, „Speichern" 26×. | größter sichtbarer Sprung |
| 3 | **Tab-Leisten und Seitentitel.** Reporting (7 Tabs), Konfiguration (8 Tabs), Budgetplanung (3 Tabs), Shop (6 Tabs). | Navigation wirkt geschlossen |
| 4 | **Meldungen aus `app.js`.** 381 Bausteine — am besten gebündelt als neue Sektion `messages.*` im Wörterbuch. | Fließtext im Betrieb |
| 5 | **Zweisprachige Stammdaten.** Kontenplan hat schon IT-Bezeichnungen — nur zeigt sie niemand an. Kostentypen und Shop-Kategorien brauchen ein zweites Feld. | Reports auf Italienisch |
| 6 | **Wörterbuch nachziehen:** `shop.pos` ergänzen, EN-Wochentage auf Mon/Fri/Sat, „Homeoffice" in beiden Sprachen anpassen. | Detailkorrektur |

---

## Zur Methode

Ich habe die Sprache auf IT gestellt, alle 13 Menüpunkte und alle Untertabs geöffnet und den jeweils sichtbaren Text automatisch gegen die drei Sprachdateien geprüft; danach dasselbe auf EN. Zusätzlich habe ich alle 46 Dialoge und die Textbausteine in `js/app.js` ausgelesen.

Nicht erfasst sind Stellen, die erst nach dem Absenden eines Formulars oder bei einem Serverfehler erscheinen, und Dialoge, die nur bestimmten Rollen angezeigt werden. Die Zuordnung einzelner Texte zu einer Ansicht ist bei geteilten Bausteinen ungefähr — die Texte selbst sind es nicht.
