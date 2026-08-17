# Migration TODO - Hetzner

**Server IP:** 2.28.22.217
**Domain:** app.kunstmeranoarte.org (DNS pending bei Giraffentoast)
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
- SSH: `ssh -i ~/.ssh/id_hetzner root@2.28.22.217`
- User: `kunstmeran` (mit sudo)
- PostgreSQL User: `kunstmeran_app`
- PostgreSQL DB: `kunstmeran`

---

## Kontakte

- [x] **Giraffentoast:** DNS A-Record `app.kunstmeranoarte.org` -> `2.28.22.217` (angefragt)
- [ ] **Ruben:** Azure AD App-Registrierung (sobald DNS funktioniert)
  - Redirect URI: `https://app.kunstmeranoarte.org/callback`

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
├── datev/          # DATEV-Buchungen (CRUD + Import + Aggregation)
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

## Phase 5: Frontend anpassen

- [ ] `config.js` - API-URL aendern zu `https://app.kunstmeranoarte.org/api/v1`
- [ ] `data-adapter.js` - Supabase-Client durch fetch() ersetzen
- [ ] `auth.js` - Microsoft SSO implementieren
- [ ] `storage-service.js` - Storage-URLs anpassen
- [ ] Frontend auf Server deployen nach `/var/www/kunstmeran/app/`
- [ ] Alle Module testen:
  - [ ] Dashboard
  - [ ] Projekte
  - [ ] Rechnungen
  - [ ] Bewegungen (DATEV)
  - [ ] Lieferanten
  - [ ] Mitglieder
  - [ ] Shop & Kasse
  - [ ] Zeiterfassung
  - [ ] Konfiguration

---

## Phase 6: Go-Live

- [ ] DNS-Propagation abwarten (bis zu 24h)
- [ ] SSL-Zertifikat pruefen (Caddy macht das automatisch)
- [ ] Finale Tests mit echten Usern
- [ ] Root-Login auf Server deaktivieren
- [ ] Supabase-Projekt archivieren (nicht loeschen!)
- [ ] Monitoring einrichten (optional)

---

## Server-Struktur

```
/var/www/kunstmeran/
├── app/                    # Frontend (HTML, JS, CSS)
│   ├── index.html
│   ├── app.html
│   ├── css/
│   ├── js/
│   └── assets/
├── api/                    # Backend (Express.js)
│   ├── server.js
│   ├── routes/
│   ├── middleware/
│   └── package.json
├── storage/                # Dateien
│   ├── invoices/           # 342 PDFs
│   └── inventar/           # 3 Dateien
└── backups/                # DB-Backups (spaeter)
```

---

## Wichtige Befehle

```bash
# SSH zum Server
ssh -i ~/.ssh/id_hetzner root@2.28.22.217

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

# Logs
journalctl -u caddy -f
journalctl -u postgresql -f
tail -f /var/log/caddy/kunstmeran.log

# API Test
curl http://localhost:3000/api/v1/health
```

---

**Zuletzt aktualisiert:** 2026-08-17 15:20
