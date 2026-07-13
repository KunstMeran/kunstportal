# TODO Liste - Projektsoftware Kunst Meran

Stand: 2026-07-11

---

## 🚨 Blockierend

### Supabase RLS Policies
- [ ] **cost_types Tabelle**: RLS Policies hinzufügen (SELECT, INSERT, UPDATE, DELETE)
  ```sql
  CREATE POLICY "Users can view cost_types" ON cost_types FOR SELECT TO authenticated USING (true);
  CREATE POLICY "Users can insert cost_types" ON cost_types FOR INSERT TO authenticated WITH CHECK (true);
  CREATE POLICY "Users can update cost_types" ON cost_types FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
  CREATE POLICY "Users can delete cost_types" ON cost_types FOR DELETE TO authenticated USING (true);
  ```
  → Ohne diese Policies funktioniert Konfiguration > Kostentypen nicht!

---

## 🎯 Aktuelle Aufgaben (Priorität: Hoch)

### 1. Import der Bedarfe
- [ ] Prüfen, ob die Bedarfe ohne "owner 2026" (die gelöscht wurden) bereits verknüpft waren
- [ ] Kontrollieren, ob die später hochgeladenen Bedarfe korrekt verknüpft wurden
- [ ] Weitere Bedarfe hochladen (sobald fehlende Fornitori ergänzt sind)
- [ ] Fehlende Fornitori (Lieferanten) identifizieren und ergänzen

### 2. Suche der Bewegungen
- [ ] Suchfunktion für Bewegungen optimieren

### 3. Dashboard und Ansichten
- [ ] Dashboard aktivieren/verknüpfen (bereits vorbereitet)
- [ ] Lieferanten-Ansicht füllen (aktuell leer)
- [ ] Projektdetails: Rechnungen bei den Bewegungen anzeigen

### 4. Budget und Deckungsbeiträge
- [ ] Budget eintragen
- [ ] Deckungsbeiträge erstellen (basierend auf den zwei Excel-Beispielen)

---

## 🔧 Technische Verbesserungen

### PDF-Handling
- [ ] PDF entverknüpfen Button für fehlerhafte PDFs (rote Links)
- [ ] PDF-Vorschau Icons in der Dropdown-Suchliste

---

## ✅ Erledigte Aufgaben

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
