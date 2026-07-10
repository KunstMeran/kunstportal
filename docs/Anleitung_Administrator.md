# Anleitung für Administratoren - Projektsoftware Kunst Meran

**Zielgruppe:** Barbara, IT-Verantwortliche
**Stand:** Juni 2026

---

## Schnellstart

Die Projektsoftware besteht aus:
1. **Web-Portal** - Hier sehen und bearbeiten Mitarbeiter die Rechnungen
2. **Import-Skript** - Importiert neue Daten aus DATEV
3. **Archiv-Skript** - Archiviert abgeschlossene Jahre

---

## Ordnerstruktur

```
Projektsoftware/
│
├── DATEV Exporte/          ← Hier DATEV-Dateien ablegen
│   └── Controlling - Kunst Meran.xls
│
├── EK-Rechnungen/          ← Hier PDF-Rechnungen ablegen
│   └── [PartitaIVA]_[Rechnungsnummer].pdf
│
├── scripts/                ← Hier sind die Skripte
│   ├── import_datev.vbs    ← DATEV importieren
│   └── archiviere_jahr.vbs ← Jahr archivieren
│
├── data/                   ← Automatisch generierte Daten
│   ├── buchungen.json      ← Aktuelle Daten
│   └── backups/            ← Automatische Sicherungen
│
└── app.html                ← Das Web-Portal
```

---

## Regelmäßige Aufgaben

### 1. Neue DATEV-Daten importieren

**Wann:** Nach jedem neuen DATEV-Export (z.B. monatlich)

**Schritte:**

1. **DATEV-Export erstellen**
   - In DATEV: Export als Excel-Datei (.xls oder .xlsx)
   - Alle Buchungen für die gewünschten Projekte (2601-2607)

2. **Datei speichern**
   - Speichern unter: `DATEV Exporte/Controlling - Kunst Meran.xls`
   - Die alte Datei wird überschrieben (Backup wird automatisch erstellt)

3. **Import ausführen**
   - Doppelklick auf: `scripts/import_datev.vbs`
   - Warten bis Erfolgsmeldung erscheint
   - Bei Fehlern: Debug-Log unter `data/import_debug.log` prüfen

4. **Portal aktualisieren**
   - Im Browser: F5 drücken oder "Aktualisieren" Button klicken

---

### 2. PDF-Rechnungen ablegen

**Wann:** Sobald neue Rechnungen eingehen

**Dateiname-Format:**
```
[PartitaIVA]_[Rechnungsnummer].pdf
```

**Beispiele:**
| DATEV Rechnungsnr. | PartitaIVA | PDF-Dateiname |
|-------------------|------------|---------------|
| 52/2026 | IT01234567890 | IT01234567890_52.2026.pdf |
| FT-001 | IT00987654321 | IT00987654321_FT-001.pdf |

**Wichtig:**
- `/` in der Rechnungsnummer wird zu `.`
- Keine Leerzeichen im Dateinamen
- Groß-/Kleinschreibung beachten

---

### 3. Jahr archivieren (Jahresende)

**Wann:** Am Ende jedes Jahres, bevor neue Daten importiert werden

**Schritte:**

1. **Archiv-Skript ausführen**
   - Doppelklick auf: `scripts/archiviere_jahr.vbs`
   - Jahr eingeben (z.B. "2025")
   - Bestätigen

2. **Ergebnis**
   - Neue Datei: `data/buchungen_2025.json`
   - Alte Jahre können im Portal über das Dropdown angezeigt werden

3. **Neues Jahr starten**
   - Neuen DATEV-Export nur mit Daten des neuen Jahres erstellen
   - Import ausführen wie gewohnt

---

## Benutzerverwaltung

### Aktuelle Benutzer

| Benutzername | Passwort | Berechtigung |
|--------------|----------|--------------|
| Admin | KunstMeran2026 | Alle Funktionen |
| Mitarbeiter1 | Test123 | Rechnungen bearbeiten |

### Passwort ändern

Die Passwörter sind in `js/auth.js` definiert:

```javascript
// Zeile ca. 10-20
const USERS = {
    'Admin': { password: 'KunstMeran2026', role: 'admin', name: 'Administrator' },
    'Mitarbeiter1': { password: 'Test123', role: 'user', name: 'Mitarbeiter 1' }
};
```

**Zum Ändern:**
1. Datei `js/auth.js` mit Texteditor öffnen
2. Passwort ändern
3. Speichern

### Neuen Benutzer anlegen

In `js/auth.js` hinzufügen:
```javascript
'NeuerName': { password: 'NeuesPasswort', role: 'user', name: 'Anzeigename' }
```

---

## Server-Setup (Lokaler Server)

### Option A: Python (einfachste Lösung)

**Voraussetzung:** Python installiert (python.org)

**Schritte:**

1. **Startskript erstellen** - Datei `start_server.bat`:
```batch
@echo off
cd /d "C:\Pfad\zur\Projektsoftware"
echo Server laeuft auf http://192.168.x.x:8080
echo Druecke Strg+C zum Beenden
python -m http.server 8080 --bind 0.0.0.0
```

2. **Server starten**
   - Doppelklick auf `start_server.bat`
   - Fenster offen lassen

3. **Zugriff für Mitarbeiter**
   - IP-Adresse des Servers ermitteln: `ipconfig`
   - Mitarbeiter öffnen: `http://[IP-ADRESSE]:8080/app.html`

### Option B: IIS (Windows Server)

1. IIS-Rolle aktivieren
2. Neue Website erstellen
3. Physischer Pfad: Projektsoftware-Ordner
4. Port: 8080 (oder 80)

---

## Fehlerbehebung

### "Keine Rechnungen gefunden"

**Ursachen:**
- buchungen.json existiert nicht → Import ausführen
- Rechnungen haben keine gültige Projekt-ID (2601-2607)

**Lösung:**
1. Import-Skript ausführen
2. Debug-Log prüfen: `data/import_debug.log`

### "Lieferantennamen fehlen"

**Ursache:** DATEV-Export enthält keine Spalte "Denominazione"

**Lösung:**
- Im Portal: Stift-Symbol klicken und Namen manuell eingeben
- Namen werden lokal gespeichert und bleiben erhalten

### "PDF wird nicht angezeigt"

**Ursachen:**
- PDF-Dateiname stimmt nicht mit DATEV-Daten überein
- Datei fehlt im EK-Rechnungen-Ordner

**Lösung:**
1. In buchungen.json prüfen welcher Dateiname erwartet wird
2. PDF entsprechend umbenennen

### Status-Daten verloren

**Ursache:** Status wird im Browser-Speicher (localStorage) gespeichert

**Wichtig:**
- Immer gleichen Browser verwenden
- Kein privates/Inkognito-Fenster
- Browser-Daten nicht löschen

---

## Backup-Strategie

### Automatisch (vor jedem Import)
- Speicherort: `data/backups/`
- Behält letzte 10 Versionen
- Dateiname: `buchungen_backup_YYYYMMDD_HHMMSS.json`

### Manuell empfohlen
Regelmäßig sichern:
1. `data/buchungen.json`
2. `EK-Rechnungen/` Ordner
3. `DATEV Exporte/` Ordner

### Status-Daten sichern
Die Status-Daten (kontrolliert, bezahlt, etc.) sind im Browser gespeichert.
Export: Im Portal → CSV Export enthält alle Status-Informationen

---

## Checkliste: Monatlicher Workflow

- [ ] DATEV-Export erstellen (nur neue Buchungen oder Komplett)
- [ ] Export speichern unter `DATEV Exporte/Controlling - Kunst Meran.xls`
- [ ] Neue PDF-Rechnungen in `EK-Rechnungen/` ablegen
- [ ] `import_datev.vbs` ausführen
- [ ] Portal öffnen und Daten prüfen
- [ ] Bei Problemen: Debug-Log prüfen

## Checkliste: Jahresende

- [ ] Letzte DATEV-Daten importieren
- [ ] `archiviere_jahr.vbs` ausführen
- [ ] Archiv-Datei prüfen (buchungen_YYYY.json)
- [ ] Neuen DATEV-Export für neues Jahr vorbereiten
- [ ] Backup aller Daten erstellen

---

## Kontakt

Bei technischen Fragen: [Controlling Solutions]
