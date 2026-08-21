# Migration TODO - Hetzner

**Server IP:** 2.28.22.217
**Domain:** portal.kunstmeranoarte.org (DNS pending bei Giraffentoast/Hetzner DNS)
**Datum:** 2026-08-17

---

## Phase 1: Server einrichten ✅ ABGESCHLOSSEN

- [x] Hetzner Server erstellen (CX22, Ubuntu 24.04, Falkenstein)
- [x] SSH-Key `id_hetzner` einrichten
- [x] Hetzner Cloud Firewall konfigurieren (Ports 22, 80, 443)
- [x] System updaten (`apt update && apt upgrade`)
- [x] Fail2ban installieren und aktiv
- [x] User `kunstmeran` erstellen mit sudo-Rechten
- [x] SSH-Key fuer neuen User kopiert
- [x] PostgreSQL 18.4 installiert
- [x] Caddy 2.11.4 installiert (Reverse Proxy + SSL)
- [x] Node.js 22.23.2 + npm 10.9.8 installiert
- [ ] Root-Login deaktivieren (nach Go-Live)

**Server-Zugangsdaten:**
- SSH: `ssh kunstmeran@2.28.22.217` (Root-Login funktioniert nicht mehr!)
- User: `kunstmeran` (mit sudo)
- PostgreSQL User: `kunstmeran_app`
- PostgreSQL DB: `kunstmeran`

**Hinweis:** Root-Passwort (`ControllArt26.`) funktioniert nicht mehr fuer SSH/su.
Nutze User `kunstmeran` mit sudo.

---

## Kontakte

- [x] **Giraffentoast:** DNS A-Record `portal.kunstmeranoarte.org` -> `2.28.22.217` (eingetragen in Hetzner DNS, TTL 7200)
- [ ] **Ruben:** Azure AD App-Registrierung (sobald DNS funktioniert)
  - Redirect URI: `https://portal.kunstmeranoarte.org/callback`

---

## Phase 2: Datenbank migrieren ✅ ABGESCHLOSSEN

- [x] PostgreSQL-Datenbank `kunstmeran` erstellen
- [x] User `kunstmeran_app` erstellen
- [x] Custom Type `permission_level` erstellen
- [x] Schema erstellt via `003_complete_schema.sql` (40 Tabellen + Views)
- [x] Daten von Supabase exportiert via `pg_dump --data-only`
- [x] Daten importiert (mit deaktivierten Foreign Keys wegen zirkulaerer Referenzen)
- [x] Indizes erstellt
- [x] Views erstellt

**Importierte Daten:**
| Tabelle | Anzahl |
|---------|--------|
| datev_bookings | 7.010 |
| suppliers | 598 |
| konto_bezeichnungen | 198 |
| invoices | 163 |
| members | 147 |
| anwesenheit_planung | 87 |
| budget_entries | 84 |
| chart_of_accounts | 26 |
| member_payments | 26 |
| cost_types | 18 |
| projects | 8 |
| kurs_kategorien | 8 |
| shop_artikeltypen | 6 |
| users | 5 |
| workspaces | 3 |
| user_workspaces | 2 |
| shop_artikel | 1 |

**Hinweise:**
- Foreign Keys zwischen `invoices` und `datev_bookings` wurden temporaer entfernt (zirkulaere Referenz)
- Unique Index `idx_unique_datev_booking_v2` wurde entfernt (Duplikate im Import)

---

## Phase 3: PDF-Dateien migrieren ✅ ABGESCHLOSSEN

- [x] PDFs von Supabase Storage heruntergeladen (manuell als ZIP)
- [x] Auf Server hochgeladen via SCP
- [x] Entpackt nach `/var/www/kunstmeran/storage/`

**Dateien:**
- `/var/www/kunstmeran/storage/invoices/` - 342 PDF-Dateien
- `/var/www/kunstmeran/storage/inventar/` - 3 Dateien

---

## Phase 4: Backend-API einrichten ✅ ABGESCHLOSSEN

- [x] Express.js Backend erstellen unter `/var/www/kunstmeran/api/`
- [x] API-Endpunkte implementieren (14 Route-Dateien)
- [x] Session-Authentifizierung einrichten (connect-pg-simple)
- [x] Caddy Reverse Proxy konfigurieren
- [x] PM2 fuer Prozess-Management installieren
- [x] API testen - Health-Check erfolgreich
- [x] `/datev/years` Endpunkt hinzugefuegt (fuer Jahr-Auswahl)

**Installierte Pakete:**
- express 4.18.2
- pg 8.11.3
- cors, helmet, express-session
- connect-pg-simple (Sessions in PostgreSQL)
- multer (File-Uploads)
- dotenv

**API-Struktur:**
```
/api/v1/
├── auth/           # Login, Logout, Session
├── users/          # User-Verwaltung (CRUD)
├── projects/       # Projekte (CRUD)
├── invoices/       # Rechnungen (CRUD + Filter)
├── datev/          # DATEV-Buchungen (CRUD + Import + Aggregation + Years)
├── suppliers/      # Lieferanten (CRUD)
├── members/        # Mitglieder + Zahlungen
├── budget/         # Budget-Eintraege, Notizen, Kontenplan
├── shop/           # Artikel, Verkaeufe, Einkaeufe, Kasse
├── workspaces/     # Berechtigungen
├── storage/        # PDF-Upload/Download/Liste
├── zeiterfassung/  # Time Entries + Stats
├── kurse/          # Kurse, Termine, Teilnehmer
└── anwesenheit/    # Planung + Heute-View
```

**PM2 Status:**
- Process: `kunstmeran-api`
- Auto-Start: systemd pm2-root.service aktiviert

---

## Phase 5: Frontend anpassen ✅ ABGESCHLOSSEN

- [x] `config.js` - API-URL geaendert zu Hetzner Backend
- [x] `api-client.js` - NEU: Fetch-basierter API-Client (ersetzt Supabase-Client)
- [x] `auth.js` - Microsoft SSO mit MSAL.js implementiert
- [x] `storage-service.js` - Storage-URLs angepasst fuer Hetzner
- [x] `data.js` - Supabase-Referenzen entfernt, nutzt jetzt ApiClient
- [x] `app.html` + `index.html` - Script-Tags aktualisiert (MSAL statt Supabase)
- [x] Frontend auf Server deployed via Git Clone

**Geaenderte Dateien:**
| Datei | Aenderung |
|-------|-----------|
| `public/js/config.js` | API-URLs fuer Hetzner, Microsoft SSO Platzhalter |
| `public/js/api-client.js` | **NEU** - 500+ Zeilen, alle API-Aufrufe |
| `public/js/auth.js` | MSAL.js Integration fuer Microsoft SSO |
| `public/js/storage-service.js` | Hetzner Storage-URLs |
| `public/js/data.js` | `getAvailableYears()` nutzt jetzt ApiClient |
| `public/app.html` | MSAL-Script statt Supabase, api-client.js hinzugefuegt |
| `public/index.html` | MSAL-Script statt Supabase, api-client.js hinzugefuegt |

**Git Commit:**
```
94c7f73 - Phase 5: Frontend für Hetzner API angepasst
```

**Deployment:**
- Repository: https://github.com/KunstMeran/kunstportal (privat)
- Geklont nach `/var/www/kunstmeran/app/` via Git
- Rechte: `www-data:www-data`

---

## Phase 6: Go-Live 🔄 IN ARBEIT

- [x] DNS-Propagation abwarten (eingetragen bei Hetzner DNS, TTL 7200)
- [x] SSL-Zertifikat pruefen (Caddy macht das automatisch sobald DNS aktiv)
- [x] Azure AD Credentials von Ruben eintragen:
  - [x] `config.js` auf Server: clientId und tenantId eintragen
  - [x] Auf GitHub pushen und auf Server pullen
- [ ] Finale Tests mit echten Usern:
  - [x] Dashboard
  - [x] Projekte
  - [x] Rechnungen
  - [x] Bewegungen (DATEV)
  - [x] Lieferanten
  - [x] Mitglieder
  - [x] Shop & Kasse (teilweise - Aktionen-Bilder fehlen noch)
  - [x] Zeiterfassung (CRUD funktioniert)
  - [x] Kalender (externe Termine + Zeiteintraege)
  - [x] Anwesenheit (API-Migration erledigt)
  - [ ] Konfiguration
- [ ] Root-Login auf Server deaktivieren
- [ ] Supabase-Projekt archivieren (nicht loeschen!)
- [ ] Monitoring einrichten (optional)

**DNS Status pruefen:**
```powershell
nslookup portal.kunstmeranoarte.org 8.8.8.8
```
Oder: https://dnschecker.org/#A/portal.kunstmeranoarte.org

---

## Server-Struktur

```
/var/www/kunstmeran/
├── app/                    # Frontend (HTML, JS, CSS)
│   ├── index.html          # Login-Seite
│   ├── app.html            # Haupt-App
│   ├── css/
│   ├── js/
│   │   ├── config.js       # Konfiguration
│   │   ├── api-client.js   # NEU: API-Client
│   │   ├── auth.js         # Microsoft SSO
│   │   ├── storage-service.js
│   │   ├── data.js
│   │   └── ...
│   └── assets/
├── api/                    # Backend (Express.js)
│   ├── server.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── datev.js        # inkl. /years Endpunkt
│   │   └── ...
│   ├── middleware/
│   └── package.json
├── storage/                # Dateien
│   ├── invoices/           # 342 PDFs
│   └── inventar/           # 3 Dateien
└── backups/                # DB-Backups (spaeter)
```

---

## Caddy-Konfiguration

Aktuelle `/etc/caddy/Caddyfile`:
```
portal.kunstmeranoarte.org, :80 {
    root * /var/www/kunstmeran/app
    file_server

    handle /api/* {
        reverse_proxy localhost:3000
    }

    handle /storage/* {
        root * /var/www/kunstmeran
        file_server
    }

    header {
        X-Frame-Options "SAMEORIGIN"
        X-Content-Type-Options "nosniff"
        X-XSS-Protection "1; mode=block"
    }

    try_files {path} /index.html

    log {
        output file /var/log/caddy/kunstmeran.log
    }
}
```

---

## Wichtige Befehle

```bash
# SSH zum Server (NICHT root, sondern kunstmeran!)
ssh kunstmeran@2.28.22.217

# PostgreSQL
sudo -u postgres psql -d kunstmeran

# Services
systemctl status postgresql
systemctl status caddy
systemctl status fail2ban

# PM2 (Node.js Process Manager)
pm2 status
pm2 logs kunstmeran-api
pm2 restart kunstmeran-api

# Caddy neu laden (nach Caddyfile-Aenderung)
sudo systemctl reload caddy

# Logs
journalctl -u caddy -f
journalctl -u postgresql -f
tail -f /var/log/caddy/kunstmeran.log

# API Test
curl http://localhost:3000/api/v1/health

# Frontend aktualisieren (nach Git Push)
cd /var/www/kunstmeran/app
sudo git pull
sudo chown -R www-data:www-data .
```

---

## Zugangsdaten (siehe auch archive/ssh_key.txt)

| Was | Wert |
|-----|------|
| Server IP | 2.28.22.217 |
| SSH User | kunstmeran |
| PostgreSQL DB | kunstmeran |
| PostgreSQL User | kunstmeran_app |
| GitHub Repo | https://github.com/KunstMeran/kunstportal |
| GitHub Token | Fine-grained (nur kunstportal, read-only) |

---

---

## Behobene Fehler (Post-Migration)

### 2026-08-21: SupabaseService zu ApiClient Migration

**Problem:** Nach der Migration wurden noch viele `SupabaseService.client` Aufrufe verwendet, die nicht mehr funktionieren.

**Behobene Issues:**

| Commit | Beschreibung |
|--------|--------------|
| `614d774` | Zeiterfassung Permission fix, Shop Artikel JOIN, Supabase-Migration Start |
| `295b472` | Members und Workspaces laden via ApiClient |
| `c978de6` | Zeiterfassung Permissions, Members Spalten, SupabaseService Migration |
| `135d13c` | Zeiterfassung CRUD auf ApiClient migriert |
| `fe70f3c` | Anwesenheit-Modul auf ApiClient migrieren |

**Details der Fixes:**

1. **Zeiterfassung Permission (403 Error)**
   - `api/routes/zeiterfassung.js`: Alle Permissions von `zeiterfassung` auf `projekte` geaendert
   - Grund: User hatte keine `zeiterfassung` Permission, aber `projekte` Permission

2. **Members Spalten (column "nachname" does not exist)**
   - `api/routes/members.js`: `searchColumns` und `orderBy` von `vorname/nachname` auf `first_name/last_name` geaendert

3. **time_entries Tabelle fehlte**
   - User musste Tabelle manuell erstellen in PostgreSQL
   - `GRANT ALL PRIVILEGES ON TABLE time_entries TO kunstmeran_app;`

4. **Anwesenheit (SupabaseService.client.from Error)**
   - `api/routes/anwesenheit.js`: Alle Permissions von `zeiterfassung` auf `projekte` geaendert
   - `public/js/data-adapter.js`: `getAnwesenheitRange`, `getHeuteAnwesend`, `upsertAnwesenheit` auf ApiClient migriert

5. **Shop Artikel JOIN**
   - `api/routes/shop.js`: JOIN von `a.typ_id = t.id` auf `a.artikeltyp = t.code` geaendert

6. **Kontenplan CRUD**
   - `api/routes/budget.js`: CRUD-Routen fuer Kontenplan hinzugefuegt
   - `public/js/api-client.js`: kontenplan CRUD Methoden hinzugefuegt

---

## Offene Issues

1. **Shop Aktionen Bilder fehlen**
   - Icons/Bilder fuer Shop-Aktionen werden nicht angezeigt
   - Moeglicherweise Storage-Pfad Problem

2. **Weitere SupabaseService Aufrufe**
   - Es gibt noch ca. 90+ `SupabaseService` Aufrufe in `data-adapter.js`
   - Diese muessen schrittweise auf ApiClient migriert werden

3. **v_heute_anwesend View**
   - View muss evtl. auf Server erstellt werden falls nicht vorhanden

---

**Zuletzt aktualisiert:** 2026-08-21 (Post-Migration Fixes)
