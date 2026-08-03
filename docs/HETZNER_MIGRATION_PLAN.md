# Hetzner Server Migration Plan

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
| Auth | Supabase Auth (self-hosted) ODER eigene JWT-Lösung |
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

## 3. Migrations-Schritte

### Phase 1: Server vorbereiten (1-2 Stunden)
1. [ ] Hetzner Cloud Server erstellen
2. [ ] SSH-Zugang einrichten
3. [ ] Firewall konfigurieren (nur 80, 443, 22)
4. [ ] Ubuntu Updates installieren
5. [ ] PostgreSQL installieren
6. [ ] Nginx installieren
7. [ ] SSL-Zertifikat einrichten

### Phase 2: Datenbank migrieren (1 Stunde)
1. [ ] PostgreSQL-Datenbank erstellen
2. [ ] Schema von Supabase exportieren
3. [ ] Daten von Supabase exportieren (pg_dump)
4. [ ] Daten auf Hetzner importieren
5. [ ] Indexes erstellen
6. [ ] Testen

### Phase 3: PDF-Dateien migrieren (30 Min - 2 Stunden)
1. [ ] Alle PDFs von Supabase Storage herunterladen
2. [ ] Auf Hetzner Server hochladen
3. [ ] Nginx für PDF-Serving konfigurieren
4. [ ] Zugriffsrechte prüfen

### Phase 4: Backend-API erstellen (2-4 Stunden)
Optionen:
- **Option A:** PostgREST (wie Supabase, minimal Code-Änderungen)
- **Option B:** Node.js/Express API (mehr Kontrolle)
- **Option C:** Direkte PostgreSQL-Verbindung via pg-Bibliothek

**Empfehlung:** PostgREST - dann funktioniert der bestehende Code fast unverändert.

### Phase 5: Frontend anpassen (1-2 Stunden)
1. [ ] Supabase-URL zu Hetzner-URL ändern
2. [ ] Storage-URLs anpassen
3. [ ] Auth-System anpassen (falls nötig)
4. [ ] Testen aller Funktionen

### Phase 6: DNS & Go-Live (30 Min)
1. [ ] DNS auf Hetzner umstellen
2. [ ] Alte Supabase-Verbindung trennen
3. [ ] Monitoring einrichten

---

## 4. Nginx Konfiguration

```nginx
server {
    listen 443 ssl http2;
    server_name kunstmeran.example.com;

    ssl_certificate /etc/letsencrypt/live/kunstmeran.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/kunstmeran.example.com/privkey.pem;

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
    }
}
```

---

## 5. PDF-Speicherung auf Hetzner

### Upload-Endpoint (Node.js Beispiel)
```javascript
// /api/upload-pdf.js
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const year = new Date().getFullYear();
        cb(null, `/var/www/kunstmeran/storage/invoices/${year}/`);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}_${file.originalname}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Nur PDF-Dateien erlaubt'));
        }
    }
});
```

### Vorteile gegenüber Supabase Storage
- **Unbegrenzter Speicher** (nur durch SSD limitiert)
- **Kein 1GB Limit**
- **Schnellerer Zugriff** (kein CDN-Overhead)
- **Volle Kontrolle** über Backup und Archivierung

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

# Datenbank
pg_dump kunstmeran > $BACKUP_DIR/db_$DATE.sql
gzip $BACKUP_DIR/db_$DATE.sql

# PDFs (inkrementell)
rsync -av /var/www/kunstmeran/storage/ $BACKUP_DIR/storage_$DATE/

# Alte Backups löschen (älter als 30 Tage)
find $BACKUP_DIR -mtime +30 -delete
```

### Hetzner Backup-Service
- +20% auf Server-Preis
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

## 8. Zeitplan

| Phase | Dauer | Wer |
|-------|-------|-----|
| Server Setup | 2h | Claude/Dev |
| DB Migration | 1h | Claude/Dev |
| PDF Migration | 1-2h | Claude/Dev |
| API Setup | 2-4h | Claude/Dev |
| Frontend Anpassung | 1-2h | Claude/Dev |
| Testing | 2h | Sophie + Team |
| Go-Live | 30min | Claude/Dev |
| **Gesamt** | **~10-14h** | |

---

## 9. Nächste Schritte

1. **Jetzt:** Supabase Indexes ausführen (siehe `002_performance_indexes.sql`)
2. **Bald:** Hetzner Account erstellen und Server bestellen
3. **Dann:** Migration durchführen (kann ich anleiten)

---

## 10. Fragen?

- Welche Domain soll verwendet werden?
- Soll Microsoft SSO weiterhin funktionieren?
- Gibt es bestehende Hetzner-Zugangsdaten?
