# TODO Liste - Projektsoftware Kunst Meran

Stand: 2026-07-10

## 🎯 Priorität: Hoch

### 1. ✅ DATEV-ID Anzeige & Bearbeitung debuggen und fixen
**Status:** In Arbeit
**Zeitaufwand:** ~5-10 Min
**Problem:** DATEV-ID wird nicht korrekt angezeigt/gespeichert
**Nächster Schritt:**
- Browser-Konsole prüfen beim Klick auf "Bearbeiten"
- `editProject()` auf async umstellen
- `getProjectById()` mit await aufrufen

---

### 2. 📁 Files-Speicherung Konzept klären
**Status:** Offen - Entscheidung nötig
**Zeitaufwand:** Diskussion + Implementierung
**Optionen:**
- **Option A:** Supabase Storage (für jetzt, einfach zu integrieren)
- **Option B:** Hetzner Server (geplant für später, mehr Kontrolle)

**Fragen zu klären:**
- Wo sollen PDFs gespeichert werden?
- Wie funktioniert der Upload-Flow?
- Automatische Zuordnung zu Lieferanten aus DATEV-Excel?

**Features:**
- Drag & Drop für Eingangsrechnungen (PDFs)
- Automatische Benennung nach Format
- Automatische Lieferanten-Zuordnung
- PDF-Vorschau in der App
- CSV-Import mit Archiv-Historie

---

### 3. 🔄 Session-State bei Page-Refresh beibehalten
**Status:** Offen
**Zeitaufwand:** ~10 Min
**Problem:** Nach F5/Reload landet man immer auf Dashboard
**Lösung:**
- Aktuelle View in localStorage speichern
- Bei App-Init letzte View wiederherstellen
- Optional: URL-Parameter für Deep-Links

**Implementierung:**
```javascript
// Beim View-Wechsel:
localStorage.setItem('lastView', viewName);

// Bei App-Init:
const lastView = localStorage.getItem('lastView') || 'dashboard';
this.showView(lastView);
```

---

### 4. 👤 User-Aktivitäten tracken
**Status:** Offen
**Zeitaufwand:** ~15 Min
**Anforderung:** Immer ersichtlich welcher User welche Aktion durchgeführt hat

**Was zu implementieren:**
- `created_by` automatisch setzen bei INSERT
- `updated_by` + `updated_at` automatisch setzen bei UPDATE
- User-Info in Listen/Details anzeigen
- Optional: Audit-Log für wichtige Aktionen

**Supabase RLS:**
- `created_by` wird automatisch via `auth.uid()` gesetzt
- Trigger für `updated_by` erstellen

---

## 🎨 Design & UX Verbesserungen

### 5. ✨ Mouse-Click Effekte hinzufügen
**Status:** Offen
**Zeitaufwand:** ~5 Min
**Anforderung:** Kleiner bunter Punkt oder Effekt beim Klick

**Implementierung:**
- CSS Ripple-Effekt
- Bunte Farben passend zum Theme
- Smooth Animation

**Technologie:**
```css
/* Material Design Ripple Effect */
.ripple {
  position: relative;
  overflow: hidden;
}
```

---

### 6. 🎨 Farben für Rechnungen anpassen
**Status:** Offen
**Zeitaufwand:** ~5 Min
**Anforderung:** Kräftigere Farben statt Ockergelb bei Einkaufsrechnungen

**Aktuell:** Gelb/Ockertöne
**Gewünscht:** Kräftigere, stärkere Farben

**Zu ändern in CSS Variables:**
```css
:root {
  --color-invoice-pending: #f39c12; /* Aktuell: Ockergelb */
  --color-invoice-paid: #27ae60;
  --color-invoice-overdue: #e74c3c;
}
```

**Neue Vorschläge:**
- Orange: `#ff6b35` (kräftiger)
- Amber: `#ffa000` (stärker)
- Deep Orange: `#ff5722` (modern)

---

## 📊 Geschätzter Gesamtaufwand

| Task | Zeit | Status |
|------|------|--------|
| 1. DATEV-ID Fix | 5-10 Min | 🔄 In Arbeit |
| 2. Files-Speicherung | Diskussion + Impl. | ⏳ Offen |
| 3. Session-State | 10 Min | ⏳ Offen |
| 4. User-Tracking | 15 Min | ⏳ Offen |
| 5. Click-Effekte | 5 Min | ⏳ Offen |
| 6. Farben-Update | 5 Min | ⏳ Offen |
| **GESAMT** | **~1 Stunde** (ohne Files) | |

---

## 🗂️ Reihenfolge der Umsetzung

1. ✅ **DATEV-ID fixen** (muss funktionieren)
2. 📁 **Files-Konzept besprechen** (wichtige Entscheidung)
3. 🔄 **Session-State** (schnelle UX-Verbesserung)
4. 👤 **User-Tracking** (wichtig für Audit)
5. ✨ **Click-Effekte** (nice to have)
6. 🎨 **Farben** (polishing)

---

## 📝 Notizen

- Supabase + Vercel Deployment läuft stabil ✅
- Projekte aus Supabase werden geladen ✅
- Login über Supabase Auth funktioniert ✅
- Kosten/Budget noch nicht migriert (localStorage)
- DATEV-Import Flow vorhanden (muss an Supabase angepasst werden)

---

## 🚀 Nach Fertigstellung

- [ ] Kosten nach Supabase migrieren
- [ ] Budget-Items nach Supabase migrieren
- [ ] Einnahmen nach Supabase migrieren
- [ ] DATEV-CSV Import auf Supabase umstellen
- [ ] PDF-Upload System implementieren
- [ ] Tests schreiben
- [ ] Dokumentation aktualisieren
