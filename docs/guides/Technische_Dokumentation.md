# Technische Dokumentation - Projektsoftware Kunst Meran

**Version:** 2.0.0
**Stand:** Juli 2026
**Autor:** Controlling Solutions

---

## 1. Systemarchitektur

### 1.1 Übersicht

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│                     (Vercel Hosting)                         │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────────┐ │
│  │ app.html│  │ auth.js │  │ app.js  │  │ data-adapter.js │ │
│  └─────────┘  └─────────┘  └─────────┘  └─────────────────┘ │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTPS
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Backend                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ PostgreSQL   │  │ Auth         │  │ Storage      │       │
│  │ (Datenbank)  │  │ (Anmeldung)  │  │ (PDFs)       │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Ordnerstruktur

```
Projektsoftware/
├── index.html                    # Login-Seite
├── app.html                      # Hauptanwendung (SPA)
│
├── css/
│   └── style.css                 # Stylesheet
│
├── js/
│   ├── config.js                 # Umgebungskonfiguration & Feature Flags
│   ├── auth.js                   # Authentifizierung (Supabase Auth)
│   ├── supabase-client.js        # Supabase API Service Layer
│   ├── data.js                   # Datenverwaltung & Business-Logik
│   ├── data-adapter.js           # Daten-Transformation (Supabase ↔ UI)
│   ├── storage-service.js        # localStorage Fallback
│   ├── excel-import-service.js   # DATEV & Lieferanten Excel-Import
│   ├── migration.js              # Datenmigration (localStorage → Supabase)
│   └── app.js                    # UI-Logik & Event-Handling
│
├── docs/                         # Dokumentation
├── supabase-migrations/          # Datenbank-Migrationen
├── vercel.json                   # Vercel-Konfiguration
└── supabase-schema.sql           # Datenbank-Schema
```

### 1.3 Datenfluss

```
DATEV Export (.xlsx)
        │
        ▼
excel-import-service.js ──► Duplikate prüfen
        │
        ▼
Supabase: datev_bookings
        │
        ▼
data-adapter.js ──► UI-Format transformieren
        │
        ▼
app.js ──► Rendering
        │
        ▼
Benutzer-Änderungen
        │
        ▼
supabase-client.js ──► API Calls
        │
        ▼
Supabase PostgreSQL
```

---

## 2. Komponenten

### 2.1 config.js

**Zweck:** Zentrale Konfiguration und Feature Flags

```javascript
const Config = {
    supabase: {
        url: 'https://xxx.supabase.co',
        anonKey: 'xxx'
    },
    app: {
        name: 'Projektsoftware Kunst Meran',
        version: '2.0.0'
    },
    features: {
        useSupabase: true,    // false = localStorage-Modus
        enableRealtime: false,
        enableBackups: true
    }
};
```

### 2.2 auth.js

**Zweck:** Authentifizierung über Supabase Auth

**Funktionen:**
- `handleLogin()` - Login mit E-Mail/Passwort
- `logout()` - Session beenden
- `checkAuth()` - Auth-Status prüfen
- `getCurrentUser()` - Benutzerinfo laden
- `isAdmin()` - Admin-Rechte prüfen

**Fallback:** Bei `useSupabase: false` wird localStorage verwendet.

### 2.3 supabase-client.js

**Zweck:** API Service Layer für alle Supabase-Operationen

**Module:**

| Bereich | Methoden |
|---------|----------|
| Auth | signIn, signOut, getCurrentUser, getSession |
| Users | getUserProfile, getAllUsers |
| Projects | getProjects, getProject, createProject, updateProject, deleteProject |
| Budget | getBudgetItems, createBudgetItem, updateBudgetItem, deleteBudgetItem |
| Costs | getCosts, createCost, updateCost, deleteCost |
| Funding | getFundingSources, createFundingSource, updateFundingSource |
| Realtime | subscribeToProjects, subscribeToCosts, unsubscribe |

### 2.4 excel-import-service.js

**Zweck:** Import von DATEV-Buchungen und Lieferanten aus Excel

**Funktionen:**
- `importDatevBookings(file, year)` - DATEV Excel importieren
- `importSuppliers(file)` - Lieferanten-Stammdaten importieren
- `syncSupplierNames()` - Lieferantennamen mit Buchungen synchronisieren
- `parseExcelFile(file)` - SheetJS Parser

**Features:**
- Automatische Spalten-Erkennung (deutsch/italienisch)
- Duplikat-Erkennung (partita_iva + dokument_nr + datum + betrag)
- Lieferanten-Matching für Partita IVA Lookup

### 2.5 data-adapter.js

**Zweck:** Transformation zwischen Supabase-Format und UI-Format

**Funktionen:**
- Konvertierung von snake_case (DB) zu camelCase (JS)
- Aggregation von Projekt-Statistiken
- Filter- und Such-Logik

### 2.6 app.js

**Zweck:** UI-Rendering und Event-Handling

**Hauptbereiche:**
- Navigation & View-Switching
- Rechnungstabelle mit Pagination (20 pro Seite)
- Sortierung & Filtering
- Batch-Operationen (Mehrfachauswahl)
- PDF-Suche und -Zuweisung
- DATEV-Bewegung-Suche

---

## 3. Datenbank-Schema (Supabase PostgreSQL)

### 3.1 Haupttabellen

```sql
-- Benutzer
CREATE TABLE users (
    id UUID PRIMARY KEY,
    username TEXT,
    email TEXT UNIQUE,
    role TEXT DEFAULT 'user',
    hourly_rate DECIMAL
);

-- Projekte
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'active',
    location TEXT,
    start_date DATE,
    end_date DATE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- DATEV-Buchungen
CREATE TABLE datev_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partita_iva TEXT,
    fornitore_nr TEXT,
    fornitore_name TEXT,
    dokument_nr TEXT NOT NULL,
    dokument_typ TEXT,
    betrag DECIMAL,
    betrag_netto DECIMAL,
    betrag_mwst DECIMAL,
    datum DATE NOT NULL,
    projekt_id TEXT,
    import_year INTEGER,
    source_file TEXT,
    pdf_path TEXT,
    kontrolliert BOOLEAN DEFAULT FALSE,
    bezahlt BOOLEAN DEFAULT FALSE,
    bezahlt_datum DATE,
    kostentyp TEXT,
    abgabestelle TEXT,
    notizen TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lieferanten
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partita_iva TEXT UNIQUE,
    fornitore_nr TEXT,
    fornitore_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Kostentypen
CREATE TABLE cost_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budget-Positionen
CREATE TABLE budget_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id),
    category TEXT,
    description TEXT,
    planned_amount DECIMAL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Kosten
CREATE TABLE costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id),
    budget_item_id UUID REFERENCES budget_items(id),
    description TEXT,
    amount DECIMAL,
    date DATE,
    cost_type TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Finanzierungsquellen
CREATE TABLE funding_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id),
    name TEXT,
    amount DECIMAL,
    status TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.2 Row Level Security (RLS)

Alle Tabellen haben RLS aktiviert. Beispiel-Policies:

```sql
-- Authentifizierte Benutzer können lesen
CREATE POLICY "Users can view datev_bookings"
ON datev_bookings FOR SELECT
TO authenticated
USING (true);

-- Authentifizierte Benutzer können schreiben
CREATE POLICY "Users can insert datev_bookings"
ON datev_bookings FOR INSERT
TO authenticated
WITH CHECK (true);
```

### 3.3 Storage Bucket

```
Bucket: invoices
├── [partita_iva]_[dokument_nr].pdf
└── ...
```

---

## 4. API-Endpunkte (Supabase)

### 4.1 REST API

Base URL: `https://[project-id].supabase.co/rest/v1`

| Methode | Endpoint | Beschreibung |
|---------|----------|--------------|
| GET | /datev_bookings | Alle Buchungen |
| POST | /datev_bookings | Neue Buchung |
| PATCH | /datev_bookings?id=eq.{id} | Buchung aktualisieren |
| GET | /suppliers | Alle Lieferanten |
| GET | /projects | Alle Projekte |

### 4.2 Auth API

Base URL: `https://[project-id].supabase.co/auth/v1`

| Methode | Endpoint | Beschreibung |
|---------|----------|--------------|
| POST | /token?grant_type=password | Login |
| POST | /logout | Logout |
| GET | /user | Aktueller Benutzer |

### 4.3 Storage API

Base URL: `https://[project-id].supabase.co/storage/v1`

| Methode | Endpoint | Beschreibung |
|---------|----------|--------------|
| POST | /object/invoices/{filename} | PDF hochladen |
| GET | /object/public/invoices/{filename} | PDF abrufen |
| DELETE | /object/invoices/{filename} | PDF löschen |

---

## 5. Deployment

### 5.1 Vercel (Frontend)

**Repository:** Sophie0301/kunstmeran

**Deployment:**
```bash
vercel --prod
```

**vercel.json:**
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/$1" }
  ]
}
```

### 5.2 Supabase (Backend)

**Projekt:** adhzwaxzozujmaeexyej
**Region:** Frankfurt (eu-central-1)

**Migrationen anwenden:**
```bash
supabase db push
```

---

## 6. Feature Flags

In `config.js`:

| Flag | Beschreibung |
|------|--------------|
| `useSupabase` | true = Supabase, false = localStorage |
| `enableRealtime` | Realtime-Subscriptions (deaktiviert) |
| `enableBackups` | Automatische Backups |

---

## 7. Authentifizierung

### 7.1 Flow

```
1. Benutzer gibt E-Mail + Passwort ein
2. auth.js ruft SupabaseService.signIn() auf
3. Supabase Auth validiert Credentials
4. JWT-Token wird im Browser gespeichert
5. Alle API-Calls enthalten Authorization Header
6. RLS Policies prüfen Berechtigungen
```

### 7.2 Rollen

| Rolle | Berechtigung |
|-------|--------------|
| admin | Alle Funktionen |
| user | Lesen + eigene Änderungen |

---

## 8. Geplante Migration: Hetzner

### 8.1 Ziel-Architektur

```
Hetzner VPS
├── PostgreSQL (Datenbank)
├── Node.js Backend (Express/Fastify)
├── Nginx (Reverse Proxy)
└── MinIO (S3-kompatibler Storage)
```

### 8.2 Migrations-Strategie

1. PostgreSQL-Schema exportieren
2. Daten mit pg_dump migrieren
3. Storage-Dateien zu MinIO kopieren
4. Auth-System ersetzen (z.B. Passport.js)
5. API-Endpunkte anpassen
6. Frontend-Config aktualisieren

---

## 9. Externe Abhängigkeiten

| Library | Version | Zweck |
|---------|---------|-------|
| @supabase/supabase-js | 2.x | Supabase Client |
| SheetJS (xlsx) | 0.18.x | Excel-Parsing |

CDN-Einbindung in app.html:
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="https://cdn.sheetjs.com/xlsx-0.20.0/package/dist/xlsx.full.min.js"></script>
```

---

## 10. Fehlerbehandlung

### 10.1 API-Fehler

Alle Supabase-Calls werfen bei Fehlern Exceptions:

```javascript
try {
    const { data, error } = await SupabaseService.client
        .from('datev_bookings')
        .select('*');
    if (error) throw error;
} catch (error) {
    console.error('Fehler:', error.message);
}
```

### 10.2 Häufige Fehler

| Fehler | Ursache | Lösung |
|--------|---------|--------|
| 401 Unauthorized | Session abgelaufen | Neu anmelden |
| 403 Forbidden | RLS Policy fehlt | Policy hinzufügen |
| 23505 Duplicate key | Duplikat-Eintrag | Wird beim Import ignoriert |

---

## 11. Kontakt & Support

**Entwicklung:** Controlling Solutions
**Projekt:** Kunsthaus Meran Kostenanalyse
**Repository:** github.com/Sophie0301/kunstmeran
