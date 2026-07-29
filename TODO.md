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

## 🚨 Blockierend

*Keine blockierenden Issues*

---

## 🎯 Aktuelle Aufgaben (Priorität: Hoch)

### 1. Import der Bedarfe
- [ ] Prüfen, ob die Bedarfe ohne "owner 2026" (die gelöscht wurden) bereits verknüpft waren
- [ ] Kontrollieren, ob die später hochgeladenen Bedarfe korrekt verknüpft wurden
- [ ] Weitere Bedarfe hochladen (sobald fehlende Fornitori ergänzt sind)
- [ ] Fehlende Fornitori (Lieferanten) identifizieren und ergänzen

### 2. Suche der Bewegungen
- [x] Suchfunktion für Bewegungen optimieren (Volltextsuche hinzugefügt)

### 3. Dashboard und Ansichten
- [x] Dashboard aktivieren/verknüpfen (funktioniert - zeigt Projekte mit Budget/IST)
- [x] Lieferanten-Ansicht füllen (funktioniert - lädt aus Supabase suppliers-Tabelle)
- [ ] Projektdetails: Rechnungen bei den Bewegungen anzeigen

### 4. Budget und Deckungsbeiträge
- [ ] Budget eintragen
- [x] Deckungsbeiträge erstellen (basierend auf den zwei Excel-Beispielen)
  - Migration: `create-chart-of-accounts.sql` (Kontenplan mit DB-Zuordnung)
  - Migration: `add-ist-ausstellung-to-projects.sql` (Projekt-Flag)
  - UI: Konfiguration > Kontenplan
  - Reporting: DB pro Projekt mit anteiliger Gemeinkostenverteilung

---

## 🆕 Neue Anforderungen (2026-07-29)

### DATEV Import
- [ ] **Jahresfilter**: Nur Bewegungen vom ausgewählten Jahr importieren (alte movimenti ignorieren)
- [ ] **Duplicate Key Error beheben**: "Duplicate key value violates unique constraint" bei DATEV Buchungen
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

### Abgabestellen (Neu)
- [ ] **Abgabestellen unter Konfiguration**: Hinzufügen können
- [ ] **Dokument pro Abgabestelle**: Ein Dokument hinterlegen
- [ ] **Budget pro Abgabestelle**: Festlegen und Zuweisung sehen
- [ ] **Von Rechnungen entfernen**: Abgabestelle von Rechnung entfernen können

### Budgetplanung (Erweiterung)
- [ ] **Budget unter Lieferanten**: Budget einfügen können
- [ ] **Budgetplanungs-Seite**: Eigene Seite mit Notiz-Funktion
- [ ] **Forecast-Logik**: Geplant = Forecast, IST = IST, Verfügbar = IST + Forecast - Budget
- [ ] **Budget unter BW Gesamtmappe**: Integration prüfen

### Einnahmeplanung (Neu)
- [ ] **Einnahmeplanung**: Neue Funktion erstellen
- [ ] **Einnahmetyp in Konfiguration**: Typ eingeben können
- [ ] **Flag für Rechnungszuweisung**: Auswählen ob bei Rechnungen zuweisbar (entfällt dann in Konfiguration)

### Mitglieder / Verein
- [ ] **Mitgliederliste von Barbara**: Importieren oder eigener Reiter
- [ ] **In Einnahmeplanung integrieren**: Oder separaten Bereich erstellen

### Sponsoring
- [ ] **Sponsoren wie Lieferanten**: Ansicht mit Vorjahresvergleich

### Inventar
- [ ] **Anhänge zum Inventar**: Dokumente/Dateien an Inventar-Einträge anhängen

### Projekte / Workflow
- [ ] **Projekt in Projekt hinterlegen**: Ideen sammeln, sodass Barbara eine Nachricht bekommt

---

## 🔧 Technische Verbesserungen

### PDF-Handling
- [x] PDF entverknüpfen Button für fehlerhafte PDFs (im Preview-Modal wenn Fehler auftritt)
- [x] PDF-Vorschau Icons in der Dropdown-Suchliste (bereits implementiert: 👁 Button)

---

## ✅ Erledigte Aufgaben

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
