# Projektsoftware Kunst Meran

## Projektbeschreibung

Lokale Webanwendung zur Verwaltung von Projekten, Budgets und Kosten für Kunst Meran.
Die Software läuft vollständig lokal im Browser ohne Server-Backend.

**Version:** 1.0.0 (Prototyp)
**Erstellt:** 29.05.2026
**Autor:** Controlling Solutions

---

## Features

### 1. Login-System
- Pseudo-Benutzer für lokalen Betrieb
- Standardbenutzer: `Admin` / `KunstMeran2026`
- Session-Verwaltung via localStorage

### 2. Benutzerrollen
| Rolle | Rechte |
|-------|--------|
| Admin | Vollzugriff: Projekte anlegen/bearbeiten/löschen, Budgets verwalten, alle Kosten einsehen |
| Mitarbeiter | Eingeschränkt: Eigene Projekte einsehen, Kosten erfassen |

### 3. Projekt-Verwaltung
- Projekte anlegen mit Name, Beschreibung, Zeitraum
- Standort/Location zuweisen (z.B. "Kunst Meran", "Biennale Venedig")
- Projektstatus: Planung, Laufend, Abgeschlossen

### 4. Budget-Planung
- Budget pro Projekt mit einzelnen Positionen
- Kostenkategorien: Personal, Material, Dienstleistungen, Reise, Sonstiges
- Geplante vs. tatsächliche Kosten

### 5. Kosten-Übersicht
- IST-Kosten: Tatsächlich angefallene Kosten
- Provisorische Kosten: Geplante/erwartete Ausgaben
- Summe: Gesamtübersicht
- Verfügbares Budget: Restbudget nach Abzug aller Kosten

### 6. Status-Anzeige
- Ampelsystem für Budget-Status (Grün/Gelb/Rot)
- Fertigstellungsgrad
- Finanzierungsquellen und deren Status

---

## Technische Umsetzung

### Architektur
```
Projektsoftware/
├── README.md              <- Diese Dokumentation
├── index.html             <- Hauptseite mit Login
├── app.html               <- Hauptanwendung nach Login
├── css/
│   └── style.css          <- Design (Schwarz/Weiß mit Akzenten)
├── js/
│   ├── auth.js            <- Login/Logout Logik
│   ├── data.js            <- Datenverwaltung (localStorage)
│   ├── projects.js        <- Projekt-Funktionen
│   ├── budget.js          <- Budget-Funktionen
│   └── app.js             <- Hauptanwendungslogik
└── data/
    └── sample_data.json   <- Beispieldaten zum Testen
```

### Technologien
- **HTML5** - Struktur
- **CSS3** - Styling (Schwarz/Weiß Design mit farbigen Akzenten)
- **JavaScript (Vanilla)** - Logik ohne Framework
- **localStorage** - Persistente Datenspeicherung im Browser

### Design-Konzept
- Hauptfarben: Schwarz (#1a1a1a), Weiß (#ffffff)
- Akzentfarbe: Blau (#3498db) für interaktive Elemente
- Statusfarben: Grün (#27ae60), Gelb (#f39c12), Rot (#e74c3c)
- Clean, minimalistisches Design
- Responsive für verschiedene Bildschirmgrößen

---

## Installation & Start

1. Ordner `Projektsoftware` öffnen
2. `index.html` im Browser öffnen (Doppelklick)
3. Mit Admin/KunstMeran2026 einloggen

**Hinweis:** Die Anwendung läuft vollständig lokal. Alle Daten werden im Browser (localStorage) gespeichert.

---

## Benutzer-Accounts (Prototyp)

| Benutzer | Passwort | Rolle |
|----------|----------|-------|
| Admin | KunstMeran2026 | Admin |
| Mitarbeiter1 | Test123 | Mitarbeiter |

---

## Datenspeicherung

Alle Daten werden im `localStorage` des Browsers gespeichert:
- `km_users` - Benutzerkonten
- `km_projects` - Projekte
- `km_budgets` - Budgetpositionen
- `km_costs` - Erfasste Kosten
- `km_session` - Aktuelle Sitzung

**Backup:** Daten können als JSON exportiert werden (Feature geplant).

---

## Superbill-Integration (Geplant)

### Konzept
Superbill/Superbith ist die Rechnungsverwaltungssoftware. Integration geplant über:
1. CSV/Excel-Export aus Superbill
2. Import in Projektsoftware
3. Automatische Zuordnung zu Projekten anhand Lieferant/Beschreibung

### Offene Fragen
- Export-Format von Superbill?
- Welche Felder sind verfügbar?
- Automatische oder manuelle Zuordnung?

---

## Changelog

### Version 1.0.0 (29.05.2026)
- Initiale Version
- Login-System implementiert
- Projekt-Verwaltung Grundfunktionen
- Budget-Planung Grundfunktionen
- Kosten-Übersicht

---

## Geplante Erweiterungen

1. [ ] Daten-Export als Excel/CSV
2. [ ] Daten-Import für Backup-Restore
3. [ ] Superbill-Integration
4. [ ] Berichtsgenerierung
5. [ ] Multi-User mit echtem Backend (zukünftig)
