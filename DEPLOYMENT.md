# Deployment-Anleitung: Supabase + Vercel

## 1. Supabase Setup

### 1.1 Projekt erstellen
1. Gehe zu [https://supabase.com](https://supabase.com)
2. Klicke auf "Start your project"
3. Erstelle ein neues Projekt:
   - **Organization**: Wähle oder erstelle eine neue
   - **Name**: `kunstmeran-projektsoftware`
   - **Database Password**: Sicheres Passwort (speichere es!)
   - **Region**: `Europe (Frankfurt)` (am nächsten zu Meran)

### 1.2 Datenbank-Schema importieren
1. Öffne dein Supabase Projekt
2. Gehe zu **SQL Editor** (linke Sidebar)
3. Klicke auf **New Query**
4. Kopiere den Inhalt von `supabase-schema.sql` und füge ihn ein
5. Klicke auf **Run** oder drücke `Ctrl+Enter`

### 1.3 Authentication einrichten
1. Gehe zu **Authentication** → **Providers**
2. Aktiviere **Email** Provider
3. Gehe zu **Authentication** → **Users**
4. Klicke auf **Add user** → **Create new user**
5. Erstelle Admin-User:
   - **Email**: `admin@kunstmeran.com`
   - **Password**: `KunstMeran2026` (oder sicherer)
   - **Auto Confirm User**: ✓ aktivieren

### 1.4 API Keys kopieren
1. Gehe zu **Project Settings** → **API**
2. Kopiere folgende Werte:
   - **Project URL** (z.B. `https://xxxxx.supabase.co`)
   - **anon public** key
   - **service_role** key (nur für Backend/Admin-Tasks)

### 1.5 Environment Variables erstellen
Erstelle eine Datei `.env.local` im Projekt-Ordner:

```env
VITE_SUPABASE_URL=https://dein-projekt.supabase.co
VITE_SUPABASE_ANON_KEY=dein-anon-key
```

**WICHTIG**: Diese Datei wird NICHT ins Git committed (.gitignore)!

---

## 2. Vercel Deployment

### 2.1 Vercel Account
1. Gehe zu [https://vercel.com](https://vercel.com)
2. Registriere dich mit deinem GitHub Account
3. Verknüpfe Vercel mit GitHub

### 2.2 Repository verbinden
1. Klicke auf **Add New** → **Project**
2. Importiere das GitHub Repository: `Sophie0301/kunstmeran`
3. Configure Project:
   - **Framework Preset**: Wähle `Other` (statische HTML-Seite)
   - **Root Directory**: `./` (falls nicht anders)
   - **Build Command**: Leer lassen (keine Build notwendig)
   - **Output Directory**: `./` (wir deployen direkt)

### 2.3 Environment Variables in Vercel
1. Unter **Environment Variables** füge hinzu:
   - `VITE_SUPABASE_URL` = deine Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = dein Supabase anon key
2. Klicke auf **Deploy**

### 2.4 Deployment abwarten
- Vercel baut und deployed automatisch
- Nach ca. 1-2 Minuten ist deine App live
- Du bekommst eine URL wie: `https://kunstmeran-xyz.vercel.app`

---

## 3. Nach dem Deployment

### 3.1 Testen
1. Öffne die Vercel-URL
2. Logge dich ein mit dem Supabase-User
3. Teste alle Funktionen

### 3.2 Custom Domain (Optional)
1. In Vercel → **Settings** → **Domains**
2. Füge deine eigene Domain hinzu (z.B. `projekte.kunstmeran.com`)
3. Folge den DNS-Anweisungen

### 3.3 Automatische Deployments
- Jeder Push zu `main` branch triggert automatisch ein neues Deployment
- Pull Requests bekommen Preview-URLs

---

## 4. Git Commands für Repository

```bash
# Alle Dateien stagen
git add .

# Commit erstellen
git commit -m "Initial commit: Supabase + Vercel Setup"

# Remote Repository hinzufügen
git remote add origin https://github.com/Sophie0301/kunstmeran.git

# Push zu GitHub
git push -u origin main
```

---

## 5. Troubleshooting

### Problem: CORS-Fehler
- Lösung: In Supabase → **Authentication** → **URL Configuration**
- Füge deine Vercel-URL zu **Site URL** hinzu

### Problem: RLS Policy Fehler
- Lösung: Prüfe ob User eingeloggt ist
- Prüfe Policies im SQL Editor

### Problem: Environment Variables nicht verfügbar
- Lösung: Vercel Projekt neu deployen nach Änderung der Env Vars

---

## 6. Kosten

### Supabase Free Tier
- 500 MB Datenbank
- 1 GB File Storage
- 50,000 monatliche aktive User
- → **Völlig ausreichend für dieses Projekt**

### Vercel Free Tier
- 100 GB Bandwidth
- Unbegrenzte Deployments
- → **Völlig ausreichend für dieses Projekt**

---

## Support

Bei Fragen:
- Supabase Docs: https://supabase.com/docs
- Vercel Docs: https://vercel.com/docs
