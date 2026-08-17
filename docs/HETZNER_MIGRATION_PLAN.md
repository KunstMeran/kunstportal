# Hetzner Server Migration Plan

**Version:** 2.0
**Aktualisiert:** 2026-08-17
**Status:** Bereit für Migration

## Übersicht

Migration von Supabase (Free Tier) zu eigenem Hetzner Server für bessere Performance und volle Kontrolle.

---

## 1. Server-Empfehlung

### Option A: Hetzner Cloud CX21 (Empfohlen)
- **CPU:** 2 vCPU
- **RAM:** 4 GB
- **SSD:** 40 GB
- **Traffic:** 20 TB
- **Preis:** ~4,85€/Monat
- **Standort:** Nürnberg oder Falkenstein (Deutschland)

### Option B: Hetzner Cloud CX31 (Wenn mehr Speicher nötig)
- **CPU:** 2 vCPU
- **RAM:** 8 GB
- **SSD:** 80 GB
- **Traffic:** 20 TB
- **Preis:** ~8,98€/Monat

**Empfehlung:** Starte mit CX21, kann jederzeit upgegradet werden.

---

## 2. Server-Setup

### 2.1 Betriebssystem
```
Ubuntu 24.04 LTS
```

### 2.2 Software-Stack
| Komponente | Software | Zweck |
|------------|----------|-------|
| Webserver | Nginx | Statische Dateien + Reverse Proxy |
| Datenbank | PostgreSQL 16 | Daten (wie Supabase) |
| Auth | Microsoft SSO (Azure AD) | Authentifizierung |
| Storage | Filesystem + Nginx | PDF-Dateien |
| SSL | Let's Encrypt (Certbot) | HTTPS |
| Backup | Hetzner Backup + pg_dump | Datensicherung |

### 2.3 Ordnerstruktur
```
/var/www/kunstmeran/
├── app/                    # Frontend (HTML, JS, CSS)
│   ├── index.html
│   ├── app.html
│   ├── js/
│   └── css/
├── storage/
│   └── invoices/           # PDF-Dateien
│       ├── 2025/
│       └── 2026/
└── backups/                # Datenbank-Backups
```

---

## 3. Datenbank-Schema (Aktuell)

### 3.1 Übersicht Tabellen (34 Tabellen)

| Kategorie | Tabellen |
|-----------|----------|
| **Kern** | `projects`, `invoices`, `suppliers`, `datev_bookings` |
| **Budget** | `budget_entries`, `budget_items`, `budget_notes`, `budget_konto_notes`, `chart_of_accounts` |
| **Finanzen** | `costs`, `cost_types`, `funding_sources` |
| **Berechtigungen** | `workspaces`, `user_workspaces`, `users` |
| **Mitglieder** | `members`, `member_payments` |
| **Shop** | `shop_artikel`, `shop_artikeltypen`, `shop_verkaeufe`, `shop_einkaeufe`, `shop_eintritt_kategorien`, `shop_mitglied_kategorien`, `shop_kassen_bewegungen`, `shop_kassenabschluss`, `shop_ausgaben` |
| **Zeiterfassung** | `time_entries` |
| **Externe** | `external_users` |

### 3.2 Tabellen-Details

#### Kern-Tabellen
| Tabelle | Beschreibung | RLS |
|---------|--------------|-----|
| `projects` | Projekte/Ausstellungen | ✅ |
| `invoices` | Rechnungen/PDFs | ✅ |
| `suppliers` | Lieferanten-Stammdaten | ✅ |
| `datev_bookings` | DATEV-Buchungen aus Excel-Import | ✅ |

#### Budget-Tabellen
| Tabelle | Beschreibung | RLS |
|---------|--------------|-----|
| `budget_entries` | Budgeteinträge pro Konto/Monat | ✅ |
| `budget_items` | Budget-Positionen (Legacy) | ✅ |
| `budget_notes` | Allgemeine Budget-Notizen | ✅ |
| `budget_konto_notes` | Notizen zu einzelnen Konten | ✅ |
| `chart_of_accounts` | Kontenplan mit Kategorien | ✅ |

#### Finanz-Tabellen
| Tabelle | Beschreibung | RLS |
|---------|--------------|-----|
| `costs` | Einzelkosten (Legacy) | ✅ |
| `cost_types` | Kostenarten-Stammdaten | ✅ |
| `funding_sources` | Förderquellen/Abgabestellen | ✅ |

#### Berechtigungssystem
| Tabelle | Beschreibung | RLS |
|---------|--------------|-----|
| `workspaces` | Berechtigungsgruppen (4-Stufen ENUM) | ✅ |
| `user_workspaces` | User-Workspace Zuweisungen | ✅ |
| `users` | User-Profile (mit user_type) | ✅ |

**Berechtigungsstufen (ENUM `permission_level`):**
- `none` - Kein Zugriff
- `read` - Nur lesen
- `write` - Bearbeiten
- `delete` - Löschen

**Workspace-Berechtigungen:**
- `access_dashboard`, `access_projekte`, `access_rechnungen`
- `access_bewegungen`, `access_lieferanten`, `access_mitglieder`
- `access_einnahmen`, `access_konfiguration`, `access_inventar`
- `access_reporting`, `access_zeiterfassung`, `access_rechnungen_bezahlt`

#### Mitglieder-Modul
| Tabelle | Beschreibung | RLS |
|---------|--------------|-----|
| `members` | Mitglieder-Stammdaten | ✅ |
| `member_payments` | Mitgliedsbeitrags-Zahlungen | ✅ |

#### Shop-Modul (NEU)
| Tabelle | Beschreibung | RLS |
|---------|--------------|-----|
| `shop_artikel` | Shop-Artikel mit Lagerbestand | ✅ |
| `shop_artikeltypen` | Kategorien (Buch, Katalog, etc.) | ✅ |
| `shop_verkaeufe` | Verkäufe (Artikel, Eintritte, Mitglied) | ✅ |
| `shop_einkaeufe` | Wareneinkäufe | ✅ |
| `shop_eintritt_kategorien` | Eintrittspreise | ✅ |
| `shop_mitglied_kategorien` | Mitgliedsbeitrags-Kategorien | ✅ |
| `shop_kassen_bewegungen` | Kassenein-/ausgänge | ✅ |
| `shop_kassenabschluss` | Tägliche Kassenabschlüsse | ✅ |
| `shop_ausgaben` | Shop-Ausgaben | ✅ |

#### Zeiterfassung (NEU)
| Tabelle | Beschreibung | RLS |
|---------|--------------|-----|
| `time_entries` | Zeiterfassung (User + Lieferanten) | ✅ |

#### Externe User
| Tabelle | Beschreibung | RLS |
|---------|--------------|-----|
| `external_users` | Externe Empfänger für Rechnungen | ✅ |

### 3.3 Views
| View | Beschreibung |
|------|--------------|
| `user_permissions` | Aggregierte Berechtigungen pro User |

### 3.4 Custom Types
| Type | Beschreibung |
|------|--------------|
| `permission_level` | ENUM: 'none', 'read', 'write', 'delete' |

### 3.5 Wichtige Indizes
- `idx_unique_datev_booking_v2` - Unique Constraint für DATEV-Import
- `idx_invoices_*` - Performance-Indizes für Rechnungen
- `idx_shop_*` - Performance-Indizes für Shop
- Siehe `002_performance_indexes.sql` für vollständige Liste

---

## 4. Migrations-Schritte

### Phase 1: Server vorbereiten
1. [ ] Hetzner Cloud Server erstellen (CX21)
2. [ ] SSH-Zugang einrichten (nur Key-Auth)
3. [ ] Firewall konfigurieren (nur 80, 443, 22)
4. [ ] Ubuntu Updates installieren
5. [ ] Fail2ban installieren
6. [ ] PostgreSQL 16 installieren
7. [ ] Nginx installieren
8. [ ] SSL-Zertifikat einrichten (Let's Encrypt)

### Phase 2: Datenbank migrieren
1. [ ] PostgreSQL-Datenbank `kunstmeran` erstellen
2. [ ] Custom Type `permission_level` erstellen
3. [ ] Schema von Supabase exportieren (pg_dump --schema-only)
4. [ ] Daten von Supabase exportieren (pg_dump --data-only)
5. [ ] Auf Hetzner importieren
6. [ ] RLS Policies importieren (alle 34 Tabellen haben RLS)
7. [ ] Indizes erstellen
8. [ ] Triggers erstellen (updated_at, Bestandsverwaltung)
9. [ ] Views erstellen (user_permissions)
10. [ ] Testen

### Phase 3: PDF-Dateien migrieren
1. [ ] Alle PDFs von Supabase Storage herunterladen
2. [ ] Auf Hetzner Server hochladen (/var/www/kunstmeran/storage/invoices/)
3. [ ] Nginx für PDF-Serving konfigurieren
4. [ ] Zugriffsrechte prüfen (www-data)

### Phase 4: Backend-API erstellen
**Empfehlung:** PostgREST (wie Supabase, minimal Code-Änderungen)

1. [ ] PostgREST installieren
2. [ ] Konfiguration erstellen (DB-Verbindung, JWT-Secret)
3. [ ] Nginx Reverse Proxy konfigurieren
4. [ ] API testen

### Phase 5: Frontend anpassen
1. [ ] Supabase-URL zu Hetzner-URL ändern (js/config.js)
2. [ ] Storage-URLs anpassen
3. [ ] Auth-System auf Microsoft SSO umstellen
4. [ ] Testen aller 10+ Module:
   - [ ] Dashboard
   - [ ] Projekte
   - [ ] Rechnungen
   - [ ] Bewegungen (DATEV)
   - [ ] Lieferanten
   - [ ] Mitglieder
   - [ ] Einnahmen/Förderquellen
   - [ ] Shop & Kasse
   - [ ] Zeiterfassung
   - [ ] Konfiguration/Workspaces

### Phase 6: DNS & Go-Live
1. [ ] DNS auf Hetzner umstellen
2. [ ] Alte Supabase-Verbindung trennen
3. [ ] Monitoring einrichten

---

## 5. Nginx Konfiguration

```nginx
server {
    listen 443 ssl http2;
    server_name kunstmeran.example.com;

    ssl_certificate /etc/letsencrypt/live/kunstmeran.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/kunstmeran.example.com/privkey.pem;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' https://cdn.jsdelivr.net; style-src 'self' https://fonts.googleapis.com 'unsafe-inline'; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://login.microsoftonline.com; img-src 'self' data: https:; frame-ancestors 'none'" always;

    # Frontend
    root /var/www/kunstmeran/app;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # PDF Storage (mit Auth-Check)
    location /storage/invoices/ {
        alias /var/www/kunstmeran/storage/invoices/;
        # Optional: Auth via JWT prüfen
    }

    # PostgREST API
    location /rest/v1/ {
        proxy_pass http://localhost:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Rate Limiting
        limit_req zone=api burst=20 nodelay;
    }
}

# Rate Limiting Zone (in http block)
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
```

---

## 6. Backup-Strategie

### Automatisches Backup (Cron-Job)
```bash
# /etc/cron.d/kunstmeran-backup
# Täglich um 3:00 Uhr
0 3 * * * root /var/www/kunstmeran/scripts/backup.sh
```

### Backup-Script
```bash
#!/bin/bash
DATE=$(date +%Y%m%d)
BACKUP_DIR=/var/www/kunstmeran/backups

# Datenbank (34 Tabellen + Views + Custom Types)
pg_dump kunstmeran > $BACKUP_DIR/db_$DATE.sql
gzip $BACKUP_DIR/db_$DATE.sql

# PDFs (inkrementell)
rsync -av /var/www/kunstmeran/storage/ $BACKUP_DIR/storage_$DATE/

# Alte Backups löschen (älter als 30 Tage)
find $BACKUP_DIR -mtime +30 -delete

# Optional: Offsite-Backup
# rclone sync $BACKUP_DIR remote:kunstmeran-backups
```

### Hetzner Backup-Service
- +20% auf Server-Preis (~1€/Monat)
- Automatische tägliche Snapshots
- 7 Snapshots werden behalten

---

## 7. Kosten-Vergleich

| Posten | Supabase Free | Hetzner CX21 |
|--------|---------------|--------------|
| Server | 0€ | 4,85€/Monat |
| Datenbank | 500MB limit | Unbegrenzt |
| Storage | 1GB limit | 40GB (erweiterbar) |
| Backups | Manuell | +1€/Monat |
| **Gesamt** | **0€** | **~6€/Monat** |

**ROI:** Bessere Performance, keine Limits, volle Kontrolle.

---

## 8. Security-Checkliste

### Vor Migration (erledigt)
- [x] XSS-Escaping implementiert
- [x] RLS-Policies für alle 34 Tabellen geprüft
- [x] RLS für Legacy-Tabellen (projects, budget_items, costs) hinzugefügt

### Nach Migration
- [ ] SSH-Key-Only-Auth (keine Passwörter)
- [ ] Fail2ban konfiguriert
- [ ] UFW Firewall aktiv (nur 80, 443, 22)
- [ ] TLS 1.3 erzwingen
- [ ] CSP-Header konfiguriert
- [ ] Rate-Limiting aktiv
- [ ] PostgreSQL nur lokale Verbindungen
- [ ] Regelmäßige Security-Updates

---

## 9. Microsoft SSO Integration

Nach der Migration soll Microsoft SSO (Azure AD) für Authentifizierung genutzt werden.

### Voraussetzungen
1. Azure AD App-Registrierung
2. Redirect-URI konfigurieren
3. Client-ID und Tenant-ID im Frontend

### Frontend-Änderungen
```javascript
// js/config.js - Nach Migration
const AUTH_CONFIG = {
    type: 'azure',
    clientId: 'YOUR_CLIENT_ID',
    tenantId: 'YOUR_TENANT_ID',
    redirectUri: 'https://kunstmeran.example.com/callback'
};
```

---

## 10. Rollback-Plan

Falls Probleme auftreten:

1. **DNS zurücksetzen** auf Vercel/Supabase
2. **Supabase-Daten** sind noch vorhanden (nicht löschen vor Go-Live)
3. **Frontend** auf Git-Stand vor Migration zurücksetzen

---

## 11. Kontakt & Nächste Schritte

### Vor Migration klären
- [x] Security-Audit durchgeführt
- [ ] Domain festlegen (kunstmeran.example.com?)
- [ ] Hetzner Account vorhanden?
- [ ] Azure AD App-Registrierung bereit?

### Migrations-Reihenfolge
1. Server bestellen und einrichten
2. Datenbank migrieren (inkl. 34 Tabellen, Views, RLS)
3. PDFs migrieren
4. API einrichten (PostgREST)
5. Frontend anpassen + Microsoft SSO
6. Testen
7. DNS umstellen
8. Go-Live
