# TODO Liste - Projektsoftware Kunst Meran

Stand: 2026-07-29

---

## 📧 Abklärung mit Ruben (IT)

### Microsoft Login (Entra ID / Azure AD)
- [ ] **E-Mail an Ruben schreiben**: Abklären ob Microsoft-Login möglich ist
  - Frage: Haben sie Microsoft Entra ID (ehemals Azure AD)?
  - Frage: Können wir die App dort registrieren für SSO?
  - Technisch: Supabase unterstützt Microsoft OAuth als Provider
  - Vorteil: Benutzer können sich mit ihrem bestehenden Microsoft-Konto anmelden

---

## ✅ Migrationen (erledigt)

- [x] **`import-kontenplan-bezeichnungen.sql`** - Kontenbezeichnungen (DE/IT) importieren
- [x] **`documents` Bucket erstellen** - Für Inventar-Anhänge

---

## 🎯 Aktuelle Aufgaben (Priorität: Hoch)

### 1. Suche der Bewegungen
- [x] Suchfunktion für Bewegungen optimieren (Volltextsuche hinzugefügt)

### 2. Dashboard und Ansichten
- [x] Dashboard aktivieren/verknüpfen (funktioniert - zeigt Projekte mit Budget/IST)
- [x] Lieferanten-Ansicht füllen (funktioniert - lädt aus Supabase suppliers-Tabelle)
- [x] Projektdetails: Rechnungen bei den Bewegungen anzeigen
- [x] **PDF-Vorschau inline**: PDF in Modal/Vorschau anzeigen statt neuem Tab

### 3. Budget und Deckungsbeiträge
- [ ] Budget eintragen
- [x] Deckungsbeiträge erstellen (basierend auf den zwei Excel-Beispielen)
  - Migration: `create-chart-of-accounts.sql` (Kontenplan mit DB-Zuordnung)
  - Migration: `add-ist-ausstellung-to-projects.sql` (Projekt-Flag)
  - UI: Konfiguration > Kontenplan
  - Reporting: DB pro Projekt mit anteiliger Gemeinkostenverteilung

---

## 🆕 Neue Anforderungen (2026-07-29)

### DATEV Import
- [x] **Jahresfilter**: Nur Bewegungen vom ausgewählten Jahr importieren (alte movimenti ignorieren)
- [x] **Duplicate Key Error beheben**: "Duplicate key value violates unique constraint" bei DATEV Buchungen
- [ ] **Daniel fragen**: Export (Barbara) von Daten vor 2026
- [ ] **DATEV Konto für Mitgliedsbeitrag** einrichten

### PDF / Rechnungen
- [x] **Drag & Drop Upload**: PDFs direkt in Zeile hineinziehen können
- [x] **Mehrere PDFs pro Bewegung**: Mehrere PDFs pro Rechnung hochladen
- [x] **Pagination einstellbar**: 10/20/50/100 Elemente pro Seite, Standard: 10
- [x] **Spaltenbreiten einstellbar**: Wie Excel, wird gespeichert
- [x] **PDF-Spalte verschoben**: Vor Kontrolliert-Spalte
- [x] **Bezahlt-Status in Projekten anzeigen**: Mit Datum, in eigener Spalte
- [x] **Bezahlt-Datum editierbar**: Direkt in der Tabelle per Datepicker änderbar
- [x] **Kostentyp-Zuweisung Bug behoben**: Verwendete falsche ID (rechnungId statt invoiceId)

### Berechtigungen / Zugriff
- [ ] **Kostenzuweisung an 3 Personen**: Diese sollen nur die zugewiesenen Rechnungen sehen können

### Abgabestellen ✅
- [x] **Abgabestellen unter Konfiguration**: Hinzufügen können
- [x] **Dokument pro Abgabestelle**: Ein Dokument hinterlegen
- [x] **Budget pro Abgabestelle**: Festlegen und Zuweisung sehen
- [x] **Von Rechnungen entfernen**: Abgabestelle von Rechnung entfernen können

### Budgetplanung ✅
- [x] **Budget unter Lieferanten**: Budget einfügen können
- [x] **Budgetplanungs-Seite**: Eigene Seite mit Notiz-Funktion
- [x] **Forecast-Logik**: Geplant = Forecast, IST = IST, Verfügbar = IST + Forecast - Budget
- [x] **Budget unter BW Gesamtmappe**: Integration prüfen

### Einnahmeplanung ✅
- [x] **Einnahmeplanung**: Neue Funktion erstellen
- [x] **Einnahmetyp in Konfiguration**: Typ eingeben können
- [x] **Flag für Rechnungszuweisung**: Auswählen ob bei Rechnungen zuweisbar (entfällt dann in Konfiguration)

### Mitglieder / Verein
- [ ] **Mitgliederliste von Barbara**: Importieren oder eigener Reiter
- [ ] **In Einnahmeplanung integrieren**: Oder separaten Bereich erstellen

### Sponsoring
- [ ] **Sponsoren wie Lieferanten**: Ansicht mit Vorjahresvergleich

### Inventar
- [x] **Anhänge zum Inventar**: Dokumente/Dateien an Inventar-Einträge anhängen (implementiert)
  - WICHTIG: `documents` Bucket in Supabase Storage erstellen!

### Projekte / Workflow
- [x] ~~**Projekt in Projekt hinterlegen**: Ideen sammeln~~ (nicht mehr nötig)

---

## 🔧 Technische Verbesserungen

### PDF-Handling
- [x] PDF entverknüpfen Button für fehlerhafte PDFs (im Preview-Modal wenn Fehler auftritt)
- [x] PDF-Vorschau Icons in der Dropdown-Suchliste (bereits implementiert: 👁 Button)

---

## ✅ Erledigte Aufgaben

### Kontenplan & Reporting (erledigt 2026-07-29)
- [x] **Kontenplan-Report**: Kosten pro Konto mit DE/IT Bezeichnungen, Vorjahresvergleich
- [x] **Kontenplan-Import**: `import-kontenplan-bezeichnungen.sql` (200+ Konten aus Excel)
- [x] **Hinweise in Konfiguration**: Warnung wenn DATEV-Konten ohne DB-Zuweisung
- [x] **Schnell-Zuweisung**: Button zum schnellen Hinzufügen fehlender Konten

### Supabase RLS Policies (erledigt 2026-07-29)
- [x] **cost_types Tabelle**: RLS Policies hinzufügen (SELECT, INSERT, UPDATE, DELETE)
  - Migration: `supabase-migrations/create-cost-types-table.sql`

### Rechnungen-Features (erledigt 2026-07-10/11)
- [x] DATEV-Bewegung als suchbares Input mit Datalist (400px breit)
- [x] PDF-Suche als suchbares Input mit Datalist (250px breit)
- [x] PDF-Status Filter (Zugewiesen / Nicht zugewiesen)
- [x] Lieferantennamen aus Suppliers-Tabelle anzeigen
- [x] Seiten-Position bleibt beim Verknüpfen erhalten
- [x] Upload-Feedback: "X neu, Y bereits vorhanden, Z Fehler"
- [x] Mass-Upload: PDF-Preview Icon zum Öffnen
- [x] Mass-Upload: Dateinamen-Filter

### Infrastruktur (erledigt)
- [x] Supabase + Vercel Deployment
- [x] Login über Supabase Auth
- [x] Projekte aus Supabase laden
- [x] PDF-Upload zu Supabase Storage
- [x] DATEV-Import Flow

---

## 📋 Backlog (Niedrige Priorität)

### UX Verbesserungen
- [ ] Session-State bei Page-Refresh beibehalten
- [ ] Mouse-Click Effekte (Ripple)
- [ ] Kräftigere Farben für Rechnungen

### Audit & Tracking
- [ ] User-Aktivitäten tracken (created_by, updated_by)

---

## 📝 Notizen

- Kosten/Budget noch nicht migriert (localStorage)
- Alte PDFs mit falschem Dateiformat müssen neu hochgeladen werden
