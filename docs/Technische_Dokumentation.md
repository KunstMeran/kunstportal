# Technische Dokumentation - Projektsoftware Kunst Meran

**Version:** 1.0.0
**Stand:** Juni 2026
**Autor:** Controlling Solutions

---

## 1. Systemarchitektur

### 1.1 Ordnerstruktur

```
Projektsoftware/
├── app.html                    # Hauptanwendung (Single Page Application)
├── css/
│   └── style.css               # Stylesheet
├── js/
│   ├── app.js                  # UI-Logik & Event-Handling
│   ├── auth.js                 # Authentifizierung
│   └── data.js                 # Datenverwaltung & Business-Logik
├── data/
│   ├── buchungen.json          # Aktuelle DATEV-Daten (generiert)
│   ├── buchungen_2025.json     # Jahresarchiv (optional)
│   └── backups/                # Automatische Backups (max. 10)
├── scripts/
│   ├── import_datev.vbs        # DATEV-Import-Skript
│   └── archiviere_jahr.vbs     # Jahresarchivierung
├── DATEV Exporte/
│   └── Controlling - Kunst Meran.xls  # Input: DATEV-Export
└── EK-Rechnungen/
    └── *.pdf                   # Rechnungs-PDFs
```

### 1.2 Datenfluss

```
DATEV Export (.xls)
        │
        ▼
import_datev.vbs ──► Backup erstellen
        │
        ▼
buchungen.json ◄──── PDF-Matching (EK-Rechnungen/)
        │
        ▼
Web-Anwendung (app.html)
        │
        ▼
localStorage (Status-Daten)
```

---

## 2. Komponenten

### 2.1 Import-Skript (import_datev.vbs)

**Zweck:** Konvertiert DATEV Excel-Export zu JSON

**Funktionen:**
- Excel-Datei lesen via COM-Objekt
- Spalten automatisch erkennen (deutsch/italienisch)
- PDF-Dateien im EK-Rechnungen-Ordner scannen
- JSON mit UTF-8 Encoding generieren
- Automatisches Backup vor Überschreiben
- Alte Backups aufräumen (behält letzte 10)

**Erkannte Spalten:**
| Spalte | Deutsch | Italienisch |
|--------|---------|-------------|
| Lieferant | Lieferant | Fornitore |
| Partita IVA | Steuernummer | Partita IVA |
| Rechnungsnr. | Belegnummer | Numero documento |
| Datum | Datum | Data |
| Betrag Netto | Netto | Imponibile |
| MwSt | MwSt | IVA |
| Projekt-ID | (letzte Spalte) | (letzte Spalte) |

**Ausführung:**
```
Doppelklick auf: scripts/import_datev.vbs
```

### 2.2 Archivierungs-Skript (archiviere_jahr.vbs)

**Zweck:** Erstellt Jahresarchiv für abgeschlossene Jahre

**Funktionen:**
- Fragt Jahr ab (Default: Vorjahr)
- Kopiert buchungen.json zu buchungen_JAHR.json
- Warnt bei existierendem Archiv

**Ausführung:**
```
Doppelklick auf: scripts/archiviere_jahr.vbs
```

### 2.3 Web-Anwendung (app.html)

**Technologie:** Vanilla JavaScript (keine Frameworks)

**Module:**

| Datei | Verantwortlichkeit |
|-------|-------------------|
| data.js | Datenladen, -speichern, Business-Logik |
| auth.js | Login/Logout, Benutzerrollen |
| app.js | UI-Rendering, Event-Handler |

---

## 3. Datenstrukturen

### 3.1 buchungen.json

```json
{
  "lastUpdate": "2026-06-22T14:30:00.000Z",
  "sourceFile": "Controlling - Kunst Meran.xls",
  "buchungen": [
    {
      "id": 1,
      "partitaIva": "IT01234567890",
      "fornitoreNr": "10001",
      "fornitoreName": "Firma XYZ S.r.l.",
      "dokumentNr": "52/2026",
      "dokumentTyp": "FT",
      "betrag": 1500.00,
      "betragNetto": 1229.51,
      "betragMwst": 270.49,
      "datum": "2026-03-15",
      "projektId": "2601",
      "pdfFile": "IT01234567890_52.2026.pdf",
      "pdfExists": true,
      "istGutschrift": false
    }
  ],
  "lieferanten": [
    {
      "partitaIva": "IT01234567890",
      "nummer": "10001",
      "name": "Firma XYZ S.r.l.",
      "anzahlRechnungen": 5
    }
  ],
  "projekte": {
    "2601": { "name": "Complice", "summe": 15000.00 },
    "2602": { "name": "Animacies", "summe": 8500.00 }
  },
  "stats": {
    "anzahlBuchungen": 150,
    "anzahlLieferanten": 45,
    "anzahlPDFs": 120
  }
}
```

### 3.2 localStorage (Status-Daten)

**Key:** `kunstMeran_rechnungStatus`

```json
{
  "IT01234567890_52.2026": {
    "kontrolliert": true,
    "bezahlt": false,
    "kostentyp": "material",
    "abgabestelle": "gemeinde",
    "notizen": "Warten auf Lieferung"
  }
}
```

**Key:** `kunstMeran_lieferantenNamen`

```json
{
  "IT01234567890": "Manuell erfasster Name"
}
```

---

## 4. Projekt-IDs

| ID | Projekt | Status |
|----|---------|--------|
| 2601 | Complice | aktiv |
| 2602 | Animacies | aktiv |
| 2603 | Stadtraum Meran | aktiv |
| 2604 | Wanderausstellung | aktiv |
| 2605 | Konzertreihe | aktiv |
| 2606 | Menschenbilder | aktiv |
| 2607 | Rahmenprogramm | aktiv |

**Wichtig:** Nur Rechnungen mit Projekt-ID 2601-2607 werden in der Rechnungsübersicht angezeigt.

---

## 5. Authentifizierung

### 5.1 Benutzer

| Benutzername | Passwort | Rolle |
|--------------|----------|-------|
| Admin | KunstMeran2026 | admin |
| Mitarbeiter1 | Test123 | user |

### 5.2 Berechtigungen

| Funktion | Admin | User |
|----------|-------|------|
| Rechnungen ansehen | ✓ | ✓ |
| Status ändern | ✓ | ✓ |
| CSV Export | ✓ | ✓ |
| Projekte verwalten | ✓ | ✗ |
| Einstellungen | ✓ | ✗ |

---

## 6. PDF-Verknüpfung

### 6.1 Dateinamenskonvention

```
Format: [PartitaIVA]_[Rechnungsnummer].pdf

Beispiele:
- IT01234567890_52.2026.pdf
- IT00987654321_FT-2026-001.pdf
```

**Konvertierungsregeln:**
- `/` wird zu `.` (52/2026 → 52.2026)
- Leerzeichen werden entfernt
- Sonderzeichen werden beibehalten

### 6.2 Matching-Logik

```javascript
// In import_datev.vbs
pdfFileName = partitaIva & "_" & Replace(dokumentNr, "/", ".") & ".pdf"
pdfExists = FileExists(pdfPath & "\" & pdfFileName)
```

---

## 7. Backup-System

### 7.1 Automatische Backups

- **Trigger:** Vor jedem Import (import_datev.vbs)
- **Speicherort:** data/backups/
- **Format:** buchungen_backup_YYYYMMDD_HHMMSS.json
- **Retention:** Letzte 10 Backups

### 7.2 Jahresarchive

- **Trigger:** Manuell (archiviere_jahr.vbs)
- **Speicherort:** data/
- **Format:** buchungen_YYYY.json
- **Abruf:** Jahr-Dropdown in Rechnungsübersicht

---

## 8. Server-Deployment

### 8.1 Lokaler Server (empfohlen)

**Voraussetzungen:**
- Windows Server mit Netzwerkfreigabe
- Python 3.x oder IIS

**Setup mit Python:**
```batch
cd C:\Projektsoftware
python -m http.server 8080
```

**Zugriff:**
```
http://[SERVER-IP]:8080/app.html
```

### 8.2 Hetzner Cloud (optional)

- Server: CX23 (4,49 EUR/Monat)
- VPN-Tunnel erforderlich
- Ruben für Setup kontaktieren

---

## 9. Fehlerbehebung

### 9.1 Import-Skript

| Problem | Ursache | Lösung |
|---------|---------|--------|
| "Excel nicht gefunden" | Excel nicht installiert | Excel installieren oder LibreOffice |
| "Keine Buchungen" | Falsche Spaltenstruktur | Debug-Log prüfen (data/import_debug.log) |
| "Lieferantennamen fehlen" | Spalte nicht erkannt | "Denominazione" Spalte prüfen |

### 9.2 Web-Anwendung

| Problem | Ursache | Lösung |
|---------|---------|--------|
| "Keine Rechnungen" | JSON nicht geladen | F5 drücken, Console prüfen |
| Status geht verloren | Anderer Browser | Gleichen Browser verwenden |
| PDFs öffnen nicht | Falscher Pfad | Dateinamen-Konvention prüfen |

---

## 10. Erweiterungsmöglichkeiten

1. **Datenbank-Backend:** SQLite oder PostgreSQL für persistente Speicherung
2. **Multi-User:** Server-seitige Session-Verwaltung
3. **API:** REST-API für Integration mit anderen Systemen
4. **Automatisierung:** Windows Task Scheduler für regelmäßige Imports

---

## 11. Kontakt & Support

**Entwicklung:** Controlling Solutions
**Projekt:** Kunsthaus Meran Kostenanalyse
**Repository:** Lokal (kein Git-Repository)
