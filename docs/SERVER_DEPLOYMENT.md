# Server Deployment & Wartung - Kunsthaus Meran Portal

**Version:** 3.0.0
**Server:** Hetzner VPS CX21
**Domain:** https://portal.kunstmeranoarte.org
**Letzte Aktualisierung:** 20. August 2026

---

## 📋 Inhaltsverzeichnis

- [Server-Informationen](#server-informationen)
- [Wichtige Verzeichnisse](#wichtige-verzeichnisse)
- [SSH-Zugang](#ssh-zugang)
- [Deployment-Prozess](#deployment-prozess)
- [Backend-Verwaltung (pm2)](#backend-verwaltung-pm2)
- [Datenbank-Zugriff](#datenbank-zugriff)
- [Wichtige Befehle](#wichtige-befehle)
- [Troubleshooting](#troubleshooting)
- [Backup & Restore](#backup--restore)

---

## 🖥️ Server-Informationen

### Hetzner VPS Details
- **Server-Typ:** CX21
- **RAM:** 4 GB
- **CPU:** 2 vCPU
- **Storage:** 40 GB SSD
- **IP-Adresse:** (über DNS portal.kunstmeranoarte.org)
- **Betriebssystem:** Ubuntu Server 22.04 LTS

### Software-Stack
- **Webserver:** Caddy (Reverse Proxy mit Auto-SSL)
- **Backend:** Node.js 22.23.2 + Express.js
- **Prozess-Manager:** PM2
- **Datenbank:** PostgreSQL 16
- **Authentifizierung:** Microsoft SSO (Azure AD)

---

## 📂 Wichtige Verzeichnisse

```
/var/www/kunstmeran/
├── app/                          # Haupt-Repository (Git)
│   ├── public/                   # Frontend (HTML, CSS, JS)
│   │   ├── js/                   # JavaScript Module
│   │   │   ├── api-client.js     # API Client
│   │   │   ├── auth.js           # Microsoft SSO
│   │   │   ├── data.js           # Data Manager
│   │   │   ├── app.js            # Haupt-App Logik
│   │   │   └── ...
│   │   └── css/                  # Stylesheets
│   ├── api/                      # Backend API
│   │   ├── server.js             # Express Server
│   │   ├── routes/               # API Routes
│   │   │   ├── datev.js          # DATEV Buchungen
│   │   │   ├── auth.js           # Authentifizierung
│   │   │   ├── projects.js       # Projekte
│   │   │   └── ...
│   │   ├── middleware/           # Auth & CRUD Middleware
│   │   ├── .env                  # Umgebungsvariablen (NICHT in Git!)
│   │   └── package.json
│   ├── database/                 # Datenbank-Migrations
│   │   └── migrations/
│   └── docs/                     # Dokumentation
└── api/                          # LEGACY (nicht mehr verwendet)
    └── ...
```

---

## 🔑 SSH-Zugang

### Mit Server verbinden

```bash
ssh kunstmeran@portal.kunstmeranoarte.org
```

### Als Root arbeiten (falls nötig)

```bash
sudo -i
```

**Wichtig:** Immer als User `kunstmeran` arbeiten, nur bei System-Operationen `sudo` verwenden!

---

## 🚀 Deployment-Prozess

### Standard Deployment (Empfohlen)

```bash
# 1. Lokal: Änderungen committen und pushen
git add .
git commit -m "Beschreibung der Änderungen"
git push origin main

# 2. Auf dem Server: SSH verbinden
ssh kunstmeran@portal.kunstmeranoarte.org

# 3. Zum Projekt-Verzeichnis
cd /var/www/kunstmeran/app

# 4. Neueste Änderungen holen
git pull origin main

# 5. Backend neu starten
pm2 restart kunstmeran-api

# 6. Status prüfen
pm2 status
```

### Bei Git-Konflikten

```bash
# Lokale Änderungen verwerfen (VORSICHT!)
git reset --hard HEAD
git pull origin main
pm2 restart kunstmeran-api
```

### Frontend-Updates

Frontend-Updates benötigen **keinen** Server-Neustart - einfach Hard-Refresh im Browser:
- Windows/Linux: `Strg + Shift + R`
- Mac: `Cmd + Shift + R`

---

## ⚙️ Backend-Verwaltung (pm2)

### PM2 Status & Monitoring

```bash
# Status aller Prozesse anzeigen
pm2 status

# Detaillierte Infos zu kunstmeran-api
pm2 describe kunstmeran-api

# Live-Monitoring (CPU, Memory)
pm2 monit

# Prozess-Liste verlassen: Strg + C
```

### Backend starten/stoppen/neu starten

```bash
# Backend neu starten
pm2 restart kunstmeran-api

# Backend stoppen
pm2 stop kunstmeran-api

# Backend starten
pm2 start kunstmeran-api

# Backend löschen und neu starten
pm2 delete kunstmeran-api
pm2 start /var/www/kunstmeran/app/api/server.js --name kunstmeran-api
pm2 save
```

### Logs anzeigen

```bash
# Live-Logs (Strg + C zum Beenden)
pm2 logs kunstmeran-api

# Letzte 50 Zeilen
pm2 logs kunstmeran-api --lines 50

# Nur einmal anzeigen (nicht live)
pm2 logs kunstmeran-api --lines 20 --nostream

# Fehler-Logs
pm2 logs kunstmeran-api --err

# Logs löschen
pm2 flush
```

### PM2 Auto-Start nach Server-Neustart

```bash
# Aktuellen Status speichern
pm2 save

# Startup-Script generieren
pm2 startup

# (Folge den Anweisungen im Terminal)
```

---

## 🗄️ Datenbank-Zugriff

### PostgreSQL verbinden

```bash
# Als postgres User
sudo -u postgres psql

# Direkt zur Datenbank
sudo -u postgres psql -d kunstmeran_db

# Von kunstmeran User
psql -U postgres -d kunstmeran_db
```

### Wichtige PostgreSQL Befehle

```sql
-- Alle Datenbanken anzeigen
\l

-- Alle Tabellen anzeigen
\dt

-- Tabellen-Struktur anzeigen
\d datev_bookings
\d suppliers
\d funding_sources

-- Erste 10 Buchungen anzeigen
SELECT * FROM datev_bookings LIMIT 10;

-- Anzahl der Buchungen
SELECT COUNT(*) FROM datev_bookings;

-- Jahre in DATEV-Daten
SELECT DISTINCT import_year FROM datev_bookings ORDER BY import_year DESC;

-- PostgreSQL verlassen
\q
```

### Datenbank Backup erstellen

```bash
# Backup erstellen
sudo -u postgres pg_dump kunstmeran_db > backup_$(date +%Y%m%d).sql

# Backup mit Kompression
sudo -u postgres pg_dump kunstmeran_db | gzip > backup_$(date +%Y%m%d).sql.gz
```

### Datenbank Restore

```bash
# Restore aus Backup
sudo -u postgres psql kunstmeran_db < backup_20260820.sql
```

---

## 🔧 Wichtige Befehle

### Git-Operations

```bash
# Status prüfen
git status

# Änderungen anzeigen
git diff

# Log ansehen
git log --oneline -10

# Branch wechseln
git checkout main

# Neueste Version holen
git pull origin main

# Lokale Änderungen verwerfen
git reset --hard HEAD
```

### Systemstatus

```bash
# Festplatten-Nutzung
df -h

# RAM-Nutzung
free -h

# CPU/Memory Top-Prozesse
htop
# (oder: top)

# Netzwerk-Verbindungen
netstat -tulpn | grep :3000
```

### Caddy (Reverse Proxy)

```bash
# Caddy Status
sudo systemctl status caddy

# Caddy neu starten
sudo systemctl restart caddy

# Caddy Logs
sudo journalctl -u caddy -f

# Caddy Konfiguration testen
sudo caddy validate --config /etc/caddy/Caddyfile
```

### Berechtigungen prüfen/setzen

```bash
# Datei-Berechtigungen anzeigen
ls -la /var/www/kunstmeran/app/api/.env

# Ownership ändern
sudo chown kunstmeran:kunstmeran /var/www/kunstmeran/app/api/.env

# Rekursiv für Verzeichnis
sudo chown -R kunstmeran:kunstmeran /var/www/kunstmeran/app/api/
```

---

## 🔍 Troubleshooting

### Problem: Backend startet nicht

```bash
# 1. Logs prüfen
pm2 logs kunstmeran-api --lines 50

# 2. .env Datei prüfen
ls -la /var/www/kunstmeran/app/api/.env
cat /var/www/kunstmeran/app/api/.env  # (Session Secret NICHT teilen!)

# 3. Node.js Version prüfen
node --version  # Sollte v22.x.x sein

# 4. Dependencies installieren
cd /var/www/kunstmeran/app/api
npm install

# 5. Backend neu starten
pm2 restart kunstmeran-api
```

### Problem: "Environment: undefined"

```bash
# .env Datei fehlt oder wird nicht geladen
ls -la /var/www/kunstmeran/app/api/.env

# Falls fehlend, vom alten Pfad kopieren
sudo cp /var/www/kunstmeran/api/.env /var/www/kunstmeran/app/api/.env
sudo chown kunstmeran:kunstmeran /var/www/kunstmeran/app/api/.env

pm2 restart kunstmeran-api
```

### Problem: "secret option required for sessions"

**Ursache:** `.env` Datei wird nicht geladen oder SESSION_SECRET fehlt

```bash
# 1. .env prüfen
cat /var/www/kunstmeran/app/api/.env | grep SESSION_SECRET

# 2. Falls SESSION_SECRET fehlt, generieren
echo "SESSION_SECRET=$(openssl rand -hex 32)" >> /var/www/kunstmeran/app/api/.env

# 3. Backend neu starten
pm2 restart kunstmeran-api
```

### Problem: Datenbank-Verbindung fehlgeschlagen

```bash
# 1. PostgreSQL Status prüfen
sudo systemctl status postgresql

# 2. PostgreSQL starten (falls gestoppt)
sudo systemctl start postgresql

# 3. Verbindung testen
psql -U postgres -d kunstmeran_db -c "SELECT 1;"

# 4. .env Datenbank-Credentials prüfen
cat /var/www/kunstmeran/app/api/.env | grep DB_
```

### Problem: Port 3000 bereits belegt

```bash
# Prozess auf Port 3000 finden
sudo lsof -i :3000

# Prozess beenden
sudo kill -9 <PID>

# Oder pm2 aufräumen
pm2 delete all
pm2 start /var/www/kunstmeran/app/api/server.js --name kunstmeran-api
```

### Problem: Git pull schlägt fehl

```bash
# Konflikt-Dateien anzeigen
git status

# Option 1: Lokale Änderungen verwerfen
git reset --hard HEAD
git pull origin main

# Option 2: Stash (Änderungen temporär speichern)
git stash
git pull origin main
git stash pop
```

---

## 💾 Backup & Restore

### Automatisches Tägliches Backup (Empfohlen)

**Cron-Job einrichten:**

```bash
# Crontab bearbeiten
crontab -e

# Folgende Zeile hinzufügen (Backup um 2:00 Uhr nachts)
0 2 * * * /usr/bin/pg_dump kunstmeran_db | gzip > /home/kunstmeran/backups/db_$(date +\%Y\%m\%d).sql.gz

# Backup-Verzeichnis erstellen
mkdir -p /home/kunstmeran/backups
```

### Manuelles Backup

```bash
# Datenbank Backup
sudo -u postgres pg_dump kunstmeran_db | gzip > ~/kunstmeran_backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Code Backup (gesamtes Verzeichnis)
tar -czf ~/kunstmeran_code_$(date +%Y%m%d).tar.gz /var/www/kunstmeran/app

# Backup herunterladen (lokal ausführen)
scp kunstmeran@portal.kunstmeranoarte.org:~/kunstmeran_backup_*.sql.gz ./
```

### Restore aus Backup

```bash
# Datenbank wiederherstellen
gunzip -c kunstmeran_backup_20260820.sql.gz | sudo -u postgres psql kunstmeran_db

# Code wiederherstellen
cd /var/www/kunstmeran
sudo tar -xzf ~/kunstmeran_code_20260820.tar.gz
sudo chown -R kunstmeran:kunstmeran app/
cd app
pm2 restart kunstmeran-api
```

---

## 📞 Support & Kontakt

**Entwickler:** Claude Sonnet 4.5 (via Controlling Solutions)
**Kunde:** Kunsthaus Meran
**GitHub Repository:** https://github.com/KunstMeran/kunstportal

### Wichtige Links
- Portal: https://portal.kunstmeranoarte.org
- GitHub Issues: https://github.com/KunstMeran/kunstportal/issues
- Dependabot Security: https://github.com/KunstMeran/kunstportal/security/dependabot

---

## 📝 Changelog

### Version 3.0.0 (20. August 2026)
- ✅ Migration von Supabase zu Hetzner VPS
- ✅ PostgreSQL 16 Installation
- ✅ Microsoft SSO Integration (Azure AD)
- ✅ Backend API mit Express.js
- ✅ PM2 Prozess-Management
- ✅ Caddy Reverse Proxy mit Auto-SSL
- ✅ Git-basierter Deployment-Prozess

### Bekannte Issues
- ⚠️ 9 High-Severity Dependencies (siehe Dependabot)
- ⚠️ Frontend: SupabaseService Referenzen müssen entfernt werden

---

**📌 Diese Dokumentation wird regelmäßig aktualisiert. Letzte Änderung: 20.08.2026**
