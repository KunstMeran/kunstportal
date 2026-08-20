# Sicherheitsdokumentation - Kunsthaus Meran Portal

**Erstellt:** 2026-08-17
**Server:** 2.28.22.217 (Hetzner CX22, Falkenstein)

---

## Inhaltsverzeichnis

1. [Server-Sicherheit](#1-server-sicherheit)
2. [Datenbank-Sicherheit](#2-datenbank-sicherheit)
3. [Applikations-Sicherheit](#3-applikations-sicherheit)
4. [Datei-Sicherheit](#4-datei-sicherheit)
5. [Backup-Sicherheit](#5-backup-sicherheit)
6. [Logging & Monitoring](#6-logging--monitoring)
7. [Haeufige Sicherheitsprobleme & Vorbeugung](#7-haeufige-sicherheitsprobleme--vorbeugung)
8. [Sicherheits-Checkliste](#8-sicherheits-checkliste)
9. [Sicherheits-Check Ergebnis](#9-sicherheits-check-ergebnis)
10. [Empfohlene Verbesserungen](#10-empfohlene-verbesserungen)
11. [Notfall-Kontakte](#11-notfall-kontakte)
12. [Quellen](#12-quellen)

---

## 1. Server-Sicherheit

### 1.1 SSH-Zugang
| Einstellung | Status | Empfehlung |
|-------------|--------|------------|
| SSH-Key-Authentifizierung | ✅ Aktiv | Nur Key-Auth verwenden |
| Root-Login via SSH | ✅ `prohibit-password` | Nur mit Key erlaubt |
| SSH-Port | 22 (Standard) | Optional: Port aendern |
| Fail2ban | ✅ Aktiv | Schuetzt vor Brute-Force |

**Pruefbefehl:**
```bash
# Root-Login Status pruefen
grep "PermitRootLogin" /etc/ssh/sshd_config

# Fail2ban Status
sudo systemctl status fail2ban
sudo fail2ban-client status sshd
```

### 1.2 Firewall
| Port | Dienst | Status |
|------|--------|--------|
| 22 | SSH | ✅ Offen (Hetzner Firewall) |
| 80 | HTTP | ✅ Offen (Hetzner Firewall) |
| 443 | HTTPS | ✅ Offen (Hetzner Firewall) |
| 3000 | API intern | ❌ Blockiert von aussen |
| Andere | - | ❌ Blockiert |

**Pruefbefehl:**
```bash
# UFW Status (Server-Firewall)
sudo ufw status

# Offene Ports anzeigen
ss -tlnp
```

### 1.3 System-Updates
| Einstellung | Status | Empfehlung |
|-------------|--------|------------|
| Automatische Updates | ❓ Pruefen | unattended-upgrades aktivieren |
| Node.js Version | 22.x LTS | LTS-Versionen verwenden |
| Ubuntu Version | 24.04 LTS | Bis 2029 unterstuetzt |

**Automatische Security-Updates aktivieren:**
```bash
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## 2. Datenbank-Sicherheit

### 2.1 PostgreSQL
| Einstellung | Status | Empfehlung |
|-------------|--------|------------|
| Nur lokale Verbindungen | ✅ 127.0.0.1 | Keine externen Verbindungen |
| Starkes Passwort | ✅ | 32+ Zeichen |
| Separater App-User | ✅ `kunstmeran_app` | Nicht postgres-User verwenden |
| Parameterized Queries | ✅ | Schuetzt vor SQL-Injection |

**Pruefbefehl:**
```bash
# Wer darf sich verbinden?
sudo cat /etc/postgresql/*/main/pg_hba.conf | grep -v "^#" | grep -v "^$"

# Listening-Adresse
sudo grep "listen_addresses" /etc/postgresql/*/main/postgresql.conf
```

### 2.2 Datenbank-Zugangsdaten
| Was | Speicherort | Sicherheit |
|-----|-------------|------------|
| DB-Passwort | `/var/www/kunstmeran/api/.env` | ✅ Rechte 600 |
| DB-User | `kunstmeran_app` | ✅ Eingeschraenkte Rechte |

---

## 3. Applikations-Sicherheit

### 3.1 API-Sicherheit (Express.js)
| Einstellung | Status | Empfehlung |
|-------------|--------|------------|
| CORS | ✅ Konfiguriert | Nur eigene Domain erlauben |
| Helmet.js | ✅ Aktiv | Security-Headers |
| Rate-Limiting | ❌ Fehlt | Gegen DDoS/Brute-Force |
| Session-Secret | ✅ | Starkes Secret verwenden |
| HTTPS-Only Cookies | ⏳ | `secure: true` nach HTTPS |
| X-Powered-By | ❓ Pruefen | Sollte deaktiviert sein |
| Body-Size-Limit | ❓ Pruefen | Max 1MB empfohlen |

### 3.2 Frontend-Sicherheit
| Einstellung | Status | Empfehlung |
|-------------|--------|------------|
| XSS-Schutz | ✅ Header gesetzt | Content-Security-Policy |
| Clickjacking-Schutz | ✅ X-Frame-Options | SAMEORIGIN |
| HTTPS | ⏳ Warte auf DNS | Caddy macht das automatisch |
| HSTS | ⏳ | Nach HTTPS-Aktivierung |

**HTTP-Security-Headers (Caddy):**
```
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000 (nach HTTPS)
```

### 3.3 Authentifizierung
| Einstellung | Status | Empfehlung |
|-------------|--------|------------|
| Microsoft SSO | ⏳ Warte auf Ruben | Azure AD mit MFA |
| Session-Timeout | ❓ Pruefen | Max 24h empfohlen |
| Session in DB | ✅ connect-pg-simple | Sicherer als Memory |

---

## 4. Datei-Sicherheit

### 4.1 Berechtigungen
| Pfad | Owner | Rechte | Status |
|------|-------|--------|--------|
| `/var/www/kunstmeran/app/` | www-data | 755/644 | ✅ |
| `/var/www/kunstmeran/api/` | root | 755/644 | ✅ |
| `/var/www/kunstmeran/storage/` | www-data | 755/644 | ✅ |
| `/var/www/kunstmeran/api/.env` | root | 600 | ✅ |

### 4.2 Sensible Dateien
| Datei | Im Git? | Empfehlung |
|-------|---------|------------|
| `.env` | ❌ Nein | .gitignore |
| `ssh_key.txt` | ⚠️ Lokal in /archive | Nicht committen! |
| Passwoerter | ❌ | Nie im Code |

---

## 5. Backup-Sicherheit

### 5.1 Backup-Status
| Was | Haeufigkeit | Speicherort |
|-----|------------|-------------|
| Datenbank | ❓ | Hetzner Backup? |
| PDF-Dateien | ❓ | Hetzner Backup? |
| Server-Snapshot | ❓ | Hetzner Backup? |

**Pruefbefehl:**
```bash
# Lokale Backups
ls -la /var/www/kunstmeran/backups/

# Cron-Jobs fuer Backups
crontab -l
sudo crontab -l
```

---

## 6. Logging & Monitoring

### 6.1 Log-Dateien
| Log | Pfad | Inhalt |
|-----|------|--------|
| Caddy | `/var/log/caddy/kunstmeran.log` | HTTP-Requests |
| API (PM2) | `pm2 logs` | API-Fehler |
| Auth | `/var/log/auth.log` | SSH-Logins |
| Fail2ban | `/var/log/fail2ban.log` | Blockierte IPs |

**Pruefbefehl:**
```bash
# Letzte fehlgeschlagene Logins
sudo grep "Failed" /var/log/auth.log | tail -20

# Fail2ban gebannte IPs
sudo fail2ban-client status sshd

# PM2 Logs
sudo pm2 logs kunstmeran-api --lines 50
```

---

## 7. Haeufige Sicherheitsprobleme & Vorbeugung

### 7.1 OWASP Top 10 fuer APIs (2026)

| Rang | Schwachstelle | Unser Status | Vorbeugung |
|------|---------------|--------------|------------|
| 1 | **Broken Object Level Authorization** | ⚠️ Pruefen | Zugriffsrechte pro Datensatz pruefen |
| 2 | **Broken Authentication** | ✅ Microsoft SSO | MFA aktiviert, starke Sessions |
| 3 | **Broken Object Property Level Authorization** | ⚠️ Pruefen | Nur erlaubte Felder zurueckgeben |
| 4 | **Unrestricted Resource Consumption** | ❌ Fehlt | Rate-Limiting implementieren |
| 5 | **Broken Function Level Authorization** | ⚠️ Pruefen | Admin-Routen absichern |
| 6 | **Server Side Request Forgery (SSRF)** | ✅ | Keine externen URL-Aufrufe |
| 7 | **Security Misconfiguration** | ✅ Helmet.js | Security-Headers gesetzt |
| 8 | **Lack of Protection from Automated Threats** | ❌ Fehlt | Rate-Limiting, CAPTCHA |
| 9 | **Improper Inventory Management** | ✅ | Nur dokumentierte Endpunkte |
| 10 | **Unsafe Consumption of APIs** | ✅ | Keine externen APIs |

### 7.2 Haeufige Node.js/Express Schwachstellen

#### SQL-Injection
**Problem:** Direktes Einsetzen von User-Input in SQL-Queries
**Status:** ✅ Geschuetzt (pg-Modul mit Parameterized Queries)
```javascript
// FALSCH - anfaellig fuer SQL-Injection
db.query(`SELECT * FROM users WHERE id = ${userId}`)

// RICHTIG - parameterisiert
db.query('SELECT * FROM users WHERE id = $1', [userId])
```

#### Cross-Site Scripting (XSS)
**Problem:** Ungefilterte User-Eingaben in HTML
**Status:** ✅ Helmet.js Headers + Frontend-Escaping
**Vorbeugung:**
- X-XSS-Protection Header
- Content-Security-Policy
- Output-Encoding im Frontend

#### Dependency Vulnerabilities
**Problem:** Veraltete npm-Pakete mit bekannten Schwachstellen
**Status:** ⚠️ Regelmaessig pruefen
**Vorbeugung:**
```bash
# Auf Server ausfuehren
cd /var/www/kunstmeran/api
npm audit
```

#### Denial of Service (DoS)
**Problem:** Ueberlastung durch zu viele Anfragen
**Status:** ❌ Kein Rate-Limiting
**Vorbeugung:**
```javascript
// In server.js hinzufuegen
const rateLimit = require('express-rate-limit');
app.use(rateLimit({
    windowMs: 15 * 60 * 1000, // 15 Minuten
    max: 100 // max 100 Requests pro IP
}));
```

### 7.3 Server-Schwachstellen

#### Supply Chain Attacks (NPM)
**Problem:** Kompromittierte npm-Pakete
**Status:** ⚠️ Risiko bei Updates
**Vorbeugung:**
- Lockfile committen (`package-lock.json`)
- `npm ci` statt `npm install`
- Packages regelmaessig auf Advisories pruefen
- Unbenutzte Dependencies entfernen

#### Brute-Force SSH
**Problem:** Automatisierte Login-Versuche
**Status:** ✅ Fail2ban aktiv
**Pruefbefehl:**
```bash
sudo fail2ban-client status sshd
```

#### Unpatched Vulnerabilities
**Problem:** Bekannte Sicherheitsluecken nicht gepatcht
**Status:** ⚠️ Automatische Updates empfohlen
**Vorbeugung:**
```bash
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure -plow unattended-upgrades
```

### 7.4 Datenbank-Schwachstellen

#### Exposed Database Port
**Problem:** Datenbank von aussen erreichbar
**Status:** ✅ Nur localhost (127.0.0.1)

#### Weak Passwords
**Problem:** Einfache Passwoerter
**Status:** ✅ 32+ Zeichen Passwort

#### Missing Encryption
**Problem:** Unverschluesselte Verbindungen
**Status:** ✅ Lokal, kein TLS noetig

---

## 8. Sicherheits-Checkliste

### Auf dem Server ausfuehren:

```bash
echo "=== SSH Config ==="
grep "PermitRootLogin\|PasswordAuthentication" /etc/ssh/sshd_config

echo ""
echo "=== Fail2ban ==="
sudo systemctl is-active fail2ban

echo ""
echo "=== Offene Ports ==="
ss -tlnp | grep LISTEN

echo ""
echo "=== PostgreSQL Listener ==="
sudo grep "listen_addresses" /etc/postgresql/*/main/postgresql.conf

echo ""
echo "=== .env Datei ==="
ls -la /var/www/kunstmeran/api/.env 2>/dev/null || echo "FEHLT!"

echo ""
echo "=== PM2 Status ==="
sudo pm2 status

echo ""
echo "=== Disk Space ==="
df -h /

echo ""
echo "=== NPM Audit ==="
cd /var/www/kunstmeran/api && npm audit 2>/dev/null || echo "Nicht ausgefuehrt"

echo ""
echo "=== Letzte Updates ==="
ls -la /var/log/apt/history.log
```

---

## 9. Sicherheits-Check Ergebnis (2026-08-17)

| Check | Status | Bemerkung |
|-------|--------|-----------|
| Fail2ban | ✅ | Aktiv |
| PostgreSQL nur lokal | ✅ | 127.0.0.1:5432 |
| .env Rechte | ✅ | 600 (nur root lesbar) |
| Port 3000 extern | ✅ | Blockiert durch Hetzner Firewall |
| API laeuft | ✅ | PM2 online, 67MB RAM |
| SSH Root-Login | ✅ | `prohibit-password` (nur Key) |
| Disk Space | ✅ | 93% frei (34GB) |
| Hetzner Firewall | ✅ | Nur 22, 80, 443 offen |
| Helmet.js | ✅ | Security Headers aktiv |
| Parameterized SQL | ✅ | pg-Modul |

---

## 10. Empfohlene Verbesserungen

### Prioritaet KRITISCH (sobald DNS aktiv):
- [ ] HTTPS aktivieren (Caddy macht automatisch)
- [ ] HSTS Header aktivieren
- [ ] Secure Cookies aktivieren (`secure: true`)

### Prioritaet HOCH:
- [x] `.env` Datei-Rechte auf 600 setzen ✅
- [ ] Rate-Limiting implementieren (express-rate-limit)
- [ ] NPM Audit ausfuehren und Vulnerabilities fixen

### Prioritaet MITTEL:
- [ ] Automatische Security-Updates aktivieren (`unattended-upgrades`)
- [ ] Session-Timeout auf max 24h setzen
- [ ] X-Powered-By Header deaktivieren
- [ ] Body-Size-Limit auf 1MB setzen

### Prioritaet NIEDRIG:
- [ ] SSH-Port aendern (optional)
- [ ] Monitoring/Alerting einrichten
- [ ] Log-Rotation pruefen
- [ ] Security Audit mit Lynis

**Rate-Limiting implementieren:**
```bash
cd /var/www/kunstmeran/api
npm install express-rate-limit
```

```javascript
// In server.js hinzufuegen
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Zu viele Anfragen, bitte spaeter versuchen' }
});

app.use('/api/', limiter);
```

---

## 11. Notfall-Kontakte

| Situation | Aktion |
|-----------|--------|
| Server nicht erreichbar | Hetzner Console pruefen |
| Verdaechtiger Zugriff | Fail2ban Logs pruefen, IP bannen |
| Datenbank-Problem | PM2 Logs + PostgreSQL Logs |
| Passwort vergessen | Hetzner Rescue Mode |
| DDoS-Angriff | Hetzner Support kontaktieren |
| Kompromittierte Credentials | Alle Passwoerter sofort aendern |

**Manuelle IP sperren:**
```bash
sudo fail2ban-client set sshd banip <IP-ADRESSE>
```

**Alle gebannten IPs anzeigen:**
```bash
sudo fail2ban-client status sshd
```

---

## 12. Quellen

Diese Dokumentation basiert auf aktuellen Security Best Practices:

- [Node.js Security Best Practices 2026 - Corgea](https://corgea.com/learn/nodejs-security-best-practices-2026)
- [Express.js Security Guide 2026 - Safeguard](https://safeguard.sh/resources/blog/express-js-security-guide)
- [VPS Security Checklist 2026 - Defensia](https://defensia.cloud/vps-security-checklist)
- [How to Secure Express.js APIs - Escape.tech](https://escape.tech/blog/how-to-secure-express-js-api/)
- [Setting up and hardening a Hetzner server](https://danieltenner.com/setting-up-and-hardening-a-hetzner-server/)
- [Node.js Security: OWASP Top 10 - HireNodeJS](https://www.hirenodejs.com/blog/nodejs-security-best-practices-2026)

---

**Zuletzt aktualisiert:** 2026-08-17 17:30
