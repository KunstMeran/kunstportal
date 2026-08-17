# Projektsoftware Kunsthaus Meran

Webanwendung zur Verwaltung von Projekten, Budgets, Rechnungen und Personalstunden fuer das Kunsthaus Meran.

**Version:** 2.0
**Stand:** August 2026
**Backend:** Hetzner VPS (PostgreSQL + Express.js)

---

## Projektstruktur

```
kunstmeran-app/
├── public/                    # Frontend (statische Dateien)
│   ├── index.html             # Login-Seite
│   ├── app.html               # Hauptanwendung
│   ├── css/
│   │   ├── style.css
│   │   └── tokens.css
│   ├── js/
│   │   ├── app.js             # Hauptlogik
│   │   ├── auth.js            # Authentifizierung
│   │   ├── config.js          # Konfiguration
│   │   ├── data.js            # Datenmodelle
│   │   ├── data-adapter.js    # API-Adapter
│   │   └── ...
│   └── assets/
│       ├── icons/             # SVG Icons
│       └── logo.png
│
├── database/                  # Datenbank
│   └── migrations/            # SQL-Migrationen (58 Dateien)
│
├── docs/                      # Dokumentation
│   ├── HETZNER_MIGRATION_PLAN.md
│   ├── HETZNER_SETUP_ANLEITUNG.md
│   ├── database-schema.md
│   └── guides/
│       ├── Benutzerhandbuch.md
│       ├── Administrator.md
│       └── Technische_Dokumentation.md
│
├── .env.example               # Umgebungsvariablen-Vorlage
├── .gitignore
├── package.json
└── README.md
```

---

## Features

### Hauptmodule
- **Dashboard** - Projektuebersicht mit Kostenauswertung
- **Projekte** - Projektverwaltung mit Budgetplanung
- **EK-Rechnungen** - DATEV-Import, PDF-Verknuepfung, Status-Tracking
- **Lieferanten** - Stammdatenverwaltung mit Partita IVA
- **Mitglieder** - Mitgliederverwaltung mit Beitragszahlungen
- **Shop & Kasse** - Inventar, Verkaeufe, Kassenabschluss
- **Zeiterfassung** - Stundenerfassung fuer Personal
- **Reporting** - Deckungsbeitragsrechnung, Bilanz/GuV

### Berechtigungssystem
4-stufiges Berechtigungssystem pro Modul:
- `none` - Kein Zugriff
- `read` - Nur lesen
- `write` - Bearbeiten
- `delete` - Loeschen

---

## Technologie-Stack

| Komponente | Technologie |
|------------|-------------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Express.js (Node.js) |
| Datenbank | PostgreSQL 16 |
| Auth | Session-basiert (httpOnly Cookies) |
| Hosting | Hetzner VPS CX21 |
| Reverse Proxy | Caddy (automatisches SSL) |

---

## Installation

### Lokal (Entwicklung)
```bash
# Repository klonen
git clone <repo-url>
cd kunstmeran-app

# Dependencies installieren
npm install

# .env konfigurieren
cp .env.example .env
# .env bearbeiten mit DB-Credentials

# Server starten
npm start
```

### Hetzner (Produktion)
Siehe [docs/HETZNER_SETUP_ANLEITUNG.md](docs/HETZNER_SETUP_ANLEITUNG.md)

---

## Datenbank

**34 Tabellen** mit Row-Level-Security (RLS):
- Kern: `projects`, `invoices`, `suppliers`, `datev_bookings`
- Budget: `budget_entries`, `chart_of_accounts`, ...
- Shop: `shop_artikel`, `shop_verkaeufe`, `shop_kassenabschluss`, ...
- Berechtigungen: `workspaces`, `user_workspaces`, `users`

Vollstaendiges Schema: [docs/database-schema.md](docs/database-schema.md)

---

## Migration von Supabase

Detaillierter Migrationsplan: [docs/HETZNER_MIGRATION_PLAN.md](docs/HETZNER_MIGRATION_PLAN.md)

---

## Kontakt

Controlling Solutions
Entwicklung & Support
